"""
Order handler
"""

import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from src.utils.auth import require_auth_handler
from src.utils.dynamodb import get_users_table
from src.utils.jwt import verify_token

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def convert_decimal(obj):
    """
    Convert Decimal objects to int or float for JSON serialization
    """
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def safe_amount_conversion(value, default=0):
    """
    Safely convert amount value (could be Decimal, int, float, or None) to int/float
    """
    try:
        if value is None:
            return default
        if isinstance(value, Decimal):
            return convert_decimal(value)
        if isinstance(value, (int, float)):
            return value
        if isinstance(value, str):
            # Try to parse string as number
            try:
                return int(value)
            except ValueError:
                return float(value)
        return default
    except Exception as e:
        logger.warning(f"Error converting amount {value}: {str(e)}")
        return default


def extract_user_id_from_token(event):
    """
    Extract user_id from JWT token in Authorization header

    Returns:
        user_id if valid token found, None otherwise
    """
    headers = event.get('headers', {})

    auth_header = (
        headers.get('Authorization', '') or 
        headers.get('authorization', '') or
        headers.get('AUTHORIZATION', '')
    )

    logger.info(f"Authorization header: {auth_header[:50] if auth_header else 'None'}...")

    if not auth_header or not auth_header.startswith('Bearer '):
        logger.warning(f"No Bearer token found")
        return None

    token = auth_header[7:]  # Remove "Bearer " prefix
    logger.info(f"Verifying token: {token[:20]}...")
    is_valid, payload, error = verify_token(token)

    if not is_valid or not payload:
        logger.warning(f"Token verification failed: {error}")
        return None

    logger.info(f"JWT payload: {payload}")  # Added logging for debugging

    user_id = payload.get('user_id')
    if not user_id:
        logger.warning("No user_id in JWT payload")
        return None

    logger.info(f"Extracted user_id from JWT: {user_id}")
    return user_id


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

        # Get user ID from token
        user_id = extract_user_id_from_token(event)
        if not user_id:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }

        table = get_users_table()

        # Query all ORDER items for this user (PK=USER#{userId}, SK starts with ORDER#)
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": "ORDER#"
            },
            ScanIndexForward=False  # Sort by most recent first
        )

        logger.info(f"Querying DynamoDB with PK: USER#{user_id}, SK begins_with: ORDER#")
        logger.info(f"DynamoDB response items count: {len(response.get('Items', []))}")

        orders = []

        # Extract ORDER items
        for item in response.get('Items', []):
            order_id = item.get('orderId')
            
            # Get ORDER_ITEM entries for this order
            items_response = table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk": f"ORDER_ITEM#{order_id}"
                }
            )
            
            order_items = []
            for order_item in items_response.get('Items', []):
                order_items.append({
                    "orderItemId": order_item.get('orderItemId') or order_item.get('itemId'),
                    "productId": order_item.get('productId'),
                    "productName": order_item.get('productName', 'Unknown Product'),
                    "quantity": safe_amount_conversion(order_item.get('quantity', 0), 0),
                    "unitPrice": safe_amount_conversion(order_item.get('amount') or order_item.get('unitPrice', 0), 0),
                    "totalPrice": safe_amount_conversion(order_item.get('totalAmount', 0), 0),
                })
            
            orders.append({
                "id": order_id,
                "orderNumber": item.get('orderNumber', ''),
                "orderDate": item.get('orderDate', ''),
                "status": item.get('status', 'PENDING'),
                "totalAmount": safe_amount_conversion(item.get('totalAmount', 0), 0),
                "tax": safe_amount_conversion(item.get('tax', 0), 0),
                "shippingCost": safe_amount_conversion(item.get('shippingCost', 0), 0),
                "discount": safe_amount_conversion(item.get('discount', 0), 0),
                "couponCode": item.get('couponCode', ''),
                "couponDiscount": safe_amount_conversion(item.get('couponDiscount', 0), 0),
                "items": order_items,
            })

        logger.info(f"Retrieved {len(orders)} orders for user {user_id}")

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
                    "orders": orders,
                    "total": len(orders)
                }
            }, ensure_ascii=False, default=convert_decimal),
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
        
        # Get user ID from token
        user_id = extract_user_id_from_token(event)
        if not user_id:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        
        # Query to find the order (could be stored under any user)
        # Since order_id is actually squareTransactionId, scan for it
        scan_response = table.scan(
            FilterExpression="begins_with(SK, :order_prefix) AND (squareTransactionId = :txn_id OR orderId = :order_id)",
            ExpressionAttributeValues={
                ":order_prefix": "ORDER#",
                ":txn_id": order_id,
                ":order_id": order_id
            }
        )
        
        logger.info(f"Scan response: {scan_response}")
        
        order_items = scan_response.get('Items', [])
        
        if not order_items:
            logger.info(f"Order not found with direct scan")
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
        
        order_data = order_items[0]
        logger.info(f"Order data: {order_data}")
        
        # Get the user ID from the order data or use the authenticated user's ID
        order_user_id = order_data.get('userId')
        if not order_user_id:
            # If order doesn't have userId, check the PK of the order
            pk = order_data.get('PK', '')
            logger.info(f"Extracted PK from order: {pk}")
            if pk.startswith('USER#'):
                order_user_id = pk.replace('USER#', '')
            else:
                order_user_id = user_id
        
        logger.info(f"Order user ID determined as: {order_user_id}")
        
        # Get ORDER_ITEM entries for this specific order
        # Items are stored with PK=USER#{userId}, SK=ORDER_ITEM#{orderId}#{itemId}
        logger.info(f"Searching for ORDER_ITEM with order_id: {order_id}, user_id: {order_user_id}")
        
        items_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{order_user_id}",
                ":sk": f"ORDER_ITEM#{order_id}"
            }
        )
        
        logger.info(f"ORDER_ITEM query response: {items_response}")
        
        items = []
        for item in items_response.get('Items', []):
            logger.info(f"Processing ORDER_ITEM from DynamoDB: {item}")
            total_price = safe_amount_conversion(item.get('totalPrice') or item.get('totalAmount', 0), 0)
            logger.info(f"totalPrice/totalAmount from item: {total_price}, raw values - totalPrice: {item.get('totalPrice')}, totalAmount: {item.get('totalAmount')}")
            items.append({
                "orderItemId": item.get('orderItemId') or item.get('itemId'),
                "productId": item.get('productId'),
                "productName": item.get('productName', 'Unknown Product'),
                "quantity": safe_amount_conversion(item.get('quantity', 0), 0),
                "unitPrice": safe_amount_conversion(item.get('amount') or item.get('unitPrice', 0), 0),
                "totalPrice": total_price,
            })
        
        # Build order detail response
        total_amount = safe_amount_conversion(order_data.get('totalAmount', 0), 0)
        tax = safe_amount_conversion(order_data.get('tax', 0), 0)
        shipping_cost = safe_amount_conversion(order_data.get('shippingCost', 0), 0)
        discount = safe_amount_conversion(order_data.get('discount', 0), 0)
        coupon_discount = safe_amount_conversion(order_data.get('couponDiscount', 0), 0)
        
        order_detail = {
            "id": order_data.get('orderId'),
            "orderNumber": order_data.get('orderNumber'),
            "orderDate": order_data.get('orderDate'),
            "status": order_data.get('status', 'PENDING'),
            "subtotal": total_amount - tax - shipping_cost + discount + coupon_discount,
            "tax": tax,
            "shippingCost": shipping_cost,
            "discount": discount,
            "couponDiscount": coupon_discount,
            "couponCode": order_data.get('couponCode'),
            "totalAmount": total_amount,
            "paymentMethod": order_data.get('paymentMethod'),
            "paymentBrand": order_data.get('paymentBrand'),
            "last4": order_data.get('last4'),
            "shippingAddress": order_data.get('shippingAddress'),
            "billingAddress": order_data.get('billingAddress'),
            "items": items,
            "paymentAt": order_data.get('paymentAt'),
            "deliveryAt": order_data.get('deliveryAt'),
        }
        
        # ⭐ Removed old incorrect subtotal calculation
        # The subtotal is now calculated as: totalAmount - tax - shippingCost + discount + couponDiscount
        # which represents: items_sum + coupon_discount - tax - shipping
        
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
            }, ensure_ascii=False, default=convert_decimal),
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


