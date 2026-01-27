/**
 * Token Refresh API
 */

import { apiClient } from './client';

export interface TokenRefreshResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name: string;
    phone: string;
    accessToken: string;
    refreshToken: string;
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
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
  };
}

export async function refreshToken(
  refreshToken: string,
): Promise<TokenRefreshResponse> {
  return apiClient.post<TokenRefreshResponse>('/refresh-token', {
    refresh_token: refreshToken,
  });
}

export async function verifyToken(
  accessToken: string,
  refreshToken?: string,
): Promise<VerifyTokenResponse> {
  const body: any = {
    access_token: accessToken,
  };

  if (refreshToken) {
    body.refresh_token = refreshToken;
  }

  return apiClient.post<VerifyTokenResponse>('/verify-token', body);
}
