/**
 * Token Refresh API
 */

import { apiRequest } from './client';

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
  return apiRequest<TokenRefreshResponse>('/refresh-token', {
    method: 'POST',
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });
}

export async function verifyToken(
  accessToken: string
): Promise<VerifyTokenResponse> {
  return apiRequest<VerifyTokenResponse>('/verify-token', {
    method: 'POST',
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });
}
