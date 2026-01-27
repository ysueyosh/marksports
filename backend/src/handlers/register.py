"""
User registration handler
"""

import json
import logging
import boto3
import os
import uuid
import secrets
from datetime import datetime, timedelta
from decimal import Decimal
import bcrypt
from src.models.auth import RegisterRequest, RegisterResponse
from src.utils.ses import send_registration_verification_email

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
        
        # Generate verification token
        verification_token = secrets.token_urlsafe(32)
        verification_token_hash = bcrypt.hashpw(
            verification_token.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        verification_expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat() + 'Z'
        
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
            'status': 'pending',  # Changed from 'active' to 'pending' until email is verified
            'verificationTokenHash': verification_token_hash,
            'expiresAt': verification_expires_at,
            'verifiedAt': None,
            'squareCustomerId': None,  # Will be populated when user adds first card
            'createdAt': now,
            'updatedAt': now,
        }
        
        # Save user to Users table
        users_table.put_item(Item=user_item)
        logger.info(f"User created: {user_id}")
        
        # Send verification email
        try:
            frontend_url = os.environ.get('FRONTEND_URL', 'https://mark-sports.com')
            verification_link = f"{frontend_url}/verify-email?token={verification_token}"
            send_registration_verification_email(
                to_email=register_request.email,
                user_name=register_request.name,
                verification_link=verification_link
            )
            logger.info(f"Verification email sent to {register_request.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {str(e)}")
            # Don't fail registration if email sending fails, just log it
        
        # If address registration is requested, save to Users table (ADDRESS partition)
        if register_request.registerAddress and register_request.prefecture:
            address_id = f"addr_{uuid.uuid4().hex[:12]}"
            address_item = {
                'PK': f'USER#{user_id}',
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
            message="ユーザー登録が完了しました。認証メールを送信しましたので、メール内のリンクをクリックして認証を完了してください。",
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
