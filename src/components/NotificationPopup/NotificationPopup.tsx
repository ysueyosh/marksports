'use client';

import React from 'react';
import Link from 'next/link';
import { Notification } from '@/data/notifications';
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
  notifications,
  onClose,
}: NotificationPopupProps) {
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
          {notifications.length === 0 ? (
            <p className={styles.empty}>お知らせはありません</p>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                className={styles.notificationItem}
                onClick={onClose}
              >
                <div className={styles.itemHeader}>
                  <h3>{notification.title}</h3>
                  {notification.tag && (
                    <NotificationTag tag={notification.tag} />
                  )}
                </div>
                <p className={styles.content}>{notification.content}</p>
                <span className={styles.date}>{notification.date}</span>
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
