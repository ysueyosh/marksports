"""
Models for categories
"""

from pydantic import BaseModel


class Subcategory(BaseModel):
    """Subcategory model"""
    id: str
    name: str


class Category(BaseModel):
    """Category model"""
    id: str
    name: str
    subcategories: list[Subcategory]


class CategoriesResponse(BaseModel):
    """Categories response model"""
    success: bool
    message: str
    data: list[Category] = None
