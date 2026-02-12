"""
DynamoDB utilities for Commerce table
"""

import boto3
import os

# DynamoDB resource
dynamodb = boto3.resource(
    'dynamodb',
    region_name='ap-northeast-1',
    endpoint_url=os.environ.get('DYNAMODB_ENDPOINT_URL', None)
)

# Table name
COMMERCE_TABLE_NAME = "Commerce-" + os.environ.get('STAGE', '')
USERS_TABLE_NAME = "User-" + os.environ.get('STAGE', '')
ADMIN_TABLE_NAME = "Admin-" + os.environ.get('STAGE', '')
NOTIFICATION_TABLE_NAME = "Notification-" + os.environ.get('STAGE', '')
CART_TABLE_NAME = "User-" + os.environ.get('STAGE', '')

def get_commerce_table():
    """Get Commerce table instance"""
    return dynamodb.Table(COMMERCE_TABLE_NAME)

def get_users_table():
    """Get Users table instance"""
    return dynamodb.Table(USERS_TABLE_NAME) 

def get_admin_table():
    """Get Admin table instance"""
    return dynamodb.Table(ADMIN_TABLE_NAME)

def get_notification_table():
    """Get Notification table instance"""
    return dynamodb.Table(NOTIFICATION_TABLE_NAME)

def get_cart_table():
    """Get Cart table instance"""
    return dynamodb.Table(CART_TABLE_NAME)

# PK/SK prefixes
PRODUCT_PK = 'PRODUCT'
CATEGORY_PK = 'CATEGORY'
COUPON_PK = 'COUPON'

def build_product_sk(product_id):
    """Build product SK"""
    return f'PRODUCT#{product_id}'

def build_category_sk(category_id):
    """Build category SK"""
    return f'CATEGORY#{category_id}'

def build_coupon_sk(coupon_id):
    """Build coupon SK"""
    return f'COUPON#{coupon_id}'