def save_order(event, context):
    """
    Save order and order items after payment completion
    Requires authentication via JWT token
    
    Request body:
    {
        "orderId": "ORDER_xxxxx",
        "orderNumber": "2024001",
        "totalAmount": 7100,
        "tax": 700,
        "shippingCost": 0,
        "discount": 0,
        "couponCode": "SUMMER2024",
        "couponDiscount": 1000,
        "shippingAddress": {...},
        "billingAddress": {...},
        "paymentMethod": "credit_card",
        "paymentBrand": "VISA",
        "last4": "1111",
        "expMonth": 12,
        "expYear": 2026,
        "squareTransactionId": "SQ_xxxxx",
        "items": [
            {
                "productId": "PROD_123",
                "quantity": 2,
                "amount": 3000,
                "totalAmount": 6000
            }
        ]
    }
    """
    try:
        import uuid
        from src.utils.dynamodb import get_users_table
        from src.utils.jwt import verify_token
        
        logger.error(f"[ORDER] SAVE_ORDER called with event body: {event.get('body', '{}')}")
        
        # Get user ID from token
        headers = event.get('headers', {})
        auth_header = (
            headers.get('Authorization', '') or 
            headers.get('authorization', '') or
            headers.get('AUTHORIZATION', '')
        )
        
        logger.error(f"[ORDER] Auth header present: {bool(auth_header)}")
        
        user_id = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            is_valid, payload, error = verify_token(token)
            logger.error(f"[ORDER] Token verification: is_valid={is_valid}, payload={bool(payload)}")
            if is_valid and payload:
                user_id = payload.get('user_id')
                logger.error(f"[ORDER] Extracted user_id: {user_id}")
        
        if not user_id:
            logger.error(f"[ORDER] No user_id found")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }
        
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        order_id = body.get('orderId') or f"ORDER_{uuid.uuid4().hex[:8]}"
        order_number = body.get('orderNumber') or str(int(datetime.utcnow().timestamp()))
        items = body.get('items', [])
        
        logger.info(f"[CREATE_ORDER] Request body: {body}")
        logger.info(f"[CREATE_ORDER] Items received: {items}")
        
        if not items or len(items) == 0:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Order items are required"
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Create ORDER item
        order_item = {
            "PK": f"USER#{user_id}",
            "SK": f"ORDER#{order_id}",
            "orderId": order_id,
            "orderNumber": order_number,
            "orderDate": now,
            "status": body.get('status', 'awaiting_shipment'),  # ⭐ リクエストボディからstatus を取得
            "totalAmount": int(body.get('totalAmount', 0)),
            "tax": int(body.get('tax', 0)),
            "shippingCost": int(body.get('shippingCost', 0)),
            "discount": int(body.get('discount', 0)),
            "couponCode": body.get('couponCode'),
            "couponDiscount": int(body.get('couponDiscount', 0)),
            "shippingAddress": body.get('shippingAddress'),
            "billingAddress": body.get('billingAddress'),
            "paymentMethod": body.get('paymentMethod', 'credit_card'),
            "paymentBrand": body.get('paymentBrand'),
            "last4": body.get('last4'),
            "expMonth": int(body.get('expMonth', 0)) if body.get('expMonth') else None,
            "expYear": int(body.get('expYear', 0)) if body.get('expYear') else None,
            "squareTransactionId": body.get('squareTransactionId'),
            "isCancelRequest": False,
            "createdAt": now,
            "updatedAt": now,
            "paymentAt": now,
        }
        
        # Filter out None values
        order_item = {k: v for k, v in order_item.items() if v is not None}
        
        # Save ORDER to DynamoDB
        table.put_item(Item=order_item)
        logger.info(f"ORDER saved: {order_id}")
        
        # Save ORDER_ITEM entries
        for item in items:
            order_item_id = f"ITEM_{uuid.uuid4().hex[:8]}"
            logger.info(f"[CREATE_ORDER] Processing item: {item}")
            order_item_entry = {
                "PK": f"USER#{user_id}",
                "SK": f"ORDER_ITEM#{order_id}#{order_item_id}",
                "orderId": order_id,
                "orderItemId": order_item_id,
                "productId": item.get('productId'),
                "productName": item.get('productName', 'Unknown Product'),
                "unitPrice": int(item.get('amount', 0)),
                "quantity": int(item.get('quantity', 1)),
                "totalPrice": int(item.get('totalAmount', 0)),
                "createdAt": now,
                "updatedAt": now,
            }
            
            logger.info(f"[CREATE_ORDER] ORDER_ITEM entry to save: {order_item_entry}")
            
            # Filter out None values
            order_item_entry = {k: v for k, v in order_item_entry.items() if v is not None}
            
            table.put_item(Item=order_item_entry)
            logger.info(f"ORDER_ITEM saved: {order_item_id}")
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Order saved successfully",
                "data": {
                    "orderId": order_id,
                    "orderNumber": order_number,
                    "itemCount": len(items)
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during save order: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to save order: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def get_all_orders(event, context):
    """
    Get all orders for admin - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with all orders
    """
    try:
        logger.info(f"Get all orders event: {event}")
        
        # Check if user is admin
        user_id = extract_user_id_from_token(event)
        if not user_id:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }
        
        # Get sort parameter (optional, defaults to 'status')
        query_params = event.get('queryStringParameters', {}) or {}
        sort_by = query_params.get('sortBy', 'status')  # 'status', 'date', 'amount'
        
        table = get_users_table()
        
        # Scan all items to get all orders from all users
        all_orders_dict = {}  # Use dict to group by transaction ID
        
        # Use scan to get all items
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        logger.info(f"Total items scanned: {len(items)}")
        
        # Filter ORDER and ORDER_ITEM items
        for item in items:
            # Try both lowercase and uppercase for SK attribute
            sk = item.get('sk') or item.get('SK') or ''
            pk = item.get('pk') or item.get('PK') or ''
            
            logger.info(f"Processing item - PK: {pk}, SK: {sk}")
            
            # Handle ORDER# (order master record)
            if sk.startswith('ORDER#'):
                txn_id = sk.replace('ORDER#', '')
                logger.info(f"Found ORDER# record with txn_id: {txn_id}")
                if txn_id:
                    all_orders_dict[txn_id] = {
                        "id": txn_id,
                        "userId": item.get('userId'),
                        "orderNumber": item.get('orderNumber'),
                        "orderDate": item.get('orderDate') or item.get('createdAt'),
                        "status": item.get('status', 'unpaid'),
                        "totalAmount": item.get('totalAmount') or Decimal(0),
                        "shippingAddress": item.get('shippingAddress'),
                        "items": []
                    }
            
            # Handle ORDER_ITEM# (individual order items)
            elif sk.startswith('ORDER_ITEM#'):
                txn_id = item.get('squareTransactionId')
                logger.info(f"Found ORDER_ITEM# record with squareTransactionId: {txn_id}")
                if txn_id:
                    # Create order entry if it doesn't exist
                    if txn_id not in all_orders_dict:
                        all_orders_dict[txn_id] = {
                            "id": txn_id,
                            "userId": item.get('userId'),
                            "orderNumber": item.get('orderNumber'),
                            "orderDate": item.get('orderDate') or item.get('createdAt'),
                            "status": item.get('status', 'unpaid'),
                            "totalAmount": Decimal(0),
                            "shippingAddress": item.get('shippingAddress'),
                            "items": []
                        }
                    
                    # Add item to order
                    all_orders_dict[txn_id]["items"].append({
                        "itemId": item.get('itemId'),
                        "productId": item.get('productId'),
                        "productName": item.get('productName'),
                        "quantity": item.get('quantity', 0),
                        "unitPrice": item.get('unitPrice', 0),
                        "amount": item.get('amount', 0)
                    })
                    
                    # Accumulate total amount if items exist
                    if all_orders_dict[txn_id]["totalAmount"] == 0:
                        all_orders_dict[txn_id]["totalAmount"] = Decimal(str(item.get('amount', 0)))
        
        all_orders = list(all_orders_dict.values())
        logger.info(f"Total orders found: {len(all_orders)}")
        
        # Sort orders based on sortBy parameter
        if sort_by == 'status':
            status_order = {'unpaid': 0, 'awaiting_shipment': 1, 'in_transit': 2, 'delivered': 3}
            all_orders.sort(key=lambda x: (status_order.get(x.get('status', 'unpaid'), 4), x.get('orderDate', '')), reverse=True)
        elif sort_by == 'date':
            all_orders.sort(key=lambda x: x.get('orderDate', ''), reverse=True)
        elif sort_by == 'amount':
            all_orders.sort(key=lambda x: x.get('totalAmount', 0), reverse=True)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "data": all_orders
            }, default=convert_decimal, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during get all orders: {str(e)}")
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
def update_order_status(event, context):
    """
    Update order status - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Update order status event: {event}")
        
        # Check if user is admin
        user_id = extract_user_id_from_token(event)
        if not user_id:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        order_id = body.get('orderId')
        new_status = body.get('status')
        
        # Validate input
        valid_statuses = ['unpaid', 'awaiting_shipment', 'in_transit', 'delivered']
        if not order_id or not new_status:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "orderId and status are required"
                }, ensure_ascii=False),
            }
        
        if new_status not in valid_statuses:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        
        # Scan to find the order
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
        
        # Update the order status
        order_item = items[0]
        user_id_from_item = order_item.get('PK')  # Adjusted to use PK
        sk_value = order_item.get('SK')  # Ensure correct sort key is used

        table.update_item(
            Key={
                'PK': user_id_from_item,  # Correct partition key
                'SK': sk_value  # Correct sort key
            },
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': new_status,
                ':updatedAt': datetime.utcnow().isoformat() + 'Z'
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
                "data": {
                    "orderId": order_id,
                    "status": new_status
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during update order status: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to update order status: {str(e)}"
            }, ensure_ascii=False),
        }
