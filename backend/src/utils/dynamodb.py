"""
DynamoDB utilities for Commerce table
"""

import boto3
import os

# DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')

# Table name
COMMERCE_TABLE_NAME = os.environ.get('COMMERCE_TABLE_NAME', 'Commerce')
USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME', 'User')
ADMIN_TABLE_NAME = os.environ.get('ADMIN_TABLE_NAME', 'Admin')

def get_commerce_table():
    """Get Commerce table instance"""
    return dynamodb.Table(COMMERCE_TABLE_NAME)

def get_users_table():
    """Get Users table instance"""
    return dynamodb.Table(USERS_TABLE_NAME)

def get_admin_table():
    """Get Admin table instance"""
    return dynamodb.Table(ADMIN_TABLE_NAME)

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
