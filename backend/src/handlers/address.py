import json
import re
import requests
from src.utils.auth import require_auth_handler


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
        # ハイフンを挿入（XXX-XXXX形式）
        formatted_postal_code = f'{postal_code[:3]}-{postal_code[3:]}'
        
        # zipcloud APIに問い合わせ
        url = 'https://zipcloud.ibsnet.co.jp/api/search'
        params = {'zipcode': postal_code}

        response = requests.get(url, params=params, timeout=5)

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


def handler(event, context):
    """AWS Lambda ハンドラ"""
    try:
        body = json.loads(event.get('body', '{}'))
        postal_code = body.get('postalCode', '').strip()

        if not postal_code:
            return {
                'statusCode': 400,
                'body': json.dumps(
                    {
                        'success': False,
                        'message': '郵便番号が必要です',
                    }
                ),
            }

        result = search_address_by_postal_code(postal_code)

        return {
            'statusCode': 200 if result.success else 404,
            'body': json.dumps(result.to_dict()),
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps(
                {'success': False, 'message': 'サーバーエラーが発生しました'}
            ),
        }


# Mock database - in production, use actual database
addresses_db = {}


@require_auth_handler
def get_addresses(event, context):
    """
    Get user addresses handler - Requires authentication
    """
    import logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    try:
        logger.info(f"Get addresses event: {event}")
        
        # TODO: Get user ID from JWT token
        user_id = "user_001"
        
        # Dummy data - sample addresses
        dummy_addresses = [
            {
                "id": "addr_001",
                "postalCode": "1000001",
                "prefecture": "東京都",
                "address": "千代田区丸の内1-1",
                "building": "丸ビル 10階",
                "isDefault": True
            },
            {
                "id": "addr_002",
                "postalCode": "1500001",
                "prefecture": "東京都",
                "address": "渋谷区道玄坂2-1",
                "building": "渋谷スクランブルスクエア",
                "isDefault": False
            },
            {
                "id": "addr_003",
                "postalCode": "5300001",
                "prefecture": "大阪府",
                "address": "大阪市北区中之島2-3",
                "building": None,
                "isDefault": False
            }
        ]
        
        # If mock database has data, use it; otherwise return dummy data
        user_addresses = addresses_db.get(user_id, dummy_addresses)
        
        # Convert AddressItem objects to dict
        addresses_list = []
        for addr in user_addresses:
            if hasattr(addr, 'dict'):
                addresses_list.append(addr.dict())
            else:
                addresses_list.append(addr)
        
        response = {
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
            "body": json.dumps(response, ensure_ascii=False),
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


@require_auth_handler
def add_address(event, context):
    """
    Add new address handler - Requires authentication
    """
    import logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    try:
        logger.info(f"Add address event: {event}")
        
        user_id = "user_001"
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['postalCode', 'prefecture', 'address']
        for field in required_fields:
            if not body.get(field):
                return {
                    "statusCode": 400,
                    "body": json.dumps({
                        "success": False,
                        "message": f"{field} is required"
                    }, ensure_ascii=False),
                }
        
        # Initialize user addresses if not exists
        if user_id not in addresses_db:
            addresses_db[user_id] = []
        
        # Create new address
        new_address = {
            "id": f"addr_{len(addresses_db[user_id]) + 1}",
            "postalCode": body.get('postalCode'),
            "prefecture": body.get('prefecture'),
            "address": body.get('address'),
            "building": body.get('building', None),
            "isDefault": len(addresses_db[user_id]) == 0  # First address is default
        }
        
        addresses_db[user_id].append(new_address)
        
        response = {
            "success": True,
            "message": "Address added successfully",
            "data": new_address
        }
        
        return {
            "statusCode": 201,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during add address: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to add address: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def update_address(event, context):
    """
    Update address handler - Requires authentication
    """
    import logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    try:
        logger.info(f"Update address event: {event}")
        
        user_id = "user_001"
        body = json.loads(event.get('body', '{}'))
        address_id = event.get('pathParameters', {}).get('id')
        
        if not address_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Address ID is required"
                }, ensure_ascii=False),
            }
        
        if user_id not in addresses_db:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Address not found"
                }, ensure_ascii=False),
            }
        
        # Find and update address
        for addr in addresses_db[user_id]:
            if addr['id'] == address_id:
                addr.update({
                    'postalCode': body.get('postalCode', addr['postalCode']),
                    'prefecture': body.get('prefecture', addr['prefecture']),
                    'address': body.get('address', addr['address']),
                    'building': body.get('building', addr.get('building')),
                })
                
                response = {
                    "success": True,
                    "message": "Address updated successfully",
                    "data": addr
                }
                
                return {
                    "statusCode": 200,
                    "body": json.dumps(response, ensure_ascii=False),
                }
        
        return {
            "statusCode": 404,
            "body": json.dumps({
                "success": False,
                "message": "Address not found"
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during update address: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to update address: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def delete_address(event, context):
    """
    Delete address handler - Requires authentication
    """
    import logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    try:
        logger.info(f"Delete address event: {event}")
        
        user_id = "user_001"
        address_id = event.get('pathParameters', {}).get('id')
        
        if not address_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Address ID is required"
                }, ensure_ascii=False),
            }
        
        if user_id not in addresses_db:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Address not found"
                }, ensure_ascii=False),
            }
        
        # Find and delete address
        original_length = len(addresses_db[user_id])
        addresses_db[user_id] = [addr for addr in addresses_db[user_id] if addr['id'] != address_id]
        
        if len(addresses_db[user_id]) == original_length:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Address not found"
                }, ensure_ascii=False),
            }
        
        # If deleted address was default, set first remaining as default
        if len(addresses_db[user_id]) > 0:
            has_default = any(addr['isDefault'] for addr in addresses_db[user_id])
            if not has_default:
                addresses_db[user_id][0]['isDefault'] = True
        
        response = {
            "success": True,
            "message": "Address deleted successfully"
        }
        
        return {
            "statusCode": 200,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during delete address: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to delete address: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def set_default_address(event, context):
    """
    Set address as default handler - Requires authentication
    """
    import logging
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    try:
        logger.info(f"Set default address event: {event}")
        
        user_id = "user_001"
        address_id = event.get('pathParameters', {}).get('id')
        
        if not address_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Address ID is required"
                }, ensure_ascii=False),
            }
        
        if user_id not in addresses_db:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Address not found"
                }, ensure_ascii=False),
            }
        
        # Find and update default status
        for addr in addresses_db[user_id]:
            addr['isDefault'] = addr['id'] == address_id
        
        response = {
            "success": True,
            "message": "Default address updated successfully",
            "data": next((addr for addr in addresses_db[user_id] if addr['id'] == address_id), None)
        }
        
        return {
            "statusCode": 200,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during set default address: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to set default address: {str(e)}"
            }, ensure_ascii=False),
        }
