"""
Product handler
"""

import json
import logging
import random
from src.models.product import ProductsResponse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Dummy products data
DUMMY_PRODUCTS = [
    {"id": 1, "name": "バレーボール 練習用", "price": 3980, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "スポーツブランドA製の高品質バレーボール。", "category_id": "volley-ball", "parent_category_id": "volley", "category_name": "バレー"},
    {"id": 2, "name": "バレーシューズ", "price": 7980, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "ジャンプ力を高める設計のシューズ。", "category_id": "volley-shoes", "parent_category_id": "volley", "category_name": "バレー"},
    {"id": 3, "name": "バレーボール用ユニフォーム", "price": 5500, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "吸汗速乾素材のユニフォーム。", "category_id": "volley-wear", "parent_category_id": "volley", "category_name": "バレー"},
    {"id": 4, "name": "バレーボール用ウェア2", "price": 4200, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "高機能ウェア。", "category_id": "volley-wear", "parent_category_id": "volley", "category_name": "バレー"},
    {"id": 5, "name": "バレーボール用靴下", "price": 1500, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "サポート機能付き靴下。", "category_id": "volley-acc", "parent_category_id": "volley", "category_name": "バレー"},
    {"id": 6, "name": "バレーボール用アクセサリー", "price": 2800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "プレイヤー向けアクセサリー。", "category_id": "volley-acc", "parent_category_id": "volley", "category_name": "バレー"},
    
    {"id": 7, "name": "バスケットボール 公式サイズ", "price": 6480, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "屋内外対応の高品質バスケットボール。", "category_id": "basket-ball", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    {"id": 8, "name": "バスケットシューズ ハイカット", "price": 9800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "グリップ力抜群のハイカットシューズ。", "category_id": "basket-shoes", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    {"id": 9, "name": "バスケット用ウェア", "price": 4980, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "スポーティーなバスケット用ウェア。", "category_id": "basket-wear", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    {"id": 10, "name": "バスケットボール用パンツ", "price": 5800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "快適なバスケットボール用パンツ。", "category_id": "basket-wear", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    {"id": 11, "name": "バスケットボール用手袋", "price": 2200, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "グリップ性能を向上させる手袋。", "category_id": "basket-acc", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    {"id": 12, "name": "バスケット用バッグ", "price": 3500, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "ボール収納バッグ。", "category_id": "basket-acc", "parent_category_id": "basketball", "category_name": "バスケットボール"},
    
    {"id": 13, "name": "卓球ラケット", "price": 4500, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "初心者から上級者まで使えるラケット。", "category_id": "ping-racket", "parent_category_id": "ping-pong", "category_name": "卓球"},
    {"id": 14, "name": "卓球台", "price": 29800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "家庭用折りたたみ卓球台。", "category_id": "ping-table", "parent_category_id": "ping-pong", "category_name": "卓球"},
    {"id": 15, "name": "卓球ボール 3個入り", "price": 800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "練習用卓球ボール。", "category_id": "ping-ball", "parent_category_id": "ping-pong", "category_name": "卓球"},
    {"id": 16, "name": "卓球用ウェア", "price": 3800, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "卓球用スポーツウェア。", "category_id": "ping-acc", "parent_category_id": "ping-pong", "category_name": "卓球"},
    {"id": 17, "name": "卓球用シューズ", "price": 5900, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "軽量で動きやすいシューズ。", "category_id": "ping-acc", "parent_category_id": "ping-pong", "category_name": "卓球"},
    {"id": 18, "name": "卓球用ラバー", "price": 2500, "image": "https://d1ylgime41e1gd.cloudfront.net/main.jpg", "description": "高性能ラバー。", "category_id": "ping-acc", "parent_category_id": "ping-pong", "category_name": "卓球"},
]


def get_featured_products(event, context):
    """
    Get featured products for each category (random 5 products per category)
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info("Get featured products event")
        
        # Group products by parent_category_id
        categories = {}
        for product in DUMMY_PRODUCTS:
            parent_cat_id = product.get("parent_category_id", product["category_id"])
            if parent_cat_id not in categories:
                categories[parent_cat_id] = []
            categories[parent_cat_id].append(product)
        
        # Get random 5 products per category
        featured = {}
        for cat_id, products in categories.items():
            featured[cat_id] = random.sample(products, min(5, len(products)))
        
        response = ProductsResponse(
            success=True,
            message="Featured products retrieved successfully",
            data=featured,
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except Exception as e:
        logger.error(f"Error during get featured products: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get featured products: {str(e)}"
            }),
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
        product_id = int(event.get("pathParameters", {}).get("id", 1))
        
        logger.info(f"Get product detail: {product_id}")
        
        # Find product
        product = None
        for p in DUMMY_PRODUCTS:
            if p["id"] == product_id:
                product = p
                break
        
        if not product:
            # Return default test product (ID: 1)
            product = DUMMY_PRODUCTS[0]
        
        # Create markdown description for product details
        product_details_md = """- **ブランド:** スポーツブランドA
- **カラー:** ホワイト/ブルー
- **素材:** 合成皮革/ポリエステル
- **対応:** 初心者～中級者"""
        
        # Add additional detail fields for product detail page
        product_detail = {
            **product,
            "productDetails": product_details_md,
            "originalPrice": None,
            "discount": None,
        }
        
        response = ProductsResponse(
            success=True,
            message="Product detail retrieved successfully",
            data=product_detail,
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
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
            }),
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
        product_id = int(event.get("pathParameters", {}).get("id", 0))
        
        logger.info(f"Check product exists: {product_id}")
        
        # Check if product exists
        exists = any(p["id"] == product_id for p in DUMMY_PRODUCTS)
        
        response = {
            "success": True,
            "message": "Product existence check completed",
            "data": {
                "exists": exists
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
            }),
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
        
        # Check existence of each product
        results = {}
        for product_id in product_ids:
            exists = any(p["id"] == int(product_id) for p in DUMMY_PRODUCTS)
            results[str(product_id)] = exists
        
        response = {
            "success": True,
            "message": "Products existence check completed",
            "data": {
                "results": results
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
            }),
        }


def get_related_products(event, context):
    """
    Get related products based on product category
    
    Priority:
    1. Products with same subcategory (excluding the product itself)
    2. If no related products found in subcategory, use parent category
    
    Query Parameters:
        - productId: ID of the product
        - limit: Number of products to return (default: 4)
    
    Args:
        event: Lambda event (with queryStringParameters)
        context: Lambda context
    
    Returns:
        API response with related products
    """
    try:
        # Get query parameters
        query_params = event.get("queryStringParameters") or {}
        product_id = int(query_params.get("productId", 1))
        limit = int(query_params.get("limit", 4))
        
        logger.info(f"Get related products for product_id: {product_id}, limit: {limit}")
        
        # Find the current product
        current_product = None
        for p in DUMMY_PRODUCTS:
            if p["id"] == product_id:
                current_product = p
                break
        
        if not current_product:
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
        
        # Step 1: Try to find products in the same subcategory (excluding current product)
        subcategory_products = [
            p for p in DUMMY_PRODUCTS
            if p["category_id"] == current_product["category_id"] and p["id"] != product_id
        ]
        
        # Step 2: If not enough products in subcategory, add products from parent category
        if len(subcategory_products) < limit:
            parent_products = [
                p for p in DUMMY_PRODUCTS
                if p["parent_category_id"] == current_product["parent_category_id"] 
                and p["id"] != product_id
                and p not in subcategory_products  # Avoid duplicates
            ]
            related_products = subcategory_products + parent_products
        else:
            related_products = subcategory_products
        
        # Limit to requested amount
        related_products = related_products[:limit]
        
        response_data = {
            "products": related_products,
            "total": len(related_products),
        }
        
        response = ProductsResponse(
            success=True,
            message="Related products retrieved successfully",
            data=response_data,
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
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
            }),
        }
