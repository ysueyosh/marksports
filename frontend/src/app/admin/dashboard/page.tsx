'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  List,
  ListItem,
  Divider,
} from '@mui/material';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminLogged');
    localStorage.removeItem('adminEmail');
    router.push('/');
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <Stack spacing={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4" fontWeight={700}>
              管理者ダッシュボード
            </Typography>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              ログアウト
            </Button>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                サイト管理
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                このページは管理者専用ページです。
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                現在、デモ版のため実際の管理機能は実装されていません。
              </Typography>
              <Typography fontWeight={700} mt={2}>
                今後、以下の機能を追加予定です：
              </Typography>
              <List dense>
                <ListItem>商品管理（追加・編集・削除）</ListItem>
                <ListItem>注文管理</ListItem>
                <ListItem>ユーザー管理</ListItem>
                <ListItem>レポート・統計</ListItem>
              </List>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                ログイン情報
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                あなたは管理者としてログインしています。
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{ textTransform: 'none' }}
              >
                ホームに戻る
              </Button>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </MainLayout>
  );
}
