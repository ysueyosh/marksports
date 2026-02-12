'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  Button,
} from '@mui/material';

export default function AccountPage() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            アカウントページ
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            ログインしていません
          </Typography>
          <Button variant="outlined" component={Link} href="/">
            ホームへ戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <Typography color="text.primary">アカウント</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          アカウント
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              メニュー
            </Typography>
            <List>
              {[
                { href: '/orders', label: '注文履歴' },
                { href: '/address', label: '配送先住所管理' },
                { href: '/payment', label: 'お支払い方法' },
                { href: '/settings', label: 'アカウント設定' },
              ].map((item) => (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ width: '100%', mt: 2 }}
            >
              ログアウト
            </Button>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
}
