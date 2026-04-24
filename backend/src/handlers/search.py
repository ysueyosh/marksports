"""
Search handler - Product search with filtering and sorting
"""

import json
import logging
from decimal import Decimal
from src.models.product import ProductsResponse
from src.utils.dynamodb import get_commerce_table, PRODUCT_PK

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder that converts Decimal to float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def search_products(event, context):
    """
    Search products with filtering and sorting
    
    Query Parameters:
        - keyword: Search keyword (searches in product name)
        - categories: Subcategory IDs (can be repeated for multiple categories)
        - priceRange: 'all', 'lt1000', '1000-5000', '5000-10000', 'gt10000'
        - sort: 'relevance', 'asc', 'desc'
        - page: Page number (default: 1)
        - limit: Items per page (default: 6)
    
    Args:
        event: Lambda event (with queryStringParameters)
        context: Lambda context
    
    Returns:
        API response with paginated search results
    """
    try:
        # Get query parameters
        query_params = event.get("queryStringParameters") or {}

        keyword = query_params.get("keyword", "").lower()

        # Normalize categories from multiple gateway formats.
        # - HTTP API v2 often provides repeated keys as comma-joined string.
        # - Some routes/local adapters provide list values directly.
        # - REST API v1 may provide multiValueQueryStringParameters.
        categories = []
        raw_categories = query_params.get("categories", [])

        if isinstance(raw_categories, list):
            categories.extend(raw_categories)
        elif isinstance(raw_categories, str):
            categories.extend(raw_categories.split(","))

        multi_value_params = event.get("multiValueQueryStringParameters") or {}
        raw_multi_categories = multi_value_params.get("categories", [])
        if isinstance(raw_multi_categories, list):
            categories.extend(raw_multi_categories)
        elif isinstance(raw_multi_categories, str):
            categories.extend(raw_multi_categories.split(","))

        # Trim spaces and remove empty values while preserving order.
        categories = [category.strip() for category in categories if category and category.strip()]
        categories = list(dict.fromkeys(categories))
        
        price_range = query_params.get("priceRange", "all")
        sort_by = query_params.get("sort", "relevance")
        page = int(query_params.get("page", "1"))
        limit = int(query_params.get("limit", "20"))
        
        logger.info(f"Search products - keyword: {keyword}, categories: {categories}, price_range: {price_range}, sort: {sort_by}, page: {page}, limit: {limit}")
        
        # Get products from DynamoDB
        table = get_commerce_table()
        
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': PRODUCT_PK}
        )
        
        all_products = response.get('Items', [])
        
        # Filter products
        filtered_products = []
        
        for product in all_products:
            # Exclude inactive products
            if not product.get('isActive', True):
                continue

            # Keyword filter
            if keyword and keyword not in product.get("name", "").lower():
                continue

            # Category filter
            if categories:
                if product.get("categoryId") not in categories:
                    continue
            
            # Price filter
            price = float(product.get("price", 0))
            if price_range == "lt1000":
                if price > 1000:
                    continue
            elif price_range == "1000-5000":
                if price <= 1000 or price > 5000:
                    continue
            elif price_range == "5000-10000":
                if price <= 5000 or price > 10000:
                    continue
            elif price_range == "gt10000":
                if price <= 10000:
                    continue
            
            filtered_products.append(product)
        
        # Calculate relevance score for keyword matching
        def calculate_relevance_score(product, keyword):
            if not keyword:
                return 0
            
            product_name_lower = product.get("name", "").lower()
            
            # Split keyword into words
            keywords = keyword.split()
            score = 0
            
            for kw in keywords:
                if kw in product_name_lower:
                    # Check if keyword is at the beginning of product name (higher relevance)
                    if product_name_lower.startswith(kw):
                        score += 10
                    else:
                        score += 5
            
            return score
        
        # Sort products
        if sort_by == "asc":
            filtered_products.sort(key=lambda x: float(x.get("price", 0)))
        elif sort_by == "desc":
            filtered_products.sort(key=lambda x: float(x.get("price", 0)), reverse=True)
        elif sort_by == "relevance":
            # Sort by relevance score (descending) if keyword exists, otherwise keep original order
            if keyword:
                filtered_products.sort(
                    key=lambda x: calculate_relevance_score(x, keyword),
                    reverse=True
                )
        
        # Pagination
        total_count = len(filtered_products)
        total_pages = (total_count + limit - 1) // limit  # Ceiling division
        
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_products = filtered_products[start_idx:end_idx]
        
        # Map DynamoDB fields to Product model fields for response
        mapped_products = []
        for product in paginated_products:
            image_urls = product.get('imageUrls', [])
            mapped_product = {
                'id': product.get('productId'),
                'name': product.get('name'),
                'price': product.get('price'),
                'image': image_urls[0] if image_urls else '',
                'description': product.get('description', ''),
                'category_id': product.get('categoryId'),
                'category_name': product.get('categoryName', ''),
            }
            mapped_products.append(mapped_product)
        
        response_data = {
            "products": mapped_products,
            "total": total_count,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
        }
        
        response = ProductsResponse(
            success=True,
            message="Products searched successfully",
            data=response_data,
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump(), cls=DecimalEncoder),
        }
    
    except Exception as e:
        logger.error(f"Error during search products: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to search products: {str(e)}"
            }, cls=DecimalEncoder),
        }
