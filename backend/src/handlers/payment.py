import json
import logging
from src.utils.auth import require_auth_handler

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Mock database - in production, use actual database
payment_methods_db = {}


@require_auth_handler
def get_saved_cards(event, context):
    """
    Get user's saved cards handler - Requires authentication
    """
    try:
        logger.info("Get saved cards event")
        
        # TODO: Get user ID from JWT token
        user_id = "user_001"
        
        # Dummy data - sample cards
        dummy_cards = [
            {
                "id": "card_001",
                "lastFourDigits": "4242",
                "cardType": "VISA",
                "expiryMonth": 12,
                "expiryYear": 2025,
                "cardholderName": "Taro Yamada",
                "isDefault": True,
                "createdAt": "2025-01-01T00:00:00Z"
            },
            {
                "id": "card_002",
                "lastFourDigits": "5555",
                "cardType": "MASTERCARD",
                "expiryMonth": 6,
                "expiryYear": 2026,
                "cardholderName": "Taro Yamada",
                "isDefault": False,
                "createdAt": "2025-06-01T00:00:00Z"
            }
        ]
        
        # If mock database has data, use it; otherwise return dummy data
        user_cards = payment_methods_db.get(user_id, dummy_cards)
        
        response = {
            "success": True,
            "message": "Success",
            "data": user_cards
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
        logger.error(f"Error during get saved cards: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get saved cards: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def add_card(event, context):
    """
    Add new card handler - Requires authentication
    """
    try:
        logger.info(f"Add card event: {event}")
        
        user_id = "user_001"
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['sourceId', 'cardholderName']
        for field in required_fields:
            if not body.get(field):
                return {
                    "statusCode": 400,
                    "body": json.dumps({
                        "success": False,
                        "message": f"{field} is required"
                    }, ensure_ascii=False),
                }
        
        # Initialize user cards if not exists
        if user_id not in payment_methods_db:
            payment_methods_db[user_id] = []
        
        # TODO: In production, call Square API to tokenize card
        # For now, use mock data
        new_card = {
            "id": f"card_{len(payment_methods_db[user_id]) + 1}",
            "lastFourDigits": "4242",
            "cardType": "VISA",
            "expiryMonth": 12,
            "expiryYear": 2025,
            "cardholderName": body.get('cardholderName'),
            "isDefault": len(payment_methods_db[user_id]) == 0,  # First card is default
            "createdAt": json.dumps({"$date": "2025-01-07T00:00:00Z"}).replace('{"$date": "', '').replace('"}', '')
        }
        
        payment_methods_db[user_id].append(new_card)
        
        response = {
            "success": True,
            "message": "Card added successfully",
            "data": new_card
        }
        
        return {
            "statusCode": 201,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during add card: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to add card: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def delete_card(event, context):
    """
    Delete card handler - Requires authentication
    """
    try:
        logger.info(f"Delete card event: {event}")
        
        user_id = "user_001"
        card_id = event.get('pathParameters', {}).get('id')
        
        if not card_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Card ID is required"
                }, ensure_ascii=False),
            }
        
        if user_id not in payment_methods_db:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Card not found"
                }, ensure_ascii=False),
            }
        
        # Find and delete card
        original_length = len(payment_methods_db[user_id])
        payment_methods_db[user_id] = [card for card in payment_methods_db[user_id] if card['id'] != card_id]
        
        if len(payment_methods_db[user_id]) == original_length:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Card not found"
                }, ensure_ascii=False),
            }
        
        # If deleted card was default, set first remaining as default
        if len(payment_methods_db[user_id]) > 0:
            has_default = any(card['isDefault'] for card in payment_methods_db[user_id])
            if not has_default:
                payment_methods_db[user_id][0]['isDefault'] = True
        
        response = {
            "success": True,
            "message": "Card deleted successfully"
        }
        
        return {
            "statusCode": 200,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during delete card: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to delete card: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def set_default_card(event, context):
    """
    Set card as default handler - Requires authentication
    """
    try:
        logger.info(f"Set default card event: {event}")
        
        user_id = "user_001"
        card_id = event.get('pathParameters', {}).get('id')
        
        if not card_id:
            return {
                "statusCode": 400,
                "body": json.dumps({
                    "success": False,
                    "message": "Card ID is required"
                }, ensure_ascii=False),
            }
        
        if user_id not in payment_methods_db:
            return {
                "statusCode": 404,
                "body": json.dumps({
                    "success": False,
                    "message": "Card not found"
                }, ensure_ascii=False),
            }
        
        # Find and update default status
        for card in payment_methods_db[user_id]:
            card['isDefault'] = card['id'] == card_id
        
        response = {
            "success": True,
            "message": "Default card updated successfully",
            "data": next((card for card in payment_methods_db[user_id] if card['id'] == card_id), None)
        }
        
        return {
            "statusCode": 200,
            "body": json.dumps(response, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during set default card: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "success": False,
                "message": f"Failed to set default card: {str(e)}"
            }, ensure_ascii=False),
        }
