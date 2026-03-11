/**
 * Admin Notifications API
 */

import { apiClient } from './client';

export interface AdminNotification {
  notificationId: string;
  type: 'info' | 'important';
  target: 'all';
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface CreateNotificationRequest {
  type: 'info' | 'important';
  target: 'all';
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  content?: string;
  type?: 'info' | 'important';
  target?: 'all';
  startDate?: string;
  endDate?: string;
}

export interface AdminNotificationResponse {
  success: boolean;
  message: string;
  data?: {
    notifications?: AdminNotification[];
    notificationId?: string;
    type?: string;
    target?: string;
    title?: string;
    content?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

const adminNotificationAPI = {
  /**
   * Get all notifications with pagination
   */
  getAllNotifications: async (
    page = 1,
    limit = 20,
  ): Promise<AdminNotificationResponse> => {
    return apiClient.get(`/admin/notifications?page=${page}&limit=${limit}`);
  },

  /**
   * Get a single notification
   */
  getNotification: async (
    notificationId: string,
  ): Promise<AdminNotificationResponse> => {
    return apiClient.get(`/admin/notifications/${notificationId}`);
  },

  /**
   * Create a new notification
   */
  createNotification: async (
    request: CreateNotificationRequest,
  ): Promise<AdminNotificationResponse> => {
    return apiClient.post(`/admin/notifications`, request);
  },

  /**
   * Update a notification
   */
  updateNotification: async (
    notificationId: string,
    request: UpdateNotificationRequest,
  ): Promise<AdminNotificationResponse> => {
    return apiClient.put(`/admin/notifications/${notificationId}`, request);
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (
    notificationId: string,
  ): Promise<AdminNotificationResponse> => {
    return apiClient.delete(`/admin/notifications/${notificationId}`);
  },
};

export default adminNotificationAPI;
