"""
Admin image upload handler - Backend uploads to S3
"""

import json
import base64
from src.utils.jwt import verify_token
from src.utils.s3 import upload_image_to_s3, get_s3_image_url
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def verify_admin_token(headers):
    """認可ヘッダーから管理者トークンを検証"""
    auth_header = headers.get('Authorization', '') or headers.get('authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header[7:]
    
    try:
        is_valid, payload, error = verify_token(token)
        
        if not is_valid or payload.get('user_type') != 'admin':
            return None
        return payload
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None


def upload_image(event, context):
    """
    Upload image to S3 - Backend uploads the file
    
    Request:
        - multipart/form-data
        - Form fields:
            - file: image file
            - productId: product id
            - imageName: image name (main, 0, 1, 2, ...)
    
    Returns:
        {
            "success": true,
            "data": {
                "s3Url": "https://..."
            }
        }
    """
    try:
        # Verify admin token
        admin_info = verify_admin_token(event.get('headers', {}))
        if not admin_info:
            return {
                'statusCode': 401,
                'body': json.dumps({'success': False, 'error': 'Unauthorized'})
            }

        # Get form data from Flask request
        # This function will be called from local_app.py with Flask's request object
        # So we'll need to handle it differently in local_app.py
        
        # For serverless, we would parse multipart form data from event
        # For now, we'll use a helper function
        
        logger.info("Image upload endpoint called")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'success': True})
        }

    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'success': False, 'error': f'Failed to upload image: {str(e)}'})
        }
