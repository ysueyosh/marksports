'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Notification, getNotifications } from '@/api/notifications';
import NotificationTag from '@/components/NotificationTag/NotificationTag';

interface NotificationPopupProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
}

export default function NotificationPopup({
  isOpen,
  notifications: initialNotifications,
  onClose,
}: NotificationPopupProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  // ポップアップが開かれるたびにデータベースからお知らせを取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await getNotifications();
        if (response.success && response.data?.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        お知らせ
        <Box flex={1} />
        <IconButton onClick={onClose} aria-label="閉じる">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography color="text.secondary" align="center">
            お知らせはありません
          </Typography>
        ) : (
          <List disablePadding>
            {notifications.slice(0, 10).map((notification) => (
              <ListItemButton
                key={notification.id}
                component={Link}
                href={`/notifications/detail?id=${notification.id}`}
                onClick={onClose}
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  mb: 1,
                  borderRadius: 2,
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {notification.title}
                      </Typography>
                      {notification.important && (
                        <NotificationTag tag="important" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(notification.timestamp).toLocaleDateString(
                          'ja-JP',
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button component={Link} href="/notifications" onClick={onClose}>
          すべて見る →
        </Button>
      </DialogActions>
    </Dialog>
  );
}
