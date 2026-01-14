'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import { requestPasswordReset } from '@/api/auth';
import { useSnackbar } from '@/context/SnackbarContext';
import { useLoading } from '@/context/LoadingContext';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();
  const { isLoading, setIsLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    try {
      setIsLoading(true);

      const response = await requestPasswordReset({ email });

      if (response.success) {
        setEmailSent(true);
        showSnackbar('リセットメールを送信しました', 'success');
      } else {
        showSnackbar(
          response.message || 'リセットメール送信に失敗しました',
          'error'
        );
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <span>パスワードリセット</span>
        </div>

        <div className={styles.formWrapper}>
          <h1>パスワードリセット</h1>

          {!emailSent ? (
            <>
              <p className={styles.description}>
                ご登録のメールアドレスを入力してください。
                パスワードリセット用のメールをお送りします。
              </p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="example@example.com"
                    className={styles.input}
                    disabled={isLoading}
                  />
                  {error && <span className={styles.error}>{error}</span>}
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? '送信中...' : 'リセットメール送信'}
                </button>
              </form>

              <div className={styles.links}>
                <p>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/');
                    }}
                    className={styles.link}
                  >
                    ホームへ戻る
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>✓</div>
                <p>メールを送信しました</p>
              </div>

              <p className={styles.description}>
                ご登録のメールアドレスにリセット用のリンクを送信しました。
                メール内のリンクをクリックして新しいパスワードを設定してください。
              </p>

              <div
                style={{
                  backgroundColor: '#fef3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '13px',
                  color: '#856404',
                  marginTop: '16px',
                }}
              >
                <strong>ご確認ください</strong>
                <ul style={{ margin: '8px 0 0 16px', paddingLeft: '8px' }}>
                  <li>
                    メールが届かない場合、迷惑メール（スパム）フォルダをご確認ください
                  </li>
                  <li>
                    @marksports.com
                    ドメインをメール設定でブロックしている場合はご解除ください
                  </li>
                </ul>
              </div>
              <div className={styles.links}>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/');
                  }}
                  className={styles.link}
                >
                  ホームへ戻る
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
