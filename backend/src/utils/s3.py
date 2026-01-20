"""
S3 utilities for image uploads
"""

import boto3
import os
from datetime import datetime, timedelta

# S3 client
s3_client = boto3.client('s3', region_name='ap-northeast-1')

# S3 bucket name
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'ecsite-images')

def get_s3_client():
    """Get S3 client instance"""
    return s3_client

def generate_presigned_url(product_id, image_name, expiration=3600):
    """
    Generate presigned URL for uploading image to S3
    
    Args:
        product_id: Product ID (folder name in S3)
        image_name: Image name (main or 0, 1, 2, ...)
        expiration: URL expiration time in seconds (default 1 hour)
    
    Returns:
        Presigned URL for PUT request
    """
    # Add .jpg extension if not already present
    if not image_name.endswith('.jpg'):
        image_name = f"{image_name}.jpg"
    
    key = f"products/{product_id}/{image_name}"
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET_NAME,
                'Key': key,
                'ContentType': 'image/jpeg'
            },
            ExpiresIn=expiration
        )
        return presigned_url
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return None

def get_s3_image_url(product_id, image_name):
    """
    Get public image URL via CloudFront
    
    Args:
        product_id: Product ID
        image_name: Image name
    
    Returns:
        CloudFront URL
    """
    cloudfront_domain = 'd23pzr22xoegue.cloudfront.net'
    return f"https://{cloudfront_domain}/products/{product_id}/{image_name}"

def delete_product_images(product_id):
    """
    Delete all images for a product
    
    Args:
        product_id: Product ID
    
    Returns:
        True if successful, False otherwise
    """
    try:
        prefix = f"products/{product_id}/"
        
        # List all objects with this prefix
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=prefix
        )
        
        if 'Contents' not in response:
            return True
        
        # Delete all objects
        for obj in response['Contents']:
            s3_client.delete_object(
                Bucket=S3_BUCKET_NAME,
                Key=obj['Key']
            )
        return True
    except Exception as e:
        print(f"Error deleting product images: {str(e)}")
        return False

def upload_image_to_s3(product_id, image_name, file_content, content_type='image/jpeg'):
    """
    Upload image to S3 from backend
    
    Args:
        product_id: Product ID
        image_name: Image name (main or 0, 1, 2, ...)
        file_content: File content (bytes)
        content_type: Content type (default image/jpeg)
    
    Returns:
        S3 URL if successful, None otherwise
    """
    # Add .jpg extension if not already present
    if not image_name.endswith('.jpg'):
        image_name = f"{image_name}.jpg"
    
    key = f"products/{product_id}/{image_name}"
    
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=key,
            Body=file_content,
            ContentType=content_type
        )
        
        return get_s3_image_url(product_id, image_name)
    except Exception as e:
        print(f"Error uploading image to S3: {str(e)}")
        return None
