"""
Ecsite Backend - Entry point for local testing
"""

import json
from src.handlers.auth import login, update_notification_settings, delete_account


def health_check(event, context):
    """Health check endpoint"""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "status": "healthy",
            "message": "Ecsite Backend API is running"
        }),
    }


if __name__ == "__main__":
    # Local testing
    test_event = {
        "body": json.dumps({
            "email": "test@example.com",
            "password": "password123"
        })
    }
    
    result = login(test_event, None)
    print(json.dumps(result, indent=2))
