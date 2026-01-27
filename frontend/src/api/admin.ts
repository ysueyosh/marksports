/**
 * Admin API client
 */

import { apiClient } from './client';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data?: {
    adminId: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateAdminResponse {
  success: boolean;
  message: string;
  data?: {
    adminId: string;
    email: string;
    name: string;
    createdAt: string;
  };
}

export interface AdminVerifyTokenRequest {
  access_token: string;
}

export interface AdminVerifyTokenResponse {
  success: boolean;
  message: string;
  data?: {
    adminId: string;
    email: string;
    name: string;
  };
}

export interface AdminRefreshTokenRequest {
  refresh_token: string;
}

export interface AdminRefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    adminId: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface AdminSettingsRequest {
  name: string;
  email: string;
}

export interface AdminSettings {
  id: string;
  name: string;
  email: string;
}

export interface GetAdminSettingsResponse {
  success: boolean;
  message: string;
  data?: AdminSettings;
}

export interface UpdateAdminSettingsResponse {
  success: boolean;
  message: string;
  data?: AdminSettings;
}

/**
 * Admin login
 */
export const adminLogin = async (
  request: AdminLoginRequest,
): Promise<AdminLoginResponse> => {
  const response = await apiClient.post<AdminLoginResponse>(
    '/admin/login',
    request,
  );
  return response as AdminLoginResponse;
};

/**
 * Create admin
 */
export const createAdmin = async (
  request: CreateAdminRequest,
): Promise<CreateAdminResponse> => {
  const response = await apiClient.post<CreateAdminResponse>(
    '/admin/create',
    request,
  );
  return response as CreateAdminResponse;
};

/**
 * Verify admin token
 */
export const verifyAdminToken = async (
  accessToken: string,
): Promise<AdminVerifyTokenResponse> => {
  const response = await apiClient.post<AdminVerifyTokenResponse>(
    '/admin/verify-token',
    { access_token: accessToken },
  );
  return response as AdminVerifyTokenResponse;
};

/**
 * Refresh admin token
 */
export const refreshAdminToken = async (
  refreshToken: string,
): Promise<AdminRefreshTokenResponse> => {
  const response = await apiClient.post<AdminRefreshTokenResponse>(
    '/admin/refresh-token',
    { refresh_token: refreshToken },
  );
  return response as AdminRefreshTokenResponse;
};

/**
 * Get admin settings
 */
export const getAdminSettings = async (): Promise<GetAdminSettingsResponse> => {
  const response =
    await apiClient.get<GetAdminSettingsResponse>('/admin/settings');
  return response as GetAdminSettingsResponse;
};

/**
 * Update admin settings
 */
export const updateAdminSettings = async (
  request: AdminSettingsRequest,
): Promise<UpdateAdminSettingsResponse> => {
  const response = await apiClient.put<UpdateAdminSettingsResponse>(
    '/admin/settings',
    request,
  );
  return response as UpdateAdminSettingsResponse;
};

/**
 * User Management Interfaces
 */
export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  data?: {
    users: Array<{
      userId: string;
      email: string;
      name?: string;
      phone?: string;
      sex?: string;
      status: string;
      createdAt: string;
      updatedAt?: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetUserResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name?: string;
    phone?: string;
    sex?: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
  };
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  sex?: string;
  status?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    name?: string;
    phone?: string;
    sex?: string;
    status: string;
    updatedAt: string;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

/**
 * Get all users
 */
export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
): Promise<GetAllUsersResponse> => {
  const response = await apiClient.get<GetAllUsersResponse>(
    `/admin/users?page=${page}&limit=${limit}`,
  );
  return response as GetAllUsersResponse;
};

/**
 * Get single user
 */
export const getUser = async (userId: string): Promise<GetUserResponse> => {
  const response = await apiClient.get<GetUserResponse>(
    `/admin/users/${userId}`,
  );
  return response as GetUserResponse;
};

/**
 * Update user
 */
export const updateUser = async (
  userId: string,
  request: UpdateUserRequest,
): Promise<UpdateUserResponse> => {
  const response = await apiClient.put<UpdateUserResponse>(
    `/admin/users/${userId}`,
    request,
  );
  return response as UpdateUserResponse;
};

/**
 * Delete user
 */
export const deleteUser = async (
  userId: string,
): Promise<DeleteUserResponse> => {
  const response = await apiClient.delete<DeleteUserResponse>(
    `/admin/users/${userId}`,
  );
  return response as DeleteUserResponse;
};
