"""
Notification handler
"""

import json
import logging
from decimal import Decimal
from src.utils.cors import cors_headers
from src.utils.dynamodb import get_notification_table

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Constants
NOTIFICATION_PK = 'NOTIFICATION'

class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def get_notifications(event, context):
    """
    Get notifications from database
    
    Returns only notifications that are currently active (startDate <= today <= endDate or no endDate)
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with active notifications
    """
    try:
        logger.info("Get notifications from database")
        
        table = get_notification_table()
        
        # Query all notifications from database
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={
                ':pk': NOTIFICATION_PK
            }
        )
        
        notifications = response.get('Items', [])
        
        # Map database fields to API response fields
        # Filter to only active notifications (based on startDate and endDate)
        from datetime import datetime
        today = datetime.utcnow().date().isoformat()
        
        active_notifications = []
        for notification in notifications:
            start_date = notification.get('startDate', '')
            end_date = notification.get('endDate', '')
            
            # Check if notification is active
            is_active = True
            if start_date and start_date > today:
                is_active = False
            if end_date and end_date < today:
                is_active = False
            
            if is_active:
                mapped = {
                    'id': notification.get('notificationId'),
                    'title': notification.get('title', ''),
                    'message': notification.get('content', ''),
                    'timestamp': notification.get('createdAt', ''),
                    'type': 'info',  # Default type
                    'important': notification.get('type') == 'important'
                }
                active_notifications.append(mapped)
        
        # Sort by timestamp (newest first)
        active_notifications.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Limit to top 10 notifications
        notifications_limited = active_notifications[:10]
        
        return {
            "statusCode": 200,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": True,
                "message": "Notifications retrieved successfully",
                "data": {
                    "notifications": notifications_limited,
                    "total": len(notifications_limited)
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        import traceback
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Error getting notifications: {error_msg}\nStack: {stack_trace}")
        return {
            "statusCode": 500,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get notifications: {error_msg}",
                "error": stack_trace if True else None
            }),
        }


def get_notification_detail(event, context):
    """
    Get a single notification by notificationId using GSI
    
    Args:
        event: Lambda event with pathParameters containing notification_id
        context: Lambda context
    
    Returns:
        API response with notification detail
    """
    try:
        # Get notification ID from path parameter
        notification_id = event.get("pathParameters", {}).get("notification_id")
        
        if not notification_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Notification ID is required"
                }),
            }
        
        logger.info(f"Get notification detail: {notification_id}")
        
        table = get_notification_table()
        
        # Query notification by notificationId using Scan
        response = table.scan(
            FilterExpression='notificationId = :notification_id',
            ExpressionAttributeValues={
                ':notification_id': notification_id
            }
        )
        
        items = response.get('Items', [])
        
        if not items or len(items) == 0:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Notification not found"
                }),
            }
        
        notification = items[0]
        
        # Check if notification is active
        from datetime import datetime
        today = datetime.utcnow().date().isoformat()
        
        start_date = notification.get('startDate', '')
        end_date = notification.get('endDate', '')
        
        is_active = True
        if start_date and start_date > today:
            is_active = False
        if end_date and end_date < today:
            is_active = False
        
        if not is_active:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Notification is not currently available"
                }),
            }
        
        # Map DynamoDB fields to API response fields
        mapped_notification = {
            'id': notification.get('notificationId'),
            'title': notification.get('title', ''),
            'message': notification.get('content', ''),
            'timestamp': notification.get('createdAt', ''),
            'type': 'info',  # Default type
            'important': notification.get('type') == 'important'
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Notification detail retrieved successfully",
                "data": mapped_notification
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error getting notification detail: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get notification detail: {str(e)}"
            }),
        }


def get_notification_count(event, context):
    """
    Get unread notification count by querying the database
    
    Args:
        event: Lambda event with queryStringParameters containing readIds (JSON array string)
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Get notification count event: {event}")
        
        # クエリパラメータから既読IDを取得
        read_ids = []
        query_params = event.get("queryStringParameters", {})
        if query_params and "readIds" in query_params:
            try:
                read_ids = json.loads(query_params["readIds"])
            except (json.JSONDecodeError, TypeError):
                read_ids = []
        
        # DB から全通知数を取得
        table = get_notification_table()
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={
                ':pk': NOTIFICATION_PK
            }
        )
        
        notifications = response.get('Items', [])
        
        # 有効な通知のみをカウント
        from datetime import datetime
        today = datetime.utcnow().date().isoformat()
        
        active_count = 0
        for notification in notifications:
            start_date = notification.get('startDate', '')
            end_date = notification.get('endDate', '')
            
            # Check if notification is active
            is_active = True
            if start_date and start_date > today:
                is_active = False
            if end_date and end_date < today:
                is_active = False
            
            if is_active:
                active_count += 1
        
        # 未読件数 = 全通知数 - 既読ID数
        unread_count = active_count - len(read_ids)
        unread_count = max(0, unread_count)  # 負の値は0に
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Notification count retrieved successfully",
                "data": {
                    "total": active_count,
                    "unread": unread_count
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error getting notification count: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get notification count: {str(e)}"
            }),
        }
