'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import Link from 'next/link';
import { Notification, getNotificationDetail } from '@/api/notifications';
import styles from './notification-detail.module.css';

export default function NotificationDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        const response = await getNotificationDetail(id);
        if (response.success && response.data) {
          setNotification(response.data);
          setError(null);
        } else {
          setError('お知らせが見つかりません');
        }
      } catch (err) {
        console.error('Failed to fetch notification:', err);
        setError('お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotification();
    }
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.loading}>読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !notification) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>お知らせが見つかりません</h2>
            <p>
              {error || 'お手数ですが、お知らせ一覧から再度お選びください。'}
            </p>
            <Link href="/notifications" className={styles.backLink}>
              お知らせ一覧に戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/notifications">お知らせ</Link>
          <span>/</span>
          <span>{notification.title}</span>
        </div>

        <article className={styles.article}>
          <header className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{notification.title}</h1>
              {notification.important && <NotificationTag tag="重要" />}
            </div>
            <time className={styles.date}>
              {new Date(notification.timestamp).toLocaleDateString('ja-JP')}
            </time>
          </header>

          <div className={styles.content}>
            <p>{notification.message}</p>
          </div>

          <footer className={styles.footer}>
            <Link href="/notifications" className={styles.backLink}>
              ← お知らせ一覧に戻る
            </Link>
          </footer>
        </article>
      </div>
    </MainLayout>
  );
}
