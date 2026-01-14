"""
Order handler
"""

import json
import logging
from datetime import datetime, timedelta
from src.utils.auth import require_auth_handler

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@require_auth_handler
def get_orders(event, context):
    """
    Get user orders list - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with orders list
    """
    try:
        logger.info(f"Get orders event: {event}")
        
        # TODO: Get user ID from JWT token
        user_id = "user_001"
        
        # Dummy data - sample orders
        dummy_orders = [
            {
                "id": "order_001",
                "orderNumber": "ORD-2024-0001",
                "orderDate": "2024-01-15T10:30:00Z",
                "status": "delivered",
                "statusLabel": "配送済み",
                "totalAmount": 25800,
                "itemCount": 3,
                "items": [
                    {
                        "productId": "1",
                        "productName": "スポーツシューズ",
                        "quantity": 1,
                        "price": 12000,
                        "image": "shoe.jpg"
                    },
                    {
                        "productId": "2",
                        "productName": "スポーツウェア",
                        "quantity": 2,
                        "price": 6900,
                        "image": "wear.jpg"
                    }
                ]
            },
            {
                "id": "order_002",
                "orderNumber": "ORD-2024-0002",
                "orderDate": "2024-01-10T14:20:00Z",
                "status": "shipped",
                "statusLabel": "発送済み",
                "totalAmount": 15400,
                "itemCount": 2,
                "cancelRequestSent": True,
                "items": [
                    {
                        "productId": "3",
                        "productName": "スポーツバッグ",
                        "quantity": 1,
                        "price": 8900,
                        "image": "bag.jpg"
                    },
                    {
                        "productId": "4",
                        "productName": "ソックス",
                        "quantity": 3,
                        "price": 2500,
                        "image": "sock.jpg"
                    }
                ]
            },
            {
                "id": "order_003",
                "orderNumber": "ORD-2024-0003",
                "orderDate": "2024-01-05T09:15:00Z",
                "status": "pending",
                "statusLabel": "処理中",
                "totalAmount": 8900,
                "itemCount": 1,
                "items": [
                    {
                        "productId": "5",
                        "productName": "キャップ",
                        "quantity": 1,
                        "price": 8900,
                        "image": "cap.jpg"
                    }
                ]
            }
        ]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Orders retrieved successfully",
                "data": {
                    "orders": dummy_orders,
                    "total": len(dummy_orders)
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting orders: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get orders: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def get_order_detail(event, context):
    """
    Get order detail - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with order detail
    """
    try:
        logger.info(f"Get order detail event: {event}")
        
        # Get order ID from path parameters
        order_id = event.get('pathParameters', {}).get('id')
        
        if not order_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Order ID is required"
                }, ensure_ascii=False),
            }
        
        # TODO: Get user ID from JWT token
        user_id = "user_001"
        
        # Dummy data - sample order detail
        order_detail = {
            "id": order_id,
            "orderNumber": "ORD-2024-0001",
            "orderDate": "2024-01-15T10:30:00Z",
            "status": "pending",
            "statusLabel": "未入金",
            "deliveryDate": "2024-01-18T15:00:00Z",
            "totalAmount": 25800,
            "subtotal": 24000,
            "tax": 1800,
            "shippingCost": 0,
            "discount": 0,
            "items": [
                {
                    "id": "item_001",
                    "productId": "1",
                    "productName": "スポーツシューズ",
                    "quantity": 1,
                    "unitPrice": 12000,
                    "totalPrice": 12000,
                    "image": "shoe.jpg"
                },
                {
                    "id": "item_002",
                    "productId": "2",
                    "productName": "スポーツウェア",
                    "quantity": 2,
                    "unitPrice": 6900,
                    "totalPrice": 13800,
                    "image": "wear.jpg"
                }
            ],
            "shippingAddress": {
                "firstName": "太郎",
                "lastName": "山田",
                "phone": "090-1234-5678",
                "postalCode": "100-0005",
                "prefecture": "東京都",
                "address": "千代田区丸の内1-1-1",
                "building": "丸ビル 4階"
            },
            "billingAddress": {
                "firstName": "太郎",
                "lastName": "山田",
                "phone": "090-1234-5678",
                "postalCode": "100-0005",
                "prefecture": "東京都",
                "address": "千代田区丸の内1-1-1",
                "building": "丸ビル 4階"
            },
            "paymentMethod": {
                "type": "credit_card",
                "lastFourDigits": "4242",
                "cardType": "VISA"
            },
            "cancelRequestSent": True
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Order detail retrieved successfully",
                "data": order_detail
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting order detail: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get order detail: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def cancel_order(event, context):
    """
    Cancel order - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Cancel order event: {event}")
        
        # Get order ID from path parameters
        order_id = event.get('pathParameters', {}).get('id')
        if not order_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Order ID is required"
                }, ensure_ascii=False),
            }
        
        # Get request body
        body = json.loads(event.get('body', '{}'))
        reason = body.get('reason', '')
        
        if not reason:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Cancellation reason is required"
                }, ensure_ascii=False),
            }
        
        # TODO: Update order status in database
        # TODO: Send cancellation email to customer
        # TODO: Process any refunds if payment was made
        
        logger.info(f"Order {order_id} cancelled. Reason: {reason}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Order cancelled successfully",
                "data": {
                    "orderId": order_id,
                    "status": "cancelled",
                    "cancelRequestSent": True
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error cancelling order: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to cancel order: {str(e)}"
            }, ensure_ascii=False),
        }
