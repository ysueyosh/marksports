"""
Models for authentication
"""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response model"""
    success: bool
    message: str
    data: dict = None


class TokenRefreshRequest(BaseModel):
    """Token refresh request model"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response model"""
    success: bool
    message: str
    data: dict = None


class VerifyTokenRequest(BaseModel):
    """Verify token request model"""
    access_token: str


class VerifyTokenResponse(BaseModel):
    """Verify token response model"""
    success: bool
    message: str
    data: dict = None


class RegisterRequest(BaseModel):
    """User registration request model"""
    name: str
    email: EmailStr
    password: str
    confirmPassword: str
    phone: str = None
    sex: str = None
    # Address fields (optional)
    registerAddress: bool = False  # チェックボックス
    postalCode: str = None
    prefecture: str = None
    address: str = None
    option: str = None  # building/option


class RegisterResponse(BaseModel):
    """User registration response model"""
    success: bool
    message: str
    data: dict = None


class UpdateProfileRequest(BaseModel):
    """Update profile request model"""
    name: str
    email: str = None
    gender: str = None


class UpdateProfileResponse(BaseModel):
    """Update profile response model"""
    success: bool
    message: str
    data: dict = None


class ChangePasswordRequest(BaseModel):
    """Change password request model"""
    currentPassword: str
    newPassword: str
    confirmPassword: str


class ChangePasswordResponse(BaseModel):
    """Change password response model"""
    success: bool
    message: str
    data: dict = None
