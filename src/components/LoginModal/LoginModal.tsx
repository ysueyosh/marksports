'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Overlay from '@/components/Common/Overlay';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    setEmail('');
    setPassword('');
    onClose();
    // ログイン後、アカウントページへ遷移
    router.push('/account');
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
              className={styles.input}
              placeholder="example@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="パスワード"
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            ログイン
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
