"""
Admin authentication handler
"""

import json
import logging
import os
import boto3
from datetime import datetime
from decimal import Decimal
from src.models.admin import (
    AdminLoginRequest, AdminLoginResponse, AdminRefreshTokenRequest,
    AdminRefreshTokenResponse, AdminVerifyTokenRequest, AdminVerifyTokenResponse,
    CreateAdminRequest, CreateAdminResponse
)
from src.utils.jwt import (
    generate_access_token, generate_refresh_token, verify_token,
    verify_password, hash_password, hash_refresh_token
)
from src.utils.auth import require_admin_auth

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('ADMIN_TABLE_NAME', 'Admin')
table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        login_request = AdminLoginRequest(**body)
        
        # Query admin by email using GSI
        response = table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={
                ':email': login_request.email
            }
        )
        
        if not response.get('Items'):
            logger.warning(f"Admin not found: {login_request.email}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid email or password"
                }),
            }
        
        admin = response['Items'][0]
        
        # Verify password
        if not verify_password(login_request.password, admin['passwordHash']):
            logger.warning(f"Invalid password for admin: {login_request.email}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid email or password"
                }),
            }
        
        # Generate tokens
        access_token = generate_access_token(admin['adminId'], admin['email'], 'admin')
        refresh_token = generate_refresh_token(admin['adminId'], admin['email'], 'admin')
        
        # Hash and store refresh token
        refresh_token_hash = hash_refresh_token(refresh_token)
        
        # Update refresh token hash in DynamoDB
        table.update_item(
            Key={
                'PK': admin['PK'],
                'SK': admin['SK']
            },
            UpdateExpression='SET refleshTokenHash = :token_hash',
            ExpressionAttributeValues={
                ':token_hash': refresh_token_hash
            }
        )
        
        response = AdminLoginResponse(
            success=True,
            message="Admin login successful",
            data={
                "adminId": admin['adminId'],
                "email": admin['email'],
                "name": admin['name'],
                "accessToken": access_token,
                "refreshToken": refresh_token,
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
        logger.error(f"Error during admin login: {str(e)}")
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


def admin_refresh_token(event, context):
    """
    Admin token refresh handler - Verifies refresh token against DB hash
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Admin token refresh event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        refresh_request = AdminRefreshTokenRequest(**body)
        
        # Verify refresh token JWT signature and expiration
        is_valid, payload, error_msg = verify_token(refresh_request.refresh_token)
        
        if not is_valid:
            logger.warning(f"Invalid refresh token: {error_msg}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired refresh token"
                }),
            }
        
        # Check if it's a refresh token
        if payload.get('token_type') != 'refresh':
            logger.warning("Access token used instead of refresh token")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid token type"
                }),
            }
        
        admin_id = payload.get('user_id')
        email = payload.get('email')
        
        # Get admin details from database and verify refresh token hash
        admin_response = table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        
        logger.info(f"Admin response query: {admin_response}")
        admin_data = admin_response.get("Items", [{}])[0] if admin_response.get("Items") else {}
        
        if not admin_data:
            logger.warning(f"Admin not found for email: {email}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Admin not found"
                }),
            }
        
        # Verify refresh token against stored hash in DB (check both field names for backwards compatibility)
        stored_refresh_token_hash = admin_data.get("refleshTokenHash") or admin_data.get("refreshTokenHash")
        if not stored_refresh_token_hash:
            logger.warning(f"No refresh token hash stored for admin: {admin_id}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "No valid refresh token found"
                }),
            }
        
        # Import verify_refresh_token from jwt utils
        from src.utils.jwt import verify_refresh_token
        
        # Verify the refresh token matches the stored hash
        if not verify_refresh_token(refresh_request.refresh_token, stored_refresh_token_hash):
            logger.warning(f"Refresh token hash mismatch for admin: {admin_id}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid refresh token"
                }),
            }
        
        # Generate new access token and refresh token
        new_access_token = generate_access_token(
            admin_id,
            email,
            payload.get('user_type', 'admin')
        )
        new_refresh_token = generate_refresh_token(
            admin_id,
            email,
            'admin'
        )
        
        # Hash and store new refresh token in DB
        new_refresh_token_hash = hash_refresh_token(new_refresh_token)
        table.update_item(
            Key={
                'PK': f'ADMIN#{admin_id}',
                'SK': f'PROFILE#{admin_id}'
            },
            UpdateExpression='SET refleshTokenHash = :hash, updatedAt = :updated',
            ExpressionAttributeValues={
                ':hash': new_refresh_token_hash,
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        response = AdminRefreshTokenResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "adminId": admin_id,
                "email": email,
                "name": admin_data.get("name", ""),
                "accessToken": new_access_token,
                "refreshToken": new_refresh_token,
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
        logger.error(f"Error during admin token refresh: {str(e)}")
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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        verify_request = AdminVerifyTokenRequest(**body)
        
        # Verify token
        is_valid, payload, error_msg = verify_token(verify_request.access_token)
        
        if not is_valid:
            logger.warning(f"Invalid access token: {error_msg}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        # Check if it's an admin token
        if payload.get('user_type') != 'admin':
            logger.warning("Non-admin token used")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Not an admin token"
                }),
            }
        
        # Get admin info from database (if available)
        try:
            admin_id = payload.get('user_id')
            admin_pk = f"ADMIN#{admin_id}"
            admin_sk = f"PROFILE#{admin_id}"

            response = table.get_item(
                Key={
                    'PK': admin_pk,
                    'SK': admin_sk,
                }
            )

            if response.get('Item'):
                admin = response['Item']
                admin_data = {
                    "adminId": admin.get('adminId', admin_id),
                    "email": admin.get('email', payload.get('email', '')),
                    "name": admin.get('name', '')
                }
            else:
                # If admin not found in database, use token payload
                admin_data = {
                    "adminId": admin_id,
                    "email": payload.get('email', ''),
                    "name": payload.get('name', '')
                }
        except Exception as db_error:
            # If database query fails, use token payload
            logger.warning(f"Failed to query admin table: {str(db_error)}, using token payload")
            admin_data = {
                "adminId": payload.get('user_id'),
                "email": payload.get('email', ''),
                "name": payload.get('name', '')
            }
        
        verify_response = AdminVerifyTokenResponse(
            success=True,
            message="Token verified successfully",
            data=admin_data
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(verify_response.model_dump()),
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
        logger.error(f"Error during admin token verification: {str(e)}")
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
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        create_request = CreateAdminRequest(**body)
        
        # Validate passwords match
        if create_request.password != create_request.confirmPassword:
            logger.warning("Passwords do not match")
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Passwords do not match"
                }),
            }
        
        # Check if admin already exists with this email
        response = table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={
                ':email': create_request.email
            }
        )
        
        if response.get('Items'):
            logger.warning(f"Admin already exists: {create_request.email}")
            return {
                "statusCode": 409,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Admin with this email already exists"
                }),
            }
        
        # Generate admin ID
        import uuid
        from datetime import datetime
        
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
            'refleshTokenHash': '',
            'createdAt': now,
            'updatedAt': now
        }
        
        # Save to DynamoDB
        table.put_item(Item=admin_item)
        
        logger.info(f"Admin created successfully: {admin_id}")
        
        response = CreateAdminResponse(
            success=True,
            message="Admin created successfully",
            data={
                "adminId": admin_id,
                "email": create_request.email,
                "name": create_request.name,
                "createdAt": now
            }
        )
        
        return {
            "statusCode": 201,
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
        logger.error(f"Error during admin creation: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Admin creation failed: {str(e)}"
            }),
        }


def get_admin_settings(event, context):
    """
    Get admin settings
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with admin settings
    """
    try:
        logger.info(f"Get admin settings event: {event}")
        
        # Get admin ID from authorization header or token
        # In a real scenario, this would come from JWT verification
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }),
            }
        
        token = auth_header.replace('Bearer ', '')
        is_valid, payload, error_msg = verify_token(token)
        
        if not is_valid:
            logger.warning(f"Invalid token: {error_msg}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        admin_id = payload.get('user_id')
        
        # Query admin by PK and SK
        response = table.get_item(
            Key={
                'PK': f'ADMIN#{admin_id}',
                'SK': f'PROFILE#{admin_id}'
            }
        )
        
        if 'Item' not in response:
            logger.warning(f"Admin not found: {admin_id}")
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Admin not found"
                }),
            }
        
        admin = response['Item']
        
        # Map DynamoDB fields to API response
        admin_settings = {
            'id': admin.get('adminId'),
            'name': admin.get('name', ''),
            'email': admin.get('email', ''),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Admin settings retrieved successfully",
                "data": admin_settings
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error getting admin settings: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get admin settings: {str(e)}"
            }),
        }


def update_admin_settings(event, context):
    """
    Update admin settings
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with updated admin settings
    """
    try:
        logger.info(f"Update admin settings event: {event}")
        
        # Get admin ID from authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }),
            }
        
        token = auth_header.replace('Bearer ', '')
        is_valid, payload, error_msg = verify_token(token)
        
        if not is_valid:
            logger.warning(f"Invalid token: {error_msg}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        admin_id = payload.get('user_id')
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Validate required fields
        required_fields = ['name', 'email']
        for field in required_fields:
            if not body.get(field):
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"{field} is required"
                    }),
                }
        
        # Check if new email is already used by another admin
        if body.get('email') != payload.get('email'):
            response = table.query(
                IndexName='GSI_MAIL',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={
                    ':email': body.get('email')
                }
            )
            
            if response.get('Items'):
                logger.warning(f"Email already exists: {body.get('email')}")
                return {
                    "statusCode": 409,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "Email already exists"
                    }),
                }
        
        # Get current admin to get PK and SK
        response = table.get_item(
            Key={
                'PK': f'ADMIN#{admin_id}',
                'SK': f'PROFILE#{admin_id}'
            }
        )
        
        if 'Item' not in response:
            logger.warning(f"Admin not found: {admin_id}")
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Admin not found"
                }),
            }
        
        admin = response['Item']
        
        # Update admin settings
        from datetime import datetime
        update_expression = 'SET #name = :name, #email = :email, updatedAt = :updated_at'
        expression_attribute_names = {
            '#name': 'name',
            '#email': 'email'
        }
        expression_attribute_values = {
            ':name': body.get('name'),
            ':email': body.get('email'),
            ':updated_at': datetime.utcnow().isoformat()
        }
        
        table.update_item(
            Key={
                'PK': admin['PK'],
                'SK': admin['SK']
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Map DynamoDB fields to API response
        admin_settings = {
            'id': admin_id,
            'name': body.get('name'),
            'email': body.get('email'),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Admin settings updated successfully",
                "data": admin_settings
            }, cls=DecimalEncoder),
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
        logger.error(f"Error updating admin settings: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to update admin settings: {str(e)}"
            }),
        }


@require_admin_auth
def manual_refund(event, context):
    """
    Manual refund processing for bank transfer orders - Requires admin authentication
    
    Args:
        event: Lambda event containing orderId in body
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Manual refund event: {event}")
        
        # Get admin ID from payload injected by decorator
        admin_payload = event.get('admin_payload', {})
        admin_id = admin_payload.get('user_id')
        
        if not admin_id:
            logger.error("No admin_id in admin_payload")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Internal server error"
                }, ensure_ascii=False),
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        order_id = body.get('orderId')
        
        if not order_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "orderId is required"
                }, ensure_ascii=False),
            }
        
        # Get Users table
        from src.utils.dynamodb import get_users_table
        table = get_users_table()
        
        # Find the order
        response = table.scan(
            FilterExpression='orderId = :order_id',
            ExpressionAttributeValues={
                ':order_id': order_id
            }
        )
        
        items = response.get('Items', [])
        if not items:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Order not found"
                }, ensure_ascii=False),
            }
        
        order_item = items[0]
        user_id_from_item = order_item.get('PK')
        sk_value = order_item.get('SK')
        payment_method = order_item.get('paymentMethod')
        current_refund_at = order_item.get('refundAt')
        user_email = order_item.get('userEmail')
        user_name = order_item.get('userName', '')
        order_number = order_item.get('orderNumber', order_id)
        total_amount = order_item.get('totalAmount', 0)
        
        # Validate payment method
        if payment_method != 'bank_transfer':
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Manual refund is only for bank transfer orders"
                }, ensure_ascii=False),
            }
        
        # Check if already refunded
        if current_refund_at:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Order already refunded"
                }, ensure_ascii=False),
            }
        
        # Update refundAt
        refund_at = datetime.utcnow().isoformat() + 'Z'
        
        table.update_item(
            Key={
                'PK': user_id_from_item,
                'SK': sk_value
            },
            UpdateExpression='SET refundAt = :refundAt, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':refundAt': refund_at,
                ':updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
        )
        
        logger.info(f"Manual refund processed for order {order_id} at {refund_at}")
        
        # Send refund completed email
        if user_email:
            try:
                from src.handlers.order import send_refund_completed_email
                send_refund_completed_email(
                    user_email=user_email,
                    user_name=user_name,
                    order_number=order_number,
                    payment_method=payment_method,
                    refund_amount=int(total_amount) if total_amount else 0
                )
                logger.info(f"Refund completed email sent to {user_email}")
            except Exception as email_error:
                logger.error(f"Failed to send refund completed email: {str(email_error)}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "data": {
                    "orderId": order_id,
                    "refundAt": refund_at
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during manual refund: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to process manual refund: {str(e)}"
            }, ensure_ascii=False),
        }
