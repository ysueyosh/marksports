"""
Admin notification management handler - DynamoDB integration
"""

import json
import logging
import uuid
import boto3
import os
from decimal import Decimal
from datetime import datetime
from src.utils.jwt import verify_token

logger = logging.getLogger()
logger.setLevel(logging.INFO)

NOTIFICATION_TABLE_NAME = os.environ.get('NOTIFICATION_TABLE_NAME', 'Notification')
NOTIFICATION_PK = 'NOTIFICATION'

def get_notification_table():
    """Get DynamoDB Notification table"""
    dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table(NOTIFICATION_TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def verify_admin_token(event):
    """
    Verify admin JWT token from Authorization header
    
    Args:
        event: Lambda event
    
    Returns:
        tuple: (is_valid, error_response) - One will be None
    """
    auth_header = event.get('headers', {}).get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return False, {
            "statusCode": 401,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": "認証が必要です"
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    
    try:
        is_valid, payload, error = verify_token(token)
        
        if not is_valid:
            return False, {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": error or "トークンが無効です"
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        # Check if token is for admin
        if payload.get('user_type') != 'admin':
            return False, {
                "statusCode": 403,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "管理者権限が必要です"
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        return True, None
    
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return False, {
            "statusCode": 401,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": "無効なトークンです"
            }, cls=DecimalEncoder, ensure_ascii=False),
        }


def get_all_notifications(event, context):
    """
    Get all notifications with pagination
    
    Args:
        event: Lambda event with query parameters (page, limit)
        context: Lambda context
    
    Returns:
        API response with notifications list
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
        
        table = get_notification_table()
        
        # Query notifications (PK = 'NOTIFICATION')
        query_params_dict = {
            'KeyConditionExpression': 'PK = :pk',
            'ExpressionAttributeValues': {':pk': NOTIFICATION_PK},
            'Limit': limit + 1,
        }
        
        # Only add ExclusiveStartKey if page > 1
        if page > 1:
            query_params_dict['ExclusiveStartKey'] = {
                'PK': NOTIFICATION_PK,
                'SK': f'NOTIFICATION#{(page - 1) * limit}'
            }
        
        response = table.query(**query_params_dict)
        
        items = response.get('Items', [])
        
        # Exclude soft-deleted notifications
        notifications = []
        for item in items:
            notification = {
                'notificationId': item.get('notificationId'),
                'type': item.get('type'),
                'target': item.get('target'),
                'title': item.get('title'),
                'content': item.get('content'),
                'startDate': item.get('startDate'),
                'endDate': item.get('endDate'),
                'createdAt': item.get('createdAt'),
            }
            notifications.append(notification)
        
        total = len(notifications)
        total_pages = (total + limit - 1) // limit
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "お知らせ一覧を取得しました",
                "data": {
                    "notifications": notifications,
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "totalPages": total_pages,
                }
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"お知らせ一覧の取得に失敗しました: {str(e)}",
                "data": None
            }, cls=DecimalEncoder, ensure_ascii=False),
        }


def get_notification(event, context):
    """
    Get a single notification by ID
    
    Args:
        event: Lambda event with pathParameters (notification_id)
        context: Lambda context
    
    Returns:
        API response with notification data
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get notification ID from path
        path_params = event.get('pathParameters', {}) or {}
        notification_id = path_params.get('notification_id')
        
        if not notification_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "お知らせIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_notification_table()
        
        # Query notification by notificationId
        response = table.query(
            KeyConditionExpression='PK = :pk',
            FilterExpression='notificationId = :id',
            ExpressionAttributeValues={
                ':pk': NOTIFICATION_PK,
                ':id': notification_id
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
                    "message": "お知らせが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        item = items[0]
        
        notification = {
            'notificationId': item.get('notificationId'),
            'type': item.get('type'),
            'target': item.get('target'),
            'title': item.get('title'),
            'content': item.get('content'),
            'startDate': item.get('startDate'),
            'endDate': item.get('endDate'),
            'createdAt': item.get('createdAt'),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "お知らせ情報を取得しました",
                "data": notification
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting notification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"お知らせ情報の取得に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }


def create_notification(event, context):
    """
    Create a new notification
    
    Args:
        event: Lambda event with body
        context: Lambda context
    
    Returns:
        API response with created notification
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "リクエストボディが無効です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Validate required fields
        required_fields = ['title', 'content', 'type', 'target', 'startDate']
        for field in required_fields:
            if field not in body or not body[field]:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"{field}は必須です",
                        "data": None
                    }, ensure_ascii=False),
                }
        
        table = get_notification_table()
        
        notification_id = str(uuid.uuid4())
        sk = f'NOTIFICATION#{datetime.utcnow().isoformat()}'
        
        item = {
            'PK': NOTIFICATION_PK,
            'SK': sk,
            'notificationId': notification_id,
            'type': body['type'],
            'target': body['target'],
            'title': body['title'],
            'content': body['content'],
            'startDate': body.get('startDate'),
            'endDate': body.get('endDate'),
            'createdAt': datetime.utcnow().isoformat() + 'Z',
        }
        
        table.put_item(Item=item)
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "お知らせを作成しました",
                "data": item
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"お知らせの作成に失敗しました: {str(e)}",
                "data": None
            }, cls=DecimalEncoder, ensure_ascii=False),
        }


def update_notification(event, context):
    """
    Update notification information
    
    Args:
        event: Lambda event with body and pathParameters
        context: Lambda context
    
    Returns:
        API response with updated notification
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get notification ID from path
        path_params = event.get('pathParameters', {}) or {}
        notification_id = path_params.get('notification_id')
        
        if not notification_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "お知らせIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "リクエストボディが無効です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_notification_table()
        
        # Find notification first
        response = table.query(
            KeyConditionExpression='PK = :pk',
            FilterExpression='notificationId = :id',
            ExpressionAttributeValues={
                ':pk': NOTIFICATION_PK,
                ':id': notification_id
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
                    "message": "お知らせが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        item = items[0]
        sk = item['SK']
        
        # Build update expression
        update_parts = []
        expression_values = {}
        
        if 'title' in body:
            update_parts.append('title = :title')
            expression_values[':title'] = body['title']
        
        if 'content' in body:
            update_parts.append('content = :content')
            expression_values[':content'] = body['content']
        
        if 'type' in body:
            update_parts.append('#type = :type')
            expression_values[':type'] = body['type']
            expression_values['#type'] = 'type'
        
        if 'target' in body:
            update_parts.append('target = :target')
            expression_values[':target'] = body['target']
        
        if 'startDate' in body:
            update_parts.append('startDate = :startDate')
            expression_values[':startDate'] = body['startDate']
        
        if 'endDate' in body:
            update_parts.append('endDate = :endDate')
            expression_values[':endDate'] = body['endDate']
        
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
        
        # Update notification
        update_expression = 'SET ' + ', '.join(update_parts)
        
        table.update_item(
            Key={'PK': NOTIFICATION_PK, 'SK': sk},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values if ':type' in str(expression_values) else None,
            ExpressionAttributeNames={'#type': 'type'} if '#type' in update_expression else None,
        )
        
        # Get updated notification
        response = table.get_item(Key={'PK': NOTIFICATION_PK, 'SK': sk})
        updated_item = response.get('Item', {})
        
        notification = {
            'notificationId': updated_item.get('notificationId'),
            'type': updated_item.get('type'),
            'target': updated_item.get('target'),
            'title': updated_item.get('title'),
            'content': updated_item.get('content'),
            'startDate': updated_item.get('startDate'),
            'endDate': updated_item.get('endDate'),
            'createdAt': updated_item.get('createdAt'),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "お知らせを更新しました",
                "data": notification
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error updating notification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"お知らせの更新に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }


def delete_notification(event, context):
    """
    Delete (hard delete) a notification
    
    Args:
        event: Lambda event with pathParameters
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Verify admin token
        is_valid, error_response = verify_admin_token(event)
        if not is_valid:
            return error_response
        
        # Get notification ID from path
        path_params = event.get('pathParameters', {}) or {}
        notification_id = path_params.get('notification_id')
        
        if not notification_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "お知らせIDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_notification_table()
        
        # Find notification
        response = table.query(
            KeyConditionExpression='PK = :pk',
            FilterExpression='notificationId = :id',
            ExpressionAttributeValues={
                ':pk': NOTIFICATION_PK,
                ':id': notification_id
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
                    "message": "お知らせが見つかりません",
                    "data": None
                }, ensure_ascii=False),
            }
        
        item = items[0]
        sk = item['SK']
        
        # Delete notification
        table.delete_item(Key={'PK': NOTIFICATION_PK, 'SK': sk})
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "お知らせを削除しました",
                "data": None
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"お知らせの削除に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }
