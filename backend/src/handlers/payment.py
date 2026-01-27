import json
import logging
import os
import uuid
import requests
from datetime import datetime
from src.utils.dynamodb import get_users_table
from src.utils.auth import require_user_auth
from src.utils.jwt import verify_token
from src.models.payment import PaymentMethod

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Square API Configuration
SQUARE_ACCESS_TOKEN = os.environ.get('SQUARE_ACCESS_TOKEN', '')
SQUARE_ENVIRONMENT = os.environ.get('SQUARE_ENVIRONMENT', 'sandbox')

# Square API URLs
SQUARE_API_BASE_URL = (
    'https://connect.squareup.com' if SQUARE_ENVIRONMENT == 'production'
    else 'https://connect.squareupsandbox.com'
)

# Square API Headers
SQUARE_HEADERS = {
    'Square-Version': '2024-10-17',
    'Authorization': f'Bearer {SQUARE_ACCESS_TOKEN}',
    'Content-Type': 'application/json',
}


def _get_or_create_square_customer(user_id: str, user_email: str, table) -> str:
    """
    Get or create a Square Customer for the user
    
    Returns:
        square_customer_id if successful, None otherwise
    """
    try:
        logger.info(f"[CUSTOMER] _get_or_create_square_customer called for user_id: {user_id}, email: {user_email}")
        
        # Step 1: Check if we already have a Square Customer ID stored for this user
        pk_value = f"USER#{user_id}"
        sk_value = f"PROFILE#{user_id}"
        
        logger.info(f"[CUSTOMER] Querying with PK={pk_value}, SK={sk_value}")
        
        profile_response = table.query(
            KeyConditionExpression="PK = :pk AND SK = :sk",
            ExpressionAttributeValues={
                ":pk": pk_value,
                ":sk": sk_value
            }
        )
        
        items = profile_response.get("Items", [])
        logger.info(f"[CUSTOMER] Query result - Items count: {len(items)}")
        logger.info(f"[CUSTOMER] Query response: {profile_response}")
        
        if not items:
            logger.error(f"[PAYMENT] Cannot create Square customer: user not found in database for user_id {user_id}")
            logger.error(f"[PAYMENT] Query was: PK={pk_value}, SK={sk_value}")
            return None
        
        user_item = items[0]
        square_customer_id = user_item.get("squareCustomerId")
        
        logger.info(f"[CUSTOMER] User found - square_customer_id: {square_customer_id}")
        
        if square_customer_id:
            logger.info(f"[CUSTOMER] Found existing square_customer_id: {square_customer_id}")
            return square_customer_id
        
        # Step 2: Get user profile for customer creation
        user_profile = user_item
        logger.info(f"[CUSTOMER] User profile data: {json.dumps({k: v for k, v in user_profile.items() if k not in ['PK', 'SK']}, default=str)}")
        
        # Step 3: Create new Square Customer
        # ベストプラクティス: reference_id で user_id を Square に記録
        customer_body = {
            "idempotency_key": str(uuid.uuid4()),
            "given_name": user_profile.get("name", "Customer"),
            "email_address": user_profile.get("email") or user_email,
            "reference_id": f"USER#{user_id}",  # ⭐ 自社 user_id とのマッピング
        }
        
        if user_profile.get("phone"):
            customer_body["phone_number"] = user_profile.get("phone")
        
        logger.info(f"[CUSTOMER] Creating Square customer with body: {json.dumps(customer_body)}")
        
        response = requests.post(
            f"{SQUARE_API_BASE_URL}/v2/customers",
            headers=SQUARE_HEADERS,
            json=customer_body,
            timeout=30
        )
        
        logger.info(f"[CUSTOMER] Square CreateCustomer response status: {response.status_code}")
        logger.info(f"[CUSTOMER] Square CreateCustomer response: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            square_customer_id = result.get('customer', {}).get('id')
            logger.info(f"[CUSTOMER] Successfully created customer: {square_customer_id}")
            
            if square_customer_id:
                # Save the square_customer_id to user profile
                user_pk = user_item.get("PK", f"USER#{user_id}")
                user_sk = user_item.get("SK")
                
                logger.info(f"[CUSTOMER] Saving square_customer_id: {square_customer_id} for user PK: {user_pk}, SK: {user_sk}")
                
                if user_pk and user_sk:
                    table.update_item(
                        Key={
                            "PK": user_pk,
                            "SK": user_sk
                        },
                        UpdateExpression="SET squareCustomerId = :cid, updatedAt = :now",
                        ExpressionAttributeValues={
                            ":cid": square_customer_id,
                            ":now": datetime.utcnow().isoformat() + 'Z'
                        }
                    )
                    logger.info(f"[CUSTOMER] Created and saved Square customer: {square_customer_id}")
                else:
                    logger.error(f"[CUSTOMER] Cannot save Square customer: missing PK or SK - PK: {user_pk}, SK: {user_sk}")
                
                return square_customer_id
        else:
            logger.error(f"[CUSTOMER] Failed to create Square customer: response status {response.status_code}")
            logger.error(f"[CUSTOMER] Response body: {response.text}")
            return None
        
        return None
    except Exception as e:
        logger.error(f"[CUSTOMER] Error in _get_or_create_square_customer: {str(e)}", exc_info=True)
        return None


def _create_square_card(source_id: str, square_customer_id: str, cardholder_name: str = None, user_id: str = None, verification_token: str = None, billing_address: dict = None) -> dict:
    """
    Create a card via Square API
    
    Reference: https://developer.squareup.com/reference/square/cards-api/create-card
    
    Args:
        source_id: Payment source nonce from Web Payments SDK (cnon_xxx)
        square_customer_id: Square Customer ID (for Card on File)
        cardholder_name: ⭐ Cardholder name for card storage (required)
        user_id: ⭐ User ID for reference_id mapping
        verification_token: Optional verification token from verifyBuyer()
        billing_address: Optional billing address
        
    Returns:
        Card data dict if successful, None otherwise
    """
    try:
        # ⭐ 診断: sourceId の形式をチェック
        logger.info(f"[DIAGNOSTIC] source_id received: {source_id}")
        logger.info(f"[DIAGNOSTIC] source_id type: {type(source_id)}")
        logger.info(f"[DIAGNOSTIC] source_id length: {len(str(source_id))}")
        logger.info(f"[DIAGNOSTIC] source_id starts with 'cnon': {str(source_id).startswith('cnon')}")
        
        # Square CreateCard API - 公式仕様に準拠
        # Required: source_id
        # Optional: verification_token, card (with customer_id for Card on File)
        card_body = {
            "idempotency_key": str(uuid.uuid4()),
            "source_id": source_id,  # ⭐ 必須
        }
        
        # Card on File の場合は card オブジェクトを指定
        # customer_id を指定すると、このカードが Customer に紐づけられる
        if square_customer_id:
            logger.info(f"[PAYMENT] Creating card with customer_id: {square_customer_id}, cardholder_name: {cardholder_name}")
            card_obj = {
                "customer_id": square_customer_id,  # ⭐ Card on File 用
            }
            
            # cardholder_name が提供されている場合のみ追加
            if cardholder_name:
                card_obj["cardholder_name"] = cardholder_name
                logger.info(f"[PAYMENT] Added cardholder_name to card object: {cardholder_name}")
            
            # reference_id を追加
            if user_id:
                card_obj["reference_id"] = f"USER#{user_id}"
                logger.info(f"[PAYMENT] Added reference_id: USER#{user_id}")
            
            card_body["card"] = card_obj
            logger.info(f"[PAYMENT] Final card object: {json.dumps(card_body['card'])}")
        else:
            logger.error(f"[PAYMENT] square_customer_id is None or empty! Cannot create card without customer_id")
            logger.error(f"[PAYMENT] square_customer_id value: '{square_customer_id}'")
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Failed to create Square customer - cannot save card"
                }, ensure_ascii=False),
            }
        
        # verification_token が提供されている場合は追加
        if verification_token:
            card_body["verification_token"] = verification_token
        
        logger.info(f"[PAYMENT] Creating Square card with body: {json.dumps(card_body)}")
        
        response = requests.post(
            f"{SQUARE_API_BASE_URL}/v2/cards",
            headers=SQUARE_HEADERS,
            json=card_body,
            timeout=30
        )
        
        logger.info(f"Square CreateCard response status: {response.status_code}")
        logger.info(f"Square CreateCard response: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            card = result.get('card', {})
            
            if card.get('id'):
                logger.info(f"Created Square card: {card.get('id')}")
                return card
        
        logger.error(f"Failed to create Square card: {response.text}")
        return None
        
    except Exception as e:
        logger.error(f"Error in _create_square_card: {str(e)}")
        return None


@require_user_auth
def get_payment_methods(event, context):
    """
    Get user's saved payment methods - Requires authentication
    """
    try:
        logger.info("Get payment methods event")
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
        if not user_id:
            logger.error("No user_id in user_payload")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Internal server error"
                }, ensure_ascii=False),
            }
        
        # Query payment methods from DynamoDB
        table = get_users_table()
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": "PAYMENT_METHOD#"
            }
        )
        
        payment_methods = []
        for item in response.get("Items", []):
            payment_method = PaymentMethod.from_dynamo(item)
            payment_methods.append(payment_method.to_dict())
        
        # Sort by isDefault first, then by creation
        payment_methods.sort(key=lambda x: (not x["isDefault"], x["id"]))
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Success",
                "data": payment_methods
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during get payment methods: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get payment methods: {str(e)}"
            }, ensure_ascii=False),
        }


