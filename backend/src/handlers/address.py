import json
import re
import requests
import logging
from datetime import datetime
from decimal import Decimal
from src.utils.dynamodb import get_users_table
from src.utils.jwt import verify_token

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class AddressSearchResponse:
    def __init__(self, success: bool, data: dict | None = None, message: str | None = None):
        self.success = success
        self.data = data
        self.message = message

    def to_dict(self):
        return {
            'success': self.success,
            'data': self.data,
            'message': self.message,
        }


def validate_postal_code(postal_code: str) -> bool:
    """郵便番号の形式をバリデーション (7桁の数字)"""
    pattern = r'^\d{7}$'
    return bool(re.match(pattern, postal_code))


def search_address_by_postal_code(postal_code: str) -> AddressSearchResponse:
    """
    郵便番号から住所を検索する
    zipcloud API (https://zipcloud.ibsnet.co.jp/) を使用
    """
    # 郵便番号のバリデーション
    if not postal_code or not validate_postal_code(postal_code):
        return AddressSearchResponse(
            success=False,
            message='郵便番号は7桁の数字で入力してください',
        )

    try:
        # zipcloud APIに問い合わせ
        url = 'https://zipcloud.ibsnet.co.jp/api/search'
        params = {'zipcode': postal_code}

        response = requests.get(url, params=params, timeout=5)

        if response.status_code != 200:
            return AddressSearchResponse(
                success=False, message='住所の検索に失敗しました'
            )

        data = response.json()

        # APIが結果を返していない場合
        if not data.get('results'):
            return AddressSearchResponse(
                success=False, message='郵便番号が見つかりません'
            )

        result = data['results'][0]

        # 住所データを整形
        formatted_postal_code = f'{postal_code[:3]}-{postal_code[3:]}'
        address_data = {
            'postalCode': formatted_postal_code,
            'prefecture': result.get('address1', ''),
            'address': f"{result.get('address2', '')}{result.get('address3', '')}",
        }

        return AddressSearchResponse(success=True, data=address_data)

    except requests.exceptions.Timeout:
        return AddressSearchResponse(
            success=False, message='住所検索がタイムアウトしました'
        )
    except requests.exceptions.RequestException:
        return AddressSearchResponse(
            success=False, message='住所の検索に失敗しました'
        )
    except (json.JSONDecodeError, KeyError, IndexError):
        return AddressSearchResponse(
            success=False, message='住所データの解析に失敗しました'
        )


def get_user_id_from_token(event):
    """
    Extract user_id from JWT token in Authorization header
    Validates that the token is for a regular user (not admin)
    
    Returns: user_id or None if not authenticated
    """
    headers = event.get('headers', {})
    
    # Try multiple header name variations (case-insensitive)
    auth_header = (
        headers.get('Authorization', '') or 
        headers.get('authorization', '') or
        headers.get('AUTHORIZATION', '')
    )
    
    logger.info(f"Authorization header: {auth_header[:50] if auth_header else 'None'}...")
    
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.warning(f"No Bearer token found. Header: {auth_header[:50] if auth_header else 'None'}")
        return None
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    logger.info(f"Verifying token: {token[:20]}...")
    is_valid, payload, error = verify_token(token)
    
    if not is_valid or not payload:
        logger.warning(f"Token verification failed: {error}")
        return None
    
    # Check user_type - must be 'user' not 'admin'
    user_type = payload.get('user_type', 'user')
    if user_type != 'user':
        logger.warning(f"Invalid user_type: {user_type}. Expected 'user' but got '{user_type}'")
        return None
    
    user_id = payload.get('user_id')
    if not user_id:
        logger.warning("No user_id in JWT payload")
        return None
    
    logger.info(f"Extracted user_id from JWT: {user_id}")
    return user_id


def search_address_handler(event, context):
    """Search address by postal code"""
    try:
        body = json.loads(event.get('body', '{}'))
        postal_code = body.get('postalCode', '').strip()

        if not postal_code:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({
                    'success': False,
                    'message': '郵便番号が必要です',
                }, ensure_ascii=False),
            }

        result = search_address_by_postal_code(postal_code)

        return {
            'statusCode': 200 if result.success else 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(result.to_dict(), ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'success': False,
                'message': 'サーバーエラーが発生しました'
            }, ensure_ascii=False),
        }


def get_addresses(event, context):
    """
    Get user addresses handler
    """
    try:
        logger.info(f"Get addresses event: {event}")
        
        # Get user ID from JWT token
        user_id = get_user_id_from_token(event)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'success': False, 'message': 'Unauthorized'}, ensure_ascii=False),
            }

        users_table = get_users_table()

        # Query ADDRESS items for this user (PK=USER#{userId}, SK starts with ADDRESS)
        response = users_table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk_prefix': 'ADDRESS'
            }
        )

        items = response.get('Items', [])

        # Convert to address format
        addresses_list = []
        for item in items:
            address_obj = {
                "id": item.get('addressId', ''),
                "postalCode": item.get('postalCode', ''),
                "prefecture": item.get('prefecture', ''),
                "address": item.get('address', ''),
                "option": item.get('option', ''),
                "isMain": item.get('isMain', False),
                "createdAt": item.get('createdAt', ''),
                "updatedAt": item.get('updatedAt', ''),
            }
            addresses_list.append(address_obj)

        response_data = {
            "success": True,
            "message": "Success",
            "data": addresses_list
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response_data, cls=DecimalEncoder, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error during get addresses: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get addresses: {str(e)}"
            }, ensure_ascii=False),
        }


