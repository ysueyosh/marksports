'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Notification, getNotifications } from '@/api/notifications';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import Overlay from '@/components/Common/Overlay';
import styles from './NotificationPopup.module.css';

interface NotificationPopupProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPopup({
  isOpen,
  notifications: initialNotifications,
  onClose,
}: NotificationPopupProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  // ポップアップが開かれるたびにデータベースからお知らせを取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await getNotifications();
        if (response.success && response.data?.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Overlay isOpen={isOpen} onClick={onClose} zIndex="notification" />

      {/* Popup */}
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>お知らせ</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.notificationList}>
          {loading ? (
            <div
              style={{ padding: '20px', textAlign: 'center', color: '#999' }}
            >
              読み込み中...
            </div>
          ) : notifications.length === 0 ? (
            <p className={styles.empty}>お知らせはありません</p>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                className={`${styles.notificationItem} ${
                  notification.read ? styles.read : styles.unread
                }`}
                onClick={onClose}
              >
                <div className={styles.itemHeader}>
                  <h3>{notification.title}</h3>
                  {notification.important && <NotificationTag tag="重要" />}
                </div>
                <p className={styles.content}>{notification.message}</p>
                <span className={styles.date}>
                  {new Date(notification.timestamp).toLocaleDateString('ja-JP')}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <Link href="/notifications" className={styles.viewAllLink}>
            すべて見る →
          </Link>
        </div>
      </div>
    </>
  );
}