@require_user_auth
def add_payment_method(event, context):
    """
    Add new payment method - Requires authentication
    
    Flow:
    1. Get user_id from JWT
    2. Ensure Square Customer exists (create if needed)
    3. Create Card via Square API with cardholder_name, reference_id, and verification_token
    4. Store card_id (not sourceId) to DynamoDB
    
    Request body:
    {
        "sourceId": "cnon_xxxxx",  # Payment token from Square Web Payments SDK (required)
        "cardholderName": "John Doe",  # Cardholder name (required for Card on File)
        "verificationToken": "token_xxx",  # From payments.verifyBuyer() (optional but recommended)
        "billingAddress": {        # Optional
            "givenName": "John",
            "familyName": "Doe",
            "addressLine1": "123 Main St",
            "addressLine2": "Apt 4",
            "administrativeDistrictLevel1": "CA",
            "postalCode": "94102",
            "country": "US"
        }
    }
    """
    try:
        logger.info(f"[ADD_PAYMENT] Starting add_payment_method")
        logger.info(f"[ADD_PAYMENT] Event keys: {list(event.keys())}")
        logger.info(f"[ADD_PAYMENT] Raw body: {event.get('body', 'NO BODY')}")
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')
        
        logger.info(f"[ADD_PAYMENT] user_payload: {user_payload}")
        logger.info(f"[ADD_PAYMENT] user_id: {user_id}")

        # ⭐ カード追加はログイン必須
        if not user_id:
            logger.error("[ADD_PAYMENT] Unauthorized - No user_id provided")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Authentication required to add payment method"
                }, ensure_ascii=False),
            }
        
        if not SQUARE_ACCESS_TOKEN:
            logger.error("SQUARE_ACCESS_TOKEN not configured")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment service not available"
                }, ensure_ascii=False),
            }
        
        body = json.loads(event.get('body', '{}'))
        
        logger.info(f"Request body received: {json.dumps(body)}")
        
        # Validate required fields
        if 'sourceId' not in body:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "sourceId is required"
                }, ensure_ascii=False),
            }
        
        source_id = body.get('sourceId')
        logger.info(f"Extracted sourceId: {source_id}")
        logger.info(f"sourceId type: {type(source_id)}, length: {len(str(source_id)) if source_id else 0}")
        table = get_users_table()
        
        # Get user email from database if user_id is available
        user_email = None
        square_customer_id = None
        
        # ⭐ First, check if square_customer_id is provided in request (from payment response)
        square_customer_id = body.get('squareCustomerId')
        logger.info(f"[PAYMENT] square_customer_id from request: {square_customer_id}")
        
        cardholder_name = body.get('cardholderName', '')
        logger.info(f"[PAYMENT] cardholder_name from request: {cardholder_name}")
        
        if user_id and not square_customer_id:
            user_response = table.query(
                KeyConditionExpression="PK = :pk AND SK = :sk",
                ExpressionAttributeValues={
                    ':pk': f'USER#{user_id}',
                    ':sk': f'PROFILE#{user_id}'
                }
            )
            if user_response.get('Items'):
                user_email = user_response['Items'][0].get('email')
                square_customer_id = user_response['Items'][0].get('squareCustomerId')
                logger.info(f"[PAYMENT] Retrieved from DB - square_customer_id: {square_customer_id}, email: {user_email}")
        
        # Step 1: Get or create Square Customer (only if user_id exists, which is guaranteed by auth check above)
        if user_id and not square_customer_id:
            # Use user_email if available from DB, otherwise error
            if not user_email:
                logger.error(f"[PAYMENT] Cannot create Square customer: user not found in database for user_id {user_id}")
                return {
                    "statusCode": 404,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "User profile not found"
                    }, ensure_ascii=False),
                }
            
            logger.info(f"[PAYMENT] Creating customer for user_id={user_id}, email={user_email}")
            square_customer_id = _get_or_create_square_customer(user_id, user_email, table)
            logger.info(f"[PAYMENT] Created new Square Customer: {square_customer_id}")
        
        # ⭐ Validate square_customer_id exists before proceeding
        if not square_customer_id:
            logger.error(f"[PAYMENT] Failed to get or create Square Customer ID for user {user_id}")
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Failed to create Square customer - cannot save card"
                }, ensure_ascii=False),
            }
        
        # Step 2: Create Card via Square API
        verification_token = body.get('verificationToken')  # ⭐ Optional but recommended
        
        logger.info(f"[PAYMENT] cardholder_name from request: {cardholder_name}")
        logger.info(f"[PAYMENT] Full request body keys: {list(body.keys())}")
        
        card_data = _create_square_card(
            source_id,
            square_customer_id,
            cardholder_name=cardholder_name,
            user_id=user_id,
            verification_token=verification_token,
            billing_address=body.get('billingAddress')
        )
        if not card_data:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Failed to create card"
                }, ensure_ascii=False),
            }
        
        # Step 3: Get existing payment methods to determine if this should be main
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": "PAYMENT_METHOD#"
            }
        )
        
        existing_count = response.get("Count", 0)
        is_main = existing_count == 0  # First payment method is main
        
        # Step 3.5: Check for duplicate card using fingerprint (ベストプラクティス)
        # Square が card_fingerprint を返す場合、同じ fingerprint のカードが既に存在するか確認
        card_fingerprint = card_data.get('fingerprint')
        if card_fingerprint:
            logger.info(f"Checking for duplicate card with fingerprint: {card_fingerprint}")
            # Query existing cards for this user and check fingerprint
            for item in response.get("Items", []):
                existing_fingerprint = item.get("cardFingerprint")
                if existing_fingerprint == card_fingerprint:
                    logger.warning(f"Duplicate card detected: {card_fingerprint}")
                    return {
                        "statusCode": 400,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": False,
                            "message": "このカードは既に登録されています"
                        }, ensure_ascii=False),
                    }
        
        # Step 4: Create PaymentMethod object with card_id (from Square)
        card_id = card_data['id']
        payment_method = PaymentMethod(
            payment_method_id=card_id,  # ⭐ Store card_id, NOT sourceId
            brand=card_data.get('card_brand', 'UNKNOWN'),
            last4=card_data.get('last_4', '0000'),
            exp_month=int(card_data.get('exp_month', 12)),
            exp_year=int(card_data.get('exp_year', 2025)),
            is_main=is_main,
            status="active"
        )
        
        # Step 5: Save to DynamoDB
        item = PaymentMethod.to_dynamo_item(user_id, payment_method)
        
        # 📝 Add fingerprint to item for future duplicate checks
        if card_fingerprint:
            item["cardFingerprint"] = card_fingerprint
        
        table.put_item(Item=item)
        
        logger.info(f"Payment method added: {card_id}")
        
        response_data = {
            "success": True,
            "message": "Payment method added successfully",
            "data": payment_method.to_dict()
        }
        
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response_data, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during add payment method: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to add payment method: {str(e)}"
            }, ensure_ascii=False),
        }


