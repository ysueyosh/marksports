'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin-login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ログイン済みの場合は管理者ホームに遷移
    const adminLogged = localStorage.getItem('adminLogged');
    if (adminLogged) {
      router.push('/admin/home');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // デバッグ中: メールアドレスとパスワードが両方入力されていればログイン可能
      if (email && password) {
        // 管理者ログイン成功
        localStorage.setItem('adminLogged', 'true');
        localStorage.setItem('adminEmail', email);
        router.push('/admin/home');
      } else {
        setError('メールアドレスとパスワードを入力してください');
      }
    } catch (err) {
      setError('ログイン処理でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.fullScreen}>
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>管理者ログイン</h1>

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
                placeholder="メールアドレス"
                className={styles.input}
                required
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
                placeholder="パスワード"
                className={styles.input}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <button onClick={() => router.back()} className={styles.backButton}>
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  );
}
