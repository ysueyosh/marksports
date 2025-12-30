'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Notification, DUMMY_NOTIFICATIONS } from '@/data/notifications';

interface NotificationContextType {
  allNotifications: Notification[];
  importantNotifications: Notification[];
  saleNotifications: Notification[];
  hasImportantNotifications: boolean;
  hasSaleNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMemo(() => {
    const importantNotifications = DUMMY_NOTIFICATIONS.filter(
      (n) => n.tag === 'important'
    );
    const saleNotifications = DUMMY_NOTIFICATIONS.filter(
      (n) => n.tag === 'sale'
    );

    return {
      allNotifications: DUMMY_NOTIFICATIONS,
      importantNotifications,
      saleNotifications,
      hasImportantNotifications: importantNotifications.length > 0,
      hasSaleNotifications: saleNotifications.length > 0,
    };
  }, []);

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
