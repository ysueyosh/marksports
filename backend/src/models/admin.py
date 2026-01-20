"""
Models for admin authentication
"""

from pydantic import BaseModel, EmailStr


class AdminLoginRequest(BaseModel):
    """Admin login request model"""
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    """Admin login response model"""
    success: bool
    message: str
    data: dict = None


class AdminRefreshTokenRequest(BaseModel):
    """Admin token refresh request model"""
    refresh_token: str


class AdminRefreshTokenResponse(BaseModel):
    """Admin token refresh response model"""
    success: bool
    message: str
    data: dict = None


class AdminVerifyTokenRequest(BaseModel):
    """Verify admin token request model"""
    access_token: str


class AdminVerifyTokenResponse(BaseModel):
    """Verify admin token response model"""
    success: bool
    message: str
    data: dict = None


class CreateAdminRequest(BaseModel):
    """Create admin request model"""
    name: str
    email: EmailStr
    password: str
    confirmPassword: str


class CreateAdminResponse(BaseModel):
    """Create admin response model"""
    success: bool
    message: str
    data: dict = None
