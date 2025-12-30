'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import Link from 'next/link';
import { DUMMY_NOTIFICATIONS } from '@/data/notifications';
import styles from './notifications.module.css';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMethod, setFilterMethod] = useState('all');

  // フィルタリング
  const filteredNotifications = useMemo(() => {
    if (filterMethod === 'all') {
      return DUMMY_NOTIFICATIONS;
    }
    return DUMMY_NOTIFICATIONS.filter((n) => n.method === filterMethod);
  }, [filterMethod]);

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

        {/* フィルタ */}
        <div className={styles.filterSection}>
          <select
            className={styles.filterSelect}
            value={filterMethod}
            onChange={(e) => {
              setFilterMethod(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">すべて</option>
            <option value="site">サイト通知</option>
            <option value="email">メール</option>
          </select>
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
                className={`${styles.notificationItem} ${
                  notification.read ? styles.read : styles.unread
                }`}
              >
                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.title}>{notification.title}</h3>
                    {notification.tag && (
                      <NotificationTag tag={notification.tag} />
                    )}
                  </div>
                  <p className={styles.description}>{notification.content}</p>
                  <div className={styles.meta}>
                    <span className={styles.date}>{notification.date}</span>
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
