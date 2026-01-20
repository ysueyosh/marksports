import json
import uuid
from datetime import datetime
from decimal import Decimal
import boto3
from src.utils.jwt import verify_token
import os

# DynamoDB 初期化
dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')

COMMERCE_TABLE_NAME = 'Commerce'


def get_commerce_table():
    return dynamodb.Table(COMMERCE_TABLE_NAME)


def verify_admin_token(headers):
    """認可ヘッダーから管理者トークンを検証"""
    print(f"DEBUG: Headers keys: {list(headers.keys()) if headers else 'No headers'}")
    
    auth_header = headers.get('Authorization', '') or headers.get('authorization', '')
    print(f"DEBUG: Auth header length: {len(auth_header) if auth_header else 0}")
    
    if not auth_header.startswith('Bearer '):
        print("DEBUG: No Bearer token found")
        return None

    token = auth_header[7:]
    print(f"DEBUG: Token length: {len(token)}")
    
    try:
        is_valid, payload, error = verify_token(token)
        print(f"DEBUG: Token valid: {is_valid}, payload: {payload}, error: {error}")
        
        if not is_valid or payload.get('user_type') != 'admin':
            print(f"DEBUG: Invalid token or not admin user")
            return None
        return payload
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None


def create_category(event, context):
    """カテゴリを新規作成"""
    try:
        # 認可確認
        admin_info = verify_admin_token(event.get('headers', {}))
        if not admin_info:
            return {
                'statusCode': 401,
                'body': json.dumps({'success': False, 'error': 'Unauthorized'})
            }

        body = json.loads(event.get('body', '{}'))
        category_name = body.get('categoryName', '').strip()
        parent_category_id = body.get('parentCategoryId')

        if not category_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'success': False, 'error': 'Category name is required'})
            }

        table = get_commerce_table()
        category_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # カテゴリ情報を保存
        item = {
            'PK': 'CATEGORY',
            'SK': f'CATEGORY#{category_id}',
            'categoryId': category_id,
            'categoryName': category_name,
            'parentCategoryId': parent_category_id,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'createdBy': admin_info.get('admin_id', 'system'),
            'isActive': True,
        }

        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'body': json.dumps({
                'success': True,
                'data': {
                    'categoryId': category_id,
                    'categoryName': category_name,
                    'parentCategoryId': parent_category_id,
                    'createdAt': timestamp,
                }
            })
        }

    except Exception as e:
        print(f"Error creating category: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


def get_all_categories(event, context):
    """すべてのカテゴリを取得（親子関係を保持）"""
    try:
        # 認可確認
        admin_info = verify_admin_token(event.get('headers', {}))
        if not admin_info:
            return {
                'statusCode': 401,
                'body': json.dumps({'success': False, 'error': 'Unauthorized'})
            }

        table = get_commerce_table()

        # すべてのアクティブなカテゴリを取得
        response = table.query(
            KeyConditionExpression='PK = :pk',
            FilterExpression='isActive = :active',
            ExpressionAttributeValues={
                ':pk': 'CATEGORY',
                ':active': True,
            }
        )

        categories = response.get('Items', [])

        # 親カテゴリ（parentCategoryId がない）のマッピング
        parent_categories = {}
        child_categories = {}
        
        for cat in categories:
            cat_data = {
                'categoryId': cat['categoryId'],
                'categoryName': cat['categoryName'],
                'parentCategoryId': cat.get('parentCategoryId'),
                'createdAt': cat['createdAt'],
            }
            
            if not cat.get('parentCategoryId'):
                # 親カテゴリ
                parent_categories[cat['categoryId']] = cat_data
                parent_categories[cat['categoryId']]['children'] = []
            else:
                # 子カテゴリ - 後で親に紐付ける
                child_categories[cat['categoryId']] = cat_data

        # 子カテゴリを親カテゴリに紐付ける
        for child_id, child_data in child_categories.items():
            parent_id = child_data.get('parentCategoryId')
            if parent_id and parent_id in parent_categories:
                parent_categories[parent_id]['children'].append(child_data)

        # 親カテゴリのリストを作成
        hierarchical_categories = list(parent_categories.values())

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'data': {
                    'categories': hierarchical_categories
                }
            })
        }

    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


def update_category(event, context):
    """カテゴリを更新"""
    try:
        # 認可確認
        admin_info = verify_admin_token(event.get('headers', {}))
        if not admin_info:
            return {
                'statusCode': 401,
                'body': json.dumps({'success': False, 'error': 'Unauthorized'})
            }

        category_id = event['pathParameters']['categoryId']
        body = json.loads(event.get('body', '{}'))
        category_name = body.get('categoryName', '').strip()
        parent_category_id = body.get('parentCategoryId')

        if not category_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'success': False, 'error': 'Category name is required'})
            }

        table = get_commerce_table()
        timestamp = datetime.utcnow().isoformat()

        # カテゴリ情報を更新
        table.update_item(
            Key={'PK': 'CATEGORY', 'SK': f'CATEGORY#{category_id}'},
            UpdateExpression='SET categoryName = :name, parentCategoryId = :parent, updatedAt = :updated',
            ExpressionAttributeValues={
                ':name': category_name,
                ':parent': parent_category_id,
                ':updated': timestamp,
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'data': {
                    'categoryId': category_id,
                    'categoryName': category_name,
                    'parentCategoryId': parent_category_id,
                    'updatedAt': timestamp,
                }
            })
        }

    except Exception as e:
        print(f"Error updating category: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


def delete_category(event, context):
    """カテゴリを削除（soft delete）"""
    try:
        # 認可確認
        admin_info = verify_admin_token(event.get('headers', {}))
        if not admin_info:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized'})
            }

        category_id = event['pathParameters']['categoryId']
        table = get_commerce_table()
        timestamp = datetime.utcnow().isoformat()

        # カテゴリを非アクティブにする
        table.update_item(
            Key={'PK': 'CATEGORY', 'SK': f'CATEGORY#{category_id}'},
            UpdateExpression='SET isActive = :active, updatedAt = :updated',
            ExpressionAttributeValues={
                ':active': False,
                ':updated': timestamp,
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'message': f'Category {category_id} deleted'
            })
        }

    except Exception as e:
        print(f"Error deleting category: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


# Flask ルートハンドラー
def admin_create_category_route():
    from flask import request
    event = {
        'headers': dict(request.headers),
        'body': request.get_data(as_text=True),
    }
    response = create_category(event, None)
    return response['body'], response['statusCode']


def admin_get_all_categories_route():
    from flask import request
    event = {
        'headers': dict(request.headers),
    }
    response = get_all_categories(event, None)
    return response['body'], response['statusCode']


def admin_update_category_route(category_id):
    from flask import request
    event = {
        'headers': dict(request.headers),
        'pathParameters': {'categoryId': category_id},
        'body': request.get_data(as_text=True),
    }
    response = update_category(event, None)
    return response['body'], response['statusCode']


def admin_delete_category_route(category_id):
    from flask import request
    event = {
        'headers': dict(request.headers),
        'pathParameters': {'categoryId': category_id},
    }
    response = delete_category(event, None)
    return response['body'], response['statusCode']
