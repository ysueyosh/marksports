"""
Product handler - Commerce table integration
"""

import json
import logging
import random
import boto3
from decimal import Decimal
from src.models.product import ProductsResponse
from src.utils.dynamodb import (
    get_commerce_table, PRODUCT_PK, build_product_sk
)
from src.utils.cors import cors_headers

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def get_featured_products(event, context):
    """
    Get featured products for each parent category
    
    Retrieves up to 5 random products from all subcategories under each parent category
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with featured products grouped by parent category ID
    """
    try:
        logger.info("Get featured products event")
        
        table = get_commerce_table()
        
        # Query all categories from Commerce table
        category_response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': 'CATEGORY'}
        )
        
        category_items = category_response.get('Items', [])
        
        # Build category hierarchy map
        category_map = {}
        parent_to_children = {}
        
        for cat_item in category_items:
            category_id = cat_item.get('categoryId')
            parent_id = cat_item.get('parentCategoryId')
            
            category_map[category_id] = {
                'id': category_id,
                'parentId': parent_id
            }
            
            # Map parent to children
            if parent_id:
                if parent_id not in parent_to_children:
                    parent_to_children[parent_id] = []
                parent_to_children[parent_id].append(category_id)
        
        # Query all products from Commerce table
        products_response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': PRODUCT_PK}
        )
        
        products = products_response.get('Items', [])
        
        # Group products by parent category
        # A product belongs to a parent category if its categoryId is a child of that parent
        featured = {}
        
        for product in products:
            product_category_id = product.get('categoryId')
            if not product_category_id:
                continue
            
            # Find the parent category for this product's category
            parent_id = category_map.get(product_category_id, {}).get('parentId')
            
            # If this is a child category, add product to parent's list
            if parent_id:
                if parent_id not in featured:
                    featured[parent_id] = []
                # Map DynamoDB fields to Product model fields
                image_urls = product.get('imageUrls', [])
                mapped_product = {
                    'id': product.get('productId'),
                    'name': product.get('name'),
                    'price': product.get('price'),
                    'image': image_urls[0] if image_urls else '',
                    'description': product.get('description', ''),
                    'category_id': product_category_id,
                    'category_name': product.get('categoryName', ''),
                    'redirectUrl': product.get('redirectUrl', ''),
                }
                featured[parent_id].append(mapped_product)
        
        # Get up to 5 random products per parent category
        featured_limited = {}
        for parent_id, cat_products in featured.items():
            featured_limited[parent_id] = random.sample(cat_products, min(5, len(cat_products)))
        
        response = ProductsResponse(
            success=True,
            message="Featured products retrieved successfully",
            data=featured_limited,
        )
        
        return {
            "statusCode": 200,
            "headers": cors_headers(event),
            "body": json.dumps(response.model_dump(), cls=DecimalEncoder),
        }
    
    except Exception as e:
        import traceback
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Error during get featured products: {error_msg}\nStack: {stack_trace}")
        return {
            "statusCode": 500,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get featured products: {error_msg}",
                "error": stack_trace if True else None
            }, cls=DecimalEncoder),
        }


