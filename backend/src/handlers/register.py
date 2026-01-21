"""
User registration handler
"""

import json
import logging
import boto3
import os
import uuid
from datetime import datetime
from decimal import Decimal
import bcrypt
from src.models.auth import RegisterRequest, RegisterResponse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    region_name='ap-northeast-1',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT_URL', None)
)
USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME', 'User')

def get_users_table():
    """Get Users table"""
    return dynamodb.Table(USERS_TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal type to JSON"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

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
        
        # Validate passwords match
        if register_request.password != register_request.confirmPassword:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "パスワードと確認パスワードが一致しません",
                }, ensure_ascii=False),
            }
        
        # Check if email already exists
        users_table = get_users_table()
        try:
            email_response = users_table.query(
                IndexName='GSI_MAIL',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': register_request.email}
            )
            if email_response['Items']:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "このメールアドレスは既に登録されています",
                    }, ensure_ascii=False),
                }
        except Exception as e:
            logger.warning(f"Could not check if email exists (GSI may not be available): {str(e)}")
        
        # Generate user ID
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Hash password
        password_hash = bcrypt.hashpw(
            register_request.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Create user item for Users table
        user_item = {
            'PK': f'USER#{user_id}',
            'SK': f'PROFILE#{user_id}',
            'userId': user_id,
            'email': register_request.email,
            'passwordHash': password_hash,
            'name': register_request.name,
            'phone': register_request.phone or '',
            'sex': register_request.sex or '',
            'status': 'active',
            'squareCustomerId': None,  # Will be populated when user adds first card
            'createdAt': now,
            'updatedAt': now,
        }
        
        # Save user to Users table
        users_table.put_item(Item=user_item)
        logger.info(f"User created: {user_id}")
        
        # If address registration is requested, save to Users table (ADDRESS partition)
        if register_request.registerAddress and register_request.prefecture:
            address_id = f"addr_{uuid.uuid4().hex[:12]}"
            address_item = {
                'PK': f'ADDRESS#{user_id}',
                'SK': f'ADDRESS#{address_id}',
                'addressId': address_id,
                'userId': user_id,
                'postalCode': register_request.postalCode or '',
                'prefecture': register_request.prefecture,
                'address': register_request.address or '',
                'option': register_request.option or '',
                'isMain': True,
                'createdAt': now,
                'updatedAt': now,
            }
            users_table.put_item(Item=address_item)
            logger.info(f"Address created: {address_id}")
        
        response = RegisterResponse(
            success=True,
            message="ユーザー登録が完了しました。メール認証をお願いします。",
            data={
                "userId": user_id,
                "email": register_request.email,
                "name": register_request.name,
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump(), ensure_ascii=False),
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
                "message": f"入力エラー: {str(e)}"
            }, ensure_ascii=False),
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
                "message": f"ユーザー登録に失敗しました: {str(e)}"
            }, ensure_ascii=False),
        }
