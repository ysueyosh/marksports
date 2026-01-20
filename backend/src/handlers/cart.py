"""
Shopping cart handler for DB-based cart management
"""

import json
import logging
import boto3
import os
from datetime import datetime
from decimal import Decimal
from src.utils.jwt import verify_token

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    region_name='ap-northeast-1',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT_URL', None)
)
CART_TABLE_NAME = os.environ.get('CART_TABLE_NAME', 'User')

def get_cart_table():
    """Get Cart table"""
    return dynamodb.Table(CART_TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal type to JSON"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

def get_cart_identifier(event):
    """
    Extract cart identifier from request
    Priority:
    1. JWT token (for authenticated users) -> returns userId
    2. X-User-UUID header (for guest users) -> returns userUuid
    3. Query parameter 'userId' (fallback) -> returns userId
    
    Returns: (identifier, is_authenticated)
    """
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    logger.info(f"Cart identifier check - Headers: {headers}, Query: {query_params}")
    
    # 1. Check for authenticated user via JWT token
    auth_header = headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        is_valid, payload, error = verify_token(token)
        if is_valid and payload and 'user_id' in payload:
            logger.info(f"Using authenticated userId: {payload['user_id']}")
            return payload['user_id'], True
    
    # 2. Fall back to userUuid from X-User-UUID header (guest users)
    # Try multiple header name variations (Flask may lowercase them)
    user_uuid = (
        headers.get('X-User-UUID', '') or 
        headers.get('x-user-uuid', '') or 
        headers.get('X-User-Uuid', '')
    )
    
    if user_uuid:
        logger.info(f"Using guest userUuid from header: {user_uuid}")
        return user_uuid, False
    
    # 3. Fall back to query parameter (alternative method)
    user_id_query = query_params.get('userId', '')
    if user_id_query:
        logger.info(f"Using userId from query parameter: {user_id_query}")
        return user_id_query, False
    
    logger.warning("No user identifier found in request")
    return None, False

def get_cart(event, context):
    """
    Get user's cart items with product details
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with cart items including product information
    """
    try:
        cart_identifier, is_authenticated = get_cart_identifier(event)
        
        if not cart_identifier:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザー識別情報が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Query cart items
        table = get_cart_table()
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': f'CART#{cart_identifier}'}
        )
        
        items = response.get('Items', [])
        cart_items = []
        
        # Get product table for enriching cart items
        from src.utils.dynamodb import get_commerce_table
        product_table = get_commerce_table()
        
        for item in items:
            product_id = item.get('productId')
            quantity = item.get('quantity')
            added_at = item.get('addedAt')
            
            # Fetch product details
            try:
                product_response = product_table.get_item(
                    Key={'PK': 'PRODUCT', 'SK': f'PRODUCT#{product_id}'}
                )
                product = product_response.get('Item', {})
                
                # Build enriched cart item with product info
                image_urls = product.get('imageUrls', [])
                cart_item = {
                    'id': product_id,
                    'productId': product_id,
                    'name': product.get('name', '不明な商品'),
                    'price': product.get('price', 0),
                    'image': image_urls[0] if image_urls else '',
                    'quantity': quantity,
                    'addedAt': added_at,
                }
                cart_items.append(cart_item)
            except Exception as e:
                logger.error(f"Error fetching product {product_id}: {str(e)}")
                # Still include cart item even if product fetch fails
                cart_items.append({
                    'id': product_id,
                    'productId': product_id,
                    'name': '削除済み商品',
                    'price': 0,
                    'image': '',
                    'quantity': quantity,
                    'addedAt': added_at,
                })
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "カート情報を取得しました",
                "data": cart_items
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting cart: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"カート取得エラー: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }

