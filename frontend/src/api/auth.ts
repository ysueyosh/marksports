/**
 * Authentication API
 */

import { apiRequest } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    token: string;
  };
}

export interface UpdateProfileRequest {
  name: string;
  email?: string;
  gender?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: {
    name: string;
    email: string;
    gender: string;
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

export interface UpdateNotificationSettingsRequest {
  emailNotifications: boolean;
}

export interface UpdateNotificationSettingsResponse {
  success: boolean;
  message: string;
  data?: {
    emailNotifications: boolean;
  };
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
    gender?: string;
    emailNotifications?: boolean;
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
  password: string
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    } as LoginRequest),
  });

  return response;
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> {
  const response = await apiRequest<UpdateProfileResponse>('/update-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response;
}

/**
 * Change password
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const response = await apiRequest<ChangePasswordResponse>(
    '/change-password',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return response;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  data: UpdateNotificationSettingsRequest
): Promise<UpdateNotificationSettingsResponse> {
  const response = await apiRequest<UpdateNotificationSettingsResponse>(
    '/update-notification-settings',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return response;
}

/**
 * Delete account
 */
export async function deleteAccount(): Promise<DeleteAccountResponse> {
  const response = await apiRequest<DeleteAccountResponse>('/delete-account', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return response;
}

/**
 * Get user profile with loading spinner
 */
export async function getUserProfile(): Promise<GetProfileResponse> {
  return apiRequest<GetProfileResponse>('/get-profile', {
    method: 'GET',
  });
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(
  data: RequestPasswordResetRequest
): Promise<RequestPasswordResetResponse> {
  const response = await apiRequest<RequestPasswordResetResponse>(
    '/password-reset/request',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return response;
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(
  data: VerifyResetTokenRequest
): Promise<VerifyResetTokenResponse> {
  const response = await apiRequest<VerifyResetTokenResponse>(
    '/password-reset/verify',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return response;
}

/**
 * Reset password with token
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const response = await apiRequest<ResetPasswordResponse>(
    '/password-reset/reset',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return response;
}
