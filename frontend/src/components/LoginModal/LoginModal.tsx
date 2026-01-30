'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { useCart } from '@/context/CartContext';
import { login as apiLogin } from '@/api/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { loginWithUserData } = useAuth();
  const { setUserIdentifier, fetchCart } = useCart();
  const { isLoading, setIsLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // ローディング状態を手動で制御
      setIsLoading(true);
      // APIでログイン
      const response = await apiLogin(email, password);

      if (response.success) {
        // APIから返されたユーザー情報をAuthContextに保存
        const userData = response.data;

        if (userData) {
          loginWithUserData(userData);

          // ログインユーザーのカートに切り替える
          setUserIdentifier(userData.userId);
        }
        try {
          await fetchCart();
        } catch (cartError) {
          console.error('Failed to fetch user cart:', cartError);
          // カート取得に失敗してもログイン処理は続行
        }

        setEmail('');
        setPassword('');
        onClose();
        // ログイン後、アカウントページへ遷移
        router.push('/account');
      } else {
        setError(response.message || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ログイン処理に失敗しました。時間をおいて再度お試しください。');
    } finally {
      // 最後に必ずローディング状態を解除
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ログイン</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            type="email"
            label="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="example@example.com"
            fullWidth
          />

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle2">パスワード</Typography>
            <MuiLink
              component="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                router.push('/forgot-password');
              }}
              sx={{ fontSize: 12 }}
            >
              パスワードを忘れた方
            </MuiLink>
          </Box>
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="パスワード"
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            アカウントをお持ちでない方は{' '}
            <MuiLink href="/register">こちら</MuiLink>
            から登録してください
          </Typography>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
