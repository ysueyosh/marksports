'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import { useNotificationContext } from '@/context/NotificationContext';
import Link from 'next/link';
import { getNotifications, Notification } from '@/api/notifications';
import styles from './notifications.module.css';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { decrementUnreadCount } = useNotificationContext();

  // 初回アクセス時にお知らせを取得
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        if (response.success && response.data) {
          // Backend から取得したデータに localStorage から既読状態を反映
          const readIds = getReadNotifications();
          const notificationsWithReadStatus = response.data.notifications.map(
            (n) => ({
              ...n,
              read: readIds.includes(n.id),
            })
          );
          setNotifications(notificationsWithReadStatus);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  // 既読状態をlocalstorageで管理
  const getReadNotifications = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('readNotifications');
    return stored ? JSON.parse(stored) : [];
  };

  const markAsRead = (notificationId: string) => {
    const readIds = getReadNotifications();
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
      // ローカル状態も更新
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      // Context の未読件数を 1 件減らす
      decrementUnreadCount();
    }
  };

  // フィルタリング不要、すべて表示
  const filteredNotifications = notifications;

  // ページング
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <span>お知らせ</span>
        </div>

        <div className={styles.header}>
          <h1>お知らせ</h1>
        </div>

        {/* 件数表示 */}
        <div className={styles.resultCount}>
          <p>全 {filteredNotifications.length} 件を表示</p>
        </div>

        {/* お知らせリスト */}
        <div className={styles.notificationList}>
          {paginatedNotifications.length === 0 ? (
            <div className={styles.empty}>お知らせがありません</div>
          ) : (
            paginatedNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                onClick={() => markAsRead(notification.id)}
                className={`${styles.notificationItem} ${
                  notification.read ? styles.read : styles.unread
                }`}
              >
                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.title}>{notification.title}</h3>
                    {notification.important && <NotificationTag tag="重要" />}
                  </div>
                  <p className={styles.description}>{notification.message}</p>
                  <div className={styles.meta}>
                    <span className={styles.date}>
                      {new Date(notification.timestamp).toLocaleDateString(
                        'ja-JP'
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* ページネーション */}
        {filteredNotifications.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </MainLayout>
  );
}
