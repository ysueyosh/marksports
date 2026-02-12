'use client';

export const runtime = 'edge';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import NotificationTag from '@/components/NotificationTag/NotificationTag';
import { useNotificationContext } from '@/context/NotificationContext';
import Link from 'next/link';
import { getNotifications, Notification } from '@/api/notifications';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Stack,
} from '@mui/material';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { decrementUnreadCount } = useNotificationContext();

  // 初回アクセス時にお知らせを取得
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        if (response.success && response.data) {
          // Backend から取得したデータに localStorage から既読状態を反映
          const readIds = getReadNotifications();
          const notificationsWithReadStatus = response.data.notifications.map(
            (n) => ({
              ...n,
              read: readIds.includes(n.id),
            }),
          );
          setNotifications(notificationsWithReadStatus);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
  }, []);

  // 既読状態をlocalstorageで管理
  const getReadNotifications = (): string[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('readNotifications');
    return stored ? JSON.parse(stored) : [];
  };

  const markAsRead = (notificationId: string) => {
    const readIds = getReadNotifications();
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
      // ローカル状態も更新
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      // Context の未読件数を 1 件減らす
      decrementUnreadCount();
    }
  };

  // フィルタリング不要、すべて表示
  const filteredNotifications = notifications;

  // ページング
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <Typography color="text.primary">お知らせ</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          お知らせ
        </Typography>

        <Typography color="text.secondary">
          全 {filteredNotifications.length} 件を表示
        </Typography>

        <Stack spacing={2}>
          {paginatedNotifications.length === 0 ? (
            <Typography color="text.secondary">お知らせがありません</Typography>
          ) : (
            paginatedNotifications.map((notification) => (
              <Card
                key={notification.id}
                variant="outlined"
                component={Link}
                href={`/notifications/detail?id=${notification.id}`}
                onClick={() => markAsRead(notification.id)}
                sx={{
                  textDecoration: 'none',
                  bgcolor: notification.read
                    ? 'background.paper'
                    : 'action.hover',
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {notification.title}
                    </Typography>
                    {notification.important && (
                      <NotificationTag tag="important" />
                    )}
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(notification.timestamp).toLocaleDateString(
                      'ja-JP',
                    )}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>

        {filteredNotifications.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Box>
    </MainLayout>
  );
}
