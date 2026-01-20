'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../admin-login.module.css';
import { adminLogin } from '@/api/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (adminLogged) {
      router.push('/admin/home');
    } else {
      setIsInitializing(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('メールアドレスとパスワードを入力してください');
        setIsLoading(false);
        return;
      }

      const response = await adminLogin({
        email,
        password,
      });

      if (response.success && response.data) {
        // トークンを localStorage に保存（adminTokensとしてJSON形式で保存）
        const adminTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: Date.now() + response.data.expiresIn * 1000,
        };

        localStorage.setItem('adminLogged', 'true');
        localStorage.setItem('adminEmail', response.data.email);
        localStorage.setItem('adminId', response.data.adminId);
        localStorage.setItem('adminName', response.data.name);
        localStorage.setItem('adminTokens', JSON.stringify(adminTokens));

        // 管理者ホームに遷移
        router.push('/admin/home');
      } else {
        setError(response.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログイン処理でエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.fullScreen}>
      <div className={styles.container}>
        <div className={styles.loginBox}>
          {isInitializing ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>読み込み中...</p>
            </div>
          ) : (
            <>
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

              <div className={styles.links}>
                <Link href="/admin/create-admin" className={styles.createLink}>
                  新規管理者ユーザーを作成
                </Link>
              </div>

              <Link href="/" className={styles.backButton}>
                ← ホーム画面へ
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
