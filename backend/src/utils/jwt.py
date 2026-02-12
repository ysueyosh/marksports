"""
JWT token generation and validation utilities
"""

import os
import jwt
import bcrypt
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from src.auth import ACCESS_TOKEN_EXPIRE_SECONDS, REFRESH_TOKEN_EXPIRE_DAYS

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'


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
        'exp': datetime.utcnow() + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
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
    Hash refresh token for storage using SHA-256
    
    Args:
        refresh_token: Refresh token string
    
    Returns:
        Hashed refresh token (hex digest)
    """
    return hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()


def verify_refresh_token(refresh_token: str, hashed_token: str) -> bool:
    """
    Verify refresh token against its hash using SHA-256 or bcrypt (for backwards compatibility)
    
    Args:
        refresh_token: Plain refresh token
        hashed_token: Hashed refresh token (SHA-256 hex digest or bcrypt hash)
    
    Returns:
        True if token matches, False otherwise
    """
    try:
        # Check if it's a bcrypt hash (starts with $2b$, $2a$, or $2y$)
        if hashed_token.startswith(('$2b$', '$2a$', '$2y$')):
            # Legacy bcrypt format - verify using bcrypt
            return bcrypt.checkpw(refresh_token.encode('utf-8'), hashed_token.encode('utf-8'))
        else:
            # New SHA-256 format - verify using SHA-256
            token_hash = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
            return token_hash == hashed_token
    except Exception as e:
        logger.error(f"Refresh token verification error: {str(e)}")
        return False
