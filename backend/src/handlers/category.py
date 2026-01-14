"""
Category handler
"""

import json
import logging
from src.models.category import CategoriesResponse, Category, Subcategory

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Dummy categories data
DUMMY_CATEGORIES = [
    {
        "id": "volley",
        "name": "バレー",
        "subcategories": [
            {"id": "volley-ball", "name": "ボール"},
            {"id": "volley-shoes", "name": "シューズ"},
            {"id": "volley-wear", "name": "ウェア"},
            {"id": "volley-acc", "name": "アクセサリー"},
        ],
    },
    {
        "id": "basketball",
        "name": "バスケットボール",
        "subcategories": [
            {"id": "basket-ball", "name": "ボール"},
            {"id": "basket-shoes", "name": "シューズ"},
            {"id": "basket-wear", "name": "ウェア"},
            {"id": "basket-acc", "name": "アクセサリー"},
        ],
    },
    {
        "id": "ping-pong",
        "name": "卓球",
        "subcategories": [
            {"id": "ping-ball", "name": "ボール"},
            {"id": "ping-racket", "name": "ラケット"},
            {"id": "ping-table", "name": "テーブル"},
            {"id": "ping-acc", "name": "アクセサリー"},
        ],
    },
]


def get_categories(event, context):
    """
    Get all categories handler
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info("Get categories event")
        
        # Convert to Category models
        categories = [
            Category(
                id=cat["id"],
                name=cat["name"],
                subcategories=[
                    Subcategory(id=sub["id"], name=sub["name"])
                    for sub in cat["subcategories"]
                ],
            )
            for cat in DUMMY_CATEGORIES
        ]
        
        response = CategoriesResponse(
            success=True,
            message="Categories retrieved successfully",
            data=categories,
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
        logger.error(f"Error during get categories: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get categories: {str(e)}"
            }),
        }
