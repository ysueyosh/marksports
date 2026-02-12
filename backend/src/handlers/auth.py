"""
Authentication handler
"""

import json
import logging
from datetime import datetime, timedelta
import bcrypt
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from src.auth import ACCESS_TOKEN_EXPIRE_SECONDS
from src.models.auth import (
    LoginRequest, LoginResponse, TokenRefreshRequest, TokenRefreshResponse,
    VerifyTokenRequest, VerifyTokenResponse, UpdateProfileRequest,
    UpdateProfileResponse, ChangePasswordRequest, ChangePasswordResponse
)
from src.utils.auth import require_auth_handler
from src.utils.jwt import (
    generate_access_token, generate_refresh_token, 
    verify_token as verify_jwt_token,
    hash_refresh_token, verify_refresh_token
)
from src.utils.dynamodb import get_users_table

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB (utilsで一元管理)

class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal type to JSON"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

def login(event, context):
    """
    Login handler
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Login event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        login_request = LoginRequest(**body)
        
        # Get user from database by email
        users_table = get_users_table()
        try:
            response = users_table.query(
                IndexName='GSI_MAIL',
                KeyConditionExpression='email = :email',
                ExpressionAttributeValues={':email': login_request.email}
            )
            
            if not response['Items']:
                return {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "メールアドレスまたはパスワードが正しくありません",
                    }, ensure_ascii=False),
                }
            
            user_item = response['Items'][0]
            user_id = user_item.get('userId')
            password_hash = user_item.get('passwordHash', '')
            
            # Verify password - password_hash should be a UTF-8 encoded hash stored as string
            try:
                if not bcrypt.checkpw(login_request.password.encode('utf-8'), password_hash.encode('utf-8')):
                    return {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": False,
                            "message": "メールアドレスまたはパスワードが正しくありません",
                        }, ensure_ascii=False),
                    }
            except ValueError as e:
                logger.error(f"Invalid password hash format: {str(e)}")
                return {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "メールアドレスまたはパスワードが正しくありません",
                    }, ensure_ascii=False),
                }
            
            # Check if email is verified
            if not user_item.get('verifiedAt'):
                return {
                    "statusCode": 403,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "メールアドレスの認証が必要です。メールをご確認ください。",
                        "requiresEmailVerification": True,
                    }, ensure_ascii=False),
                }
            
            # Check if user is active
            if user_item.get('status') != 'active':
                return {
                    "statusCode": 401,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "このアカウントは使用できません",
                    }, ensure_ascii=False),
                }
            
            # Generate JWT tokens
            access_token = generate_access_token(user_id, login_request.email, user_type="user")
            refresh_token_str = generate_refresh_token(user_id, login_request.email, user_type="user")
            
            # Hash and store refresh token in DB
            refresh_token_hash = hash_refresh_token(refresh_token_str)
            users_table.update_item(
                Key={
                    'PK': f'USER#{user_id}',
                    'SK': f'PROFILE#{user_id}'
                },
                UpdateExpression='SET refreshTokenHash = :hash, updatedAt = :updated',
                ExpressionAttributeValues={
                    ':hash': refresh_token_hash,
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            
            response_data = LoginResponse(
                success=True,
                message="ログインしました",
                data={
                    "userId": user_id,
                    "email": login_request.email,
                    "name": user_item.get('name', ''),
                    "phone": user_item.get('phone', ''),
                    "accessToken": access_token,
                    "refreshToken": refresh_token_str,
                    "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
                }
            )
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps(response_data.model_dump(), cls=DecimalEncoder, ensure_ascii=False),
            }
        
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            # If GSI query fails, return generic error
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "ログインに失敗しました",
                }, ensure_ascii=False),
            }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"入力エラー: {str(e)}"
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"ログインに失敗しました: {str(e)}"
            }, ensure_ascii=False),
        }



def refresh_token(event, context):
    """
    Token refresh handler - Verifies refresh token against DB hash and issues new tokens
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Token refresh event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        refresh_request = TokenRefreshRequest(**body)
        
        # Verify the refresh token JWT signature and expiration
        is_valid, payload, error_msg = verify_jwt_token(refresh_request.refresh_token)
        
        if not is_valid:
            logger.warning(f"Invalid refresh token: {error_msg}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired refresh token"
                }),
            }
        
        # Extract user info from payload
        user_id = payload.get("user_id")
        email = payload.get("email")
        user_type = payload.get("user_type", "user")
        
        # Get user details from database and verify refresh token hash
        table = get_users_table()
        user_response = table.query(
            IndexName='GSI_MAIL',
            KeyConditionExpression='email = :email',
            ExpressionAttributeValues={':email': email}
        )
        
        logger.info(f"User response query: {user_response}")
        user_data = user_response.get("Items", [{}])[0] if user_response.get("Items") else {}
        
        if not user_data:
            logger.warning(f"User not found for email: {email}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "User not found"
                }),
            }
        
        # Verify refresh token against stored hash in DB
        stored_refresh_token_hash = user_data.get("refreshTokenHash")
        if not stored_refresh_token_hash:
            logger.warning(f"No refresh token hash stored for user: {user_id}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "No valid refresh token found"
                }),
            }
        
        # Verify the refresh token matches the stored hash
        if not verify_refresh_token(refresh_request.refresh_token, stored_refresh_token_hash):
            logger.warning(f"Refresh token hash mismatch for user: {user_id}")
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid refresh token"
                }),
            }
        
        logger.info(f"User data retrieved: {user_data}")
        logger.info(f"User name from DB: {user_data.get('name', 'NOT FOUND')}")
        
        # Generate new access token and refresh token
        new_access_token = generate_access_token(user_id, email, user_type=user_type)
        new_refresh_token = generate_refresh_token(user_id, email, user_type=user_type)
        
        # Hash and store new refresh token in DB
        new_refresh_token_hash = hash_refresh_token(new_refresh_token)
        table.update_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PROFILE#{user_id}'
            },
            UpdateExpression='SET refreshTokenHash = :hash, updatedAt = :updated',
            ExpressionAttributeValues={
                ':hash': new_refresh_token_hash,
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        response = TokenRefreshResponse(
            success=True,
            message="Token refreshed successfully",
            data={
                "userId": user_id,
                "email": email,
                "name": user_data.get("name", ""),
                "phone": user_data.get("phone", ""),
                "accessToken": new_access_token,
                "refreshToken": new_refresh_token,
                "expiresIn": ACCESS_TOKEN_EXPIRE_SECONDS
            }
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Token refresh failed: {str(e)}"
            }),
        }


