'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import { TextInput } from '@/components/Input/TextInput';
import { verifyResetToken, resetPassword } from '@/api/auth';
import { useSnackbar } from '@/context/SnackbarContext';
import { useLoading } from '@/context/LoadingContext';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();
  const { isLoading, setIsLoading } = useLoading();

  const token = searchParams.get('token') as string;

  const [passwordReset, setPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(true);

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await verifyResetToken({ token });

        if (response.success) {
          setTokenVerified(true);
        } else {
          showSnackbar('無効または有効期限切れのリンクです', 'error');
          router.push('/forgot-password');
        }
      } catch (err) {
        showSnackbar('トークン検証エラーが発生しました', 'error');
        router.push('/forgot-password');
      } finally {
        setTokenVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenVerifying(false);
    }
  }, [token, router, showSnackbar]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'パスワードは8文字以上である必要があります';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワードを再度入力してください';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setPasswordReset(true);
        showSnackbar('パスワードをリセットしました', 'success');
      } else {
        showSnackbar(
          response.message || 'パスワードリセットに失敗しました',
          'error',
        );
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenVerifying) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            <p>トークンを確認中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!tokenVerified) {
    return null;
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <span>パスワードリセット</span>
        </div>

        <div className={styles.formWrapper}>
          <h1>新しいパスワードを設定</h1>

          {!passwordReset ? (
            <>
              <p className={styles.description}>
                新しいパスワードを入力してください。
              </p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <TextInput
                  name="newPassword"
                  label="新しいパスワード"
                  inputType="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: '' });
                    }
                  }}
                  placeholder="8文字以上のパスワード"
                  disabled={isLoading}
                  required
                  error={errors.newPassword}
                  containerStyle={{ marginBottom: '28px' }}
                />

                <TextInput
                  name="confirmPassword"
                  label="パスワード（確認）"
                  inputType="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder="パスワードを再度入力"
                  disabled={isLoading}
                  required
                  error={errors.confirmPassword}
                  containerStyle={{ marginBottom: '28px' }}
                />

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'リセット中...' : 'パスワードリセット'}
                </button>
              </form>

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
          ) : (
            <>
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>✓</div>
                <p>パスワードをリセットしました</p>
              </div>

              <p className={styles.description}>
                新しいパスワードでログインしてください。
              </p>

              <button
                onClick={() => router.push('/')}
                className={styles.successButton}
              >
                ホームへ戻る
              </button>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
