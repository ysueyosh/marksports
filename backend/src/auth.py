"""
Unified Authentication Module
Handles all user and admin authentication functionality for Lambda deployment

This module includes:
- Pydantic request/response models
- JWT token generation and verification
- Password hashing and validation
- All authentication handlers
"""

import json
import os
import uuid
import logging
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict, Any
from functools import wraps
from pydantic import BaseModel, EmailStr
from src.utils.dynamodb import get_admin_table, get_users_table

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ============================================================================
# Configuration
# ============================================================================

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_SECONDS = 3600
REFRESH_TOKEN_EXPIRE_DAYS = 7

# DynamoDB configuration
try:
    admin_table = get_admin_table()
    user_table = get_users_table()
except Exception as e:
    logger.warning(f"DynamoDB tables not initialized: {str(e)}")
    admin_table = None
    user_table = None

# ============================================================================
# Pydantic Models - User Authentication
# ============================================================================

class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """User login response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class RegisterRequest(BaseModel):
    """User registration request"""
    name: str
    email: EmailStr
    password: str
    postalCode: str
    prefecture: str
    address: str
    building: Optional[str] = None


class RegisterResponse(BaseModel):
    """User registration response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class TokenRefreshRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class VerifyTokenRequest(BaseModel):
    """Verify token request"""
    access_token: str


class VerifyTokenResponse(BaseModel):
    """Verify token response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class UpdateProfileRequest(BaseModel):
    """Update profile request"""
    name: str
    email: Optional[str] = None
    gender: Optional[str] = None


class UpdateProfileResponse(BaseModel):
    """Update profile response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    currentPassword: str
    newPassword: str
    confirmPassword: str


class ChangePasswordResponse(BaseModel):
    """Change password response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


# ============================================================================
# Pydantic Models - Admin Authentication
# ============================================================================

class AdminLoginRequest(BaseModel):
    """Admin login request"""
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    """Admin login response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class AdminRefreshTokenRequest(BaseModel):
    """Admin token refresh request"""
    refresh_token: str


class AdminRefreshTokenResponse(BaseModel):
    """Admin token refresh response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class AdminVerifyTokenRequest(BaseModel):
    """Admin token verification request"""
    access_token: str


class AdminVerifyTokenResponse(BaseModel):
    """Admin token verification response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class CreateAdminRequest(BaseModel):
    """Create admin request"""
    name: str
    email: EmailStr
    password: str
    confirmPassword: str


class CreateAdminResponse(BaseModel):
    """Create admin response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


# ============================================================================
# JWT and Password Utilities
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash

    Args:
        password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def generate_access_token(user_id: str, email: str, user_type: str = "user") -> str:
    """
    Generate JWT access token

    Args:
        user_id: User ID
        email: User email
        user_type: Type of user (user, admin, etc.)

    Returns:
        JWT access token
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'user_type': user_type,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def generate_refresh_token(user_id: str, email: str, user_type: str = "user") -> str:
    """
    Generate JWT refresh token

    Args:
        user_id: User ID
        email: User email
        user_type: Type of user (user, admin, etc.)

    Returns:
        JWT refresh token
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'user_type': user_type,
        'token_type': 'refresh',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """
    Verify JWT token and return payload

    Args:
        token: JWT token

    Returns:
        Tuple of (is_valid: bool, payload: dict or None, error_message: str or None)
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return True, payload, None
    except jwt.ExpiredSignatureError:
        return False, None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return False, None, f"Invalid token: {str(e)}"
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return False, None, f"Token verification failed: {str(e)}"


def hash_refresh_token(refresh_token: str) -> str:
    """
    Hash refresh token for storage

    Args:
        refresh_token: Refresh token string

    Returns:
        Hashed refresh token
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(refresh_token.encode('utf-8'), salt).decode('utf-8')


def verify_refresh_token(refresh_token: str, hashed_token: str) -> bool:
    """
    Verify refresh token against its hash

    Args:
        refresh_token: Plain refresh token
        hashed_token: Hashed refresh token

    Returns:
        True if token matches, False otherwise
    """
    try:
        return bcrypt.checkpw(refresh_token.encode('utf-8'), hashed_token.encode('utf-8'))
    except Exception as e:
        logger.error(f"Refresh token verification error: {str(e)}")
        return False


# ============================================================================
# Authentication Utilities
# ============================================================================

def extract_bearer_token(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract Bearer token from Authorization header

    Args:
        event: Lambda event

    Returns:
        Token string or None if not found
    """
    headers = event.get('headers') or {}
    auth_header = headers.get('Authorization') or headers.get('authorization')

    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]

    return None