def verify_token(event, context):
    """
    Verify token handler - validates access token and returns user info
    If access token is expired, attempts to refresh it using refresh token
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Verify token event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        verify_request = VerifyTokenRequest(**body)
        refresh_token = body.get('refreshToken')  # リクエストボディから直接取得
        
        # Verify the access token
        is_valid, payload, error_msg = verify_jwt_token(verify_request.access_token)
        
        if not is_valid:
            logger.warning(f"Invalid access token: {error_msg}")
            
            # ⭐ トークン期限切れの場合、リフレッシュトークンで再発行を試みる
            if "expired" in error_msg.lower() and refresh_token:
                logger.info("Access token expired, attempting to refresh...")
                
                # リフレッシュトークンを検証
                refresh_is_valid, refresh_payload, refresh_error = verify_jwt_token(refresh_token)
                
                if refresh_is_valid:
                    user_id = refresh_payload.get("user_id")
                    email = refresh_payload.get("email")
                    user_type = refresh_payload.get("user_type", "user")
                    
                    # Get user details from database using PK/SK
                    table = get_users_table()
                    user_response = table.get_item(
                        Key={
                            'PK': f'USER#{user_id}',
                            'SK': f'PROFILE#{user_id}'
                        }
                    )
                    user_data = user_response.get("Item", {})
                    
                    if not user_data:
                        logger.warning(f"User not found: {user_id}")
                        return {
                            "statusCode": 401,
                            "headers": {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "*",
                            },
                            "body": json.dumps({
                                "success": False,
                                "message": "User not found"
                            }),
                        }
                    
                    # Verify refresh token against stored hash in DB
                    stored_refresh_token_hash = user_data.get("refreshTokenHash")
                    if not stored_refresh_token_hash:
                        logger.warning(f"No refresh token hash stored for user: {user_id}")
                        return {
                            "statusCode": 401,
                            "headers": {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "*",
                            },
                            "body": json.dumps({
                                "success": False,
                                "message": "No valid refresh token found"
                            }),
                        }
                    
                    # Verify the refresh token matches the stored hash
                    if not verify_refresh_token(refresh_token, stored_refresh_token_hash):
                        logger.warning(f"Refresh token hash mismatch for user: {user_id}")
                        return {
                            "statusCode": 401,
                            "headers": {
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Origin": "*",
                            },
                            "body": json.dumps({
                                "success": False,
                                "message": "Invalid refresh token"
                            }),
                        }
                    
                    # 新しいアクセストークンとリフレッシュトークンを生成
                    new_access_token = generate_access_token(user_id, email, user_type=user_type)
                    new_refresh_token = generate_refresh_token(user_id, email, user_type=user_type)
                    
                    # Hash and store new refresh token in DB
                    new_refresh_token_hash = hash_refresh_token(new_refresh_token)
                    table.update_item(
                        Key={
                            'PK': f'USER#{user_id}',
                            'SK': f'PROFILE#{user_id}'
                        },
                        UpdateExpression='SET refreshTokenHash = :hash, updatedAt = :updated',
                        ExpressionAttributeValues={
                            ':hash': new_refresh_token_hash,
                            ':updated': datetime.utcnow().isoformat()
                        }
                    )
                    
                    logger.info(f"New tokens generated for user: {user_id}")
                    
                    return {
                        "statusCode": 200,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": True,
                            "message": "Token refreshed successfully",
                            "data": {
                                "id": user_id,
                                "email": email,
                                "name": user_data.get("name", ""),
                                "phone": user_data.get("phone"),
                                "sex": user_data.get("sex"),
                                "address": user_data.get("address", ""),
                                "accessToken": new_access_token,
                                "refreshToken": new_refresh_token,
                                "expiresIn": 3600
                            }
                        }, ensure_ascii=False),
                    }
                else:
                    logger.warning(f"Refresh token also invalid: {refresh_error}")
                    return {
                        "statusCode": 401,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": False,
                            "message": "Session expired. Please log in again."
                        }),
                    }
            
            # リフレッシュトークンがない、または無効
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired access token"
                }),
            }
        
        # Extract user info from JWT payload
        user_id = payload.get("user_id")
        email = payload.get("email")
        
        # Fetch user details from DynamoDB using PK and SK for profile info
        # user_id はトークンから取得済みなのでGSIは不要
        table = get_users_table()
        user_response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'PROFILE#{user_id}'
            }
        )
        user_data = user_response.get("Item", {})
        
        # Fetch user profile details
        user_info = {
            "id": user_id,
            "email": email,
            "name": user_data.get("name", ""),
            "phone": user_data.get("phone"),
            "sex": user_data.get("sex"),
            "address": user_data.get("address", ""),
            "accessToken": verify_request.access_token,
            "refreshToken": refresh_token,
            "expiresIn": 3600
        }

        response = VerifyTokenResponse(
            success=True,
            message="Token verified successfully",
            data=user_info
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.model_dump()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during token verification: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Token verification failed: {str(e)}"
            }),
        }


@require_auth_handler
def update_profile(event, context):
    """
    Update user profile handler - Requires authentication
    
    Request body:
    {
        "name": "新しい名前",
        "email": "new@example.com",
        "phone": "09012345678",
        "sex": "male"
    }
    """
    try:
        logger.info(f"Update profile event: {event}")
        
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
                }),
            }
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Get DynamoDB table
        table = get_users_table()
        
        # Query current user profile using PK + PROFILE
        user_response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("PROFILE#"),
            Limit=1
        )
        
        if not user_response.get("Items"):
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "User not found"
                }),
            }
        
        user_item = user_response["Items"][0]
        user_pk = user_item.get("PK")
        user_sk = user_item.get("SK")
        
        # Build update expression
        update_expression = "SET #upd = :val"
        expression_values = {":val": int(datetime.utcnow().timestamp() * 1000)}
        expression_names = {"#upd": "updatedAt"}
        
        if "name" in body and body["name"]:
            update_expression += ", #name = :name"
            expression_names["#name"] = "name"
            expression_values[":name"] = body["name"]

        if "email" in body:
            email_value = (body.get("email") or "").strip()
            if not email_value:
                return {
                    "statusCode": 400,
                    "headers": {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    "body": json.dumps({
                        "success": False,
                        "message": "メールアドレスを入力してください"
                    }, ensure_ascii=False),
                }

            current_email = user_item.get("email", "")
            if email_value != current_email:
                # Check if email already exists
                try:
                    email_response = table.query(
                        IndexName='GSI_MAIL',
                        KeyConditionExpression='email = :email',
                        ExpressionAttributeValues={':email': email_value}
                    )
                    if email_response.get('Items'):
                        for item in email_response['Items']:
                            if item.get('userId') != user_id:
                                return {
                                    "statusCode": 400,
                                    "headers": {
                                        "Content-Type": "application/json",
                                        "Access-Control-Allow-Origin": "*",
                                    },
                                    "body": json.dumps({
                                        "success": False,
                                        "message": "このメールアドレスは既に登録されています"
                                    }, ensure_ascii=False),
                                }
                except Exception as e:
                    logger.warning(f"Could not check if email exists: {str(e)}")

            update_expression += ", #email = :email"
            expression_names["#email"] = "email"
            expression_values[":email"] = email_value
        
        if "phone" in body:
            update_expression += ", #phone = :phone"
            expression_names["#phone"] = "phone"
            expression_values[":phone"] = body.get("phone", "")
        
        if "sex" in body:
            update_expression += ", #sex = :sex"
            expression_names["#sex"] = "sex"
            expression_values[":sex"] = body.get("sex", "")
        
        # Update user profile
        update_response = table.update_item(
            Key={
                "PK": user_pk,
                "SK": user_sk
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )
        
        updated_item = update_response.get("Attributes", {})
        
        response = {
            "success": True,
            "message": "プロフィールを更新しました",
            "data": {
                "name": updated_item.get("name"),
                "email": updated_item.get("email"),
                "phone": updated_item.get("phone"),
                "sex": updated_item.get("sex")
            }
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
        logger.error(f"Error during profile update: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Profile update failed: {str(e)}"
            }, ensure_ascii=False),
        }


@require_auth_handler
def change_password(event, context):
    """
    Change password handler - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Change password event: {event}")
        
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
                }),
            }
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        change_request = ChangePasswordRequest(**body)
        
        # Validate passwords match
        if change_request.newPassword != change_request.confirmPassword:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "新しいパスワードと確認用パスワードが一致しません"
                }),
            }
        
        # Validate password length
        if len(change_request.newPassword) < 6:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "パスワードは6文字以上である必要があります"
                }),
            }
        
        logger.info("Password validation passed")
        
        # TODO: Verify current password in database
        # TODO: Update password in database
        # For now, just return success
        
        response = ChangePasswordResponse(
            success=True,
            message="パスワードを変更しました",
            data={}
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response.dict()),
        }
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Invalid input: {str(e)}"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error during password change: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Password change failed: {str(e)}"
            }),
        }