@require_user_auth
def delete_payment_method(event, context):
    """
    Delete payment method - Requires authentication
    """
    try:
        logger.info(f"Delete payment method event: {event}")
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')

        if not user_id:
            logger.error("No user_id in user_payload")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Internal server error"
                }, ensure_ascii=False),
            }
        
        payment_method_id = event.get('pathParameters', {}).get('id')
        
        if not payment_method_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment method ID is required"
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        
        # Get the payment method to check if it's main
        get_response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PAYMENT_METHOD#{payment_method_id}"
            }
        )
        
        if "Item" not in get_response:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment method not found"
                }, ensure_ascii=False),
            }
        
        was_main = get_response["Item"].get("isMain", False)
        
        # Delete the payment method
        table.delete_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PAYMENT_METHOD#{payment_method_id}"
            }
        )
        
        logger.info(f"Payment method deleted: {payment_method_id}")
        
        # If deleted method was main, set first remaining as main
        if was_main:
            remaining_response = table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk": "PAYMENT_METHOD#"
                }
            )
            
            if remaining_response.get("Count", 0) > 0:
                first_method = remaining_response["Items"][0]
                table.update_item(
                    Key={
                        "PK": first_method["PK"],
                        "SK": first_method["SK"]
                    },
                    UpdateExpression="SET isMain = :val",
                    ExpressionAttributeValues={
                        ":val": True
                    }
                )
        
        response_data = {
            "success": True,
            "message": "Payment method deleted successfully"
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response_data, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during delete payment method: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to delete payment method: {str(e)}"
            }, ensure_ascii=False),
        }


