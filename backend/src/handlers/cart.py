"""
Shopping cart handler for DB-based cart management
"""

import json
import hashlib
import logging
from datetime import datetime
from decimal import Decimal
from src.utils.jwt import verify_token
from src.utils.cors import cors_headers
from src.utils.dynamodb import get_cart_table

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB (utilsで一元管理)

# 商品備考（itemNote）
ITEM_NOTE_DEFAULT_MAX_LENGTH = 200
ITEM_NOTE_SETTINGS = ('optional', 'required')


def build_cart_item_key(product_id, size='', color='', option_choice_id='', item_note=''):
    """
    カート行のキーを作る。
    商品備考がある場合は、本文ではなくハッシュをキーに含める
    （注文保存時に '|' 区切りでキーを解析しているため、本文の '|' でキーが壊れないようにする）
    """
    if item_note:
        note_hash = hashlib.sha256(item_note.encode('utf-8')).hexdigest()[:12]
        return f'{product_id}|{size or ""}|{color or ""}|{option_choice_id or ""}|n:{note_hash}'
    if option_choice_id:
        return f'{product_id}|{size or ""}|{color or ""}|{option_choice_id}'
    if size or color:
        return f'{product_id}|{size}|{color}'
    return product_id


def validate_item_note(product, item_note):
    """
    商品の備考欄設定に従って商品備考を検証する。
    Returns: (正規化した備考, エラーメッセージ or None)
    """
    setting = product.get('itemNoteSetting')
    if setting not in ITEM_NOTE_SETTINGS:
        # 備考欄のない商品は備考を受け付けない
        return '', None
    note = (item_note or '').strip()
    max_length = int(product.get('itemNoteMaxLength') or ITEM_NOTE_DEFAULT_MAX_LENGTH)
    label = product.get('itemNoteLabel') or '商品備考'
    if setting == 'required' and not note:
        return note, f'{label}を入力してください'
    if len(note) > max_length:
        return note, f'{label}は{max_length}文字以内で入力してください'
    return note, None


