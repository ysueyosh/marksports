"""
Models for address management
"""

from pydantic import BaseModel
from typing import List, Optional


class AddressItem(BaseModel):
    """Address item model"""
    id: str
    postalCode: str
    prefecture: str
    address: str
    building: Optional[str] = None
    isDefault: bool = False


class GetAddressesResponse(BaseModel):
    """Get addresses response model"""
    success: bool
    message: str
    data: List[AddressItem] = None


class AddAddressRequest(BaseModel):
    """Add address request model"""
    postalCode: str
    prefecture: str
    address: str
    building: Optional[str] = None


class AddAddressResponse(BaseModel):
    """Add address response model"""
    success: bool
    message: str
    data: AddressItem = None


class UpdateAddressRequest(BaseModel):
    """Update address request model"""
    id: str
    postalCode: str
    prefecture: str
    address: str
    building: Optional[str] = None


class UpdateAddressResponse(BaseModel):
    """Update address response model"""
    success: bool
    message: str
    data: AddressItem = None


class DeleteAddressRequest(BaseModel):
    """Delete address request model"""
    id: str


class DeleteAddressResponse(BaseModel):
    """Delete address response model"""
    success: bool
    message: str
    data: dict = None


class SetDefaultAddressRequest(BaseModel):
    """Set default address request model"""
    id: str


class SetDefaultAddressResponse(BaseModel):
    """Set default address response model"""
    success: bool
    message: str
    data: dict = None