@require_user_auth
def set_default_payment_method(event, context):
    """
    Set payment method as default (main) - Requires authentication
    """
    try:
        logger.info(f"Set default payment method event: {event}")
        
        # Get user ID from payload injected by decorator
        user_payload = event.get('user_payload', {})
        user_id = user_payload.get('user_id')

        if not user_id:
            logger.error("No user_id in user_payload")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Internal server error"
                }, ensure_ascii=False),
            }
        
        payment_method_id = event.get('pathParameters', {}).get('id')
        
        if not payment_method_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment method ID is required"
                }, ensure_ascii=False),
            }
        
        table = get_users_table()
        
        # Get all payment methods for this user
        query_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": "PAYMENT_METHOD#"
            }
        )
        
        # Find target payment method
        target_method = None
        for item in query_response.get("Items", []):
            if item.get("paymentMethodId") == payment_method_id:
                target_method = item
                break
        
        if not target_method:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment method not found"
                }, ensure_ascii=False),
            }
        
        # Update all methods: set target to main, others to not main
        for item in query_response.get("Items", []):
            is_target = item.get("paymentMethodId") == payment_method_id
            table.update_item(
                Key={
                    "PK": item["PK"],
                    "SK": item["SK"]
                },
                UpdateExpression="SET isMain = :val",
                ExpressionAttributeValues={
                    ":val": is_target
                }
            )
        
        logger.info(f"Default payment method set to: {payment_method_id}")
        
        # Return updated payment method
        payment_method = PaymentMethod.from_dynamo(target_method)
        payment_method.is_main = True
        
        response_data = {
            "success": True,
            "message": "Default payment method updated successfully",
            "data": payment_method.to_dict()
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response_data, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during set default payment method: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to set default payment method: {str(e)}"
            }, ensure_ascii=False),
        }


