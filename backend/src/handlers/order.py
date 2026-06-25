"""
Order handler
"""

import json
import logging
import os
import requests
from datetime import datetime, timedelta
from decimal import Decimal
from src.utils.auth import require_auth_handler, require_admin_auth
from src.utils.dynamodb import get_users_table
from src.utils.ses import send_email

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Square API Configuration
SQUARE_ACCESS_TOKEN = os.environ.get('SQUARE_ACCESS_TOKEN', '')
SQUARE_ENVIRONMENT = os.environ.get('SQUARE_ENVIRONMENT', 'sandbox')
SQUARE_API_BASE_URL = (
    'https://connect.squareup.com' if SQUARE_ENVIRONMENT == 'production'
    else 'https://connect.squareupsandbox.com'
)
SQUARE_HEADERS = {
    'Square-Version': '2024-10-17',
    'Authorization': f'Bearer {SQUARE_ACCESS_TOKEN}',
    'Content-Type': 'application/json',
}


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


def get_admin_emails():
    """
    Get all admin email addresses from Admin table
    
    Returns:
        List of admin email addresses
    """
    try:
        from src.utils.dynamodb import get_admin_table
        admin_table = get_admin_table()
        
        # Scan all items in Admin table to get all admin emails
        response = admin_table.scan()
        
        admin_emails = []
        for item in response.get('Items', []):
            email = item.get('email')
            if email:
                admin_emails.append(email)
        
        logger.info(f"Found {len(admin_emails)} admin emails: {admin_emails}")
        return admin_emails
    except Exception as e:
        logger.error(f"Error getting admin emails: {str(e)}")
        return []


def send_cancel_request_notification_email(order_number: str, user_name: str, user_email: str, cancel_reason: str, admin_emails: list):
    """
    Send cancel request notification email to all admins
    
    Args:
        order_number: Order number
        user_name: Customer name
        user_email: Customer email
        cancel_reason: Cancellation reason
        admin_emails: List of admin email addresses
    """
    try:
        if not admin_emails:
            logger.warning("No admin emails found")
            return
        
        subject = f"【キャンセルリクエスト】注文番号: {order_number}"
        body = f'''
キャンセルリクエストが送信されました。

顧客情報:
名前: {user_name}
メール: {user_email}

注文情報:
注文番号: {order_number}

キャンセル理由:
{cancel_reason}

管理画面よりキャンセル申請を確認・処理してください。
'''
        
        # Send email to all admins
        result = send_email(
            to_addresses=admin_emails,
            subject=subject,
            body_text=body,
            from_email=os.environ.get('ORDER_FROM_EMAIL', 'info@mark-sports.com')
        )
        
        if result.get('success'):
            logger.info(f"Cancel request notification email sent to {len(admin_emails)} admins for order {order_number}")
        else:
            logger.error(f"Failed to send cancel request notification email: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error sending cancel request notification email: {str(e)}")


