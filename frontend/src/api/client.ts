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

    // Only add Authorization header if not already present
    if (typeof window !== 'undefined' && !headers['Authorization']) {
      try {
        const authTokensStr = localStorage.getItem('authTokens');
        if (authTokensStr) {
          const authTokens = JSON.parse(authTokensStr);
          if (authTokens.accessToken) {
            headers['Authorization'] = `Bearer ${authTokens.accessToken}`;
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
      const errorData: T = await response.json();
      return errorData;
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
