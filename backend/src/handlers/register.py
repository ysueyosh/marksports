"""
User registration handler
"""

import json
import logging
from src.models.auth import RegisterRequest, RegisterResponse

logger = logging.getLogger()
logger.setLevel(logging.INFO)


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        register_request = RegisterRequest(**body)
        
        # ログに受け取ったデータを出力
        logger.info(f"Registration data - Name: {register_request.name}, Email: {register_request.email}")
        logger.info(f"Address - PostalCode: {register_request.postalCode}, Prefecture: {register_request.prefecture}, Address: {register_request.address}")
        if register_request.building:
            logger.info(f"Building: {register_request.building}")
        
        # TODO: Save user to database
        # TODO: Send confirmation email
        # For now, just accept and return success
        
        response = RegisterResponse(
            success=True,
            message="Registration successful. Please check your email for confirmation.",
            data={
                "email": register_request.email,
                "name": register_request.name,
                "message": "確認メールを送信しました"
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
        logger.error(f"Error during registration: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Registration failed: {str(e)}"
            }),
        }
