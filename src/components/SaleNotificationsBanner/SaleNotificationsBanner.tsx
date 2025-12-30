'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNotificationContext } from '@/context/NotificationContext';
import styles from './SaleNotificationsBanner.module.css';

export default function SaleNotificationsBanner() {
  const { saleNotifications } = useNotificationContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // クライアント側で localStorage から状態を復元
    const dismissedIds = JSON.parse(
      localStorage.getItem('dismissedSaleNotifications') || '[]'
    );
    const visibleNotifications = saleNotifications.filter(
      (n) => !dismissedIds.includes(n.id)
    );
    setIsVisible(visibleNotifications.length > 0);
    setIsHydrated(true);
  }, [saleNotifications]);

  if (!isHydrated) return null;

  const handleDismiss = (notificationId: string) => {
    const dismissedIds = JSON.parse(
      localStorage.getItem('dismissedSaleNotifications') || '[]'
    );
    if (!dismissedIds.includes(notificationId)) {
      dismissedIds.push(notificationId);
      localStorage.setItem(
        'dismissedSaleNotifications',
        JSON.stringify(dismissedIds)
      );
    }

    // 非表示になったid以外のセールがあるかチェック
    const visibleNotifications = saleNotifications.filter(
      (n) => !dismissedIds.includes(n.id)
    );
    setIsVisible(visibleNotifications.length > 0);
  };

  if (!isVisible) return null;

  const dismissedIds = JSON.parse(
    localStorage.getItem('dismissedSaleNotifications') || '[]'
  );
  const visibleNotifications = saleNotifications.filter(
    (n) => !dismissedIds.includes(n.id)
  );

  return (
    <div className={styles.banner}>
      <div className={styles.icon}>🎉</div>
      <div className={styles.content}>
        {visibleNotifications.map((notification, index) => (
          <span key={notification.id}>
            {index > 0 && <span className={styles.separator}>・</span>}
            <Link
              href={`/notifications/${notification.id}`}
              className={styles.notificationLink}
            >
              {notification.title}
            </Link>
          </span>
        ))}
      </div>
      <button
        className={styles.closeButton}
        onClick={() => {
          if (visibleNotifications.length > 0) {
            handleDismiss(visibleNotifications[0].id);
          }
        }}
        aria-label="バナーを閉じる"
      >
        ✕
      </button>
    </div>
  );
}
