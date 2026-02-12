'use client';

export const runtime = 'edge';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyEmail } from '@/api/register';
import MainLayout from '@/components/Layout/MainLayout';
import LoginModal from '@/components/LoginModal/LoginModal';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

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
      <Box display="flex" justifyContent="center" py={6}>
        <Paper
          variant="outlined"
          sx={{ p: { xs: 3, md: 4 }, textAlign: 'center', maxWidth: 480 }}
        >
          <Stack spacing={2} alignItems="center">
            {status === 'loading' && <CircularProgress />}
            {status === 'success' && (
              <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
            )}
            {status === 'error' && (
              <ErrorIcon color="error" sx={{ fontSize: 56 }} />
            )}

            <Typography variant="h5" fontWeight={700}>
              {status === 'loading' && 'メール認証中'}
              {status === 'success' && '認証成功'}
              {status === 'error' && '認証失敗'}
            </Typography>

            <Typography color="text.secondary">{message}</Typography>

            {status === 'error' && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                width="100%"
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push('/register')}
                >
                  会員登録に戻る
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push('/')}
                >
                  ホームへ
                </Button>
              </Stack>
            )}

            {status === 'success' && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                width="100%"
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  ログインする
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.push('/')}
                >
                  ホームへ
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Box>

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
