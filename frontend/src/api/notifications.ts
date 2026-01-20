/**
 * Notification API
 */

import { apiClient } from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  important?: boolean;
  read?: boolean; // Frontend で localStorage から追加される
}

export interface NotificationDetailResponse {
  success: boolean;
  message: string;
  data?: Notification;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data?: {
    notifications: Notification[];
    total: number;
  };
}

export interface GetNotificationCountResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    unread: number;
  };
}

/**
 * Get all notifications
 */
export async function getNotifications(): Promise<GetNotificationsResponse> {
  const response = await apiClient.get<GetNotificationsResponse>(
    '/notifications'
  );

  return response;
}

/**
 * Get a single notification by ID
 */
export async function getNotificationDetail(
  notificationId: string
): Promise<NotificationDetailResponse> {
  const response = await apiClient.get<NotificationDetailResponse>(
    `/notifications/${notificationId}`
  );

  return response;
}

/**
 * Get notification count (unread and total)
 * @param readIds - Array of read notification IDs
 */
export async function getNotificationCount(
  readIds: string[] = []
): Promise<GetNotificationCountResponse> {
  const params = new URLSearchParams();
  params.append('readIds', JSON.stringify(readIds));

  const response = await apiClient.get<GetNotificationCountResponse>(
    `/notifications/count?${params.toString()}`
  );

  return response;
}