def add_address(event, context):
    """
    Add new address handler
    """
    try:
        logger.info(f"Add address event: {event}")
        
        user_id = get_user_id_from_token(event)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Unauthorized'}, ensure_ascii=False),
            }

        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['postalCode', 'prefecture', 'address']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': f'{field} is required'}, ensure_ascii=False),
                }
        
        import uuid
        address_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'

        users_table = get_users_table()

        # Check if this is the first address (should be isMain=True)
        response = users_table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk_prefix': 'ADDRESS'
            }
        )
        is_first = len(response.get('Items', [])) == 0

        # Add new address to User table
        users_table.put_item(
            Item={
                'PK': f'USER#{user_id}',
                'SK': f'ADDRESS#{address_id}',
                'addressId': address_id,
                'postalCode': body.get('postalCode'),
                'prefecture': body.get('prefecture'),
                'address': body.get('address'),
                'option': body.get('option', ''),
                'isMain': is_first,
                'createdAt': now,
                'updatedAt': now,
            }
        )

        address_obj = {
            "id": address_id,
            "postalCode": body.get('postalCode'),
            "prefecture": body.get('prefecture'),
            "address": body.get('address'),
            "option": body.get('option', ''),
            "isMain": is_first,
            "createdAt": now,
            "updatedAt": now,
        }

        return {
            "statusCode": 201,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": True,
                "message": "Address added successfully",
                "data": address_obj
            }, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error adding address: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": False, "message": f"Failed to add address: {str(e)}"}, ensure_ascii=False),
        }


def update_address(event, context):
    """
    Update address handler
    """
    try:
        logger.info(f"Update address event: {event}")
        
        user_id = get_user_id_from_token(event)
        address_id = event.get('pathParameters', {}).get('id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Unauthorized'}, ensure_ascii=False),
            }
        
        if not address_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Address ID is required'}, ensure_ascii=False),
            }

        body = json.loads(event.get('body', '{}'))
        now = datetime.utcnow().isoformat() + 'Z'

        users_table = get_users_table()

        # Build update expression
        update_expr_parts = ['updatedAt = :updatedAt']
        expr_values = {':updatedAt': now}
        attr_names = {}

        if body.get('postalCode'):
            update_expr_parts.append('postalCode = :postalCode')
            expr_values[':postalCode'] = body.get('postalCode')
        if body.get('prefecture'):
            update_expr_parts.append('prefecture = :prefecture')
            expr_values[':prefecture'] = body.get('prefecture')
        if body.get('address'):
            update_expr_parts.append('#addr = :address')
            expr_values[':address'] = body.get('address')
            attr_names['#addr'] = 'address'
        if 'option' in body:
            update_expr_parts.append('#opt = :option')
            expr_values[':option'] = body.get('option', '')
            attr_names['#opt'] = 'option'

        users_table.update_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'ADDRESS#{address_id}'},
            UpdateExpression='SET ' + ', '.join(update_expr_parts),
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=attr_names if attr_names else None
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": True,
                "message": "Address updated successfully"
            }, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error updating address: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": False, "message": f"Failed to update address: {str(e)}"}, ensure_ascii=False),
        }


def delete_address(event, context):
    """
    Delete address handler
    """
    try:
        logger.info(f"Delete address event: {event}")
        
        user_id = get_user_id_from_token(event)
        address_id = event.get('pathParameters', {}).get('id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Unauthorized'}, ensure_ascii=False),
            }
        
        if not address_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Address ID is required'}, ensure_ascii=False),
            }

        users_table = get_users_table()

        # Delete address
        users_table.delete_item(
            Key={'PK': f'USER#{user_id}', 'SK': f'ADDRESS#{address_id}'}
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": True,
                "message": "Address deleted successfully"
            }, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error deleting address: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": False, "message": f"Failed to delete address: {str(e)}"}, ensure_ascii=False),
        }


def set_main_address(event, context):
    """
    Set address as main/default handler
    """
    try:
        logger.info(f"Set main address event: {event}")
        
        user_id = get_user_id_from_token(event)
        address_id = event.get('pathParameters', {}).get('id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Unauthorized'}, ensure_ascii=False),
            }
        
        if not address_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'message': 'Address ID is required'}, ensure_ascii=False),
            }

        users_table = get_users_table()

        # Get all addresses for this user
        response = users_table.query(
            KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk_prefix': 'ADDRESS'
            }
        )

        items = response.get('Items', [])

        # Update all addresses: set isMain=False, then set target to True
        for item in items:
            is_target = item.get('addressId') == address_id
            users_table.update_item(
                Key={'PK': item.get('PK'), 'SK': item.get('SK')},
                UpdateExpression='SET isMain = :isMain',
                ExpressionAttributeValues={':isMain': is_target}
            )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": True,
                "message": "Main address updated successfully"
            }, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error setting main address: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"success": False, "message": f"Failed to set main address: {str(e)}"}, ensure_ascii=False),
        }