def create_payment(event, context):
    """
    Create a payment using Square API
    
    Request body:
    {
        "sourceId": "cnon_xxxxx" or "card_id",  # Payment token from Square Web Payments SDK or saved card ID
        "amount": 1000,                         # Amount in cents
        "currency": "JPY",                      # Currency code
        "orderId": "ORDER_xxxxx"                # Order ID (optional)
    }
    """
    try:
        # 🔴 MUST OUTPUT - Payment API called
        print(f"[PAYMENT] CREATE_PAYMENT called with event body: {event.get('body', '{}')}")
        logger.error(f"[PAYMENT] CREATE_PAYMENT called with event body: {event.get('body', '{}')}")
        
        # Validate Square API Token
        if not SQUARE_ACCESS_TOKEN:
            logger.error("SQUARE_ACCESS_TOKEN not configured")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment service not available"
                }, ensure_ascii=False),
            }
        
        # Get user ID from token (optional - required for saved card payments)
        headers = event.get('headers', {})
        auth_header = (
            headers.get('Authorization', '') or 
            headers.get('authorization', '') or
            headers.get('AUTHORIZATION', '')
        )
        
        logger.info(f"Auth header present: {bool(auth_header)}")
        logger.info(f"Auth header value: {auth_header[:20]}..." if auth_header else "No auth header")
        
        user_id = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            is_valid, payload, error = verify_token(token)
            logger.info(f"Token verification result: is_valid={is_valid}, payload={payload}")
            if is_valid and payload:
                user_id = payload.get('user_id')
                logger.info(f"Extracted user_id from token: {user_id}")
        else:
            logger.warning("No valid Bearer token found in auth header")
        
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        source_id = body.get('sourceId')
        amount = body.get('amount')
        currency = body.get('currency', 'JPY')
        order_id = body.get('orderId', f"ORDER_{uuid.uuid4().hex[:8]}")
        
        logger.info(f"[PAYMENT] Request details - sourceId: {source_id}, amount: {amount}, currency: {currency}")
        
        if not source_id:
            logger.error("[PAYMENT] sourceId is required")
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "sourceId is required"
                }, ensure_ascii=False),
            }
        
        if amount is None or amount <= 0:
            logger.error(f"[PAYMENT] Invalid amount: {amount}")
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid amount"
                }, ensure_ascii=False),
            }
        
        # Build Square API request body
        payment_body = {
            "idempotency_key": str(uuid.uuid4()),
            "amount_money": {
                "amount": int(amount),
                "currency": currency
            },
            "source_id": source_id,
        }
        
        # 🔴 MUST OUTPUT - Check source_id type
        logger.info(f"[PAYMENT] source_id: {source_id}, type: {type(source_id)}")
        logger.info(f"[PAYMENT] source_id starts with 'card_': {str(source_id).startswith('card_')}")
        logger.info(f"[PAYMENT] source_id starts with 'ccof:': {str(source_id).startswith('ccof:')}")
        logger.info(f"[PAYMENT] source_id starts with 'cnon_': {str(source_id).startswith('cnon_')}")

        # Initialize payment_square_customer_id to None
        payment_square_customer_id = None

        # ⭐ If paying with saved card (card_id or ccof:), must include customer_id
        # ccof: = Customer Card On File token from Square SDK
        if str(source_id).startswith('card_') or str(source_id).startswith('ccof:'):
            logger.info(f"[PAYMENT] Processing saved card payment with source_id: {source_id}")
            logger.info(f"[PAYMENT] user_id available: {user_id}")

            # Get Square Customer ID for saved card payment
            if user_id:
                payment_table = get_users_table()
                # PK/SKで直接プロファイルアイテムを取得（より効率的）
                user_response = payment_table.get_item(
                    Key={
                        'PK': f'USER#{user_id}',
                        'SK': f'PROFILE#{user_id}'
                    }
                )
                user_item_payment = user_response.get('Item', {})
                payment_square_customer_id = user_item_payment.get('squareCustomerId')
                user_email_payment = user_item_payment.get('email')
                
                logger.info(f"[PAYMENT] Retrieved squareCustomerId: {payment_square_customer_id}")
                logger.info(f"[PAYMENT] Retrieved user_email: {user_email_payment}")
                
                # If no Square customer ID, try to create one
                if not payment_square_customer_id and user_email_payment:
                    logger.info(f"[PAYMENT] No Square customer ID found, creating new one for user {user_id}")
                    payment_square_customer_id = _get_or_create_square_customer(user_id, user_email_payment, payment_table)
                    logger.info(f"[PAYMENT] Created new squareCustomerId: {payment_square_customer_id}")
                
                if payment_square_customer_id:
                    payment_body["customer_id"] = payment_square_customer_id
                    logger.info(f"[PAYMENT] Added customer_id to payment: {payment_square_customer_id}")
                else:
                    logger.error(f"[PAYMENT] No Square customer ID found or could not be created for user {user_id}")
                    return {
                        "statusCode": 400,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": False,
                            "message": "Customer not registered for saved card payment"
                        }, ensure_ascii=False),
                    }
            else:
                logger.error("[PAYMENT] user_id not available for saved card payment")
                return {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "User authentication required for saved card payment"
                    }, ensure_ascii=False),
                }
        
        # Note: order_id is optional and may require specific format/validation
        # For now, we're excluding it to avoid validation errors
        # if order_id:
        #     payment_body["order_id"] = order_id
        
        logger.info(f"Calling Square Payments API with: {json.dumps(payment_body)}")
        logger.info(f"Source ID format: {source_id}")
        
        # Check if this is a Square-compatible payment method
        # Only card, ccof, and cnon payments can be sent to Square API
        source_id_str = str(source_id) if source_id else ""
        
        is_square_payment = (
            source_id_str.startswith('card_') or 
            source_id_str.startswith('ccof:') or 
            source_id_str.startswith('cnon:') or  # ⭐ cnon: (with colon, not underscore)
            source_id_str.startswith('cnon_')
        )
        
        logger.info(f"[PAYMENT] source_id_str: {source_id_str}, is_square_payment: {is_square_payment}")
        
        if not is_square_payment:
            # Non-Square payment methods (bank transfer, Apple Pay, Google Pay, etc.)
            # Return a mock/placeholder response
            logger.info(f"Non-Square payment method detected: {source_id}")
            
            # Generate a transaction ID for tracking
            transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": True,
                    "message": f"Payment initiated successfully ({source_id.split('_')[0].upper()})",
                    "data": {
                        "id": transaction_id,
                        "status": "PENDING",
                        "amount_money": {
                            "amount": int(amount),
                            "currency": currency
                        },
                        "receipt_number": f"{source_id.split('_')[0].upper()}_{int(uuid.uuid4().int % 1000000):06d}",
                        "receipt_url": f"/receipt/{transaction_id}"
                    }
                }, ensure_ascii=False),
            }
        
        # Call Square API to process payment
        try:
            square_url = f"{SQUARE_API_BASE_URL}/v2/payments"
            response = requests.post(
                square_url,
                headers=SQUARE_HEADERS,
                json=payment_body,
                timeout=30
            )
            
            logger.info(f"Square API response status: {response.status_code}")
            logger.info(f"Square API response body: {response.text}")
            
            if response.status_code in [200, 201]:
                result = response.json()
                payment_data = result.get('payment', {})
                card_details = payment_data.get('card_details', {})
                
                logger.info(f"Payment successful: {payment_data.get('id')}")
                logger.info(f"Card details: {card_details}")
                
                response_data = {
                    "id": payment_data.get('id'),
                    "status": payment_data.get('status'),
                    "amount_money": payment_data.get('amount_money', {}),
                    "receipt_number": payment_data.get('receipt_number'),
                    "receipt_url": payment_data.get('receipt_url'),
                    "customer_id": payment_square_customer_id if payment_square_customer_id else None
                }
                
                # Add card details if available
                if card_details:
                    response_data["card_details"] = {
                        "card_brand": card_details.get('card_brand'),
                        "last_4": card_details.get('last_4'),
                        "exp_month": card_details.get('exp_month'),
                        "exp_year": card_details.get('exp_year'),
                    }
                
                return {
                    "statusCode": 200,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": True,
                        "message": "Payment completed successfully",
                        "data": response_data
                    }, ensure_ascii=False),
                }
            
            elif response.status_code in [400, 422]:
                try:
                    error_data = response.json()
                    error_message = error_data.get('errors', [{}])[0].get('detail', 'Client error')
                except:
                    error_message = response.text
                
                logger.warning(f"Square API client error: {error_message}")
                logger.warning(f"Error details: {response.text}")
                
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": error_message
                    }, ensure_ascii=False),
                }
            
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get('errors', [{}])[0].get('detail', 'Server error')
                except:
                    error_message = response.text
                
                logger.error(f"Square API server error: {error_message}")
                logger.error(f"Error details: {response.text}")
                
                return {
                    "statusCode": response.status_code,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": f"Payment processing failed: {error_message}"
                    }, ensure_ascii=False),
                }
        
        except requests.RequestException as req_error:
            logger.error(f"Square API request error: {str(req_error)}")
            
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": f"Payment processing failed: {str(req_error)}"
                }, ensure_ascii=False),
            }
    
    except Exception as e:
        logger.error(f"Error during payment creation: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Payment processing failed: {str(e)}"
            }, ensure_ascii=False),
        }
