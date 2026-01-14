"""
Authentication handler
"""

import json
import logging
from datetime import datetime, timedelta
from src.models.auth import (
    LoginRequest, LoginResponse, TokenRefreshRequest, TokenRefreshResponse,
    VerifyTokenRequest, VerifyTokenResponse, UpdateProfileRequest,
    UpdateProfileResponse, ChangePasswordRequest, ChangePasswordResponse
)
from src.utils.auth import require_auth_handler

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def login(event, context):
    """
    Login handler
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Login event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        login_request = LoginRequest(**body)
        
        # TODO: Validate against database
        # For now, just accept any email/password combination
        
        response = LoginResponse(
            success=True,
            message="Login successful",
            data={
                "id": "user_001",
                "email": login_request.email,
                "name": "山田太郎",
                "phone": "090-1234-5678",
                "address": "東京都渋谷区1-2-3",
                "accessToken": "dummy_access_token_123",  # TODO: Generate JWT token
                "refreshToken": "dummy_refresh_token_456",  # TODO: Generate refresh token
                "expiresIn": 3600  # Token expires in 1 hour (seconds)
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Login failed: {str(e)}"
            }),
        }


def refresh_token(event, context):
    """
    Token refresh handler
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Token refresh event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        refresh_request = TokenRefreshRequest(**body)
        
        # TODO: Validate refresh token against database
        # For now, just accept any refresh token and return new access token
        
        response = TokenRefreshResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "accessToken": "dummy_new_access_token_789",  # TODO: Generate new JWT token
                "expiresIn": 3600  # Token expires in 1 hour (seconds)
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Token refresh failed: {str(e)}"
            }),
        }


def verify_token(event, context):
    """
    Verify token handler - validates access token and returns user info
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Verify token event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        verify_request = VerifyTokenRequest(**body)
        
        # TODO: Validate access token against database
        # For now, just accept any access token and return dummy user data
        
        response = VerifyTokenResponse(
            success=True,
            message="Token verified successfully",
            data={
                "id": "user_001",
                "email": "user@example.com",
                "name": "山田太郎",
                "phone": "090-1234-5678",
                "address": "東京都渋谷区1-2-3"
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during token verification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Token verification failed: {str(e)}"
            }),
        }


@require_auth_handler
def update_profile(event, context):
    """
    Update user profile handler - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Update profile event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        update_request = UpdateProfileRequest(**body)
        
        logger.info(f"Updating profile for: {update_request.name}")
        
        # TODO: Update user profile in database
        # For now, just return success
        
        response = UpdateProfileResponse(
            success=True,
            message="プロフィールを更新しました",
            data={
                "name": update_request.name,
                "email": update_request.email,
                "gender": update_request.gender
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.dict()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during profile update: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Profile update failed: {str(e)}"
            }),
        }


@require_auth_handler
def change_password(event, context):
    """
    Change password handler - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Change password event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        change_request = ChangePasswordRequest(**body)
        
        # Validate passwords match
        if change_request.newPassword != change_request.confirmPassword:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "新しいパスワードと確認用パスワードが一致しません"
                }),
            }
        
        # Validate password length
        if len(change_request.newPassword) < 6:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "パスワードは6文字以上である必要があります"
                }),
            }
        
        logger.info("Password validation passed")
        
        # TODO: Verify current password in database
        # TODO: Update password in database
        # For now, just return success
        
        response = ChangePasswordResponse(
            success=True,
            message="パスワードを変更しました",
            data={}
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.dict()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during password change: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Password change failed: {str(e)}"
            }),
        }


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        email_notifications = body.get("emailNotifications", True)
        
        # TODO: Update notification settings in database
        # For now, just return success
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "通知設定を更新しました",
                "data": {
                    "emailNotifications": email_notifications
                }
            }),
        }
    
    except Exception as e:
        logger.error(f"Error updating notification settings: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Notification settings update failed: {str(e)}"
            }),
        }


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
        # For now, just return success
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "アカウントを削除しました",
                "data": {}
            }),
        }
    
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Account deletion failed: {str(e)}"
            }),
        }


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
        
        # TODO: Get user ID from JWT token
        # For now, return dummy user data
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Profile retrieved successfully",
                "data": {
                    "name": "山田太郎",
                    "email": "yamada@example.com",
                    "gender": "male",
                    "emailNotifications": True
                }
            }),
        }
    
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get profile: {str(e)}"
            }),
        }


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        email = body.get("email")
        
        if not email:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Email is required"
                }),
            }
        
        # TODO: Generate reset token and send email
        # For now, return success with a dummy token
        reset_token = f"reset_{email}_{int(datetime.now().timestamp())}"
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Password reset email sent successfully",
                "data": {
                    "token": reset_token  # For development only
                }
            }),
        }
    
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to request password reset: {str(e)}"
            }),
        }


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        token = body.get("token")
        
        if not token:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Token is required"
                }),
            }
        
        # TODO: Verify token from database
        # For now, accept any token starting with "reset_"
        if not token.startswith("reset_"):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Token is valid"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error verifying reset token: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to verify token: {str(e)}"
            }),
        }


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        token = body.get("token")
        new_password = body.get("newPassword")
        
        if not token or not new_password:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Token and new password are required"
                }),
            }
        
        # TODO: Verify token and update password in database
        # For now, accept any token starting with "reset_"
        if not token.startswith("reset_"):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Password reset successfully"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to reset password: {str(e)}"
            }),
        }

