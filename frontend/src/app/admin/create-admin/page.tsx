'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './create-admin.module.css';
import { createAdmin } from '@/api/admin';
import Snackbar from '@/components/Snackbar/Snackbar';

export default function CreateAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    // このページは常に表示（ログイン状態でもアクセス可能）
    setIsReady(true);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上である必要があります';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await createAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.success) {
        setSnackbar({
          open: true,
          message: '管理者ユーザーが正常に作成されました',
          type: 'success',
        });
        router.push('/admin/login');
      } else {
        setSnackbar({
          open: true,
          message: response.message || '管理者の作成に失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setSnackbar({
        open: true,
        message: 'エラーが発生しました。もう一度試してください',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return <div className={styles.fullScreen}>読み込み中...</div>;
  }

  return (
    <div className={styles.fullScreen}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1>管理者ユーザー作成</h1>
            <p>新しい管理者アカウントを作成します</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Name Field */}
            <div className={styles.formGroup}>
              <label htmlFor="name">名前 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="山田太郎"
                className={errors.name ? styles.inputError : ''}
                disabled={loading}
              />
              {errors.name && (
                <span className={styles.error}>{errors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div className={styles.formGroup}>
              <label htmlFor="email">メールアドレス *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className={errors.email ? styles.inputError : ''}
                disabled={loading}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="password">パスワード *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8文字以上のパスワード"
                className={errors.password ? styles.inputError : ''}
                disabled={loading}
              />
              {errors.password && (
                <span className={styles.error}>{errors.password}</span>
              )}
              <p className={styles.hint}>
                8文字以上のパスワードを設定してください
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">パスワード確認 *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="パスワードを再入力"
                className={errors.confirmPassword ? styles.inputError : ''}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className={styles.error}>{errors.confirmPassword}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? '作成中...' : '管理者ユーザーを作成'}
            </button>
          </form>

          {/* Links */}
          <div className={styles.links}>
            <div className={styles.linkContent}>
              <span className={styles.linkText}>既存の管理者ですか？</span>
              <Link href="/admin/login" className={styles.loginLink}>
                ログインページへ
              </Link>
            </div>
            <Link href="/" className={styles.backLink}>
              ← ホーム画面へ
            </Link>
          </div>
        </div>

        {/* Snackbar */}
        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          />
        )}
      </div>
    </div>
  );
}