@require_auth_handler
def update_notification_settings(event, context):
    """
    Update notification settings - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Update notification settings event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        email_notifications = body.get("emailNotifications", True)
        
        # TODO: Update notification settings in database
        # For now, just return success
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "通知設定を更新しました",
                "data": {
                    "emailNotifications": email_notifications
                }
            }),
        }
    
    except Exception as e:
        logger.error(f"Error updating notification settings: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Notification settings update failed: {str(e)}"
            }),
        }


@require_auth_handler
def delete_account(event, context):
    """
    Delete account - Requires authentication
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Delete account event: {event}")
        
        # TODO: Delete account and all associated data from database
        # For now, just return success
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "アカウントを削除しました",
                "data": {}
            }),
        }
    
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Account deletion failed: {str(e)}"
            }),
        }


@require_auth_handler
def get_profile(event, context):
    """
    Get user profile - Requires authentication
    """
    try:
        logger.info(f"Get profile event: {event}")
        
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
                }),
            }
        
        # Get DynamoDB table
        table = get_users_table()
        
        # Query user profile item (PROFILE#) to avoid address items
        user_response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("PROFILE#"),
            Limit=1
        )
        
        if not user_response.get("Items"):
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "User not found"
                }),
            }
        
        user_data = user_response["Items"][0]
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Profile retrieved successfully",
                "data": {
                    "name": user_data.get("name", ""),
                    "email": user_data.get("email", ""),
                    "phone": user_data.get("phone", ""),
                    "sex": user_data.get("sex", "")
                }
            }, ensure_ascii=False),
        }
    
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to get profile: {str(e)}"
            }),
        }


