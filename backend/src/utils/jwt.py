"""
JWT token generation and validation utilities
"""

import os
import jwt
import bcrypt
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


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


def generate_access_token(user_id: str, email: str, user_type: str = "admin") -> str:
    """
    Generate JWT access token
    
    Args:
        user_id: User ID
        email: User email
        user_type: Type of user (admin, user, etc.)
    
    Returns:
        JWT access token
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'user_type': user_type,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def generate_refresh_token(user_id: str, email: str, user_type: str = "admin") -> str:
    """
    Generate JWT refresh token
    
    Args:
        user_id: User ID
        email: User email
        user_type: Type of user (admin, user, etc.)
    
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
