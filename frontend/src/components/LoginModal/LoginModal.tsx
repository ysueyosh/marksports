'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { login as apiLogin } from '@/api/auth';
import Overlay from '@/components/Common/Overlay';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { loginWithUserData } = useAuth();
  const { isLoading, setIsLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // ローディング状態を手動で制御
      setIsLoading(true);
      // APIでログイン
      const response = await apiLogin(email, password);

      if (response.success) {
        // APIから返されたユーザー情報をAuthContextに保存
        loginWithUserData(response.data);
        setEmail('');
        setPassword('');
        onClose();
        // ログイン後、アカウントページへ遷移
        router.push('/account');
      } else {
        setError(response.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログイン処理に失敗しました。時間をおいて再度お試しください。');
    } finally {
      // 最後に必ずローディング状態を解除
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Overlay isOpen={isOpen} onClick={onClose} zIndex="modal" />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>ログイン</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className={styles.input}
              placeholder="example@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.passwordLabelWrapper}>
              <label htmlFor="password" className={styles.label}>
                パスワード
              </label>
              <a
                href="/forgot-password"
                className={styles.forgotLink}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  router.push('/forgot-password');
                }}
              >
                パスワードを忘れた方
              </a>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className={styles.input}
              placeholder="パスワード"
            />
          </div>

          {error && (
            <div
              style={{
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(220, 38, 38, 0.3)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            アカウントをお持ちでない方は{' '}
            <a href="/register" className={styles.link}>
              こちら
            </a>
            から登録してください
          </p>
        </div>
      </div>
    </>
  );
}
