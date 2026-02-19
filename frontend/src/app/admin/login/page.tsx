'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminLogin } from '@/api/admin';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Link as MuiLink,
} from '@mui/material';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      errors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
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
      <Paper sx={{ p: { xs: 3, md: 4 }, width: '100%', maxWidth: 420 }}>
        {isInitializing ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography>読み込み中...</Typography>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              管理者ログイン
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              display="flex"
              flexDirection="column"
              gap={2}
              noValidate
            >
              <TextField
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="メールアドレス"
                required
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                fullWidth
              />

              <TextField
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="パスワード"
                required
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password}
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </Box>

            <Stack spacing={1}>
              <MuiLink component={Link} href="/admin/create-admin">
                新規管理者ユーザーを作成
              </MuiLink>
              <MuiLink component={Link} href="/">
                ← ホーム画面へ
              </MuiLink>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