def _error_response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "success": False,
            "message": message,
            "data": None
        }, ensure_ascii=False),
    }


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
                "headers": cors_headers(event),
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
                # Extract item_key from SK (format: CART#{item_key})
                sk = item.get('SK', '')
                item_key = sk[len('CART#'):] if sk.startswith('CART#') else product_id
                additional_price = float(item.get('additionalPrice', 0) or 0)
                base_price = float(product.get('price', 0))
                cart_item = {
                    'id': item_key,
                    'productId': product_id,
                    'name': product.get('name', '不明な商品'),
                    'price': base_price + additional_price,
                    'image': image_urls[0] if image_urls else '',
                    'quantity': quantity,
                    'addedAt': added_at,
                    'size': item.get('size', ''),
                    'color': item.get('color', ''),
                    'selectedOptionChoiceId': item.get('selectedOptionChoiceId', ''),
                    'selectedOptionChoiceName': item.get('selectedOptionChoiceName', ''),
                    'additionalPrice': additional_price,
                    'minQuantity': product.get('minQuantity'),
                    'maxQuantity': product.get('maxQuantity'),
                    'paymentMethodRestriction': product.get('paymentMethodRestriction'),
                    'itemNote': item.get('itemNote', ''),
                    'itemNoteSetting': product.get('itemNoteSetting'),
                    'itemNoteLabel': product.get('itemNoteLabel'),
                    'itemNoteMaxLength': product.get('itemNoteMaxLength'),
                }
                cart_items.append(cart_item)
            except Exception as e:
                logger.error(f"Error fetching product {product_id}: {str(e)}")
                # Still include cart item even if product fetch fails
                sk = item.get('SK', '')
                item_key = sk[len('CART#'):] if sk.startswith('CART#') else product_id
                cart_items.append({
                    'id': item_key,
                    'productId': product_id,
                    'name': '削除済み商品',
                    'price': 0,
                    'image': '',
                    'quantity': quantity,
                    'addedAt': added_at,
                    'size': item.get('size', ''),
                    'color': item.get('color', ''),
                })
        
        return {
            "statusCode": 200,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": True,
                "message": "カート情報を取得しました",
                "data": cart_items
            }, cls=DecimalEncoder, ensure_ascii=False),
        }
    
    except Exception as e:
        import traceback
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Error getting cart: {error_msg}\nStack: {stack_trace}")
        return {
            "statusCode": 500,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": False,
                "message": f"カート取得エラー: {error_msg}",
                "error": stack_trace if True else None,
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
        size = body.get('size', '')
        color = body.get('color', '')
        selected_option_choice_id = body.get('selectedOptionChoiceId', '')
        selected_option_choice_name = body.get('selectedOptionChoiceName', '')
        additional_price = body.get('additionalPrice', 0)
        item_note = body.get('itemNote', '')
        
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
        
        # 商品備考を商品の設定に従って検証
        from src.utils.dynamodb import get_commerce_table
        product = get_commerce_table().get_item(
            Key={'PK': 'PRODUCT', 'SK': f'PRODUCT#{product_id}'}
        ).get('Item', {})
        item_note, note_error = validate_item_note(product, item_note)
        if note_error:
            return _error_response(400, note_error)

        # Build item_key: includes size, color, optionChoiceId and item note for uniqueness
        # 同じ商品でも商品備考が異なる場合は別の行として扱う
        item_key = build_cart_item_key(
            product_id, size, color, selected_option_choice_id, item_note
        )
        
        # Check if product (with same variant) already in cart
        table = get_cart_table()
        response = table.get_item(
            Key={
                'PK': f'CART#{cart_identifier}',
                'SK': f'CART#{item_key}'
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
                    'SK': f'CART#{item_key}'
                },
                UpdateExpression='SET quantity = :qty, updatedAt = :updatedAt',
                ExpressionAttributeValues={
                    ':qty': new_quantity,
                    ':updatedAt': now
                }
            )
        else:
            # Add new item
            new_item = {
                'PK': f'CART#{cart_identifier}',
                'SK': f'CART#{item_key}',
                'productId': product_id,
                'quantity': quantity,
                'addedAt': now,
            }
            if size:
                new_item['size'] = size
            if color:
                new_item['color'] = color
            if selected_option_choice_id:
                new_item['selectedOptionChoiceId'] = selected_option_choice_id
            if selected_option_choice_name:
                new_item['selectedOptionChoiceName'] = selected_option_choice_name
            if additional_price:
                from decimal import Decimal as _Decimal
                new_item['additionalPrice'] = _Decimal(str(additional_price))
            if item_note:
                new_item['itemNote'] = item_note
            table.put_item(Item=new_item)
        
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
                    "itemKey": item_key,
                    "size": size,
                    "color": color,
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
        item_key = path_params.get('product_id')
        
        if not item_key:
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
        new_item_key = item_key

        if 'itemNote' in body:
            # 商品備考の変更: 行のキーが変わるため、行を作り直す
            existing = table.get_item(
                Key={'PK': f'CART#{cart_identifier}', 'SK': f'CART#{item_key}'}
            ).get('Item')
            if not existing:
                return _error_response(404, 'カートに商品が見つかりません')

            from src.utils.dynamodb import get_commerce_table
            product_id = existing.get('productId')
            product = get_commerce_table().get_item(
                Key={'PK': 'PRODUCT', 'SK': f'PRODUCT#{product_id}'}
            ).get('Item', {})
            item_note, note_error = validate_item_note(product, body.get('itemNote'))
            if note_error:
                return _error_response(400, note_error)

            new_item_key = build_cart_item_key(
                product_id,
                existing.get('size', ''),
                existing.get('color', ''),
                existing.get('selectedOptionChoiceId', ''),
                item_note,
            )

            if new_item_key != item_key:
                target = table.get_item(
                    Key={'PK': f'CART#{cart_identifier}', 'SK': f'CART#{new_item_key}'}
                ).get('Item')
                if target:
                    # 同じ内容の行が既にあれば数量をまとめる
                    table.update_item(
                        Key={'PK': f'CART#{cart_identifier}', 'SK': f'CART#{new_item_key}'},
                        UpdateExpression='SET quantity = :qty, updatedAt = :updatedAt',
                        ExpressionAttributeValues={
                            ':qty': int(target.get('quantity', 0)) + quantity,
                            ':updatedAt': now,
                        },
                    )
                else:
                    new_row = {k: v for k, v in existing.items() if k != 'itemNote'}
                    new_row['SK'] = f'CART#{new_item_key}'
                    new_row['quantity'] = quantity
                    new_row['updatedAt'] = now
                    if item_note:
                        new_row['itemNote'] = item_note
                    table.put_item(Item=new_row)
                table.delete_item(
                    Key={'PK': f'CART#{cart_identifier}', 'SK': f'CART#{item_key}'}
                )
            else:
                table.update_item(
                    Key={'PK': f'CART#{cart_identifier}', 'SK': f'CART#{item_key}'},
                    UpdateExpression='SET quantity = :qty, updatedAt = :updatedAt',
                    ExpressionAttributeValues={':qty': quantity, ':updatedAt': now},
                )
        else:
            table.update_item(
                Key={
                    'PK': f'CART#{cart_identifier}',
                    'SK': f'CART#{item_key}'
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
                    "itemKey": new_item_key,
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
        item_key = path_params.get('product_id')
        
        if not item_key:
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
                'SK': f'CART#{item_key}'
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
