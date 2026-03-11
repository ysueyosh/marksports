"""
Admin product management handler - DynamoDB integration
"""

import json
import logging
import uuid
import base64
from decimal import Decimal
from datetime import datetime
from src.utils.dynamodb import get_commerce_table, PRODUCT_PK
from src.utils.auth import require_admin_auth
from src.utils.s3 import upload_image_to_s3

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


@require_admin_auth
def create_product(event, context):
    """
    Create a new product
    
    Request body:
        {
            "name": "Product Name",
            "description": "Description",
            "price": 9999,
            "categoryId": "category_id",
            "parentCategoryId": "parent_category_id",
            "mainImage": "base64_or_url",
            "subImages": ["base64_or_url", ...],
            "status": "active",
            "stock": 100
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
        
        required_fields = ['name', 'price', 'categoryId', 'parentCategoryId']
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
        
        logger.info(f"Creating product: {body['name']}")
        
        table = get_commerce_table()
        
        # Generate product ID
        product_id = str(uuid.uuid4())[:8]
        
        # Process images (Base64 to S3)
        image_urls = []
        
        # Process main image
        main_image = body.get('mainImage', '')
        if main_image and main_image.startswith('data:'):
            try:
                # Decode Base64 and upload to S3
                base64_data = main_image.split(',')[1]
                image_bytes = base64.b64decode(base64_data)
                s3_url = upload_image_to_s3(product_id, 'main', image_bytes)
                if s3_url:
                    image_urls.append(s3_url)
            except Exception as e:
                logger.error(f"Failed to process main image: {str(e)}")
        elif main_image and not main_image.startswith('data:'):
            # Already a S3 URL
            image_urls.append(main_image)
        
        # Process sub images
        sub_images = body.get('subImages', [])
        for idx, sub_image in enumerate(sub_images):
            if sub_image and sub_image.startswith('data:'):
                try:
                    # Decode Base64 and upload to S3
                    base64_data = sub_image.split(',')[1]
                    image_bytes = base64.b64decode(base64_data)
                    s3_url = upload_image_to_s3(product_id, f'sub_{idx + 1}', image_bytes)
                    if s3_url:
                        image_urls.append(s3_url)
                except Exception as e:
                    logger.error(f"Failed to process sub image {idx}: {str(e)}")
            elif sub_image and not sub_image.startswith('data:'):
                # Already a S3 URL
                image_urls.append(sub_image)
        
        # Create product item
        product = {
            'PK': PRODUCT_PK,
            'SK': f'PRODUCT#{product_id}',
            'productId': product_id,
            'name': body['name'],
            'description': body.get('description', ''),
            'price': Decimal(str(body['price'])),
            'categoryId': body['categoryId'],
            'parentCategoryId': body['parentCategoryId'],
            'imageUrls': image_urls,
            'stock': int(body.get('stock', 0)),
            'status': body.get('status', 'active'),
            'isActive': body.get('isActive', True),
            'redirectUrl': body.get('redirectUrl', ''),
            'createdBy': admin_info.get('adminId'),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
        }
        
        # Save to DynamoDB
        table.put_item(Item=product)
        
        logger.info(f"Product created successfully: {product_id}")
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Product created successfully",
                "data": product
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to create product: {str(e)}"
            }, cls=DecimalEncoder),
        }


@require_admin_auth
def update_product(event, context):
    """
    Update an existing product
    
    Path parameter:
        - productId: Product ID
    
    Request body:
        {
            "name": "Updated Name",
            "price": 9999,
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
        
        # Get product ID from path parameter
        product_id = event.get("pathParameters", {}).get("productId")
        
        if not product_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Product ID is required"
                }, cls=DecimalEncoder),
            }
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        logger.info(f"Updating product: {product_id}")
        
        table = get_commerce_table()
        
        # Check if product exists
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
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
                    "message": "Product not found"
                }, cls=DecimalEncoder),
            }
        
        # Build update expression
        update_parts = []
        expr_values = {}
        
        # Process images (Base64 to S3)
        image_urls = []
        
        # Process main image if provided
        main_image = body.get('mainImage', '')
        if main_image:
            if main_image.startswith('data:'):
                try:
                    # Decode Base64 and upload to S3
                    base64_data = main_image.split(',')[1]
                    image_bytes = base64.b64decode(base64_data)
                    s3_url = upload_image_to_s3(product_id, 'main', image_bytes)
                    if s3_url:
                        image_urls.append(s3_url)
                except Exception as e:
                    logger.error(f"Failed to process main image: {str(e)}")
            else:
                # Already a S3 URL
                image_urls.append(main_image)
        
        # Process sub images if provided
        sub_images = body.get('subImages', [])
        if sub_images:
            for idx, sub_image in enumerate(sub_images):
                if sub_image and sub_image.startswith('data:'):
                    try:
                        # Decode Base64 and upload to S3
                        base64_data = sub_image.split(',')[1]
                        image_bytes = base64.b64decode(base64_data)
                        s3_url = upload_image_to_s3(product_id, f'sub_{idx + 1}', image_bytes)
                        if s3_url:
                            image_urls.append(s3_url)
                    except Exception as e:
                        logger.error(f"Failed to process sub image {idx}: {str(e)}")
                elif sub_image and not sub_image.startswith('data:'):
                    # Already a S3 URL
                    image_urls.append(sub_image)
        
        # If images were processed, update imageUrls
        if image_urls:
            update_parts.append('imageUrls = :imageUrls')
            expr_values[':imageUrls'] = image_urls
        elif 'imageUrls' in body:
            # If imageUrls provided directly (without mainImage/subImages)
            update_parts.append('imageUrls = :imageUrls')
            expr_values[':imageUrls'] = body['imageUrls']
        
        if 'name' in body:
            update_parts.append('#n = :name')
            expr_values[':name'] = body['name']
        
        if 'description' in body:
            update_parts.append('description = :desc')
            expr_values[':desc'] = body['description']
        
        if 'price' in body:
            update_parts.append('price = :price')
            expr_values[':price'] = Decimal(str(body['price']))
        
        if 'categoryId' in body:
            update_parts.append('categoryId = :catId')
            expr_values[':catId'] = body['categoryId']
        
        if 'parentCategoryId' in body:
            update_parts.append('parentCategoryId = :parentCatId')
            expr_values[':parentCatId'] = body['parentCategoryId']
        
        if 'stock' in body:
            update_parts.append('stock = :stock')
            expr_values[':stock'] = int(body['stock'])
        
        if 'status' in body:
            update_parts.append('#status = :status')
            expr_values[':status'] = body['status']
        
        if 'isActive' in body:
            update_parts.append('isActive = :active')
            expr_values[':active'] = body['isActive']
        
        if 'redirectUrl' in body:
            update_parts.append('redirectUrl = :redirectUrl')
            expr_values[':redirectUrl'] = body['redirectUrl']
        
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
        
        # Always update updatedAt
        update_parts.append('updatedAt = :updatedAt')
        expr_values[':updatedAt'] = datetime.utcnow().isoformat()
        
        # Build ExpressionAttributeNames
        expr_attr_names = {}
        if 'name' in body:
            expr_attr_names['#n'] = 'name'
        if 'status' in body:
            expr_attr_names['#status'] = 'status'
        
        # Update product
        table.update_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            },
            UpdateExpression='SET ' + ', '.join(update_parts),
            ExpressionAttributeNames=expr_attr_names if expr_attr_names else None,
            ExpressionAttributeValues=expr_values
        )
        
        # Fetch updated product
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            }
        )
        
        updated_product = response.get('Item')
        
        logger.info(f"Product updated successfully: {product_id}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Product updated successfully",
                "data": updated_product
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to update product: {str(e)}"
            }, cls=DecimalEncoder),
        }


