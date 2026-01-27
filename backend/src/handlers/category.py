"""
Category handler - Commerce table integration
"""

import json
import logging
from src.models.category import CategoriesResponse, Category, Subcategory
from src.utils.dynamodb import get_commerce_table, CATEGORY_PK
from src.utils.cors import cors_headers

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_categories(event, context):
    """
    Get all categories handler
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response with parent categories and their subcategories
    """
    try:
        logger.info("Get categories event")
        
        table = get_commerce_table()
        
        # Query all categories from Commerce table
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={':pk': CATEGORY_PK}
        )
        
        category_items = response.get('Items', [])
        
        # Build category dictionary and separate parent/child
        category_map = {}
        parent_categories = []
        
        for cat_item in category_items:
            category_id = cat_item.get('categoryId')
            parent_category_id = cat_item.get('parentCategoryId')
            category_name = cat_item.get('categoryName')
            
            # Store in map for easy lookup
            category_map[category_id] = {
                'id': category_id,
                'name': category_name,
                'parentCategoryId': parent_category_id,
                'index': cat_item.get('index', 0),
            }
            
            # If no parent, it's a top-level category
            if not parent_category_id:
                parent_categories.append(category_id)
        
        # Build Category models with subcategories
        categories = []
        for parent_id in parent_categories:
            parent_data = category_map[parent_id]
            
            # Find all subcategories for this parent
            subcategories = []
            for cat_id, cat_data in category_map.items():
                if cat_data['parentCategoryId'] == parent_id:
                    subcategories.append(Subcategory(
                        id=cat_id,
                        name=cat_data['name']
                    ))
            
            # Sort subcategories by index
            subcategories.sort(key=lambda x: category_map[x.id].get('index', 0))
            
            category = Category(
                id=parent_id,
                name=parent_data['name'],
                subcategories=subcategories,
            )
            categories.append(category)
        
        # Sort parent categories by index
        categories.sort(key=lambda x: category_map[x.id].get('index', 0))
        
        response = CategoriesResponse(
            success=True,
            message="Categories retrieved successfully",
            data=categories,
        )
        
        return {
            "statusCode": 200,
            "headers": cors_headers(event),
            "body": json.dumps(response.model_dump()),
        }
    
    except Exception as e:
        import traceback
        error_msg = str(e)
        stack_trace = traceback.format_exc()
        logger.error(f"Error during get categories: {error_msg}\nStack: {stack_trace}")
        return {
            "statusCode": 500,
            "headers": cors_headers(event),
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get categories: {error_msg}",
                "error": stack_trace if True else None  # Include traceback in dev
            }),
        }

