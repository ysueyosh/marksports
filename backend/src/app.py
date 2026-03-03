"""
Ecsite Backend - Lambda Handler for AWS API Gateway HTTP API v2
"""

import json
import logging
import time
from src.handlers.auth import (
    login, refresh_token, verify_token, update_profile, change_password,
    update_notification_settings, delete_account, get_profile,
    request_password_reset, verify_reset_token, reset_password
)
from src.handlers.register import register
from src.handlers.verify_email import verify_email
from src.handlers.resend_verification_email import resend_verification_email
from src.handlers.cart import get_cart, add_to_cart, update_cart_item, delete_from_cart, clear_cart
from src.handlers.address import get_addresses, add_address, update_address, delete_address, set_main_address, search_address_handler
from src.handlers.category import get_categories
from src.handlers.payment import get_payment_methods, add_payment_method, delete_payment_method, set_default_payment_method, create_payment
from src.handlers.product import get_featured_products, get_product_detail, get_related_products, check_product_exists, check_products_exist
from src.handlers.search import search_products
from src.handlers.coupon import apply_coupon
from src.handlers.notification import get_notifications, get_notification_detail, get_notification_count
from src.handlers.page_view import record_page_view, get_page_view_stats
from src.handlers.order import (
    get_orders, get_order_detail, cancel_order, revoke_cancel_request, save_order,
    get_all_orders, update_order_status, get_admin_order_detail,
    get_dashboard_pending_orders, get_dashboard_payment_confirmation
)
from src.handlers.admin import admin_login, admin_refresh_token, admin_verify_token, create_admin, get_admin_settings, update_admin_settings, manual_refund
from src.handlers.admin_product import create_product, update_product, delete_product, get_all_products
from src.handlers.admin_category import create_category, get_all_categories, update_category, delete_category
from src.handlers.admin_coupon import create_coupon as create_coupon_admin, update_coupon as update_coupon_admin, delete_coupon as delete_coupon_admin, get_all_coupons
from src.handlers.admin_user import get_all_users, get_user, update_user, delete_user
from src.handlers.admin_notification import (
    get_all_notifications as get_all_notifications_admin,
    get_notification as get_notification_admin,
    create_notification as create_notification_admin,
    update_notification as update_notification_admin,
    delete_notification as delete_notification_admin
)
from src.handlers.admin_image import upload_image
from src.handlers.admin_shipping import get_admin_shipping_settings, update_admin_shipping_settings
from src.handlers.shipping import estimate_shipping, get_shipping_policy

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Main Lambda handler - routes all HTTP API Gateway requests
    
    HTTP API v2 event format:
    {
        "version": "2.0",
        "routeKey": "POST /login",
        "rawPath": "/login",
        "rawQueryString": "param=value",
        "headers": {...},
        "requestContext": {...},
        "body": "...",
        "isBase64Encoded": false
    }
    """
    start_time = time.time()
    
    try:
        # Extract request details
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        raw_path = event.get('rawPath', '/')
        request_id = event.get('requestContext', {}).get('requestId', 'unknown')
        
        # Structured logging for request start
        logger.info(json.dumps({
            "event": "api_request",
            "method": http_method,
            "path": raw_path,
            "request_id": request_id
        }))
        
        # Handle OPTIONS requests (CORS preflight)
        if http_method == 'OPTIONS':
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-UUID, X-User-Id",
                    "Access-Control-Max-Age": "86400",
                },
                "body": "",
            }
        
        # Route to appropriate handler
        route_key = f"{http_method} {raw_path}"
        handler = ROUTE_MAP.get(route_key)
        
        if not handler:
            # Try path parameter matching
            handler, path_params = match_path_parameters(http_method, raw_path)
            if handler and path_params:
                # Add path parameters to event
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters'].update(path_params)
        
        if handler:
            result = handler(event, context)
            # Ensure CORS headers are present in response
            if 'headers' not in result:
                result['headers'] = {}
            result['headers']['Access-Control-Allow-Origin'] = '*'
            
            # Log response with duration
            duration_ms = round((time.time() - start_time) * 1000, 2)
            status_code = result.get('statusCode', 200)
            logger.info(json.dumps({
                "event": "api_response",
                "method": http_method,
                "path": raw_path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "request_id": request_id
            }))
            
            return result
        else:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.warning(json.dumps({
                "event": "api_not_found",
                "method": http_method,
                "path": raw_path,
                "duration_ms": duration_ms,
                "request_id": request_id
            }))
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "error": "Not Found",
                    "message": f"No handler for {http_method} {raw_path}"
                }),
            }
    
    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.error(json.dumps({
            "event": "api_error",
            "method": http_method if 'http_method' in locals() else 'UNKNOWN',
            "path": raw_path if 'raw_path' in locals() else 'UNKNOWN',
            "error": str(e),
            "duration_ms": duration_ms,
            "request_id": request_id if 'request_id' in locals() else 'unknown'
        }), exc_info=True)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "Internal Server Error",
                "message": str(e)
            }),
        }


def match_path_parameters(method, path):
    """Match paths with parameters like /product/{id}
    
    Returns:
        tuple: (handler, path_params) or (None, None) if no match
    """
    import re
    
    # Define path patterns with method
    patterns = [
        # Product
        ('GET', r'^/product/([^/]+)$', get_product_detail, ['id']),
        ('GET', r'^/product/([^/]+)/exists$', check_product_exists, ['id']),
        
        # Address
        ('PUT', r'^/addresses/([^/]+)$', update_address, ['id']),
        ('DELETE', r'^/addresses/([^/]+)$', delete_address, ['id']),
        ('PUT', r'^/addresses/([^/]+)/default$', set_main_address, ['id']),
        
        # Payment
        ('DELETE', r'^/payment-methods/([^/]+)$', delete_payment_method, ['id']),
        ('PUT', r'^/payment-methods/([^/]+)/default$', set_default_payment_method, ['id']),
        
        # Orders
        ('GET', r'^/orders/([^/]+)$', get_order_detail, ['id']),
        ('POST', r'^/orders/([^/]+)/cancel$', cancel_order, ['id']),
        ('POST', r'^/orders/([^/]+)/cancel/revoke$', revoke_cancel_request, ['id']),
        
        # Cart
        ('PUT', r'^/cart/([^/]+)$', update_cart_item, ['product_id']),
        ('DELETE', r'^/cart/([^/]+)$', delete_from_cart, ['product_id']),
        
        # Notifications
        ('GET', r'^/notifications/([^/]+)$', get_notification_detail, ['notification_id']),
        
        # Admin Products
        ('PUT', r'^/admin/products/([^/]+)$', update_product, ['productId']),
        ('DELETE', r'^/admin/products/([^/]+)$', delete_product, ['productId']),
        
        # Admin Categories  
        ('PUT', r'^/admin/categories/([^/]+)$', update_category, ['categoryId']),
        ('DELETE', r'^/admin/categories/([^/]+)$', delete_category, ['categoryId']),
        
        # Admin Coupons
        ('PUT', r'^/admin/coupons/([^/]+)$', update_coupon_admin, ['couponId']),
        ('DELETE', r'^/admin/coupons/([^/]+)$', delete_coupon_admin, ['couponId']),
        
        # Admin Users
        ('GET', r'^/admin/users/([^/]+)$', get_user, ['user_id']),
        ('PUT', r'^/admin/users/([^/]+)$', update_user, ['user_id']),
        ('DELETE', r'^/admin/users/([^/]+)$', delete_user, ['user_id']),
        
        # Admin Notifications
        ('GET', r'^/admin/notifications/([^/]+)$', get_notification_admin, ['notification_id']),
        ('PUT', r'^/admin/notifications/([^/]+)$', update_notification_admin, ['notification_id']),
        ('DELETE', r'^/admin/notifications/([^/]+)$', delete_notification_admin, ['notification_id']),
        
        # Admin Orders
        ('GET', r'^/admin/orders/([^/]+)$', get_admin_order_detail, ['id']),
    ]
    
    for pattern_method, pattern_path, handler, param_names in patterns:
        if method == pattern_method:
            match = re.match(pattern_path, path)
            if match:
                # Extract path parameters
                path_params = {}
                for i, param_name in enumerate(param_names):
                    path_params[param_name] = match.group(i + 1)
                
                logger.info(f"Matched pattern: {pattern_method} {pattern_path} with params: {path_params}")
                return handler, path_params
    
    return None, None


# Route mapping (exact matches)
ROUTE_MAP = {
    # Health check
    "GET /health": lambda e, c: health_check(e, c),
    
    # Authentication
    "POST /login": login,
    "POST /register": register,
    "POST /verify-email-registration": verify_email,
    "POST /resend-verification-email": resend_verification_email,
    "POST /password-reset/request": request_password_reset,
    "POST /password-reset/verify": verify_reset_token,
    "POST /password-reset/reset": reset_password,
    "POST /refresh-token": refresh_token,
    "POST /verify-token": verify_token,
    
    # User Profile
    "GET /get-profile": get_profile,
    "POST /update-profile": update_profile,
    "POST /change-password": change_password,
    "POST /update-notification-settings": update_notification_settings,
    "POST /delete-account": delete_account,
    
    # Admin Authentication
    "POST /admin/login": admin_login,
    "POST /admin/refresh-token": admin_refresh_token,
    "POST /admin/verify-token": admin_verify_token,
    "POST /admin/create": create_admin,
    "GET /admin/settings": get_admin_settings,
    "PUT /admin/settings": update_admin_settings,
    "GET /admin/shipping-settings": get_admin_shipping_settings,
    "PUT /admin/shipping-settings": update_admin_shipping_settings,
    
    # Admin Products
    "GET /admin/products": get_all_products,
    "POST /admin/products": create_product,
    
    # Admin Categories
    "GET /admin/categories": get_all_categories,
    "POST /admin/categories": create_category,
    
    # Admin Coupons
    "GET /admin/coupons": get_all_coupons,
    "POST /admin/coupons": create_coupon_admin,
    
    # Admin Users
    "GET /admin/users": get_all_users,
    
    # Admin Notifications
    "GET /admin/notifications": get_all_notifications_admin,
    "POST /admin/notifications": create_notification_admin,
    
    # Admin Images
    "POST /admin/images/upload": upload_image,
    
    # Admin Orders
    "GET /admin/orders": get_all_orders,
    "POST /admin/orders/status": update_order_status,
    "POST /admin/orders/manual-refund": manual_refund,
    "GET /admin/dashboard/pending-orders": get_dashboard_pending_orders,
    "GET /admin/dashboard/payment-confirmation": get_dashboard_payment_confirmation,
    
    # Addresses
    "GET /addresses": get_addresses,
    "POST /addresses": add_address,
    "POST /search-address": search_address_handler,
    
    # Payment Methods
    "GET /payment-methods": get_payment_methods,
    "POST /payment-methods": add_payment_method,
    "POST /payments": create_payment,
    
    # Orders
    "GET /orders": get_orders,
    "POST /orders": save_order,
    
    # Cart
    "GET /cart": get_cart,
    "POST /cart": add_to_cart,
    "POST /cart/clear": clear_cart,
    
    # Products & Categories
    "GET /categories": get_categories,
    "GET /featured-products": get_featured_products,
    "GET /related-products": get_related_products,
    "POST /products/exists": check_products_exist,
    
    # Search
    "GET /search": search_products,
    
    # Coupon
    "POST /apply-coupon": apply_coupon,
    
    # Notifications
    "GET /notifications": get_notifications,
    "GET /notifications/count": get_notification_count,

    # Shipping
    "POST /shipping/estimate": estimate_shipping,
    "GET /shipping/policy": get_shipping_policy,
    
    # Page Views
    "POST /page-views": record_page_view,
    "GET /admin/page-views": get_page_view_stats,
}


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
        "version": "2.0",
        "routeKey": "POST /login",
        "rawPath": "/login",
        "requestContext": {
            "http": {
                "method": "POST"
            }
        },
        "body": json.dumps({
            "email": "test@example.com",
            "password": "password123"
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