@require_admin_auth
def delete_product(event, context):
    """
    Delete a product (soft delete - set isActive to False)
    
    Path parameter:
        - productId: Product ID
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Admin info is available in event['admin_payload']
        admin_info = event.get('admin_payload', {})
        
        # Get product ID from path parameter
        product_id = event.get("pathParameters", {}).get("productId")
        
        if not product_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Product ID is required"
                }, cls=DecimalEncoder),
            }
        
        logger.info(f"Deleting product: {product_id}")
        
        table = get_commerce_table()
        
        # Check if product exists
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
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
                    "message": "Product not found"
                }, cls=DecimalEncoder),
            }
        
        # Soft delete - set isActive to False
        table.update_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            },
            UpdateExpression='SET isActive = :active, updatedAt = :updatedAt',
            ExpressionAttributeValues={
                ':active': False,
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Product deleted successfully: {product_id}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Product deleted successfully"
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to delete product: {str(e)}"
            }, cls=DecimalEncoder),
        }


@require_admin_auth
def get_all_products(event, context):
    """
    Get all products (admin view - includes inactive products)
    
    Query parameters:
        - page: Page number (default: 1)
        - limit: Items per page (default: 20)
        - keyword: Product name keyword (optional)
    
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
        keyword = (query_params.get("keyword") or "").strip().lower()
        
        logger.info(
            f"Getting all products - page: {page}, limit: {limit}, keyword: {keyword}"
        )
        
        table = get_commerce_table()
        
        # Query all products
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': PRODUCT_PK}
        )
        
        all_products = response.get('Items', [])

        if keyword:
            all_products = [
                product
                for product in all_products
                if keyword in product.get("name", "").lower()
            ]
        
        # Pagination
        total_count = len(all_products)
        total_pages = (total_count + limit - 1) // limit
        
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_products = all_products[start_idx:end_idx]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Products retrieved successfully",
                "data": {
                    "products": paginated_products,
                    "total": total_count,
                    "page": page,
                    "limit": limit,
                    "totalPages": total_pages
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error getting products: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get products: {str(e)}"
            }, cls=DecimalEncoder),
        }
