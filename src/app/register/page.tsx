'use client';

import MainLayout from '@/components/Layout/MainLayout';
import styles from './register.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm || !address) {
      setError('すべての項目を入力してください');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = () => {
    // 本来はAPIリクエスト
    setStep('done');
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>アカウント登録</h1>
        {step === 'form' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                お名前 <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：山田 太郎"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                メールアドレス <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例：sample@example.com"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>パスワード</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>パスワード（確認）</label>
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                住所 <span style={{ color: '#d32f2f' }}>*</span>
              </label>
              <input
                className={styles.input}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例：東京都千代田区1-1-1"
                required
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button className={styles.submitButton} type="submit">
              登録内容を確認
            </button>
          </form>
        )}
        {step === 'confirm' && (
          <div className={styles.confirmBox}>
            <h2>入力内容の確認</h2>
            <div className={styles.confirmRow}>
              <span>お名前</span>
              <span>{name}</span>
            </div>
            <div className={styles.confirmRow}>
              <span>メールアドレス</span>
              <span>{email}</span>
            </div>
            <div className={styles.confirmRow}>
              <span>住所</span>
              <span>{address}</span>
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.submitButton} onClick={handleConfirm}>
                登録
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setStep('form')}
              >
                戻る
              </button>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className={styles.doneBox}>
            <div className={styles.checkIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#4caf50" />
                <path
                  d="M14 25l7 7 13-13"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>メール送信しました</h2>
            <p>
              ご登録のメールアドレス宛に確認メールを送信しました。
              <br />
              メールをご確認のうえ、認証手続きを完了してください。
            </p>
            <button
              className={styles.submitButton}
              onClick={() => router.push('/')}
            >
              ホームへ
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
