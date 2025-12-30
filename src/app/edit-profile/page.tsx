'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import Link from 'next/link';
import styles from './edit-profile.module.css';

export default function EditProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // 1秒間スピナーを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        {isLoading && <LoadingSpinner />}
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>プロフィール編集</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      setError('すべての項目を入力してください');
      return;
    }
    setError('');
    setSuccess('プロフィールを更新しました');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('すべての項目を入力してください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }
    if (newPassword.length < 6) {
      setError('パスワードは6文字以上で設定してください');
      return;
    }
    setError('');
    setSuccess('パスワードを変更しました');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <MainLayout>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>プロフィール編集</span>
        </div>

        <h1 className={styles.title}>プロフィール編集</h1>

        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'profile' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('profile')}
          >
            プロフィール
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'password' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('password')}
          >
            パスワード変更
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {activeTab === 'profile' && (
          <form className={styles.form} onSubmit={handleProfileSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">お名前</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="お名前"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={user.email}
                disabled
                placeholder="メールアドレス"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">住所</label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="住所"
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              更新する
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form className={styles.form} onSubmit={handlePasswordSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">現在のパスワード</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="現在のパスワード"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">新しいパスワード</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">パスワード確認</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワード確認"
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              変更する
            </button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
