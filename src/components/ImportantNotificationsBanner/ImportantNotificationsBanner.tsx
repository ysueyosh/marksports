'use client';

import Link from 'next/link';
import { useNotificationContext } from '@/context/NotificationContext';
import styles from './ImportantNotificationsBanner.module.css';

export default function ImportantNotificationsBanner() {
  const { importantNotifications } = useNotificationContext();

  if (importantNotifications.length === 0) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        {importantNotifications.map((notification, index) => (
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
    </div>
  );
}
