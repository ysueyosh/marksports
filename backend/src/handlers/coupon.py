"""
Coupon handler
"""

import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ダミークーポンデータ
DUMMY_COUPONS = {
    "SAVE10": {
        "code": "SAVE10",
        "discount_type": "percentage",
        "discount_value": 10,
        "max_discount_amount": 500,
        "description": "10%割引（最大500円）",
    },
    "SAVE500": {
        "code": "SAVE500",
        "discount_type": "fixed",
        "discount_value": 500,
        "min_order_amount": 1000,
        "description": "500円割引（1000円以上の注文が必要）",
    },
    "SUMMER2026": {
        "code": "SUMMER2026",
        "discount_type": "percentage",
        "discount_value": 15,
        "max_discount_amount": 1000,
        "description": "15%割引（最大1000円、夏セール）",
    },
}


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
                }),
            }
        
        # Check if coupon exists
        coupon = DUMMY_COUPONS.get(coupon_code)
        if not coupon:
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
                }),
            }
        
        # Validate minimum order amount for fixed discount
        # Note: min_order_amount is checked against subtotal (excluding shipping)
        if coupon["discount_type"] == "fixed" and "min_order_amount" in coupon:
            if subtotal < coupon["min_order_amount"]:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"このクーポンは{coupon['min_order_amount']}円以上の注文が必要です",
                        "data": None
                    }),
                }
        
        # Calculate discount
        if coupon["discount_type"] == "percentage":
            discount_amount = int(subtotal * coupon["discount_value"] / 100)
            # Apply maximum discount cap for percentage discounts
            if "max_discount_amount" in coupon:
                discount_amount = min(discount_amount, coupon["max_discount_amount"])
        else:  # fixed
            discount_amount = min(coupon["discount_value"], subtotal)
        
        response = {
            "success": True,
            "message": "クーポンが適用されました",
            "data": {
                "coupon_code": coupon_code,
                "coupon_description": coupon["description"],
                "discount_type": coupon["discount_type"],
                "discount_value": coupon["discount_value"],
                "discount_amount": discount_amount,
            }
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response),
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
            }),
        }
