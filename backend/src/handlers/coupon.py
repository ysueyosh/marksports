"""
Coupon handler - Commerce table integration
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
from src.utils.dynamodb import (
    get_commerce_table, COUPON_PK, build_coupon_sk
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal type to JSON"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def apply_coupon(event, context):
    """
    Apply coupon code and calculate discount
    
    Args:
        event: Lambda event (with body containing coupon code and subtotal)
        context: Lambda context
    
    Returns:
        API response with discount information
    """
    try:
        # Get coupon code and subtotal from request body
        body = json.loads(event.get("body", "{}"))
        coupon_code = body.get("coupon_code", "").strip().upper()
        subtotal = body.get("subtotal", 0)
        
        logger.info(f"Apply coupon: {coupon_code}, subtotal: {subtotal}")
        
        # Validate coupon code
        if not coupon_code:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "クーポンコードを入力してください",
                    "data": None
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        table = get_commerce_table()
        
        # Query coupon by couponCode (using GSI_COUPON_CODE)
        response = table.query(
            IndexName='GSI_COUPON_CODE',
            KeyConditionExpression='couponCode = :code',
            ExpressionAttributeValues={':code': coupon_code}
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
                    "message": "無効なクーポンコードです",
                    "data": None
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        coupon = items[0]
        
        # Check if coupon is active
        if not coupon.get("isActive", True):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "このクーポンは現在使用できません",
                    "data": None
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        # Check if coupon is within valid date range
        today = datetime.now().strftime('%Y-%m-%d')
        start_date = coupon.get("startDate", "")
        end_date = coupon.get("endDate", "")
        
        if start_date and today < start_date:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": f"このクーポンは{start_date}から使用可能です",
                    "data": None
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        if end_date and today > end_date:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "このクーポンの有効期限が切れています",
                    "data": None
                }, cls=DecimalEncoder, ensure_ascii=False),
            }
        
        # Validate minimum order amount for fixed discount
        # Note: min_order_amount is checked against subtotal (excluding shipping)
        discount_type = coupon.get("discountType", "percentage")
        discount_value = coupon.get("discountValue", 0)
        
        if discount_type == "amount" and "minOrderAmount" in coupon:
            if subtotal < coupon["minOrderAmount"]:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"このクーポンは{coupon['minOrderAmount']}円以上の注文が必要です",
                        "data": None
                    }, cls=DecimalEncoder, ensure_ascii=False),
                }
        
        # Calculate discount
        if discount_type == "percentage":
            discount_amount = int(subtotal * discount_value / 100)
            # Apply maximum discount cap for percentage discounts
            if "maxDiscountAmount" in coupon:
                discount_amount = min(discount_amount, coupon["maxDiscountAmount"])
        else:  # amount
            discount_amount = min(discount_value, subtotal)
        
        response = {
            "success": True,
            "message": "クーポンが適用されました",
            "data": {
                "coupon_code": coupon_code,
                "coupon_description": coupon.get("description", ""),
                "discount_type": discount_type,
                "discount_value": discount_value,
                "discount_amount": discount_amount,
                "max_discount_amount": coupon.get("maxDiscountAmount"),
                "min_order_amount": coupon.get("minOrderAmount"),
            }
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during apply coupon: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"クーポン適用に失敗しました: {str(e)}",
                "data": None
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
