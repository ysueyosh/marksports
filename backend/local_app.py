"""
Local Flask app for testing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from src.handlers.auth import login, refresh_token, verify_token, update_profile, change_password, update_notification_settings, delete_account, get_profile, request_password_reset, verify_reset_token, reset_password
from src.handlers.register import register
from src.handlers.address import get_addresses, add_address, update_address, delete_address, set_default_address
from src.handlers.category import get_categories
from src.handlers.payment import get_saved_cards, add_card, delete_card, set_default_card
from src.handlers.product import get_featured_products, get_product_detail, get_related_products, check_product_exists, check_products_exist
from src.handlers.search import search_products
from src.handlers.coupon import apply_coupon
from src.handlers.notification import get_notifications, get_notification_count
from src.handlers.order import get_orders, get_order_detail, cancel_order
import json

app = Flask(__name__)
CORS(app)


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


@app.route('/register', methods=['POST'])
def register_route():
    """Register endpoint"""
    # Lambda event形式に変換
    event = {'body': request.data.decode()}
    result = register(event, None)
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
def set_default_address_route(address_id):
    """Set address as default endpoint"""
    event = {'pathParameters': {'id': address_id}, 'headers': dict(request.headers)}
    result = set_default_address(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods', methods=['GET'])
def get_saved_cards_route():
    """Get saved cards endpoint"""
    event = {'headers': dict(request.headers)}
    result = get_saved_cards(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods', methods=['POST'])
def add_card_route():
    """Add new card endpoint"""
    event = {'body': request.data.decode(), 'headers': dict(request.headers)}
    result = add_card(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods/<card_id>', methods=['DELETE'])
def delete_card_route(card_id):
    """Delete card endpoint"""
    event = {'pathParameters': {'id': card_id}, 'headers': dict(request.headers)}
    result = delete_card(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/payment-methods/<card_id>/default', methods=['PUT'])
def set_default_card_route(card_id):
    """Set card as default endpoint"""
    event = {'pathParameters': {'id': card_id}, 'headers': dict(request.headers)}
    result = set_default_card(event, None)
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


@app.route('/product/<int:product_id>', methods=['GET'])
def product_detail_route(product_id):
    """Get product detail endpoint"""
    event = {'pathParameters': {'id': str(product_id)}}
    result = get_product_detail(event, None)
    body = json.loads(result['body'])
    return jsonify(body), result['statusCode']


@app.route('/product/<int:product_id>/exists', methods=['GET'])
def product_exists_route(product_id):
    """Check if product exists endpoint"""
    event = {'pathParameters': {'id': str(product_id)}}
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

@app.route('/search-address', methods=['POST'])
def search_address_route():
    """Search address by postal code endpoint"""
    from src.handlers.address import handler as search_address_handler
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
    
    # Payment endpoints
    print("\n  💳 PAYMENT")
    print("    GET    /payment-methods")
    print("    POST   /payment-methods")
    print("    DELETE /payment-methods/<card_id>")
    print("    PUT    /payment-methods/<card_id>/default")
    
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
