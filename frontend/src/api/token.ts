/**
 * Token Refresh API
 */

import { apiClient } from './client';

export interface TokenRefreshResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    name: string;
    phone: string;
    address: string;
  };
}

export async function refreshToken(
  refreshToken: string
): Promise<TokenRefreshResponse> {
  return apiClient.post<TokenRefreshResponse>('/refresh-token', {
    refresh_token: refreshToken,
  });
}

export async function verifyToken(
  accessToken: string
): Promise<VerifyTokenResponse> {
  return apiClient.post<VerifyTokenResponse>('/verify-token', {
    access_token: accessToken,
  });
}
