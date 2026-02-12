"""
Local Flask app for testing
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set environment variables for local testing
os.environ['ADMIN_TABLE_NAME'] = 'Admin'
os.environ['COMMERCE_TABLE_NAME'] = 'Commerce'
os.environ['USERS_TABLE_NAME'] = 'User'
os.environ['CART_TABLE_NAME'] = 'User'
os.environ['FRONTEND_URL'] = 'http://localhost:3000'

from flask import Flask, request, jsonify
from flask_cors import CORS
from src.handlers.auth import login, refresh_token, verify_token, update_profile, change_password, update_notification_settings, delete_account, get_profile, request_password_reset, verify_reset_token, reset_password
from src.handlers.register import register
from src.handlers.verify_email import verify_email
from src.handlers.resend_verification_email import resend_verification_email
from src.handlers.cart import get_cart, add_to_cart, update_cart_item, delete_from_cart, clear_cart
from src.handlers.address import get_addresses, add_address, update_address, delete_address, set_main_address
from src.handlers.category import get_categories
from src.handlers.payment import get_payment_methods, add_payment_method, delete_payment_method, set_default_payment_method, create_payment
from src.handlers.product import get_featured_products, get_product_detail, get_related_products, check_product_exists, check_products_exist
from src.handlers.search import search_products
from src.handlers.coupon import apply_coupon
from src.handlers.notification import get_notifications, get_notification_detail, get_notification_count
from src.handlers.order import get_orders, get_order_detail, cancel_order, revoke_cancel_request, save_order, get_all_orders, update_order_status, get_admin_order_detail, get_dashboard_pending_orders, get_dashboard_payment_confirmation
from src.handlers.admin import admin_login, admin_refresh_token, admin_verify_token, create_admin, get_admin_settings, update_admin_settings, manual_refund
from src.handlers.admin_product import create_product, update_product, delete_product, get_all_products
from src.handlers.admin_category import admin_create_category_route, admin_get_all_categories_route, admin_update_category_route, admin_delete_category_route
from src.handlers.admin_coupon import create_coupon, update_coupon, delete_coupon, get_all_coupons
from src.handlers.admin_user import get_all_users, get_user, update_user, delete_user
from src.handlers.admin_notification import get_all_notifications, get_notification, create_notification, update_notification, delete_notification
import json

app = Flask(__name__)

# Configure CORS
cors_config = {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-User-UUID", "X-User-Id"],
    "max_age": 3600
}
CORS(app, resources={r"/*": cors_config})


@app.route('/login', methods=['POST'])
def login_route():
    """Login endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = login(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/refresh-token', methods=['POST'])
def refresh_token_route():
    """Refresh token endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = refresh_token(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/verify-token', methods=['POST'])
def verify_token_route():
    """Verify token endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = verify_token(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# Admin Authentication Endpoints
@app.route('/admin/login', methods=['POST'])
def admin_login_route():
    """Admin login endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = admin_login(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/refresh-token', methods=['POST'])
def admin_refresh_token_route():
    """Admin refresh token endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = admin_refresh_token(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/verify-token', methods=['POST'])
def admin_verify_token_route():
    """Admin verify token endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = admin_verify_token(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/create', methods=['POST'])
def create_admin_route():
    """Create admin endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = create_admin(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/settings', methods=['GET'])
def get_admin_settings_route():
    """Get admin settings endpoint"""
    # Lambda event形式に変換
    event = {
        'headers': dict(request.headers)
    }
    result = get_admin_settings(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/settings', methods=['PUT'])
def update_admin_settings_route():
    """Update admin settings endpoint"""
    # Lambda event形式に変換
    event = {
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = update_admin_settings(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# Admin Product Management Endpoints
@app.route('/admin/products', methods=['POST'])
def admin_create_product_route():
    """Create product endpoint (admin only)"""
    # Lambda event形式に変換
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = create_product(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/products', methods=['GET'])
def admin_get_all_products_route():
    """Get all products endpoint (admin only)"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict()
    }
    result = get_all_products(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/products/<product_id>', methods=['PUT'])
def admin_update_product_route(product_id):
    """Update product endpoint (admin only)"""
    event = {
        'pathParameters': {'productId': product_id},
        'body': request.data.decode(),
        'headers': dict(request.headers)
    }
    result = update_product(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/products/<product_id>', methods=['DELETE'])
def admin_delete_product_route(product_id):
    """Delete product endpoint (admin only)"""
    event = {
        'pathParameters': {'productId': product_id},
        'headers': dict(request.headers)
    }
    result = delete_product(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# Admin Category Management Endpoints
@app.route('/admin/categories', methods=['POST'])
def admin_create_category_route_wrapper():
    """Create category endpoint (admin only)"""
    return admin_create_category_route()


@app.route('/admin/categories', methods=['GET'])
def admin_get_all_categories_route_wrapper():
    """Get all categories endpoint (admin only)"""
    return admin_get_all_categories_route()


@app.route('/admin/categories/<category_id>', methods=['PUT'])
def admin_update_category_route_wrapper(category_id):
    """Update category endpoint (admin only)"""
    return admin_update_category_route(category_id)


@app.route('/admin/categories/<category_id>', methods=['DELETE'])
def admin_delete_category_route_wrapper(category_id):
    """Delete category endpoint (admin only)"""
    return admin_delete_category_route(category_id)


@app.route('/admin/coupons', methods=['POST'])
def create_coupon_route():
    """Create coupon endpoint (admin only)"""
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = create_coupon(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/coupons', methods=['GET'])
def get_all_coupons_route():
    """Get all coupons endpoint (admin only)"""
    event = {
        'queryStringParameters': dict(request.args),
        'headers': dict(request.headers)
    }
    result = get_all_coupons(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/coupons/<coupon_id>', methods=['PUT'])
def update_coupon_route(coupon_id):
    """Update coupon endpoint (admin only)"""
    event = {
        'pathParameters': {'couponId': coupon_id},
        'body': request.data.decode(),
        'headers': dict(request.headers)
    }
    result = update_coupon(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/coupons/<coupon_id>', methods=['DELETE'])
def delete_coupon_route(coupon_id):
    """Delete coupon endpoint (admin only)"""
    event = {
        'pathParameters': {'couponId': coupon_id},
        'headers': dict(request.headers)
    }
    result = delete_coupon(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# ===== Admin User Management Routes =====

@app.route('/admin/users', methods=['GET'])
def get_all_users_route():
    """Get all users endpoint (admin only)"""
    event = {
        'queryStringParameters': request.args.to_dict() or {},
        'headers': dict(request.headers)
    }
    result = get_all_users(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/users/<user_id>', methods=['GET'])
def get_user_route(user_id):
    """Get user by ID endpoint (admin only)"""
    event = {
        'pathParameters': {'user_id': user_id},
        'headers': dict(request.headers)
    }
    result = get_user(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/users/<user_id>', methods=['PUT'])
def update_user_route(user_id):
    """Update user endpoint (admin only)"""
    event = {
        'body': request.data.decode(),
        'pathParameters': {'user_id': user_id},
        'headers': dict(request.headers)
    }
    result = update_user(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/users/<user_id>', methods=['DELETE'])
def delete_user_route(user_id):
    """Delete user endpoint (admin only)"""
    event = {
        'pathParameters': {'user_id': user_id},
        'headers': dict(request.headers)
    }
    result = delete_user(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# Admin Notification Routes
@app.route('/admin/notifications', methods=['GET'])
def get_all_notifications_route():
    """Get all notifications endpoint (admin only)"""
    event = {
        'queryStringParameters': request.args.to_dict(),
        'headers': dict(request.headers)
    }
    result = get_all_notifications(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/notifications/<notification_id>', methods=['GET'])
def get_notification_route(notification_id):
    """Get notification endpoint (admin only)"""
    event = {
        'pathParameters': {'notification_id': notification_id},
        'headers': dict(request.headers)
    }
    result = get_notification(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/notifications', methods=['POST'])
def create_notification_route():
    """Create notification endpoint (admin only)"""
    event = {
        'body': request.get_data(as_text=True),
        'headers': dict(request.headers)
    }
    result = create_notification(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/notifications/<notification_id>', methods=['PUT'])
def update_notification_route(notification_id):
    """Update notification endpoint (admin only)"""
    event = {
        'pathParameters': {'notification_id': notification_id},
        'body': request.get_data(as_text=True),
        'headers': dict(request.headers)
    }
    result = update_notification(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/notifications/<notification_id>', methods=['DELETE'])
def delete_notification_route(notification_id):
    """Delete notification endpoint (admin only)"""
    event = {
        'pathParameters': {'notification_id': notification_id},
        'headers': dict(request.headers)
    }
    result = delete_notification(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/admin/images/upload', methods=['POST'])
def upload_image_route():
    """Upload image to S3 (admin only)"""
    try:
        from src.handlers.admin_image import verify_admin_token
        from src.utils.s3 import upload_image_to_s3
        
        # Verify admin token
        admin_info = verify_admin_token(dict(request.headers))
        if not admin_info:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        # Get form data
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        product_id = request.form.get('productId')
        image_name = request.form.get('imageName')
        
        if not product_id or not image_name:
            return jsonify({'success': False, 'error': 'productId and imageName are required'}), 400
        
        # Read file content
        file_content = file.read()
        
        # Upload to S3
        s3_url = upload_image_to_s3(product_id, image_name, file_content)
        
        if not s3_url:
            return jsonify({'success': False, 'error': 'Failed to upload image'}), 500
        
        return jsonify({
            'success': True,
            'data': {
                's3Url': s3_url
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/register', methods=['POST'])
def register_route():
    """Register endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = register(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/verify-email-registration', methods=['POST'])
def verify_email_route():
    """Verify email endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = verify_email(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/resend-verification-email', methods=['POST'])
def resend_verification_email_route():
    """Resend verification email endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = resend_verification_email(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/update-profile', methods=['POST'])
def update_profile_route():
    """Update profile endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = update_profile(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/change-password', methods=['POST'])
def change_password_route():
    """Change password endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = change_password(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/update-notification-settings', methods=['POST'])
def update_notification_settings_route():
    """Update notification settings endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = update_notification_settings(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/delete-account', methods=['POST'])
def delete_account_route():
    """Delete account endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = delete_account(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/get-profile', methods=['GET'])
def get_profile_route():
    """Get user profile endpoint"""
    event = {'headers': dict(request.headers)}
    result = get_profile(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/notifications', methods=['GET'])
def get_notifications_route():
    """Get notifications endpoint"""
    result = get_notifications(None, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/notifications/count', methods=['GET'])
def get_notification_count_route():
    """Get notification count endpoint"""
    result = get_notification_count(None, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/notifications/<notification_id>', methods=['GET'])
def get_notification_detail_route(notification_id):
    """Get notification detail endpoint"""
    event = {
        'pathParameters': {'notification_id': notification_id}
    }
    result = get_notification_detail(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/password-reset/request', methods=['POST'])
def request_password_reset_route():
    """Request password reset endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = request_password_reset(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/password-reset/verify', methods=['POST'])
def verify_reset_token_route():
    """Verify password reset token endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = verify_reset_token(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/password-reset/reset', methods=['POST'])
def reset_password_route():
    """Reset password endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = reset_password(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/addresses', methods=['GET'])
def get_addresses_route():
    """Get addresses endpoint"""
    event = {'headers': dict(request.headers)}
    result = get_addresses(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/addresses', methods=['POST'])
def add_address_route():
    """Add new address endpoint"""
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = add_address(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/addresses/<address_id>', methods=['PUT'])
def update_address_route(address_id):
    """Update address endpoint"""
    event = {
        'pathParameters': {'id': address_id},
        'body': request.data.decode(),
        'headers': dict(request.headers)
    }
    result = update_address(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/addresses/<address_id>', methods=['DELETE'])
def delete_address_route(address_id):
    """Delete address endpoint"""
    event = {'pathParameters': {'id': address_id}, 'headers': dict(request.headers)}
    result = delete_address(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/addresses/<address_id>/default', methods=['PUT'])
def set_main_address_route(address_id):
    """Set address as main endpoint"""
    event = {'pathParameters': {'id': address_id}, 'headers': dict(request.headers)}
    result = set_main_address(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods', methods=['GET'])
def get_saved_cards_route():
    """Get saved cards endpoint"""
    event = {'headers': dict(request.headers)}
    result = get_payment_methods(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods', methods=['POST'])
def add_card_route():
    """Add new card endpoint"""
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = add_payment_method(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods/<card_id>', methods=['DELETE'])
def delete_card_route(card_id):
    """Delete card endpoint"""
    event = {'pathParameters': {'id': card_id}, 'headers': dict(request.headers)}
    result = delete_payment_method(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods/<card_id>/default', methods=['PUT'])
def set_default_card_route(card_id):
    """Set card as default endpoint"""
    event = {'pathParameters': {'id': card_id}, 'headers': dict(request.headers)}
    result = set_default_payment_method(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payments', methods=['POST'])
def create_payment_route():
    """Create payment endpoint"""
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = create_payment(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


# ================== CART ENDPOINTS ==================

@app.route('/cart', methods=['GET'])
def get_cart_route():
    """Get cart items endpoint"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict(),
    }
    result = get_cart(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/cart', methods=['POST'])
def add_to_cart_route():
    """Add item to cart endpoint"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict(),
        'body': request.data.decode(),
    }
    result = add_to_cart(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/cart/<product_id>', methods=['PUT'])
def update_cart_item_route(product_id):
    """Update cart item quantity endpoint"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict(),
        'pathParameters': {'product_id': product_id},
        'body': request.data.decode(),
    }
    result = update_cart_item(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/cart/<product_id>', methods=['DELETE'])
def delete_from_cart_route(product_id):
    """Delete item from cart endpoint"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict(),
        'pathParameters': {'product_id': product_id},
    }
    result = delete_from_cart(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/cart/clear', methods=['POST'])
def clear_cart_route():
    """Clear cart endpoint (after successful payment)"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': request.args.to_dict(),
    }
    result = clear_cart(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/categories', methods=['GET'])
def categories_route():
    """Get categories endpoint"""
    result = get_categories(None, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/featured-products', methods=['GET'])
def featured_products_route():
    """Get featured products endpoint"""
    result = get_featured_products(None, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/product/<product_id>', methods=['GET'])
def product_detail_route(product_id):
    """Get product detail endpoint"""
    event = {'pathParameters': {'id': product_id}}
    result = get_product_detail(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/product/<product_id>/exists', methods=['GET'])
def product_exists_route(product_id):
    """Check if product exists endpoint"""
    event = {'pathParameters': {'id': product_id}}
    result = check_product_exists(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/products/exists', methods=['POST'])
def products_exist_route():
    """Check if multiple products exist endpoint"""
    event = {'body': request.data.decode()}
    result = check_products_exist(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/search', methods=['GET'])
def search_route():
    """Search products endpoint"""
    # Convert query parameters to Lambda event format
    query_params = request.args.to_dict(flat=False)
    # Flatten single-value parameters, keep multi-value parameters
    query_string_params = {}
    for key, values in query_params.items():
        if len(values) == 1:
            query_string_params[key] = values[0]
        else:
            query_string_params[key] = values
    
    event = {'queryStringParameters': query_string_params}
    result = search_products(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/related-products', methods=['GET'])
def related_products_route():
    """Get related products endpoint"""
    query_params = request.args.to_dict()
    event = {'queryStringParameters': query_params}
    result = get_related_products(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/apply-coupon', methods=['POST'])
def apply_coupon_route():
    """Apply coupon code endpoint"""
    event = {'body': request.data.decode()}
    result = apply_coupon(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/orders', methods=['GET'])
def get_orders_route():
    """Get orders list endpoint - Requires authentication"""
    event = {'headers': dict(request.headers)}
    result = get_orders(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/orders', methods=['POST'])
def save_order_route():
    """Save order endpoint - Requires authentication"""
    event = {
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = save_order(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/orders/<order_id>', methods=['GET'])
def get_order_detail_route(order_id):
    """Get order detail endpoint - Requires authentication"""
    event = {'pathParameters': {'id': order_id}, 'headers': dict(request.headers)}
    result = get_order_detail(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/orders/<order_id>/cancel', methods=['POST'])
def cancel_order_route(order_id):
    """Cancel order endpoint - Requires authentication"""
    event = {
        'pathParameters': {'id': order_id},
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = cancel_order(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/orders/<order_id>/cancel/revoke', methods=['POST'])
def revoke_cancel_request_route(order_id):
    """Revoke cancel request endpoint - Requires authentication"""
    event = {
        'pathParameters': {'id': order_id},
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = revoke_cancel_request(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/orders', methods=['GET'])
def get_all_orders_route():
    """Get all orders for admin - Requires authentication"""
    event = {
        'headers': dict(request.headers),
        'queryStringParameters': dict(request.args)
    }
    result = get_all_orders(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/orders/<id>', methods=['GET'])
def get_admin_order_detail_route(id):
    """Get admin order detail - Requires authentication"""
    event = {
        'headers': dict(request.headers),
        'pathParameters': {'id': id}
    }
    result = get_admin_order_detail(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/orders/status', methods=['POST'])
def update_order_status_route():
    """Update order status - Requires authentication"""
    event = {
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = update_order_status(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/orders/manual-refund', methods=['POST'])
def manual_refund_route():
    """Manual refund for bank transfer orders - Requires admin authentication"""
    event = {
        'headers': dict(request.headers),
        'body': request.data.decode()
    }
    result = manual_refund(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/dashboard/pending-orders', methods=['GET'])
def get_dashboard_pending_orders_route():
    """Get dashboard pending orders - Requires admin authentication"""
    event = {
        'headers': dict(request.headers)
    }
    result = get_dashboard_pending_orders(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/admin/dashboard/payment-confirmation', methods=['GET'])
def get_dashboard_payment_confirmation_route():
    """Get dashboard payment confirmation - Requires admin authentication"""
    event = {
        'headers': dict(request.headers)
    }
    result = get_dashboard_payment_confirmation(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']

@app.route('/search-address', methods=['POST'])
def search_address_route():
    """Search address by postal code endpoint"""
    from src.handlers.address import search_address_handler
    event = {'body': request.data.decode()}
    result = search_address_handler(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Ecsite Backend is running'}), 200


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("🚀  ECSITE BACKEND - LOCAL DEVELOPMENT SERVER")
    print("=" * 80)
    print("\n📋 API ENDPOINTS:\n")
    
    # Auth endpoints
    print("  🔐 AUTH")
    print("    POST   /login")
    print("    POST   /register")
    print("    POST   /refresh-token")
    print("    POST   /verify-token")
    print("    POST   /password-reset/request")
    print("    POST   /password-reset/verify")
    print("    POST   /password-reset/reset")
    
    # Admin Authentication endpoints
    print("\n  🛡️  ADMIN AUTH")
    print("    POST   /admin/login")
    print("    POST   /admin/refresh-token")
    print("    POST   /admin/verify-token")
    print("    POST   /admin/create")
    
    # Profile endpoints
    print("\n  👤 PROFILE")
    print("    GET    /get-profile")
    print("    POST   /update-profile")
    print("    POST   /change-password")
    print("    POST   /update-notification-settings")
    print("    POST   /delete-account")
    
    # Address endpoints
    print("\n  📍 ADDRESS")
    print("    GET    /addresses")
    print("    POST   /addresses")
    print("    PUT    /addresses/<address_id>")
    print("    DELETE /addresses/<address_id>")
    print("    PUT    /addresses/<address_id>/default")
    print("    POST   /search-address")
    
    # Cart endpoints
    print("\n  🛒 CART")
    print("    GET    /cart?userUuid=<uuid> (or with Authorization header)")
    print("    POST   /cart (body: {productId, quantity})")
    print("    PUT    /cart/<product_id> (body: {quantity})")
    print("    DELETE /cart/<product_id>")
    print("    POST   /cart/clear")
    
    # Payment endpoints
    print("\n  💳 PAYMENT")
    print("    GET    /payment-methods")
    print("    POST   /payment-methods")
    print("    DELETE /payment-methods/<card_id>")
    print("    PUT    /payment-methods/<card_id>/default")
    print("    POST   /payments")

    
    # Category endpoints
    print("\n  🏷️  CATEGORIES")
    print("    GET    /categories")
    
    # Product endpoints
    print("\n  📦 PRODUCTS")
    print("    GET    /featured-products")
    print("    GET    /product/<product_id>")
    print("    GET    /product/<product_id>/exists")
    print("    POST   /products/exists")
    print("    GET    /related-products?productId=<id>&limit=<limit>")
    
    # Search endpoint
    print("\n  🔍 SEARCH")
    print("    GET    /search?keyword=<keyword>&categories=<categories>&priceRange=<range>&sort=<sort>")
    
    # Coupon endpoint
    print("\n  🎟️  COUPON")
    print("    POST   /apply-coupon")
    
    # Admin coupon endpoints
    print("\n  🎟️  ADMIN COUPON MANAGEMENT")
    print("    POST   /admin/coupons")
    print("    GET    /admin/coupons?page=<page>&limit=<limit>")
    print("    PUT    /admin/coupons/<coupon_id>")
    print("    DELETE /admin/coupons/<coupon_id>")
    
    # Admin user endpoints
    print("\n  👥 ADMIN USER MANAGEMENT")
    print("    GET    /admin/users?page=<page>&limit=<limit>")
    print("    GET    /admin/users/<user_id>")
    print("    PUT    /admin/users/<user_id>")
    print("    DELETE /admin/users/<user_id>")
    
    # Notification endpoints
    print("\n  🔔 NOTIFICATIONS")
    print("    GET    /notifications")
    print("    GET    /notifications/count?readIds=<json_array>")
    
    # Order endpoints
    print("\n  📦 ORDERS")
    print("    GET    /orders")
    print("    GET    /orders/<order_id>")
    print("    POST   /orders/<order_id>/cancel")
    
    # Health check
    print("\n  ❤️  HEALTH")
    print("    GET    /health")
    
    print("\n" + "=" * 80)
    print(f"🌐 Server started at http://localhost:5000")
    print("=" * 80 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
