"""
Admin User Management Handler - Users table integration
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
import boto3
import os
from src.utils.jwt import verify_token

logger = logging.getLogger()
logger.setLevel(logging.INFO)

USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME', 'User')


def get_users_table():
    """Get DynamoDB Users table"""
    dynamodb = boto3.resource(
        'dynamodb',
        region_name='ap-northeast-1',
        endpoint_url=os.environ.get('DYNAMODB_ENDPOINT_URL', None)
    )
    return dynamodb.Table(USERS_TABLE_NAME)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal type to JSON"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def verify_admin_token(event):
    """
    Verify admin token from Authorization header
    
    Args:
        event: Lambda event with headers
    
    Returns:
        Tuple of (is_valid, error_response)
    """
    auth_header = event.get('headers', {}).get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        error_response = {
            "statusCode": 401,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": "認証が必要です",
                "data": None
            }, ensure_ascii=False),
        }
        return False, error_response
    
    token = auth_header[7:]
    
    try:
        # verify_token returns (is_valid, payload, error)
        is_valid, payload, error = verify_token(token)
        
        if not is_valid:
            error_response = {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": error or "トークンが無効です",
                    "data": None
                }, ensure_ascii=False),
            }
            return False, error_response
        
        # Check if user is admin
        if payload.get('user_type') != 'admin':
            error_response = {
                "statusCode": 403,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "管理者権限が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
            return False, error_response
        
        return True, None
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        error_response = {
            "statusCode": 401,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": "無効なトークンです",
                "data": None
            }, ensure_ascii=False),
        }
        return False, error_response


def get_all_users(event, context):
    """
    Get all users with pagination
    
    Args:
        event: Lambda event with query parameters (page, limit)
        context: Lambda context
    
    Returns:
        API response with users list
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get pagination parameters
        query_params = event.get('queryStringParameters', {}) or {}
        page = int(query_params.get('page', 1))
        limit = int(query_params.get('limit', 10))
        
        if page < 1 or limit < 1:
            page, limit = 1, 10
        
        logger.info(f"Get all users - page: {page}, limit: {limit}")
        
        table = get_users_table()
        
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Scan Users table (no PK/SK structure, just userId as PK)
        try:
            response = table.scan(
                Limit=limit + 1  # +1 to check if there are more pages
            )
            logger.info(f"Scan response items count: {len(response.get('Items', []))}")
        except Exception as e:
            logger.error(f"Scan failed: {str(e)}, trying with pagination token")
            response = table.scan()
        
        items = response.get('Items', [])
        
        # Filter out deleted users and exclude sensitive fields
        users = []
        for item in items:
            if item.get('deletedAt'):  # Skip soft-deleted users
                continue
            
            user = {
                'userId': item.get('userId'),
                'email': item.get('email'),
                'name': item.get('name'),
                'phone': item.get('phone'),
                'sex': item.get('sex'),
                'status': item.get('status'),
                'createdAt': item.get('createdAt'),
                'updatedAt': item.get('updatedAt'),
            }
            users.append(user)
        
        # Apply pagination to results
        paginated_users = users[offset:offset + limit]
        total = len(users)
        total_pages = (total + limit - 1) // limit if total > 0 else 0
        
        logger.info(f"Returning {len(paginated_users)} users out of {total} total")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "ユーザー一覧を取得しました",
                "data": {
                    "users": paginated_users,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "totalPages": total_pages,
                }
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"ユーザー一覧の取得に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }


def get_user(event, context):
    """
    Get a single user by ID
    
    Args:
        event: Lambda event with pathParameters (user_id)
        context: Lambda context
    
    Returns:
        API response with user data
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get user ID from path
        path_params = event.get('pathParameters', {}) or {}
        user_id = path_params.get('user_id')
        
        if not user_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Query user by user_id
        table = get_users_table()
        response = table.get_item(
            Key={'userId': user_id}
        )
        
        
        item = response.get('Item')
        if not item:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Exclude sensitive fields
        user = {
            'userId': item.get('userId'),
            'email': item.get('email'),
            'name': item.get('name'),
            'phone': item.get('phone'),
            'sex': item.get('sex'),
            'status': item.get('status'),
            'createdAt': item.get('createdAt'),
            'updatedAt': item.get('updatedAt'),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "ユーザー情報を取得しました",
                "data": user
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"ユーザー情報の取得に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }


def update_user(event, context):
    """
    Update user information
    
    Args:
        event: Lambda event with body and pathParameters (user_id)
        context: Lambda context
    
    Returns:
        API response with updated user data
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get user ID from path
        path_params = event.get('pathParameters', {}) or {}
        user_id = path_params.get('user_id')
        
        if not user_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Get update data from body
        body = json.loads(event.get('body', '{}'))
        
        table = get_users_table()
        
        # Find user first
        response = table.get_item(
            Key={'userId': user_id}
        )
        
        item = response.get('Item')
        if not item or item.get('deletedAt'):
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Build update expression
        update_parts = []
        expression_values = {}
        
        if 'name' in body:
            update_parts.append('#name = :name')
            expression_values[':name'] = body['name']
            expression_values['#name'] = 'name'
        
        if 'phone' in body:
            update_parts.append('phone = :phone')
            expression_values[':phone'] = body['phone']
        
        if 'sex' in body:
            update_parts.append('sex = :sex')
            expression_values[':sex'] = body['sex']
        
        if 'status' in body:
            update_parts.append('#status = :status')
            expression_values[':status'] = body['status']
            expression_values['#status'] = 'status'
        
        # Always update updatedAt
        update_parts.append('updatedAt = :updatedAt')
        expression_values[':updatedAt'] = datetime.now().isoformat()
        
        if not update_parts:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "更新するフィールドを指定してください",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Update user
        update_expression = 'SET ' + ', '.join(update_parts)
        
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
        )
        
        # Get updated user
        response = table.get_item(Key={'userId': user_id})
        updated_item = response.get('Item', {})
        
        user = {
            'userId': updated_item.get('userId'),
            'email': updated_item.get('email'),
            'name': updated_item.get('name'),
            'phone': updated_item.get('phone'),
            'sex': updated_item.get('sex'),
            'status': updated_item.get('status'),
            'createdAt': updated_item.get('createdAt'),
            'updatedAt': updated_item.get('updatedAt'),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "ユーザー情報を更新しました",
                "data": user
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"ユーザー情報の更新に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }


def delete_user(event, context):
    """
    Delete (soft delete) a user
    
    Args:
        event: Lambda event with pathParameters (user_id)
        context: Lambda context
    
    Returns:
        API response with success message
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get user ID from path
        path_params = event.get('pathParameters', {}) or {}
        user_id = path_params.get('user_id')
        
        if not user_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        
        # Find user
        response = table.get_item(
            Key={'userId': user_id}
        )
        
        item = response.get('Item')
        if not item or item.get('deletedAt'):
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザーが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Soft delete user (set deletedAt)
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression='SET deletedAt = :deletedAt, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':deletedAt': datetime.now().isoformat(),
                ':updatedAt': datetime.now().isoformat(),
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "ユーザーを削除しました",
                "data": None
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"ユーザー削除に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }
