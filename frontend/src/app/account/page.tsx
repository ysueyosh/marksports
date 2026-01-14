'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import styles from './account.module.css';

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    // ページ遷移時の処理
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>アカウントページ</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
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
          <span>アカウント</span>
        </div>

        <h1 className={styles.title}>アカウント</h1>

        <div className={styles.profileSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <h2>プロフィール</h2>
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>お名前</span>
                <span className={styles.value}>{user.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>メール</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>住所</span>
                <span className={styles.value}>{user.address || '未登録'}</span>
              </div>
            </div>
          </div>

          <div className={styles.menuCard}>
            <h2>メニュー</h2>
            <ul className={styles.menuList}>
              <li>
                <Link href="/orders">注文履歴</Link>
              </li>
              <li>
                <Link href="/address">配送先住所管理</Link>
              </li>
              <li>
                <Link href="/payment">お支払い方法</Link>
              </li>
              <li>
                <Link href="/settings">アカウント設定</Link>
              </li>
            </ul>
            <button className={styles.logoutButton} onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
