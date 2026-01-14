"""
Notification handler
"""

import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_notifications(event, context):
    """
    Get notifications
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Get notifications event: {event}")
        
        # TODO: Get notifications from database
        # For now, return dummy notifications
        dummy_notifications = [
            {
                "id": "1",
                "title": "新商品が登録されました",
                "message": "春の新作コレクションが入荷しました",
                "timestamp": "2026-01-07T10:00:00Z",
                "type": "info"
            },
            {
                "id": "2",
                "title": "【重要】システムメンテナンスのお知らせ",
                "message": "1月15日 23:00～1月16日 03:00 の間、システムメンテナンスを実施いたします",
                "timestamp": "2026-01-06T15:30:00Z",
                "type": "warning",
                "important": True
            },
            {
                "id": "3",
                "title": "配送完了のお知らせ",
                "message": "ご注文の商品が配送されました",
                "timestamp": "2026-01-05T09:15:00Z",
                "type": "success"
            },
            {
                "id": "4",
                "title": "ポイント還元のお知らせ",
                "message": "お買い物でポイントが還元されました",
                "timestamp": "2026-01-04T14:45:00Z",
                "type": "success"
            },
            {
                "id": "5",
                "title": "クーポンコード配信",
                "message": "会員限定のクーポンコードを配信しました",
                "timestamp": "2026-01-03T11:20:00Z",
                "type": "info"
            },
            {
                "id": "6",
                "title": "【重要】システムメンテナンス完了のお知らせ",
                "message": "予定していたシステムメンテナンスが完了いたしました",
                "timestamp": "2026-01-02T08:00:00Z",
                "type": "success",
                "important": True
            },
            {
                "id": "7",
                "title": "新機能リリース",
                "message": "在庫管理機能がリリースされました",
                "timestamp": "2026-01-01T12:00:00Z",
                "type": "info"
            },
            {
                "id": "8",
                "title": "誕生日特典のお知らせ",
                "message": "お誕生日月の特典をご用意しました",
                "timestamp": "2025-12-31T10:30:00Z",
                "type": "info"
            },
            {
                "id": "9",
                "title": "注文確認のお知らせ",
                "message": "ご注文ありがとうございます",
                "timestamp": "2025-12-30T16:45:00Z",
                "type": "success"
            },
            {
                "id": "10",
                "title": "キャンペーン開始",
                "message": "冬のキャンペーンが開始されました",
                "timestamp": "2025-12-29T09:00:00Z",
                "type": "info"
            }
        ]
        
        # Limit to top 10 notifications
        notifications = dummy_notifications[:10]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Notifications retrieved successfully",
                "data": {
                    "notifications": notifications,
                    "total": len(notifications)
                }
            }),
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
                "message": f"Failed to get notifications: {str(e)}"
            }),
        }


def get_notification_count(event, context):
    """
    Get unread notification count
    
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
        
        # TODO: DB から全件数を取得
        # 現在はダミーデータから未読件数を計算
        total_count = 10
        unread_count = total_count - len(read_ids)  # 既読ID以外が未読
        
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
                    "total": total_count,
                    "unread": unread_count
                }
            }),
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