def add_to_cart(event, context):
    """
    Add item to cart
    
    Args:
        event: Lambda event with body containing { productId, quantity }
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        cart_identifier, is_authenticated = get_cart_identifier(event)
        
        if not cart_identifier:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザー識別情報が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        product_id = body.get('productId')
        quantity = body.get('quantity', 1)
        
        if not product_id or quantity < 1:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "商品IDと数量が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        # Check if product already in cart
        table = get_cart_table()
        response = table.get_item(
            Key={
                'PK': f'CART#{cart_identifier}',
                'SK': f'CART#{product_id}'
            }
        )
        
        now = datetime.utcnow().isoformat() + 'Z'
        
        if 'Item' in response:
            # Update quantity if already exists
            existing_item = response['Item']
            new_quantity = existing_item.get('quantity', 0) + quantity
            
            table.update_item(
                Key={
                    'PK': f'CART#{cart_identifier}',
                    'SK': f'CART#{product_id}'
                },
                UpdateExpression='SET quantity = :qty, updatedAt = :updatedAt',
                ExpressionAttributeValues={
                    ':qty': new_quantity,
                    ':updatedAt': now
                }
            )
        else:
            # Add new item
            table.put_item(
                Item={
                    'PK': f'CART#{cart_identifier}',
                    'SK': f'CART#{product_id}',
                    'productId': product_id,
                    'quantity': quantity,
                    'addedAt': now,
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
                "message": "カートに商品を追加しました",
                "data": {
                    "productId": product_id,
                    "quantity": quantity if 'Item' not in response else new_quantity,
                }
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error adding to cart: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"カートへの追加に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }

def update_cart_item(event, context):
    """
    Update cart item quantity
    
    Args:
        event: Lambda event with pathParameters (product_id) and body (quantity)
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        cart_identifier, is_authenticated = get_cart_identifier(event)
        
        if not cart_identifier:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザー識別情報が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        path_params = event.get('pathParameters', {}) or {}
        product_id = path_params.get('product_id')
        
        if not product_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "商品IDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        body = json.loads(event.get("body", "{}"))
        quantity = body.get('quantity', 1)
        
        if quantity < 1:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "数量は1以上である必要があります",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_cart_table()
        now = datetime.utcnow().isoformat() + 'Z'
        
        table.update_item(
            Key={
                'PK': f'CART#{cart_identifier}',
                'SK': f'CART#{product_id}'
            },
            UpdateExpression='SET quantity = :qty, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':qty': quantity,
                ':updatedAt': now
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
                "message": "カートを更新しました",
                "data": {
                    "productId": product_id,
                    "quantity": quantity,
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error updating cart item: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"カート更新に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }

def delete_from_cart(event, context):
    """
    Delete item from cart
    
    Args:
        event: Lambda event with pathParameters (product_id)
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        cart_identifier, is_authenticated = get_cart_identifier(event)
        
        if not cart_identifier:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザー識別情報が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        path_params = event.get('pathParameters', {}) or {}
        product_id = path_params.get('product_id')
        
        if not product_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "商品IDが必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_cart_table()
        table.delete_item(
            Key={
                'PK': f'CART#{cart_identifier}',
                'SK': f'CART#{product_id}'
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
                "message": "カートから商品を削除しました",
                "data": None
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error deleting from cart: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"カートから削除に失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }

def clear_cart(event, context):
    """
    Clear all items from user's cart (used after successful payment)
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        cart_identifier, is_authenticated = get_cart_identifier(event)
        
        if not cart_identifier:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ユーザー識別情報が必要です",
                    "data": None
                }, ensure_ascii=False),
            }
        
        table = get_cart_table()
        
        # Query all cart items for this user
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': f'CART#{cart_identifier}'}
        )
        
        items = response.get('Items', [])
        
        # Delete all items
        with table.batch_writer(
            overwrite_by_pkeys=['PK', 'SK']
        ) as batch:
            for item in items:
                batch.delete_item(
                    Key={
                        'PK': item['PK'],
                        'SK': item['SK']
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
                "message": "カートをクリアしました",
                "data": None
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error clearing cart: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"カートのクリアに失敗しました: {str(e)}",
                "data": None
            }, ensure_ascii=False),
        }
