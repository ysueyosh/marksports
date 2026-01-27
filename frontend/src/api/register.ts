/**
 * User Registration API
 */

import { apiClient } from './client';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  sex?: string;
  registerAddress: boolean;
  postalCode?: string;
  prefecture?: string;
  address?: string;
  option?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name: string;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
  };
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ResendVerificationEmailResponse {
  success: boolean;
  message: string;
}

export async function register(
  registerData: RegisterRequest,
): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>('/register', registerData);
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return apiClient.post<VerifyEmailResponse>('/verify-email-registration', {
    token,
  });
}

export async function resendVerificationEmail(
  request: ResendVerificationEmailRequest,
): Promise<ResendVerificationEmailResponse> {
  return apiClient.post<ResendVerificationEmailResponse>(
    '/resend-verification-email',
    request,
  );
}
