'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import { TextInput } from '@/components/Input/TextInput';
import { verifyResetToken, resetPassword } from '@/api/auth';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Paper,
} from '@mui/material';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();

  const token = searchParams.get('token') as string;

  const [passwordReset, setPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.push('/forgot-password');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = '新しいパスワードを入力してください';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'パスワードは8文字以上必要です';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認を入力してください';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
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
      setIsSubmitting(false);
    }
  };

  if (tokenVerifying) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="text.secondary">検証中...</Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!tokenVerified) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={Link} href="/" color="inherit">
              ホーム
            </MuiLink>
            <Typography color="text.primary">パスワードリセット</Typography>
          </Breadcrumbs>
        </Box>

        <Paper
          variant="outlined"
          sx={{ p: { xs: 3, md: 4 }, maxWidth: 500, mx: 'auto' }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            新しいパスワードを設定
          </Typography>

          {!passwordReset ? (
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <Typography color="text.secondary">
                新しいパスワードを入力してください。
              </Typography>

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
                disabled={isSubmitting}
                required
                error={errors.newPassword}
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
                disabled={isSubmitting}
                required
                error={errors.confirmPassword}
              />

              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'リセット中...' : 'パスワードリセット'}
              </Button>

              <MuiLink
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/');
                }}
              >
                ホームへ戻る
              </MuiLink>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography fontWeight={700}>
                パスワードがリセットされました
              </Typography>
              <Typography color="text.secondary">
                新しいパスワードの設定が完了しました。以下のボタンからホームに戻ってください。
              </Typography>
              <Button variant="contained" onClick={() => router.push('/')}>
                ホームへ戻る
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}
