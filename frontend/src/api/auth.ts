/**
 * Authentication API
 */

import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
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

export interface UpdateProfileRequest {
  name: string;
  email?: string;
  phone?: string;
  sex?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    email?: string;
    phone?: string;
    sex?: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: object;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data?: object;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    email: string;
    phone?: string;
    sex?: string;
  };
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
  };
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface VerifyResetTokenResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * User login
 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/login', {
    email,
    password,
  } as LoginRequest);

  return response;
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const response = await apiClient.post<UpdateProfileResponse>(
    '/update-profile',
    data,
  );

  return response;
}

/**
 * Change password
 */
export async function changePassword(
  data: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  const response = await apiClient.post<ChangePasswordResponse>(
    '/change-password',
    data,
  );

  return response;
}

/**
 * Delete account
 */
export async function deleteAccount(): Promise<DeleteAccountResponse> {
  const response = await apiClient.post<DeleteAccountResponse>(
    '/delete-account',
    {},
  );

  return response;
}

/**
 * Get user profile with loading spinner
 */
export async function getUserProfile(): Promise<GetProfileResponse> {
  return apiClient.get<GetProfileResponse>('/get-profile');
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(
  data: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  const response = await apiClient.post<RequestPasswordResetResponse>(
    '/password-reset/request',
    data,
  );

  return response;
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(
  data: VerifyResetTokenRequest,
): Promise<VerifyResetTokenResponse> {
  const response = await apiClient.post<VerifyResetTokenResponse>(
    '/password-reset/verify',
    data,
  );

  return response;
}

/**
 * Reset password with token
 */
export async function resetPassword(
  data: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await apiClient.post<ResetPasswordResponse>(
    '/password-reset/reset',
    data,
  );

  return response;
}
