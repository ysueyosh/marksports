"""
Admin image upload handler - Backend uploads to S3
"""

import json
import base64
import logging
from email.parser import BytesParser
from email.policy import default

from src.utils.auth import require_admin_auth
from src.utils.s3 import upload_image_to_s3

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _parse_multipart(event):
    """Parse multipart/form-data from API Gateway HTTP API event."""
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    content_type = headers.get("content-type")
    if not content_type or "boundary=" not in content_type:
        raise ValueError("Missing Content-Type boundary")

    body = event.get("body", "") or ""
    body_bytes = base64.b64decode(body) if event.get("isBase64Encoded") else body.encode("utf-8")

    raw_message = b"Content-Type: " + content_type.encode() + b"\r\n\r\n" + body_bytes
    message = BytesParser(policy=default).parsebytes(raw_message)

    file_content = None
    file_content_type = None
    filename = None
    fields = {}

    for part in message.iter_parts():
        if part.get_content_disposition() != "form-data":
            continue
        name = part.get_param("name", header="content-disposition")
        current_filename = part.get_filename()
        if current_filename:
            file_content = part.get_payload(decode=True)
            file_content_type = part.get_content_type() or "application/octet-stream"
            filename = current_filename
        else:
            fields[name] = part.get_content()

    if file_content is None:
        raise ValueError("File is required")

    return fields, file_content, file_content_type, filename


@require_admin_auth
def upload_image(event, context):
    """Upload image to S3. Expects multipart/form-data with file, productId, imageName."""
    try:
        fields, file_content, content_type, filename = _parse_multipart(event)
        product_id = fields.get("productId")
        image_name = fields.get("imageName") or filename

        if not product_id or not image_name:
            return {
                "statusCode": 400,
                "body": json.dumps({"success": False, "error": "productId and imageName are required"})
            }

        s3_url = upload_image_to_s3(product_id, image_name, file_content, content_type)
        if not s3_url:
            return {
                "statusCode": 500,
                "body": json.dumps({"success": False, "error": "Failed to upload image"})
            }

        return {
            "statusCode": 200,
            "body": json.dumps({"success": True, "data": {"s3Url": s3_url}})
        }

    except ValueError as e:
        logger.error(f"Validation error during image upload: {str(e)}")
        return {
            "statusCode": 400,
            "body": json.dumps({"success": False, "error": str(e)})
        }
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "error": f"Failed to upload image: {str(e)}"})
        }
