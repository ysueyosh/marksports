'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createAdmin } from '@/api/admin';
import Snackbar from '@/components/Snackbar/Snackbar';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';

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
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper sx={{ p: { xs: 3, md: 4 }, width: '100%', maxWidth: 560 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              管理者ユーザー作成
            </Typography>
            <Typography color="text.secondary">
              新しい管理者アカウントを作成します
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <TextField
              label="名前"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="山田太郎"
              error={Boolean(errors.name)}
              helperText={errors.name}
              disabled={loading}
              required
              fullWidth
            />

            <TextField
              label="メールアドレス"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              error={Boolean(errors.email)}
              helperText={errors.email}
              disabled={loading}
              required
              fullWidth
            />

            <TextField
              label="パスワード"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8文字以上のパスワード"
              error={Boolean(errors.password)}
              helperText={
                errors.password || '8文字以上のパスワードを設定してください'
              }
              disabled={loading}
              required
              fullWidth
            />

            <TextField
              label="パスワード確認"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="パスワードを再入力"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              disabled={loading}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '作成中...' : '管理者ユーザーを作成'}
            </Button>
          </Box>

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              既存の管理者ですか？
            </Typography>
            <MuiLink component={Link} href="/admin/login">
              ログインページへ
            </MuiLink>
            <MuiLink component={Link} href="/">
              ← ホーム画面へ
            </MuiLink>
          </Stack>
        </Stack>

        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          />
        )}
      </Paper>
    </Box>
  );
}
