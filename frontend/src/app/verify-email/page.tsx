'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyEmail } from '@/api/register';
import styles from '@/app/register/register.module.css';
import MainLayout from '@/components/Layout/MainLayout';
import LoginModal from '@/components/LoginModal/LoginModal';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('メール認証を処理中です...');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('検証トークンが指定されていません。');
        return;
      }

      try {
        const response = await verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage(
            response.message || 'メールアドレスの認証に成功しました。',
          );
          // 自動でモーダルを開く（1秒後）
          setTimeout(() => {
            setIsLoginModalOpen(true);
          }, 1000);
        } else {
          setStatus('error');
          setMessage(response.message || 'メール認証に失敗しました。');
        }
      } catch (err) {
        setStatus('error');
        const errorMessage =
          err instanceof Error ? err.message : 'メール認証に失敗しました。';
        setMessage(errorMessage);
      }
    };

    verify();
  }, [token, router]);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.verificationBox}>
          <div className={styles.checkIcon}>
            {status === 'loading' && (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#007bff"
                  strokeWidth="2"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#007bff"
                  strokeWidth="2"
                  strokeDasharray="31.4 94.2"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </svg>
            )}
            {status === 'success' && (
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
            )}
            {status === 'error' && (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#e74c3c" />
                <path
                  d="M15 15l18 18M33 15L15 33"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <h2 style={{ marginBottom: '16px' }}>
            {status === 'loading' && 'メール認証中'}
            {status === 'success' && '認証成功'}
            {status === 'error' && '認証失敗'}
          </h2>

          <p
            style={{ marginBottom: '24px', textAlign: 'center', color: '#666' }}
          >
            {message}
          </p>

          {status === 'error' && (
            <div className={styles.verificationActions}>
              <button
                className={styles.submitButton}
                onClick={() => router.push('/register')}
              >
                会員登録に戻る
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => router.push('/')}
              >
                ホームへ
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.verificationActions}>
              <button
                className={styles.submitButton}
                onClick={() => setIsLoginModalOpen(true)}
              >
                ログインする
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => router.push('/')}
              >
                ホームへ
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          router.push('/');
        }}
      />
    </MainLayout>
  );
}
