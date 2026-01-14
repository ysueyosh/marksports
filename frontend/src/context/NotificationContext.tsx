'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/api/notifications';

// ダミー通知データ（重要な通知用）
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'システムメンテナンスのお知らせ',
    message: '本日午後2時から3時まで、システムメンテナンスを実施いたします。',
    timestamp: '2024-01-15T10:00:00Z',
    type: 'warning',
    important: true,
  },
  {
    id: '2',
    title: '新規キャンペーン開始',
    message: '新しいセールキャンペーンが開始されました。',
    timestamp: '2024-01-14T15:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '3',
    title: 'ご注文確認',
    message: 'ご注文ありがとうございます。',
    timestamp: '2024-01-13T12:00:00Z',
    type: 'success',
    important: false,
  },
  {
    id: '4',
    title: 'セキュリティアラート',
    message: '不審なアクセスがありました。',
    timestamp: '2024-01-12T09:00:00Z',
    type: 'error',
    important: true,
  },
  {
    id: '5',
    title: 'お知らせ5',
    message: 'これはお知らせ5です。',
    timestamp: '2024-01-11T08:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '6',
    title: 'お知らせ6',
    message: 'これはお知らせ6です。',
    timestamp: '2024-01-10T07:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '7',
    title: 'お知らせ7',
    message: 'これはお知らせ7です。',
    timestamp: '2024-01-09T06:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '8',
    title: 'お知らせ8',
    message: 'これはお知らせ8です。',
    timestamp: '2024-01-08T05:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '9',
    title: 'お知らせ9',
    message: 'これはお知らせ9です。',
    timestamp: '2024-01-07T04:00:00Z',
    type: 'info',
    important: false,
  },
  {
    id: '10',
    title: 'お知らせ10',
    message: 'これはお知らせ10です。',
    timestamp: '2024-01-06T03:00:00Z',
    type: 'info',
    important: false,
  },
];

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

  // localStorage から初期未読件数を読み込み、重要な通知を取得
  useEffect(() => {
    const readNotifications = localStorage.getItem('readNotifications');
    const readIds = readNotifications ? JSON.parse(readNotifications) : [];
    // 全通知件数は 10 件、未読件数 = 10 - 既読件数
    const initialUnreadCount = 10 - readIds.length;
    setUnreadCount(initialUnreadCount);

    // 重要な通知を取得
    const important = DUMMY_NOTIFICATIONS.filter((n) => n.important);
    setImportantNotifications(important);
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