def require_auth(event: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Check if request has valid authentication

    Args:
        event: Lambda event

    Returns:
        Tuple of (is_authenticated: bool, error_message: Optional[str])
    """
    token = extract_bearer_token(event)

    if not token:
        return False, "Missing Authorization header"

    if not token or token == "":
        return False, "Invalid or expired token"

    logger.info(f"Auth check passed for token: {token[:20]}...")
    return True, None


def get_auth_error_response(message: str = "Unauthorized") -> Dict[str, Any]:
    """
    Generate a 401 Unauthorized error response

    Args:
        message: Error message

    Returns:
        Lambda response dictionary
    """
    return {
        'statusCode': 401,
        'body': json.dumps({
            'success': False,
            'message': message,
            'data': None
        }),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }


def require_auth_handler(handler_func):
    """
    Decorator: Wrap handler functions that require authentication

    Usage:
        @require_auth_handler
        def update_profile(event, context):
            # This handler requires authentication
            ...

    Args:
        handler_func: The Lambda handler function

    Returns:
        Wrapped handler function
    """
    @wraps(handler_func)
    def wrapper(event, context):
        is_auth, error_msg = require_auth(event)
        if not is_auth:
            logger.warning(f"Authentication failed: {error_msg}")
            return get_auth_error_response(error_msg)

        logger.info(f"Authentication passed. Calling {handler_func.__name__}")
        return handler_func(event, context)

    return wrapper


def create_api_response(
    status_code: int,
    success: bool,
    message: str,
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standard API response

    Args:
        status_code: HTTP status code
        success: Whether the request was successful
        message: Response message
        data: Response data

    Returns:
        Lambda response dictionary
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': success,
            'message': message,
            'data': data
        })
    }


# ============================================================================
# User Authentication Handlers
# ============================================================================

def login(event, context):
    """
    User login handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Login event: {event}")

        body = json.loads(event.get("body", "{}"))
        login_request = LoginRequest(**body)

        # TODO: Validate against database and retrieve user
        # For now, accept any email/password combination
        
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        access_token = generate_access_token(user_id, login_request.email, "user")
        refresh_token = generate_refresh_token(user_id, login_request.email, "user")

        response = LoginResponse(
            success=True,
            message="Login successful",
            data={
                "id": user_id,
                "email": login_request.email,
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
            }
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return create_api_response(500, False, f"Login failed: {str(e)}")


def register(event, context):
    """
    User registration handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Register event: {event}")

        body = json.loads(event.get("body", "{}"))
        register_request = RegisterRequest(**body)

        logger.info(f"Registration data - Name: {register_request.name}, Email: {register_request.email}")
        logger.info(f"Address - PostalCode: {register_request.postalCode}, Prefecture: {register_request.prefecture}, Address: {register_request.address}")
        if register_request.building:
            logger.info(f"Building: {register_request.building}")

        # TODO: Save user to database
        # TODO: Send confirmation email

        response = RegisterResponse(
            success=True,
            message="Registration successful. Please check your email for confirmation.",
            data={
                "email": register_request.email,
                "name": register_request.name,
                "message": "確認メールを送信しました"
            }
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        return create_api_response(500, False, f"Registration failed: {str(e)}")


def refresh_token(event, context):
    """
    User token refresh handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Token refresh event: {event}")

        body = json.loads(event.get("body", "{}"))
        refresh_request = TokenRefreshRequest(**body)

        # Verify refresh token
        is_valid, payload, error_msg = verify_token(refresh_request.refresh_token)

        if not is_valid:
            logger.warning(f"Invalid refresh token: {error_msg}")
            return create_api_response(401, False, "Invalid or expired refresh token")

        if payload.get('token_type') != 'refresh':
            logger.warning("Access token used instead of refresh token")
            return create_api_response(401, False, "Invalid token type")

        # Generate new access token and new refresh token
        new_access_token = generate_access_token(
            payload['user_id'],
            payload['email'],
            payload.get('user_type', 'user')
        )
        
        new_refresh_token = generate_refresh_token(
            payload['user_id'],
            payload['email'],
            payload.get('user_type', 'user')
        )

        response = TokenRefreshResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "accessToken": new_access_token,
                "refreshToken": new_refresh_token,
                "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
            }
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        return create_api_response(500, False, f"Token refresh failed: {str(e)}")


def verify_access_token(event, context):
    """
    Verify access token handler - validates token and returns user info

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Verify token event: {event}")

        body = json.loads(event.get("body", "{}"))
        verify_request = VerifyTokenRequest(**body)

        is_valid, payload, error_msg = verify_token(verify_request.access_token)

        if not is_valid:
            logger.warning(f"Invalid access token: {error_msg}")
            return create_api_response(401, False, "Invalid or expired token")

        user_id = payload['user_id']
        email = payload['email']

        # Fetch user profile from DynamoDB
        user_info = {
            "id": user_id,
            "email": email,
            "accessToken": verify_request.access_token,
            "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
        }

        if user_table:
            try:
                user_response = user_table.get_item(
                    Key={
                        'PK': f'USER#{user_id}',
                        'SK': f'PROFILE#{user_id}'
                    }
                )
                
                if 'Item' in user_response:
                    item = user_response['Item']
                    user_info['name'] = item.get('name', '')
                    user_info['phone'] = item.get('phone')
                    user_info['sex'] = item.get('sex')
                    user_info['address'] = item.get('address')
            except Exception as db_error:
                logger.warning(f"Failed to fetch user profile from DynamoDB: {str(db_error)}")

        response = VerifyTokenResponse(
            success=True,
            message="Token verified successfully",
            data=user_info
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during token verification: {str(e)}")
        return create_api_response(500, False, f"Token verification failed: {str(e)}")


@require_auth_handler
def update_profile(event, context):
    """
    Update user profile - Requires authentication

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Update profile event: {event}")

        body = json.loads(event.get("body", "{}"))
        update_request = UpdateProfileRequest(**body)

        logger.info(f"Updating profile for: {update_request.name}")

        # TODO: Update user profile in database

        response = UpdateProfileResponse(
            success=True,
            message="プロフィールを更新しました",
            data={
                "name": update_request.name,
                "email": update_request.email,
                "gender": update_request.gender
            }
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during profile update: {str(e)}")
        return create_api_response(500, False, f"Profile update failed: {str(e)}")


@require_auth_handler
def change_password(event, context):
    """
    Change password - Requires authentication

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Change password event: {event}")

        body = json.loads(event.get("body", "{}"))
        change_request = ChangePasswordRequest(**body)

        if change_request.newPassword != change_request.confirmPassword:
            return create_api_response(
                400, False,
                "新しいパスワードと確認用パスワードが一致しません"
            )

        if len(change_request.newPassword) < 6:
            return create_api_response(
                400, False,
                "パスワードは6文字以上である必要があります"
            )

        logger.info("Password validation passed")

        # TODO: Verify current password in database
        # TODO: Update password in database

        response = ChangePasswordResponse(
            success=True,
            message="パスワードを変更しました",
            data={}
        )

        return create_api_response(200, response.success, response.message, response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during password change: {str(e)}")
        return create_api_response(500, False, f"Password change failed: {str(e)}")


@require_auth_handler
def update_notification_settings(event, context):
    """
    Update notification settings - Requires authentication

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Update notification settings event: {event}")

        body = json.loads(event.get("body", "{}"))
        email_notifications = body.get("emailNotifications", True)

        # TODO: Update notification settings in database

        return create_api_response(
            200, True,
            "通知設定を更新しました",
            {"emailNotifications": email_notifications}
        )

    except Exception as e:
        logger.error(f"Error updating notification settings: {str(e)}")
        return create_api_response(500, False, f"Notification settings update failed: {str(e)}")


@require_auth_handler
def delete_account(event, context):
    """
    Delete account - Requires authentication

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Delete account event: {event}")

        # TODO: Delete account and all associated data from database

        return create_api_response(
            200, True,
            "アカウントを削除しました",
            {}
        )

    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        return create_api_response(500, False, f"Account deletion failed: {str(e)}")


@require_auth_handler
def get_profile(event, context):
    """
    Get user profile - Requires authentication

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Get profile event: {event}")

        # TODO: Get user ID from JWT token and retrieve from database

        return create_api_response(
            200, True,
            "Profile retrieved successfully",
            {
                "name": None,
                "email": None,
                "phone": None,
                "sex": None
            }
        )

    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return create_api_response(500, False, f"Failed to get profile: {str(e)}")


def request_password_reset(event, context):
    """
    Request password reset by email

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Request password reset event: {event}")

        body = json.loads(event.get("body", "{}"))
        email = body.get("email")

        if not email:
            return create_api_response(400, False, "Email is required")

        # TODO: Generate reset token and send email

        reset_token = f"reset_{email}_{int(datetime.now().timestamp())}"

        return create_api_response(
            200, True,
            "Password reset email sent successfully",
            {"token": reset_token}
        )

    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        return create_api_response(500, False, f"Failed to request password reset: {str(e)}")


def verify_reset_token(event, context):
    """
    Verify password reset token

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Verify reset token event: {event}")

        body = json.loads(event.get("body", "{}"))
        token = body.get("token")

        if not token:
            return create_api_response(400, False, "Token is required")

        # TODO: Verify token from database
        if not token.startswith("reset_"):
            return create_api_response(400, False, "Invalid or expired token")

        return create_api_response(200, True, "Token is valid", None)

    except Exception as e:
        logger.error(f"Error verifying reset token: {str(e)}")
        return create_api_response(500, False, f"Failed to verify token: {str(e)}")


def reset_password(event, context):
    """
    Reset password with valid token

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Reset password event: {event}")

        body = json.loads(event.get("body", "{}"))
        token = body.get("token")
        new_password = body.get("newPassword")

        if not token or not new_password:
            return create_api_response(400, False, "Token and new password are required")

        # TODO: Verify token and update password in database
        if not token.startswith("reset_"):
            return create_api_response(400, False, "Invalid or expired token")

        return create_api_response(200, True, "Password reset successfully", None)

    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return create_api_response(500, False, f"Failed to reset password: {str(e)}")


# ============================================================================
# Admin Authentication Handlers
# ============================================================================

def admin_login(event, context):
    """
    Admin login handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Admin login event: {event}")

        body = json.loads(event.get("body", "{}"))
        login_request = AdminLoginRequest(**body)

        # Query admin by email using GSI
        if not admin_table:
            logger.error("Admin table not initialized")
            return create_api_response(500, False, "Database not available")

        response = admin_table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={
                ':email': login_request.email
            }
        )

        if not response.get('Items'):
            logger.warning(f"Admin not found: {login_request.email}")
            return create_api_response(401, False, "Invalid email or password")

        admin = response['Items'][0]

        if not verify_password(login_request.password, admin['passwordHash']):
            logger.warning(f"Invalid password for admin: {login_request.email}")
            return create_api_response(401, False, "Invalid email or password")

        # Generate tokens
        access_token = generate_access_token(admin['adminId'], admin['email'], 'admin')
        refresh_token_str = generate_refresh_token(admin['adminId'], admin['email'], 'admin')

        # Hash and store refresh token
        refresh_token_hash = hash_refresh_token(refresh_token_str)

        # Update refresh token hash in DynamoDB
        admin_table.update_item(
            Key={
                'PK': admin['PK'],
                'SK': admin['SK']
            },
            UpdateExpression='SET refreshTokenHash = :token_hash',
            ExpressionAttributeValues={
                ':token_hash': refresh_token_hash
            }
        )

        admin_response = AdminLoginResponse(
            success=True,
            message="Admin login successful",
            data={
                "adminId": admin['adminId'],
                "email": admin['email'],
                "name": admin['name'],
                "accessToken": access_token,
                "refreshToken": refresh_token_str,
                "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
            }
        )

        return create_api_response(200, admin_response.success, admin_response.message, admin_response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during admin login: {str(e)}")
        return create_api_response(500, False, f"Login failed: {str(e)}")


def admin_refresh_token(event, context):
    """
    Admin token refresh handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Admin token refresh event: {event}")

        body = json.loads(event.get("body", "{}"))
        refresh_request = AdminRefreshTokenRequest(**body)

        is_valid, payload, error_msg = verify_token(refresh_request.refresh_token)

        if not is_valid:
            logger.warning(f"Invalid refresh token: {error_msg}")
            return create_api_response(401, False, "Invalid or expired refresh token")

        if payload.get('token_type') != 'refresh':
            logger.warning("Access token used instead of refresh token")
            return create_api_response(401, False, "Invalid token type")

        # Generate new access token and new refresh token
        new_access_token = generate_access_token(
            payload['user_id'],
            payload['email'],
            payload.get('user_type', 'admin')
        )
        
        new_refresh_token = generate_refresh_token(
            payload['user_id'],
            payload['email'],
            payload.get('user_type', 'admin')
        )

        admin_response = AdminRefreshTokenResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "accessToken": new_access_token,
                "refreshToken": new_refresh_token,
                "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
            }
        )

        return create_api_response(200, admin_response.success, admin_response.message, admin_response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during admin token refresh: {str(e)}")
        return create_api_response(500, False, f"Token refresh failed: {str(e)}")


def admin_verify_token(event, context):
    """
    Admin verify token handler - validates access token and returns admin info

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Admin verify token event: {event}")

        body = json.loads(event.get("body", "{}"))
        verify_request = AdminVerifyTokenRequest(**body)

        is_valid, payload, error_msg = verify_token(verify_request.access_token)

        if not is_valid:
            logger.warning(f"Invalid access token: {error_msg}")
            return create_api_response(401, False, "Invalid or expired token")

        if payload.get('user_type') != 'admin':
            logger.warning("Non-admin token used")
            return create_api_response(401, False, "Not an admin token")

        # Get admin info from database
        if not admin_table:
            logger.error("Admin table not initialized")
            return create_api_response(500, False, "Database not available")

        response = admin_table.get_item(
            Key={
                'userId': payload['user_id']
            }
        )

        if not response.get('Item'):
            logger.warning(f"Admin not found: {payload['user_id']}")
            return create_api_response(404, False, "Admin not found")

        admin = response['Item']

        verify_response = AdminVerifyTokenResponse(
            success=True,
            message="Token verified successfully",
            data={
                "adminId": admin['adminId'],
                "email": admin['email'],
                "name": admin['name']
            }
        )

        return create_api_response(200, verify_response.success, verify_response.message, verify_response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during admin token verification: {str(e)}")
        return create_api_response(500, False, f"Token verification failed: {str(e)}")


def create_admin(event, context):
    """
    Create new admin handler

    Args:
        event: Lambda event
        context: Lambda context

    Returns:
        API response
    """
    try:
        logger.info(f"Create admin event: {event}")

        body = json.loads(event.get("body", "{}"))
        create_request = CreateAdminRequest(**body)

        if create_request.password != create_request.confirmPassword:
            logger.warning("Passwords do not match")
            return create_api_response(400, False, "Passwords do not match")

        # Check if admin already exists with this email
        if not admin_table:
            logger.error("Admin table not initialized")
            return create_api_response(500, False, "Database not available")

        response = admin_table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={
                ':email': create_request.email
            }
        )

        if response.get('Items'):
            logger.warning(f"Admin already exists: {create_request.email}")
            return create_api_response(409, False, "Admin with this email already exists")

        # Generate admin ID
        admin_id = f"admin_{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()

        # Hash password
        password_hash = hash_password(create_request.password)

        # Create admin item
        admin_item = {
            'PK': f"ADMIN#{admin_id}",
            'SK': f"PROFILE#{admin_id}",
            'adminId': admin_id,
            'email': create_request.email,
            'name': create_request.name,
            'passwordHash': password_hash,
            'refreshTokenHash': '',
            'createdAt': now,
            'updatedAt': now
        }

        # Save to DynamoDB
        admin_table.put_item(Item=admin_item)

        logger.info(f"Admin created successfully: {admin_id}")

        admin_response = CreateAdminResponse(
            success=True,
            message="Admin created successfully",
            data={
                "adminId": admin_id,
                "email": create_request.email,
                "name": create_request.name,
                "createdAt": now
            }
        )

        return create_api_response(201, admin_response.success, admin_response.message, admin_response.data)

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return create_api_response(400, False, f"Invalid input: {str(e)}")

    except Exception as e:
        logger.error(f"Error during admin creation: {str(e)}")
        return create_api_response(500, False, f"Admin creation failed: {str(e)}")
