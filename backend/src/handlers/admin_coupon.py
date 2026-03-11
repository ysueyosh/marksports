"""
Admin coupon management handler - DynamoDB integration
"""

import json
import logging
import uuid
from decimal import Decimal
from datetime import datetime
from src.utils.dynamodb import get_commerce_table
from src.utils.auth import require_admin_auth

logger = logging.getLogger()
logger.setLevel(logging.INFO)

COUPON_PK = 'COUPON'


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


@require_admin_auth
def create_coupon(event, context):
    """
    Create a new coupon
    
    Request body:
        {
            "couponCode": "SAVE10",
            "discountType": "percentage",
            "discountValue": 10,
            "minOrderAmount": 1000,
            "maxDiscountAmount": 5000,
            "startDate": "2024-01-01",
            "endDate": "2024-12-31",
            "isActive": true
        }
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Admin info is available in event['admin_payload']
        admin_info = event.get('admin_payload', {})
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        required_fields = ['couponCode', 'discountType', 'discountValue']
        for field in required_fields:
            if field not in body:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"Missing required field: {field}"
                    }, cls=DecimalEncoder),
                }
        
        logger.info(f"Creating coupon: {body['couponCode']}")
        
        table = get_commerce_table()
        
        # Generate coupon ID
        coupon_id = str(uuid.uuid4())[:8]
        
        # Create coupon item
        coupon = {
            'PK': COUPON_PK,
            'SK': f'COUPON#{coupon_id}',
            'couponId': coupon_id,
            'couponCode': body['couponCode'],
            'discountType': body['discountType'],
            'discountValue': Decimal(str(body['discountValue'])),
            'minOrderAmount': Decimal(str(body.get('minOrderAmount', 0))),
            'maxDiscountAmount': Decimal(str(body.get('maxDiscountAmount', 0))),
            'startDate': body.get('startDate', ''),
            'endDate': body.get('endDate', ''),
            'isActive': body.get('isActive', True),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
        }
        
        # Save to DynamoDB
        table.put_item(Item=coupon)
        
        logger.info(f"Coupon created successfully: {coupon_id}")
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Coupon created successfully",
                "data": coupon
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error creating coupon: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to create coupon: {str(e)}"
            }, cls=DecimalEncoder),
        }


def update_coupon(event, context):
    """
    Update an existing coupon
    
    Path parameter:
        - couponId: Coupon ID
    
    Request body:
        {
            "couponCode": "SAVE10",
            "discountType": "percentage",
            "discountValue": 15,
            ...
        }
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Admin info is available in event['admin_payload']
        admin_info = event.get('admin_payload', {})
        
        # Get coupon ID from path parameter
        coupon_id = event.get("pathParameters", {}).get("couponId")
        
        if not coupon_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Coupon ID is required"
                }, cls=DecimalEncoder),
            }
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        logger.info(f"Updating coupon: {coupon_id}")
        
        table = get_commerce_table()
        
        # Check if coupon exists
        response = table.get_item(
            Key={
                'PK': COUPON_PK,
                'SK': f'COUPON#{coupon_id}'
            }
        )
        
        if 'Item' not in response:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Coupon not found"
                }, cls=DecimalEncoder),
            }
        
        # Build update expression
        update_parts = []
        expr_values = {}
        
        if 'couponCode' in body:
            update_parts.append('couponCode = :code')
            expr_values[':code'] = body['couponCode']
        
        if 'discountType' in body:
            update_parts.append('discountType = :type')
            expr_values[':type'] = body['discountType']
        
        if 'discountValue' in body:
            update_parts.append('discountValue = :value')
            expr_values[':value'] = Decimal(str(body['discountValue']))
        
        if 'minOrderAmount' in body:
            update_parts.append('minOrderAmount = :minAmount')
            expr_values[':minAmount'] = Decimal(str(body['minOrderAmount']))
        
        if 'maxDiscountAmount' in body:
            update_parts.append('maxDiscountAmount = :maxAmount')
            expr_values[':maxAmount'] = Decimal(str(body['maxDiscountAmount']))
        
        if 'startDate' in body:
            update_parts.append('startDate = :start')
            expr_values[':start'] = body['startDate']
        
        if 'endDate' in body:
            update_parts.append('endDate = :end')
            expr_values[':end'] = body['endDate']
        
        if 'isActive' in body:
            update_parts.append('isActive = :active')
            expr_values[':active'] = body['isActive']
        
        if not update_parts:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "No fields to update"
                }, cls=DecimalEncoder),
            }
        
        # Add updated timestamp
        update_parts.append('updatedAt = :updatedAt')
        expr_values[':updatedAt'] = datetime.utcnow().isoformat()
        
        # Update in DynamoDB
        table.update_item(
            Key={
                'PK': COUPON_PK,
                'SK': f'COUPON#{coupon_id}'
            },
            UpdateExpression='SET ' + ', '.join(update_parts),
            ExpressionAttributeValues=expr_values
        )
        
        logger.info(f"Coupon updated successfully: {coupon_id}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Coupon updated successfully"
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error updating coupon: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to update coupon: {str(e)}"
            }, cls=DecimalEncoder),
        }


def delete_coupon(event, context):
    """
    Delete a coupon (soft delete - set isActive to False)
    
    Path parameter:
        - couponId: Coupon ID
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Admin info is available in event['admin_payload']
        admin_info = event.get('admin_payload', {})
        
        # Get coupon ID from path parameter
        coupon_id = event.get("pathParameters", {}).get("couponId")
        
        if not coupon_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Coupon ID is required"
                }, cls=DecimalEncoder),
            }
        
        logger.info(f"Deleting coupon: {coupon_id}")
        
        table = get_commerce_table()
        
        # Check if coupon exists
        response = table.get_item(
            Key={
                'PK': COUPON_PK,
                'SK': f'COUPON#{coupon_id}'
            }
        )
        
        if 'Item' not in response:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Coupon not found"
                }, cls=DecimalEncoder),
            }
        
        # Soft delete - set isActive to False
        table.update_item(
            Key={
                'PK': COUPON_PK,
                'SK': f'COUPON#{coupon_id}'
            },
            UpdateExpression='SET isActive = :active, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':active': False,
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Coupon deleted successfully: {coupon_id}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Coupon deleted successfully"
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error deleting coupon: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to delete coupon: {str(e)}"
            }, cls=DecimalEncoder),
        }


def get_all_coupons(event, context):
    """
    Get all coupons (admin view)
    
    Query parameters:
        - page: Page number (default: 1)
        - limit: Items per page (default: 20)
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Admin info is available in event['admin_payload']
        admin_info = event.get('admin_payload', {})
        
        query_params = event.get("queryStringParameters") or {}
        page = int(query_params.get("page", "1"))
        limit = int(query_params.get("limit", "20"))
        
        logger.info(f"Getting all coupons - page: {page}, limit: {limit}")
        
        table = get_commerce_table()
        
        # Query all coupons
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': COUPON_PK}
        )
        
        all_coupons = response.get('Items', [])
        
        # Pagination
        total_count = len(all_coupons)
        total_pages = (total_count + limit - 1) // limit
        
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_coupons = all_coupons[start_idx:end_idx]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Coupons retrieved successfully",
                "data": {
                    "coupons": paginated_coupons,
                    "total": total_count,
                    "page": page,
                    "limit": limit,
                    "totalPages": total_pages
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error getting coupons: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get coupons: {str(e)}"
            }, cls=DecimalEncoder),
        }
