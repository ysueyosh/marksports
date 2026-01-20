/**
 * API Client Configuration
 * Centralized API endpoint management with request/response interceptors
 */

import { API_BASE_URL } from './constants';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Loading context functions for managing multiple simultaneous API calls
let incrementLoadingFn: (() => void) | null = null;
let decrementLoadingFn: (() => void) | null = null;

export const setLoadingInterceptors = (
  increment: () => void,
  decrement: () => void
) => {
  incrementLoadingFn = increment;
  decrementLoadingFn = decrement;
};

/**
 * Request Interceptor - called before API request
 */
const requestInterceptor = () => {
  if (incrementLoadingFn) {
    incrementLoadingFn();
  }
};

/**
 * Response Interceptor - called after API response (success or error)
 */
const responseInterceptor = () => {
  if (decrementLoadingFn) {
    decrementLoadingFn();
  }
};

/**
 * Generic API request handler with interceptors
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  // Request Interceptor
  requestInterceptor();

  try {
    // Get access token from AuthStore
    let headers: any = {
      ...API_CONFIG.headers,
      ...options.headers,
    };

    // If body is FormData, remove Content-Type to let browser set it
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    // Only add Authorization header if not already present
    if (typeof window !== 'undefined' && !headers['Authorization']) {
      try {
        // Try to get admin tokens first (for admin pages)
        const adminTokensStr = localStorage.getItem('adminTokens');
        if (adminTokensStr) {
          try {
            const adminTokens = JSON.parse(adminTokensStr);
            if (adminTokens.accessToken) {
              headers['Authorization'] = `Bearer ${adminTokens.accessToken}`;
            }
          } catch {
            // adminTokens is not valid JSON, try regular auth tokens
            const authTokensStr = localStorage.getItem('authTokens');
            if (authTokensStr) {
              const authTokens = JSON.parse(authTokensStr);
              if (authTokens.accessToken) {
                headers['Authorization'] = `Bearer ${authTokens.accessToken}`;
              }
            }
          }
        } else {
          // No admin tokens, try regular auth tokens
          const authTokensStr = localStorage.getItem('authTokens');
          if (authTokensStr) {
            const authTokens = JSON.parse(authTokensStr);
            if (authTokens.accessToken) {
              headers['Authorization'] = `Bearer ${authTokens.accessToken}`;
            }
          }
        }
      } catch (error) {
        console.error('Failed to read auth tokens:', error);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.error(
        `API Response Error: ${response.status} ${response.statusText}`,
        response
      );
      try {
        const errorData: T = await response.json();
        return errorData;
      } catch (e) {
        // レスポンスのJSONパースに失敗した場合
        console.error('Failed to parse error response as JSON:', e);
        return {
          success: false,
          message: `API Error: ${response.status} ${response.statusText}`,
        } as T;
      }
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, {
      url,
      baseURL: API_CONFIG.baseURL,
      endpoint,
      error,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    // Response Interceptor
    responseInterceptor();
  }
}

/**
 * API Client - convenient methods for common HTTP operations
 */
export const apiClient = {
  get: async <T>(endpoint: string, options: RequestInit = {}) => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  post: async <T>(endpoint: string, body?: any, options: RequestInit = {}) => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: async <T>(endpoint: string, body?: any, options: RequestInit = {}) => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: async <T>(endpoint: string, options: RequestInit = {}) => {
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },
};
