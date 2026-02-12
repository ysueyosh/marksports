/**
 * Authentication Configuration Constants
 * Centralized token expiration settings
 */

// Access token expiration time in seconds (60 minutes)
export const ACCESS_TOKEN_EXPIRE_SECONDS = 3600;

// Default fallback value if server doesn't return expiresIn
export const DEFAULT_TOKEN_EXPIRY_SECONDS = ACCESS_TOKEN_EXPIRE_SECONDS;