def get_product_detail(event, context):
    """
    Get product detail by ID
    
    Args:
        event: Lambda event (with pathParameters)
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        # Get product ID from path parameter
        product_id = event.get("pathParameters", {}).get("id")
        
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
                }),
            }
        
        logger.info(f"Get product detail: {product_id}")
        
        table = get_commerce_table()
        
        # Query product by ID
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            }
        )
        
        product = response.get('Item')
        
        if not product:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Product not found"
                }),
            }
        
        # Map DynamoDB fields to Product model fields for response
        image_urls = product.get('imageUrls', [])
        product_response = {
            'id': product.get('productId'),
            'name': product.get('name'),
            'price': product.get('price'),
            'image': image_urls[0] if image_urls else '',
            'description': product.get('description', ''),
            'category_id': product.get('categoryId'),
            'category_name': product.get('categoryName', ''),
            'brand': product.get('brand', ''),
            'color': product.get('color', ''),
            'material': product.get('material', ''),
            'level': product.get('level', ''),
            'originalPrice': product.get('originalPrice'),
            'discount': product.get('discount', ''),
            'productDetails': product.get('productDetails', ''),
            'imageUrls': image_urls,
            'redirectUrl': product.get('redirectUrl', ''),
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Product detail retrieved successfully",
                "data": product_response
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error during get product detail: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get product detail: {str(e)}"
            }, cls=DecimalEncoder),
        }


def check_product_exists(event, context):
    """
    Check if a product exists by ID
    
    Args:
        event: Lambda event (with pathParameters)
        context: Lambda context
    
    Returns:
        API response with exists flag
    """
    try:
        # Get product ID from path parameter
        product_id = event.get("pathParameters", {}).get("id")
        
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
                }),
            }
        
        logger.info(f"Check product exists: {product_id}")
        
        table = get_commerce_table()
        
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            }
        )
        
        exists = 'Item' in response
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "data": {"exists": exists}
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error during check product exists: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to check product exists: {str(e)}"
            }, cls=DecimalEncoder),
        }


def check_products_exist(event, context):
    """
    Check if multiple products exist by IDs
    
    Args:
        event: Lambda event (with body containing product IDs)
        context: Lambda context
    
    Returns:
        API response with existence status for each product
    """
    try:
        # Get product IDs from request body
        body = json.loads(event.get("body", "{}"))
        product_ids = body.get("product_ids", [])
        
        logger.info(f"Check products exist: {product_ids}")
        
        table = get_commerce_table()
        
        # Check existence of each product
        results = {}
        for product_id in product_ids:
            response = table.get_item(
                Key={
                    'PK': PRODUCT_PK,
                    'SK': f'PRODUCT#{product_id}'
                }
            )
            results[str(product_id)] = 'Item' in response
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "data": {
                    "results": results
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error during check products exist: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to check products exist: {str(e)}"
            }, cls=DecimalEncoder),
        }


def get_related_products(event, context):
    """
    Get related products based on product category
    
    Query Parameters:
        - productId: ID of the product
        - limit: Number of products to return (default: 5)
    
    Args:
        event: Lambda event (with queryStringParameters)
        context: Lambda context
    
    Returns:
        API response with related products
    """
    try:
        # Get query parameters
        query_params = event.get("queryStringParameters") or {}
        product_id = query_params.get("productId")
        limit = int(query_params.get("limit", 5))
        
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
                }),
            }
        
        logger.info(f"Get related products for product_id: {product_id}, limit: {limit}")
        
        table = get_commerce_table()
        
        # Get the main product
        response = table.get_item(
            Key={
                'PK': PRODUCT_PK,
                'SK': f'PRODUCT#{product_id}'
            }
        )
        
        product = response.get('Item')
        if not product:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Product not found"
                }),
            }
        
        category_id = product.get('categoryId')
        
        # Query all products from the same category
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': PRODUCT_PK}
        )
        
        all_products = response.get('Items', [])
        
        # Filter by category and exclude the current product
        related_items = [
            p for p in all_products
            if p.get('categoryId') == category_id and p.get('productId') != product_id
        ][:limit]
        
        # Map DynamoDB fields to Product model fields
        related = []
        for item in related_items:
            image_urls = item.get('imageUrls', [])
            mapped_product = {
                'id': item.get('productId'),
                'name': item.get('name'),
                'price': item.get('price'),
                'image': image_urls[0] if image_urls else '',
                'description': item.get('description', ''),
                'category_id': item.get('categoryId'),
                'category_name': item.get('categoryName', ''),
            }
            related.append(mapped_product)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Related products retrieved successfully",
                "data": {
                    "products": related,
                    "total": len(related)
                }
            }, cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error during get related products: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get related products: {str(e)}"
            }, cls=DecimalEncoder),
        }
