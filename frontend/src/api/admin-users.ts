/**
 * Admin user management API client
 */

import { apiClient } from './client';

export interface User {
  userId: string;
  email: string;
  name: string;
  phone: string;
  sex: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  sex?: string;
  status?: string;
}

export interface AdminUserResponse {
  success: boolean;
  message: string;
  data?:
    | User
    | {
        users: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
}

export const adminUserAPI = {
  /**
   * Get all users with pagination and optional search
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    email?: string,
    name?: string,
    status?: string,
  ): Promise<AdminUserResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (email) params.append('email', email);
    if (name) params.append('name', name);
    if (status && status !== 'all') params.append('status', status);

    return apiClient.get<AdminUserResponse>(
      `/admin/users?${params.toString()}`,
    );
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<AdminUserResponse> {
    return apiClient.get<AdminUserResponse>(`/admin/users/${userId}`);
  },

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    request: UserUpdateRequest,
  ): Promise<AdminUserResponse> {
    return apiClient.put<AdminUserResponse>(`/admin/users/${userId}`, request);
  },

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<AdminUserResponse> {
    return apiClient.delete<AdminUserResponse>(`/admin/users/${userId}`);
  },
};
