'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import Link from 'next/link';
import { Notification, getNotificationDetail } from '@/api/notifications';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Button,
} from '@mui/material';

export default function NotificationDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        const response = await getNotificationDetail(id);
        if (response.success && response.data) {
          setNotification(response.data);
          setError(null);
        } else {
          setError('お知らせが見つかりません');
        }
      } catch (err) {
        console.error('Failed to fetch notification:', err);
        setError('お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotification();
    }
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" py={6}>
          <Typography color="text.secondary">読み込み中...</Typography>
        </Box>
      </MainLayout>
    );
  }

  if (error || !notification) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            お知らせが見つかりません
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {error || 'お手数ですが、お知らせ一覧から再度お選びください。'}
          </Typography>
          <Button variant="outlined" component={Link} href="/notifications">
            お知らせ一覧に戻る
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
          <MuiLink component={Link} href="/notifications" color="inherit">
            お知らせ
          </MuiLink>
          <Typography color="text.primary">{notification.title}</Typography>
        </Breadcrumbs>

        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5" fontWeight={700}>
                {notification.title}
              </Typography>
              {notification.important && <NotificationTag tag="important" />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {new Date(notification.timestamp).toLocaleDateString('ja-JP')}
            </Typography>
          </Box>
          <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {notification.message}
          </Typography>
          <Box mt={3}>
            <Button component={Link} href="/notifications">
              ← お知らせ一覧に戻る
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
