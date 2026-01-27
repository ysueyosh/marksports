"""
Authentication utilities for API requests
Lambda-compatible common authentication handlers
"""

import json
import logging
from typing import Tuple, Optional, Dict, Any
from functools import wraps
from src.utils.jwt import verify_token

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


def get_auth_error_response(message: str = "Unauthorized", status_code: int = 401) -> Dict[str, Any]:
    """
    Generate an authentication error response
    
    Args:
        message: Error message
        status_code: HTTP status code
    
    Returns:
        Lambda response dictionary
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps({
            'success': False,
            'message': message,
            'data': None
        }, ensure_ascii=False)
    }


def verify_user_token(event: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Verify user (non-admin) JWT token from Authorization header
    
    Args:
        event: Lambda event
    
    Returns:
        Tuple of (payload: dict or None, error_response: dict or None)
    """
    token = extract_bearer_token(event)
    
    if not token:
        return None, get_auth_error_response("認証が必要です")
    
    # Verify JWT token
    is_valid, payload, error = verify_token(token)
    
    if not is_valid or not payload:
        logger.warning(f"Token verification failed: {error}")
        return None, get_auth_error_response(error or "トークンが無効です")
    
    # Check if token is for regular user (not admin)
    user_type = payload.get('user_type', 'user')
    if user_type != 'user':
        logger.warning(f"Invalid user_type: {user_type}. Expected 'user' but got '{user_type}'")
        return None, get_auth_error_response("このリソースにはユーザー権限が必要です", 403)
    
    logger.info(f"User authentication passed for user_id: {payload.get('user_id')}")
    return payload, None


def verify_admin_token(event: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Verify admin JWT token from Authorization header
    Common function for all admin handlers
    
    Args:
        event: Lambda event
    
    Returns:
        Tuple of (payload: dict or None, error_response: dict or None)
    """
    token = extract_bearer_token(event)
    
    if not token:
        return None, get_auth_error_response("認証が必要です")
    
    # Verify JWT token
    is_valid, payload, error = verify_token(token)
    
    if not is_valid or not payload:
        logger.warning(f"Token verification failed: {error}")
        return None, get_auth_error_response(error or "トークンが無効です")
    
    # Check if token is for admin
    if payload.get('user_type') != 'admin':
        logger.warning(f"Non-admin user attempted to access admin resource: {payload.get('user_id')}")
        return None, get_auth_error_response("管理者権限が必要です", 403)
    
    logger.info(f"Admin authentication passed for admin_id: {payload.get('user_id')}")
    return payload, None


def require_user_auth(handler_func):
    """
    Decorator: Wrap handler functions that require user authentication
    Ensures the request is from a regular user (not admin)
    
    Usage:
        @require_user_auth
        def get_orders(event, context):
            # This handler requires user authentication
            # Access user_id via event['user_payload']
            ...
    
    Args:
        handler_func: The Lambda handler function
    
    Returns:
        Wrapped handler function
    """
    @wraps(handler_func)
    def wrapper(event, context):
        # Verify user token
        payload, error_response = verify_user_token(event)
        if error_response:
            return error_response
        
        # Inject user payload into event for handler to use
        event['user_payload'] = payload
        
        # Call the actual handler
        logger.info(f"User authentication passed. Calling {handler_func.__name__}")
        return handler_func(event, context)
    
    return wrapper


def require_admin_auth(handler_func):
    """
    Decorator: Wrap handler functions that require admin authentication
    Ensures the request is from an admin user
    
    Usage:
        @require_admin_auth
        def create_product(event, context):
            # This handler requires admin authentication
            # Access admin info via event['admin_payload']
            ...
    
    Args:
        handler_func: The Lambda handler function
    
    Returns:
        Wrapped handler function
    """
    @wraps(handler_func)
    def wrapper(event, context):
        # Verify admin token
        payload, error_response = verify_admin_token(event)
        if error_response:
            return error_response
        
        # Inject admin payload into event for handler to use
        event['admin_payload'] = payload
        
        # Call the actual handler
        logger.info(f"Admin authentication passed. Calling {handler_func.__name__}")
        return handler_func(event, context)
    
    return wrapper


# Legacy alias for backward compatibility
require_auth_handler = require_user_auth