def request_password_reset(event, context):
    """
    Request password reset by email
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Request password reset event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        email = body.get("email")
        
        if not email:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Email is required"
                }),
            }
        
        # TODO: Generate reset token and send email
        # For now, return success with a dummy token
        reset_token = f"reset_{email}_{int(datetime.now().timestamp())}"
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Password reset email sent successfully",
                "data": {
                    "token": reset_token  # For development only
                }
            }),
        }
    
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to request password reset: {str(e)}"
            }),
        }


def verify_reset_token(event, context):
    """
    Verify password reset token
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Verify reset token event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        token = body.get("token")
        
        if not token:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Token is required"
                }),
            }
        
        # TODO: Verify token from database
        # For now, accept any token starting with "reset_"
        if not token.startswith("reset_"):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Token is valid"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error verifying reset token: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to verify token: {str(e)}"
            }),
        }


def reset_password(event, context):
    """
    Reset password with valid token
    
    Args:
        event: Lambda event
        context: Lambda context
    
    Returns:
        API response
    """
    try:
        logger.info(f"Reset password event: {event}")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        token = body.get("token")
        new_password = body.get("newPassword")
        
        if not token or not new_password:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Token and new password are required"
                }),
            }
        
        # TODO: Verify token and update password in database
        # For now, accept any token starting with "reset_"
        if not token.startswith("reset_"):
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Invalid or expired token"
                }),
            }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": True,
                "message": "Password reset successfully"
            }),
        }
    
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to reset password: {str(e)}"
            }),
        }

