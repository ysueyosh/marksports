'use client';

export const runtime = 'edge';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import { requestPasswordReset } from '@/api/auth';
import { useSnackbar } from '@/context/SnackbarContext';
import { useLoading } from '@/context/LoadingContext';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';

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

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <Typography color="text.primary">パスワードリセット</Typography>
        </Breadcrumbs>

        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            パスワードリセット
          </Typography>

          {!emailSent ? (
            <Box
              component="form"
              onSubmit={handleSubmit}
              display="flex"
              flexDirection="column"
              gap={2}
            >
              <Typography color="text.secondary">
                ご登録のメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
              </Typography>

              <TextField
                id="email"
                type="email"
                label="メールアドレス"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="example@example.com"
                disabled={isLoading}
                error={Boolean(error)}
                helperText={error}
                fullWidth
              />

              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? '送信中...' : 'リセットメール送信'}
              </Button>

              <Typography variant="body2">
                <MuiLink
                  component="button"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/');
                  }}
                >
                  ホームへ戻る
                </MuiLink>
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              <Alert severity="success">メールを送信しました</Alert>
              <Typography color="text.secondary">
                ご登録のメールアドレスにリセット用のリンクを送信しました。メール内のリンクをクリックして新しいパスワードを設定してください。
              </Typography>
              <Alert severity="warning">
                <Typography fontWeight={700}>ご確認ください</Typography>
                <List dense>
                  {[
                    'メールが届かない場合、迷惑メール（スパム）フォルダをご確認ください',
                    '@marksports.com ドメインをメール設定でブロックしている場合はご解除ください',
                  ].map((item) => (
                    <ListItem key={item} disableGutters>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
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
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}
