"""
Authentication utilities for API requests
"""

import json
import logging
from typing import Tuple, Optional, Dict, Any
from functools import wraps

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def extract_bearer_token(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract Bearer token from Authorization header
    
    Args:
        event: Lambda event
    
    Returns:
        Token string or None if not found
    """
    # Get headers from event
    headers = event.get('headers') or {}
    
    # Header names can be case-insensitive, so check both cases
    auth_header = headers.get('Authorization') or headers.get('authorization')
    
    if not auth_header:
        return None
    
    # Extract Bearer token
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
    
    # TODO: Validate JWT token against your auth service
    # For now, just check if token exists (not empty)
    if not token or token == "":
        return False, "Invalid or expired token"
    
    # In a real application, you would:
    # 1. Decode the JWT token
    # 2. Verify the signature
    # 3. Check expiration
    # 4. Extract user information
    
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
            'Content-Type': 'application/json'
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
        # Check authentication
        is_auth, error_msg = require_auth(event)
        if not is_auth:
            logger.warning(f"Authentication failed: {error_msg}")
            return get_auth_error_response(error_msg)
        
        # Call the actual handler
        logger.info(f"Authentication passed. Calling {handler_func.__name__}")
        return handler_func(event, context)
    
    return wrapper
