'use client';

import { useParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import Link from 'next/link';
import { DUMMY_NOTIFICATIONS } from '@/data/notifications';
import styles from './notification-detail.module.css';

export default function NotificationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const notification = DUMMY_NOTIFICATIONS.find((n) => n.id === id);

  if (!notification) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>お知らせが見つかりません</h2>
            <p>お手数ですが、お知らせ一覧から再度お選びください。</p>
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
              {notification.tag && <NotificationTag tag={notification.tag} />}
            </div>
            <time className={styles.date}>{notification.date}</time>
          </header>

          <div className={styles.content}>
            <p>{notification.content}</p>
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
