"""
Models for products
"""

from pydantic import BaseModel


class Product(BaseModel):
    """Product model"""
    id: int
    name: str
    price: float
    image: str
    description: str
    category_id: str
    category_name: str


class ProductsResponse(BaseModel):
    """Products response model"""
    success: bool
    message: str
    data: dict = None  # {category_id: [products]}
