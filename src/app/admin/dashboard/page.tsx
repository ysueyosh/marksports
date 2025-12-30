'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import styles from './admin-dashboard.module.css';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminLogged');
    localStorage.removeItem('adminEmail');
    router.push('/');
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>管理者ダッシュボード</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            ログアウト
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h2>サイト管理</h2>
            <p>このページは管理者専用ページです。</p>
            <p>現在、デモ版のため実際の管理機能は実装されていません。</p>
            <p>今後、以下の機能を追加予定です：</p>
            <ul>
              <li>商品管理（追加・編集・削除）</li>
              <li>注文管理</li>
              <li>ユーザー管理</li>
              <li>レポート・統計</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h2>ログイン情報</h2>
            <p>あなたは管理者としてログインしています。</p>
            <button
              onClick={() => router.push('/')}
              className={styles.homeButton}
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
