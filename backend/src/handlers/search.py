"""
Search handler - Product search with filtering and sorting
"""

import json
import logging
from src.models.product import ProductsResponse
from src.handlers.product import DUMMY_PRODUCTS

logger = logging.getLogger()
logger.setLevel(logging.INFO)


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
        categories = query_params.get("categories", [])
        if isinstance(categories, str):
            categories = [categories]
        
        price_range = query_params.get("priceRange", "all")
        sort_by = query_params.get("sort", "relevance")
        page = int(query_params.get("page", "1"))
        limit = int(query_params.get("limit", "20"))
        
        logger.info(f"Search products - keyword: {keyword}, categories: {categories}, price_range: {price_range}, sort: {sort_by}, page: {page}, limit: {limit}")
        
        # Filter products
        filtered_products = []
        
        for product in DUMMY_PRODUCTS:
            # Keyword filter
            if keyword and keyword not in product["name"].lower():
                continue
            
            # Category filter
            if categories:
                # Since DUMMY_PRODUCTS doesn't have subcategory_id, we use category_id as fallback
                # In production, this would filter by subcategory_id
                if product.get("category_id") not in categories:
                    continue
            
            # Price filter
            price = product["price"]
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
            
            product_name_lower = product["name"].lower()
            
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
            filtered_products.sort(key=lambda x: x["price"])
        elif sort_by == "desc":
            filtered_products.sort(key=lambda x: x["price"], reverse=True)
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
        
        # Add subcategory_id field for frontend compatibility
        # In production, this would come from the database
        for product in paginated_products:
            if "subcategory_id" not in product:
                product["subcategory_id"] = f"{product['category_id']}-item"
                product["subcategory_name"] = product.get("category_name", "")
        
        response_data = {
            "products": paginated_products,
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
            "body": json.dumps(response.model_dump()),
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
            }),
        }