def send_order_status_update_email(user_email: str, user_name: str, order_number: str, new_status: str):
    """
    Send order status update email to customer
    
    Args:
        user_email: Customer email address
        user_name: Customer name
        order_number: Order number
        new_status: New order status (unpaid, awaiting_shipment, in_transit, delivered)
    """
    try:
        # Define status-specific messages
        status_messages = {
            'unpaid': {
                'subject': '【重要】お支払いの確認が取れませんでした',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

大変申し訳ございませんが、お支払いの確認が取れませんでした。
お手数ですが、お支払い方法を更新していただきますようお願いいたします。

マイページよりお支払い方法を更新してください。

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
            },
            'awaiting_shipment': {
                'subject': 'お支払いを確認いたしました',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

お支払いを確認いたしました。
配送準備を開始いたしますので、今しばらくお待ちください。

商品の発送が完了次第、改めてご連絡させていただきます。

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
            },
            'in_transit': {
                'subject': '商品を発送いたしました',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

商品の配送を開始いたしました。
到着までしばらくお待ちください。

配送状況につきましては、配送業者の追跡サービスをご利用ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
            },
            'delivered': {
                'subject': '商品が到着いたしました',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

商品が無事に到着いたしました。

万が一、商品に不備がございましたら、お早めにお問い合わせください。

この度はご利用いただき、誠にありがとうございました。
またのご利用を心よりお待ちしております。

今後ともよろしくお願いいたします。
'''
            },
            'cancelled_customer': {
                'subject': '【確認】ご注文がキャンセルされました',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

ご注文がキャンセルされました。

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
            },
            'cancelled_internal': {
                'subject': '【確認】ご注文がキャンセルされました',
                'body': f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}

ご注文がキャンセルされました。

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
            }
        }
        
        # Get message for the status
        message_data = status_messages.get(new_status)
        if not message_data:
            logger.warning(f"No email template for status: {new_status}")
            return
        
        # Send email
        result = send_email(
            to_addresses=[user_email],
            subject=message_data['subject'],
            body_text=message_data['body'],
            from_email=os.environ.get('ORDER_FROM_EMAIL', 'info@mark-sports.com')
        )
        
        if result.get('success'):
            logger.info(f"Status update email sent successfully to {user_email} for order {order_number}")
        else:
            logger.error(f"Failed to send status update email: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error sending order status update email: {str(e)}")


def send_refund_completed_email(user_email: str, user_name: str, order_number: str, payment_method: str, refund_amount: int):
    """
    Send refund completed notification email to customer
    
    Args:
        user_email: Customer email address
        user_name: Customer name
        order_number: Order number
        payment_method: Payment method (credit_card, bank_transfer, etc.)
        refund_amount: Refund amount in yen
    """
    try:
        payment_method_labels = {
            'credit_card': 'クレジットカード',
            'apple_pay': 'Apple Pay',
            'google_pay': 'Google Pay',
            'bank_transfer': '銀行振込'
        }
        
        payment_label = payment_method_labels.get(payment_method, payment_method)
        
        subject = '【返金完了】ご注文の返金処理が完了しました'
        body = f'''
{user_name} 様

いつもご利用いただきありがとうございます。

ご注文番号: {order_number}
返金金額: ¥{refund_amount:,}
お支払い方法: {payment_label}

上記注文の返金処理が完了いたしました。

【返金方法について】
'''
        
        if payment_method in ['credit_card', 'apple_pay', 'google_pay']:
            body += '''
クレジットカード・電子決済でのお支払い分は、ご利用のカード会社を通じて返金されます。
返金のタイミングはカード会社により異なりますので、詳細はカード会社にお問い合わせください。
'''
        elif payment_method == 'bank_transfer':
            body += '''
銀行振込でのお支払い分は、ご指定の口座へ返金いたしました。
お振込み完了までに数営業日かかる場合がございます。
'''
        
        body += '''

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。
'''
        
        # Send email
        result = send_email(
            to_addresses=[user_email],
            subject=subject,
            body_text=body,
            from_email=os.environ.get('ORDER_FROM_EMAIL', 'info@mark-sports.com')
        )
        
        if result.get('success'):
            logger.info(f"Refund completed email sent successfully to {user_email} for order {order_number}")
        else:
            logger.error(f"Failed to send refund completed email: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Error sending refund completed email: {str(e)}")


def process_square_refund(payment_id: str, amount_money: dict, reason: str = "Requested by customer") -> dict:
    """
    Process refund via Square API
    
    Args:
        payment_id: Square payment ID (squareTransactionId)
        amount_money: Amount to refund {"amount": cents, "currency": "JPY"}
        reason: Refund reason
        
    Returns:
        {"success": bool, "refund_id": str, "error": str}
    """
    try:
        import uuid
        
        refund_body = {
            "idempotency_key": str(uuid.uuid4()),
            "payment_id": payment_id,
            "amount_money": amount_money,
            "reason": reason
        }
        
        logger.info(f"Processing Square refund: payment_id={payment_id}, amount={amount_money}")
        
        response = requests.post(
            f"{SQUARE_API_BASE_URL}/v2/refunds",
            headers=SQUARE_HEADERS,
            json=refund_body,
            timeout=30
        )
        
        logger.info(f"Square refund response status: {response.status_code}")
        logger.info(f"Square refund response: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            refund = result.get('refund', {})
            refund_id = refund.get('id')
            
            if refund_id:
                logger.info(f"Successfully processed refund: {refund_id}")
                return {
                    "success": True,
                    "refund_id": refund_id,
                    "error": None
                }
        
        error_message = response.text
        logger.error(f"Failed to process Square refund: {error_message}")
        return {
            "success": False,
            "refund_id": None,
            "error": error_message
        }
        
    except Exception as e:
        logger.error(f"Error in process_square_refund: {str(e)}")
        return {
            "success": False,
            "refund_id": None,
            "error": str(e)
        }


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

        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
        if not user_id:
            logger.error("No user_id in user_payload")
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
                raw_product_id = str(order_item.get('productId') or '')
                parsed_product_id = raw_product_id
                parsed_size = ''
                parsed_color = ''

                if '|' in raw_product_id:
                    parts = raw_product_id.split('|')
                    parsed_product_id = parts[0]
                    if len(parts) > 1:
                        parsed_size = parts[1]
                    if len(parts) > 2:
                        parsed_color = parts[2]

                order_items.append({
                    "orderItemId": order_item.get('orderItemId') or order_item.get('itemId'),
                    "productId": parsed_product_id,
                    "productName": order_item.get('productName', 'Unknown Product'),
                    "quantity": safe_amount_conversion(order_item.get('quantity', 0), 0),
                    "unitPrice": safe_amount_conversion(order_item.get('amount') or order_item.get('unitPrice', 0), 0),
                    "totalAmount": safe_amount_conversion(order_item.get('totalAmount', 0), 0),
                    "size": order_item.get('size', '') or parsed_size,
                    "color": order_item.get('color', '') or parsed_color,
                    "selectedOptionChoiceName": order_item.get('selectedOptionChoiceName', ''),
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
                "isCancelRequest": item.get('isCancelRequest', False),
                "refundAt": item.get('refundAt'),
            })

        orders.sort(
            key=lambda order: order.get('orderDate', ''),
            reverse=True,
        )

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
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
        if not user_id:
            logger.error("No user_id in user_payload")
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
            raw_product_id = str(item.get('productId') or '')
            parsed_product_id = raw_product_id
            parsed_size = ''
            parsed_color = ''

            if '|' in raw_product_id:
                parts = raw_product_id.split('|')
                parsed_product_id = parts[0]
                if len(parts) > 1:
                    parsed_size = parts[1]
                if len(parts) > 2:
                    parsed_color = parts[2]

            total_amount = safe_amount_conversion(item.get('totalAmount', 0), 0)
            logger.info(f"totalAmount from item: {total_amount}, raw value - totalAmount: {item.get('totalAmount')}")
            items.append({
                "orderItemId": item.get('orderItemId') or item.get('itemId'),
                "productId": parsed_product_id,
                "productName": item.get('productName', 'Unknown Product'),
                "quantity": safe_amount_conversion(item.get('quantity', 0), 0),
                "unitPrice": safe_amount_conversion(item.get('amount') or item.get('unitPrice', 0), 0),
                "totalAmount": total_amount,
                "size": item.get('size', '') or parsed_size,
                "color": item.get('color', '') or parsed_color,
                "selectedOptionChoiceName": item.get('selectedOptionChoiceName', ''),
            })
        
        # Build order detail response
        total_amount = safe_amount_conversion(order_data.get('totalAmount', 0), 0)
        tax = safe_amount_conversion(order_data.get('tax', 0), 0)
        shipping_cost = safe_amount_conversion(order_data.get('shippingCost', 0), 0)
        shipping_base_fee = safe_amount_conversion(order_data.get('shippingBaseFee', shipping_cost), 0)
        shipping_region_fee = safe_amount_conversion(order_data.get('shippingRegionFee', 0), 0)
        discount = safe_amount_conversion(order_data.get('discount', 0), 0)
        coupon_discount = safe_amount_conversion(order_data.get('couponDiscount', 0), 0)
        
        order_detail = {
            "id": order_data.get('orderId'),
            "orderNumber": order_data.get('orderNumber'),
            "orderDate": order_data.get('orderDate'),
            "status": order_data.get('status', 'PENDING'),
            "subtotal": total_amount - tax - shipping_cost + discount + coupon_discount,
            "tax": tax,
            "taxRate": safe_amount_conversion(order_data.get('taxRate', 0), 0),
            "shippingCost": shipping_cost,
            "shippingBaseFee": shipping_base_fee,
            "shippingRegionFee": shipping_region_fee,
            "shippingRegionKey": order_data.get('shippingRegionKey'),
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
            "isCancelRequest": order_data.get('isCancelRequest', False),
            "cancelReason": order_data.get('cancelReason'),
            "cancelRequestAt": order_data.get('cancelRequestAt'),
            "refundAt": order_data.get('refundAt'),
            "orderNote": order_data.get('orderNote'),
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
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
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
        reason = body.get('reason', '').strip()
        
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
        
        table = get_users_table()
        
        # Query the order to get order details
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": f"ORDER#{order_id}"
            }
        )
        
        orders = response.get('Items', [])
        if not orders:
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
        
        order = orders[0]
        order_number = order.get('orderNumber', order_id)
        user_name = order.get('userName', '')
        user_email = order.get('userEmail', '')
        
        # Get current timestamp
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        # Update order with cancel request information
        update_expression = (
            "SET isCancelRequest = :true, "
            "cancelReason = :reason, "
            "cancelRequestAt = :timestamp, "
            "updatedAt = :timestamp"
        )
        
        expression_attribute_values = {
            ":true": True,
            ":reason": reason,
            ":timestamp": current_time
        }
        
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"ORDER#{order_id}"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Send notification email to all admins
        admin_emails = get_admin_emails()
        if admin_emails:
            send_cancel_request_notification_email(
                order_number=order_number,
                user_name=user_name,
                user_email=user_email,
                cancel_reason=reason,
                admin_emails=admin_emails
            )
        else:
            logger.warning("No admin emails found for cancel request notification")
        
        logger.info(f"Order {order_id} cancel request submitted. Reason: {reason}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Order cancellation request submitted successfully",
                "data": {
                    "orderId": order_id,
                    "status": "cancel_requested",
                    "cancelRequestSent": True
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error submitting cancel order request: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to submit cancellation request: {str(e)}"
            }, ensure_ascii=False),
        }



@require_auth_handler
def revoke_cancel_request(event, context):
    """
    Revoke cancel request - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Revoke cancel request event: {event}")
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
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
        
        table = get_users_table()
        
        # Query the order to verify it exists and belongs to the user
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": f"ORDER#{order_id}"
            }
        )
        
        orders = response.get('Items', [])
        if not orders:
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
        
        order = orders[0]
        
        # Check if cancel request is actually submitted
        if not order.get('isCancelRequest', False):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "No cancel request to revoke"
                }, ensure_ascii=False),
            }
        
        # Get current timestamp
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        # Remove cancel request information from order
        update_expression = (
            "SET isCancelRequest = :false, "
            "updatedAt = :timestamp "
            "REMOVE cancelReason, cancelRequestAt"
        )
        
        expression_attribute_values = {
            ":false": False,
            ":timestamp": current_time
        }
        
        table.update_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"ORDER#{order_id}"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        logger.info(f"Order {order_id} cancel request revoked by user {user_id}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Cancel request revoked successfully",
                "data": {
                    "orderId": order_id,
                    "status": order.get('status', 'unknown'),
                    "cancelRequestSent": False
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error revoking cancel request: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to revoke cancel request: {str(e)}"
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
        
        # Log the raw request body first
        raw_body = event.get('body', '{}')
        logger.info(f"[ORDER_SAVE] Raw body received: {raw_body[:200]}...")
        
        body = json.loads(raw_body)
        
        # Get user_id - try from Authorization header first, then from body token
        user_id = None
        
        # Try to get token from Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            try:
                is_valid, payload, error_msg = verify_token(token)
                if is_valid:
                    user_id = payload.get('user_id')
                    logger.info(f"[ORDER_SAVE] Got user_id from Authorization header: {user_id}")
                else:
                    logger.warning(f"[ORDER_SAVE] Token verification failed: {error_msg}")
            except Exception as token_error:
                logger.warning(f"[ORDER_SAVE] Token verification error: {str(token_error)}")
        
        # Fallback to body token if header token failed
        if not user_id:
            token = body.get('token')
            if token:
                try:
                    is_valid, payload, error_msg = verify_token(token)
                    if is_valid:
                        user_id = payload.get('user_id')
                        logger.info(f"[ORDER_SAVE] Got user_id from body token: {user_id}")
                except Exception as token_error:
                    logger.warning(f"[ORDER_SAVE] Token verification failed: {str(token_error)}")
        
        # If still no user_id, create guest user
        if not user_id:
            user_id = f"GUEST_{uuid.uuid4().hex[:8]}"
            logger.info(f"[ORDER_SAVE] No valid token, using guest ID: {user_id}")
        
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

        def normalize_shipping_address(address):
            if not isinstance(address, dict):
                return {}

            family_name = address.get('familyName') or address.get('lastName') or ''
            given_name = address.get('givenName') or address.get('firstName') or ''
            name = address.get('name') or f"{family_name} {given_name}".strip()
            postal_code = address.get('postalCode') or address.get('zip') or ''
            prefecture = (
                address.get('prefecture')
                or address.get('administrativeDistrictLevel1')
                or ''
            )
            street = address.get('address') or address.get('addressLine1') or ''
            building = (
                address.get('building')
                or address.get('addressLine2')
                or address.get('option')
                or ''
            )

            normalized = dict(address)
            normalized.update({
                'name': name,
                'familyName': family_name,
                'givenName': given_name,
                'postalCode': postal_code,
                'prefecture': prefecture,
                'address': street,
                'building': building,
            })
            return normalized

        body['shippingAddress'] = normalize_shipping_address(body.get('shippingAddress', {}))
        body['billingAddress'] = normalize_shipping_address(body.get('billingAddress', {}))

        shipping_address = body.get('shippingAddress', {})
        shipping_breakdown_for_email = {
            'lines': []
        }
        try:
            from src.services.shipping import calculate_shipping

            shipping_result = calculate_shipping(items, shipping_address)
            calculated_shipping_cost = int(shipping_result.get('total', 0))
            breakdown = shipping_result.get('breakdown', {})
            shipping_base_fee_applied = int(breakdown.get('baseFeeApplied', 0))
            shipping_region_fee = int(breakdown.get('regionFee', 0))
            shipping_region_key = shipping_result.get('regionKey')
            shipping_breakdown_for_email = {
                'lines': breakdown.get('lines', [])
            }
        except Exception as shipping_error:
            logger.error(f"[ORDER_SAVE] Failed to calculate shipping on server: {str(shipping_error)}")
            calculated_shipping_cost = int(body.get('shippingCost', 0))
            shipping_base_fee_applied = calculated_shipping_cost
            shipping_region_fee = 0
            shipping_region_key = None
            shipping_breakdown_for_email = {
                'lines': [
                    {
                        'label': '基本送料',
                        'amount': calculated_shipping_cost,
                    },
                    {
                        'label': '地域追加送料',
                        'amount': 0,
                    }
                ]
            }

        request_total_amount = int(body.get('totalAmount', 0))
        request_shipping_cost = int(body.get('shippingCost', 0))
        adjusted_total_amount = request_total_amount - request_shipping_cost + calculated_shipping_cost
        body['shippingCost'] = calculated_shipping_cost
        body['totalAmount'] = adjusted_total_amount
        
        table = get_users_table()
        now = datetime.utcnow().isoformat() + 'Z'
        
        # Get user information from request body
        user_email = body.get('userEmail')
        user_name = body.get('userName', 'お客様')
        
        # If not in body, try to get from shippingAddress
        if not user_email:
            shipping_address = body.get('shippingAddress', {})
            user_email = shipping_address.get('email')
        
        if not user_name or user_name == 'お客様':
            shipping_address = body.get('shippingAddress', {})
            given_name = shipping_address.get('givenName', '')
            family_name = shipping_address.get('familyName', '')
            if given_name or family_name:
                user_name = f"{family_name}{given_name}".strip() or 'お客様'
        
        logger.info(f"[ORDER_SAVE] User info - email: {user_email}, name: {user_name}")
        
        # Create ORDER item
        order_item = {
            "PK": f"USER#{user_id}",
            "SK": f"ORDER#{order_id}",
            "userId": user_id,
            "orderId": order_id,
            "orderNumber": order_number,
            "orderDate": now,
            "status": body.get('status', 'awaiting_shipment'),  # ⭐ リクエストボディからstatus を取得
            "totalAmount": int(body.get('totalAmount', 0)),
            "tax": int(body.get('tax', 0)),
            "taxRate": Decimal(str(body.get('taxRate', 0))) if body.get('taxRate') is not None else None,
            "shippingCost": calculated_shipping_cost,
            "shippingBaseFee": shipping_base_fee_applied,
            "shippingRegionFee": shipping_region_fee,
            "shippingRegionKey": shipping_region_key,
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
            "userEmail": user_email,
            "userName": user_name,
            "orderNote": body.get('orderNote'),
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

            raw_product_id = str(item.get('productId') or '')
            parsed_product_id = raw_product_id
            parsed_size = ''
            parsed_color = ''

            # Backward-compatible parsing when productId includes variant key
            # format: {productId}|{size}|{color}
            if '|' in raw_product_id:
                parts = raw_product_id.split('|')
                parsed_product_id = parts[0]
                if len(parts) > 1:
                    parsed_size = parts[1]
                if len(parts) > 2:
                    parsed_color = parts[2]

            final_size = item.get('size', '') or parsed_size
            final_color = item.get('color', '') or parsed_color

            order_item_entry = {
                "PK": f"USER#{user_id}",
                "SK": f"ORDER_ITEM#{order_id}#{order_item_id}",
                "orderId": order_id,
                "orderItemId": order_item_id,
                "productId": parsed_product_id,
                "productName": item.get('productName', 'Unknown Product'),
                "unitPrice": int(item.get('amount', 0)),
                "quantity": int(item.get('quantity', 1)),
                "totalAmount": int(item.get('totalAmount', 0)),
                "size": final_size,
                "color": final_color,
                "selectedOptionChoiceName": item.get('selectedOptionChoiceName', ''),
                "createdAt": now,
                "updatedAt": now,
            }
            
            logger.info(f"[CREATE_ORDER] ORDER_ITEM entry to save: {order_item_entry}")
            
            # Filter out None values
            order_item_entry = {k: v for k, v in order_item_entry.items() if v is not None}
            
            table.put_item(Item=order_item_entry)
            logger.info(f"ORDER_ITEM saved: {order_item_id}")
        
        # ===== Send emails after order is saved =====
        logger.info("[EMAIL] Starting email notification process")
        try:
            from src.utils.ses import (
                send_order_confirmation_email,
                send_admin_order_notification_email,
                send_bank_transfer_instructions_email
            )
            logger.info("[EMAIL] Email functions imported successfully")
            
            # Get user email and name from request body (provided by frontend)
            user_email = body.get('userEmail')
            user_name = body.get('userName', 'お客様')
            
            logger.info(f"[EMAIL] Initial user_email: {user_email}, user_name: {user_name}")
            
            # If not in body, try to get from shippingAddress
            if not user_email:
                shipping_address = body.get('shippingAddress', {})
                user_email = shipping_address.get('email')
                logger.info(f"[EMAIL] Got user_email from shippingAddress: {user_email}")
            
            if not user_name or user_name == 'お客様':
                shipping_address = body.get('shippingAddress', {})
                given_name = shipping_address.get('givenName', '')
                family_name = shipping_address.get('familyName', '')
                if given_name or family_name:
                    user_name = f"{family_name}{given_name}".strip() or 'お客様'
                logger.info(f"[EMAIL] Updated user_name: {user_name}")
            
            if not user_email:
                logger.warning(f"[EMAIL] No user email provided for order {order_id}, skipping email notifications")
            else:
                logger.info(f"[EMAIL] Proceeding with email sending to: {user_email}, name: {user_name}")
                # Prepare order items for email
                email_items = []
                for item in items:
                    email_items.append({
                        'productName': item.get('productName', 'Unknown Product'),
                        'quantity': int(item.get('quantity', 1)),
                        'unitPrice': int(item.get('amount', 0)),
                        'size': item.get('size', ''),
                        'color': item.get('color', ''),
                        'selectedOptionChoiceName': item.get('selectedOptionChoiceName', ''),
                    })
                
                logger.info(f"[EMAIL] Prepared {len(email_items)} items for email")
                
                total_amount = int(body.get('totalAmount', 0))
                tax = int(body.get('tax', 0))
                shipping_cost = int(body.get('shippingCost', 0))
                discount = int(body.get('discount', 0))
                coupon_discount = int(body.get('couponDiscount', 0))
                payment_method = body.get('paymentMethod', 'credit_card')
                
                logger.info(f"[EMAIL] Order details - total: {total_amount}, tax: {tax}, payment: {payment_method}")
                
                # 1. Send order confirmation email to customer
                logger.info(f"[EMAIL] Step 1: Sending order confirmation email to {user_email}")
                try:
                    confirmation_result = send_order_confirmation_email(
                        user_email=user_email,
                        user_name=user_name,
                        order_number=order_number,
                        order_items=email_items,
                        total_amount=total_amount,
                        tax=tax,
                        shipping_cost=shipping_cost,
                        coupon_discount=coupon_discount,
                        payment_method=payment_method,
                        shipping_breakdown=shipping_breakdown_for_email,
                        order_note=body.get('orderNote')
                    )
                    
                    if confirmation_result.get('success'):
                        logger.info(f"[EMAIL] Order confirmation email sent successfully: {confirmation_result.get('message_id')}")
                    else:
                        logger.error(f"[EMAIL] Failed to send order confirmation email: {confirmation_result.get('error')}")
                except Exception as conf_error:
                    logger.error(f"[EMAIL] Exception sending confirmation email: {str(conf_error)}", exc_info=True)
                
                # 2. Get all admin emails and send notification
                logger.info("[EMAIL] Step 2: Fetching all admin emails for order notification")
                admin_emails = []
                
                # Query Admin table for all admin profiles
                try:
                    from src.utils.dynamodb import get_admin_table
                    
                    # Get Admin table
                    admin_table = get_admin_table()
                    
                    logger.info("[EMAIL] Scanning Admin table for admin profiles")
                    
                    # Scan all items in Admin table
                    admin_scan_response = admin_table.scan()
                    
                    total_scanned = len(admin_scan_response.get('Items', []))
                    logger.info(f"[EMAIL] Total items scanned from Admin table: {total_scanned}")
                    
                    for admin_item in admin_scan_response.get('Items', []):
                        # Get admin email
                        admin_email = admin_item.get('email')
                        admin_id = admin_item.get('PK', '')
                        
                        logger.info(f"[EMAIL] Found admin - ID: {admin_id}, email: {admin_email}")
                        
                        if admin_email:
                            admin_emails.append(admin_email)
                            logger.info(f"[EMAIL] Added admin email to list: {admin_email}")
                    
                    logger.info(f"[EMAIL] Total admin emails collected: {len(admin_emails)} - {admin_emails}")
                    
                except Exception as scan_error:
                    logger.error(f"[EMAIL] Error scanning Admin table for admins: {str(scan_error)}", exc_info=True)
                
                if admin_emails:
                    logger.info(f"[EMAIL] Sending order notification to {len(admin_emails)} admins")
                    admin_notification_result = send_admin_order_notification_email(
                        admin_emails=admin_emails,
                        order_number=order_number,
                        user_email=user_email,
                        order_items=email_items,
                        total_amount=total_amount,
                        payment_method=payment_method,
                        shipping_cost=shipping_cost,
                        shipping_breakdown=shipping_breakdown_for_email,
                        tax=tax,
                        coupon_discount=coupon_discount,
                        order_note=body.get('orderNote')
                    )
                    
                    if admin_notification_result.get('success'):
                        logger.info(f"Admin order notification sent successfully: {admin_notification_result.get('message_id')}")
                    else:
                        logger.error(f"Failed to send admin order notification: {admin_notification_result.get('error')}")
                else:
                    logger.warning("No admin emails found for order notification")
                
                # 3. Send bank transfer instructions if payment method is bank_transfer
                if payment_method == 'bank_transfer':
                    logger.info(f"Sending bank transfer instructions to {user_email}")
                    bank_transfer_result = send_bank_transfer_instructions_email(
                        user_email=user_email,
                        user_name=user_name,
                        order_number=order_number,
                        total_amount=total_amount
                    )
                    
                    if bank_transfer_result.get('success'):
                        logger.info(f"Bank transfer instructions sent successfully: {bank_transfer_result.get('message_id')}")
                    else:
                        logger.error(f"Failed to send bank transfer instructions: {bank_transfer_result.get('error')}")
        
        except Exception as email_error:
            # Log error but don't fail the order creation
            logger.error(f"Error sending order emails: {str(email_error)}")
        # ===== End email sending =====
        
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


@require_admin_auth
def get_all_orders(event, context):
    """
    Get all orders for admin - Requires admin authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with all orders
    """
    try:
        logger.info(f"Get all orders event: {event}")
        
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
        
        # Get sort parameter (optional, defaults to 'status')
        query_params = event.get('queryStringParameters', {}) or {}
        sort_by = query_params.get('sortBy', 'status')  # 'status', 'date', 'amount'
        order_number_filter = query_params.get('orderNumber')  # 注文番号で検索
        status_filter = query_params.get('status')  # ステータスで検索
        
        logger.info(f"Search parameters - orderNumber: {order_number_filter}, status: {status_filter}")
        
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
                order_number = item.get('orderNumber', '')
                order_status = item.get('status', 'unpaid')
                
                # Apply filters
                if order_number_filter and order_number_filter not in order_number:
                    continue
                if status_filter and order_status != status_filter:
                    continue
                
                logger.info(f"Found ORDER# record with txn_id: {txn_id}")
                if txn_id:
                    all_orders_dict[txn_id] = {
                        "id": txn_id,
                        "userId": item.get('userId'),
                        "orderNumber": order_number,
                        "orderDate": item.get('orderDate') or item.get('createdAt'),
                        "status": order_status,
                        "totalAmount": item.get('totalAmount') or Decimal(0),
                        "shippingAddress": item.get('shippingAddress'),
                        "isCancelRequest": item.get('isCancelRequest', False),
                        "refundAt": item.get('refundAt'),
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
                            "isCancelRequest": item.get('isCancelRequest', False),
                            "refundAt": item.get('refundAt'),
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
        
        # Sort orders: 1. isCancelRequest (True first), 2. status priority (unpaid/awaiting_shipment first), 3. orderDate (newest first)
        status_priority = {'unpaid': 0, 'awaiting_shipment': 1, 'in_transit': 2, 'delivered': 3}
        
        all_orders.sort(
            key=lambda x: (
                not x.get('isCancelRequest', False),  # False=0 (cancel requests first), True=1
                status_priority.get(x.get('status', 'unpaid'), 4),  # Status priority
                -(datetime.fromisoformat(x.get('orderDate', '2000-01-01T00:00:00').replace('Z', '+00:00')).timestamp() if x.get('orderDate') else 0)  # Newest first (negative for reverse)
            )
        )
        
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


@require_admin_auth
def update_order_status(event, context):
    """
    Update order status - Requires admin authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Update order status event: {event}")
        
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
        new_status = body.get('status')
        
        # Validate input
        valid_statuses = ['unpaid', 'awaiting_shipment', 'in_transit', 'delivered', 'cancelled_customer', 'cancelled_internal']
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
        user_email = order_item.get('userEmail')
        user_name = order_item.get('userName', '')
        order_number = order_item.get('orderNumber', order_id)
        payment_method = order_item.get('paymentMethod')
        square_transaction_id = order_item.get('squareTransactionId')
        total_amount = order_item.get('totalAmount')
        
        logger.info(f"Order item details - userEmail: {user_email}, userName: {user_name}, orderNumber: {order_number}, paymentMethod: {payment_method}")

        # Process refund if status is being changed to cancelled
        refund_at = None
        is_cancelled_status = new_status in ['cancelled_customer', 'cancelled_internal']
        
        if is_cancelled_status:
            logger.info(f"Order {order_id} is being cancelled. Checking refund eligibility...")
            
            # Credit card payment: Automatic refund via Square API
            # Only process if we have a valid Square Payment ID (not TXN_ placeholder)
            if (payment_method in ['credit_card', 'apple_pay', 'google_pay'] and 
                square_transaction_id and 
                not square_transaction_id.startswith('TXN_')):
                
                logger.info(f"Processing Square refund for payment_id: {square_transaction_id}, payment_method: {payment_method}")
                
                # Convert amount to cents for Square API
                amount_cents = int(safe_amount_conversion(total_amount, 0))
                
                refund_result = process_square_refund(
                    payment_id=square_transaction_id,
                    amount_money={
                        "amount": amount_cents,
                        "currency": "JPY"
                    },
                    reason=f"Order cancelled: {new_status}"
                )
                
                if refund_result.get('success'):
                    refund_at = datetime.utcnow().isoformat() + 'Z'
                    logger.info(f"Square refund successful. refundAt: {refund_at}")
                    
                    # Send refund completed email
                    if user_email:
                        try:
                            send_refund_completed_email(
                                user_email=user_email,
                                user_name=user_name,
                                order_number=order_number,
                                payment_method=payment_method,
                                refund_amount=amount_cents
                            )
                            logger.info(f"Refund completed email sent to {user_email}")
                        except Exception as email_error:
                            logger.error(f"Failed to send refund completed email: {str(email_error)}")
                else:
                    logger.error(f"Square refund failed: {refund_result.get('error')}")
                    # Continue with status update even if refund fails
            
            elif payment_method in ['credit_card', 'apple_pay', 'google_pay'] and square_transaction_id and square_transaction_id.startswith('TXN_'):
                # Non-Square payment with placeholder ID - skip Square refund
                logger.info(f"Skipping Square refund - non-Square payment ID: {square_transaction_id}")
            
            # Bank transfer: Manual refund required (refundAt will be null)
            elif payment_method == 'bank_transfer':
                logger.info(f"Bank transfer payment - manual refund required for order {order_id}")
                # refund_at remains None - admin will manually process later

        # Build update expression
        update_expression_parts = ['SET #status = :status', 'updatedAt = :updatedAt']
        expression_attribute_names = {'#status': 'status'}
        expression_attribute_values = {
            ':status': new_status,
            ':updatedAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Add refundAt if applicable
        if refund_at is not None:
            update_expression_parts.append('refundAt = :refundAt')
            expression_attribute_values[':refundAt'] = refund_at

        table.update_item(
            Key={
                'PK': user_id_from_item,  # Correct partition key
                'SK': sk_value  # Correct sort key
            },
            UpdateExpression=', '.join(update_expression_parts),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Send status update email to customer
        if user_email:
            logger.info(f"Attempting to send status update email to {user_email} for order {order_number}, status: {new_status}")
            try:
                send_order_status_update_email(
                    user_email=user_email,
                    user_name=user_name,
                    order_number=order_number,
                    new_status=new_status
                )
                logger.info(f"Status update email sent successfully to {user_email}")
            except Exception as email_error:
                logger.error(f"Failed to send status update email: {str(email_error)}")
                # Continue processing even if email fails
        else:
            logger.warning(f"No user email found for order {order_id}, skipping status update email")
        
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


@require_admin_auth
def get_admin_order_detail(event, context):
    """
    Get order detail for admin - Requires admin authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with order detail
    """
    try:
        logger.info(f"Get admin order detail event: {event}")
        
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
        
        table = get_users_table()
        
        # Scan to find the order
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
        
        # Get the user ID from the order data
        order_user_id = order_data.get('userId')
        if not order_user_id:
            pk = order_data.get('PK', '')
            logger.info(f"Extracted PK from order: {pk}")
            if pk.startswith('USER#'):
                order_user_id = pk.replace('USER#', '')
        
        logger.info(f"Order user ID determined as: {order_user_id}")
        
        # Get ORDER_ITEM entries for this specific order
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
            raw_product_id = str(item.get('productId') or '')
            parsed_product_id = raw_product_id
            parsed_size = ''
            parsed_color = ''

            if '|' in raw_product_id:
                parts = raw_product_id.split('|')
                parsed_product_id = parts[0]
                if len(parts) > 1:
                    parsed_size = parts[1]
                if len(parts) > 2:
                    parsed_color = parts[2]

            total_amount = safe_amount_conversion(item.get('totalAmount', 0), 0)
            items.append({
                "orderItemId": item.get('orderItemId') or item.get('itemId'),
                "productId": parsed_product_id,
                "productName": item.get('productName', 'Unknown Product'),
                "quantity": safe_amount_conversion(item.get('quantity', 0), 0),
                "unitPrice": safe_amount_conversion(item.get('amount') or item.get('unitPrice', 0), 0),
                "totalAmount": total_amount,
                "size": item.get('size', '') or parsed_size,
                "color": item.get('color', '') or parsed_color,
                "selectedOptionChoiceName": item.get('selectedOptionChoiceName', ''),
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
            "status": order_data.get('status', 'unpaid'),
            "subtotal": total_amount - tax - shipping_cost + discount + coupon_discount,
            "tax": tax,
            "taxRate": safe_amount_conversion(order_data.get('taxRate', 0), 0),
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
            "cancelRequestSent": order_data.get('isCancelRequest', False),
            "refundAt": order_data.get('refundAt'),
            "orderNote": order_data.get('orderNote'),
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
            }, ensure_ascii=False, default=convert_decimal),
        }

    except Exception as e:
        logger.error(f"Error getting admin order detail: {str(e)}")
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


@require_admin_auth
def get_dashboard_pending_orders(event, context):
    """
    Get pending orders for admin dashboard (awaiting_shipment status) - Top 5
    Requires admin authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with pending orders and count
    """
    try:
        logger.info(f"Get dashboard pending orders event: {event}")
        
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
        
        table = get_users_table()
        
        # Scan for orders with awaiting_shipment status
        response = table.scan(
            FilterExpression="begins_with(SK, :order_prefix) AND #status = :awaiting_status",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":order_prefix": "ORDER#",
                ":awaiting_status": "awaiting_shipment"
            }
        )
        
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression="begins_with(SK, :order_prefix) AND #status = :awaiting_status",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":order_prefix": "ORDER#",
                    ":awaiting_status": "awaiting_shipment"
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))
        
        logger.info(f"Found {len(items)} pending orders")
        
        # Parse orders
        orders = []
        for item in items:
            user_name = item.get('userName', '不明')
            shipping_address = item.get('shippingAddress', {})
            if not user_name or user_name == '不明':
                # Try to construct name from shipping address
                given_name = shipping_address.get('givenName', '')
                family_name = shipping_address.get('familyName', '')
                if given_name or family_name:
                    user_name = f"{family_name}{given_name}".strip()
                else:
                    user_name = '不明'
            
            orders.append({
                "id": item.get('orderId'),
                "orderNumber": item.get('orderNumber'),
                "customerName": user_name,
                "orderDate": item.get('orderDate') or item.get('createdAt'),
                "amount": safe_amount_conversion(item.get('totalAmount', 0), 0),
                "status": "awaiting_shipment",
                "paymentMethod": item.get('paymentMethod', 'unknown')
            })
        
        # Sort by order date (most recent first) and get top 5
        orders.sort(key=lambda x: x.get('orderDate', ''), reverse=True)
        top_orders = orders[:5]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Pending orders retrieved successfully",
                "data": {
                    "orders": top_orders,
                    "count": len(orders)
                }
            }, ensure_ascii=False, default=convert_decimal),
        }
    
    except Exception as e:
        logger.error(f"Error getting dashboard pending orders: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get pending orders: {str(e)}"
            }, ensure_ascii=False),
        }


@require_admin_auth
def get_dashboard_payment_confirmation(event, context):
    """
    Get orders awaiting payment confirmation for admin dashboard (unpaid with bank_transfer) - Top 5
    Requires admin authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with payment confirmation orders and count
    """
    try:
        logger.info(f"Get dashboard payment confirmation event: {event}")
        
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
        
        table = get_users_table()
        
        # Scan for orders with unpaid status and bank_transfer payment method
        response = table.scan(
            FilterExpression="begins_with(SK, :order_prefix) AND #status = :unpaid_status AND paymentMethod = :bank_transfer",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":order_prefix": "ORDER#",
                ":unpaid_status": "unpaid",
                ":bank_transfer": "bank_transfer"
            }
        )
        
        items = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression="begins_with(SK, :order_prefix) AND #status = :unpaid_status AND paymentMethod = :bank_transfer",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":order_prefix": "ORDER#",
                    ":unpaid_status": "unpaid",
                    ":bank_transfer": "bank_transfer"
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            items.extend(response.get('Items', []))
        
        logger.info(f"Found {len(items)} payment confirmation orders")
        
        # Parse orders
        orders = []
        for item in items:
            user_name = item.get('userName', '不明')
            shipping_address = item.get('shippingAddress', {})
            if not user_name or user_name == '不明':
                # Try to construct name from shipping address
                given_name = shipping_address.get('givenName', '')
                family_name = shipping_address.get('familyName', '')
                if given_name or family_name:
                    user_name = f"{family_name}{given_name}".strip()
                else:
                    user_name = '不明'
            
            orders.append({
                "id": item.get('orderId'),
                "orderNumber": item.get('orderNumber'),
                "customerName": user_name,
                "orderDate": item.get('orderDate') or item.get('createdAt'),
                "amount": safe_amount_conversion(item.get('totalAmount', 0), 0),
                "status": "unpaid",
                "paymentMethod": "bank_transfer"
            })
        
        # Sort by order date (most recent first) and get top 5
        orders.sort(key=lambda x: x.get('orderDate', ''), reverse=True)
        top_orders = orders[:5]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Payment confirmation orders retrieved successfully",
                "data": {
                    "orders": top_orders,
                    "count": len(orders)
                }
            }, ensure_ascii=False, default=convert_decimal),
        }
    
    except Exception as e:
        logger.error(f"Error getting dashboard payment confirmation orders: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get payment confirmation orders: {str(e)}"
            }, ensure_ascii=False),
        }
