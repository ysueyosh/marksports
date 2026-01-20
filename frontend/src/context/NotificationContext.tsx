'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, getNotifications } from '@/api/notifications';

interface NotificationContextType {
  unreadCount: number;
  importantNotifications: Notification[];
  decrementUnreadCount: () => void;
  resetUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [importantNotifications, setImportantNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);

  // DB からお知らせを取得して重要な通知を抽出
  useEffect(() => {
    const fetchImportantNotifications = async () => {
      try {
        setLoading(true);
        console.log('Fetching notifications...');
        const response = await getNotifications();
        console.log('Notifications response:', response);

        if (response && response.success && response.data?.notifications) {
          console.log('Got notifications:', response.data.notifications.length);
          // 重要な通知（important === true）のみを抽出
          const important = response.data.notifications.filter(
            (n) => n.important === true
          );
          setImportantNotifications(important);

          // localStorage から既読状態を取得
          const readNotifications = localStorage.getItem('readNotifications');
          let readIds: string[] = [];
          try {
            if (readNotifications) {
              const parsed = JSON.parse(readNotifications);
              readIds = Array.isArray(parsed) ? parsed : [];
            }
          } catch (e) {
            console.warn(
              'Failed to parse readNotifications from localStorage:',
              e
            );
            readIds = [];
          }

          // 通知ごとに既読状態をチェックして未読件数を計算
          const unreadNotifications = response.data.notifications.filter(
            (n) => !readIds.includes(n.id)
          );
          const initialUnreadCount = unreadNotifications.length;
          console.log(
            'Total notifications:',
            response.data.notifications.length,
            'Read IDs:',
            readIds.length,
            'Unread count:',
            initialUnreadCount
          );
          setUnreadCount(initialUnreadCount);
        } else {
          console.warn('Invalid response or no notifications:', response);
          setImportantNotifications([]);
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch important notifications:', err);
        // エラー時はデフォルト値を設定
        setImportantNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchImportantNotifications();
  }, []);

  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const resetUnreadCount = (count: number) => {
    setUnreadCount(count);
  };

  const value = {
    unreadCount,
    importantNotifications,
    decrementUnreadCount,
    resetUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
}
