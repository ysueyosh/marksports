'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import adminNotificationAPI from '@/api/admin-notifications';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Paper,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';

interface Notification {
  notificationId: string;
  type: 'info' | 'important' | 'sale';
  target: 'all' | 'members';
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'important' | 'sale',
    target: 'all' as 'all' | 'members',
    startDate: '',
    endDate: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
      loadNotifications();
    }
  }, [router]);

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminNotificationAPI.getAllNotifications(
        page,
        itemsPerPage,
      );

      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      } else {
        setErrorMessage(response.message || 'データ取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setErrorMessage(error.message || 'お知らせ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  const handleAddNotification = async () => {
    if (
      newNotification.title &&
      newNotification.content &&
      newNotification.startDate
    ) {
      try {
        setLoading(true);
        const response = await adminNotificationAPI.createNotification({
          type: newNotification.type,
          target: newNotification.target,
          title: newNotification.title,
          content: newNotification.content,
          startDate: newNotification.startDate,
          endDate: newNotification.endDate || undefined,
        });

        if (response.success) {
          setSuccessMessage('お知らせを配信しました');
          setNewNotification({
            title: '',
            content: '',
            type: 'info',
            target: 'all',
            startDate: '',
            endDate: '',
          });
          setIsModalOpen(false);
          setTimeout(() => setSuccessMessage(''), 3000);
          loadNotifications();
        } else {
          setErrorMessage(response.message || '配信に失敗しました');
        }
      } catch (error: any) {
        console.error('Error creating notification:', error);
        setErrorMessage(error.message || 'お知らせの作成に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId !== null) {
      const targetNotification = notifications.find(
        (n) => n.notificationId === deleteTargetId,
      );
      if (targetNotification && deleteInputValue === targetNotification.title) {
        try {
          setLoading(true);
          const response =
            await adminNotificationAPI.deleteNotification(deleteTargetId);

          if (response.success) {
            setSuccessMessage('お知らせを削除しました');
            setIsDeleteConfirming(false);
            setDeleteTargetId(null);
            setDeleteInputValue('');
            setTimeout(() => setSuccessMessage(''), 3000);
            loadNotifications(currentPage);
          } else {
            setErrorMessage(response.message || '削除に失敗しました');
          }
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          setErrorMessage(error.message || 'お知らせの削除に失敗しました');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewNotification({
      title: '',
      content: '',
      type: 'info',
      target: 'all',
      startDate: '',
      endDate: '',
    });
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            お知らせ配信
          </Typography>
          <Button
            variant={isModalOpen ? 'outlined' : 'contained'}
            onClick={() => setIsModalOpen(!isModalOpen)}
            disabled={loading}
          >
            {isModalOpen ? 'キャンセル' : 'お知らせを配信'}
          </Button>
        </Box>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {isDeleteConfirming && deleteTargetId !== null && (
          <AdminModal
            isOpen={isDeleteConfirming}
            onClose={handleCancelDelete}
            title="お知らせを削除"
            buttons={
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={handleCancelDelete} disabled={loading}>
                  キャンセル
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleConfirmDelete}
                  disabled={
                    deleteInputValue !==
                      notifications.find(
                        (n) => n.notificationId === deleteTargetId,
                      )?.title || loading
                  }
                >
                  削除する
                </Button>
              </Stack>
            }
          >
            {notifications.find((n) => n.notificationId === deleteTargetId) && (
              <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                <Typography color="error" fontWeight={700} mb={1}>
                  ⚠️ 確認: 以下のお知らせを削除します
                </Typography>
                <Typography variant="body2" mb={2}>
                  <strong>タイトル:</strong>{' '}
                  {
                    notifications.find(
                      (n) => n.notificationId === deleteTargetId,
                    )?.title
                  }
                </Typography>
                <TextField
                  fullWidth
                  label="削除確認"
                  value={deleteInputValue}
                  onChange={(e) => setDeleteInputValue(e.target.value)}
                  placeholder={`「${
                    notifications.find(
                      (n) => n.notificationId === deleteTargetId,
                    )?.title
                  }」と入力`}
                />
              </Box>
            )}
          </AdminModal>
        )}

        <AdminModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="お知らせを配信"
          buttons={
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={handleCloseModal} disabled={loading}>
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={handleAddNotification}
                disabled={loading}
              >
                {loading ? '配信中...' : '配信実行'}
              </Button>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <TextField
              label="タイトル"
              value={newNotification.title}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  title: e.target.value,
                })
              }
              placeholder="タイトルを入力"
              required
              fullWidth
            />
            <TextField
              label="本文"
              value={newNotification.content}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  content: e.target.value,
                })
              }
              placeholder="本文を入力"
              rows={5}
              multiline
              required
              fullWidth
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="掲載開始日"
                type="date"
                value={newNotification.startDate}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    startDate: e.target.value,
                  })
                }
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="掲載終了日"
                type="date"
                value={newNotification.endDate}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <Select
                  value={newNotification.type}
                  onChange={(e) =>
                    setNewNotification({
                      ...newNotification,
                      type: e.target.value as 'info' | 'important' | 'sale',
                    })
                  }
                >
                  <MenuItem value="info">一般情報</MenuItem>
                  <MenuItem value="important">重要</MenuItem>
                  <MenuItem value="sale">セール</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <Select
                  value={newNotification.target}
                  onChange={(e) =>
                    setNewNotification({
                      ...newNotification,
                      target: e.target.value as 'all' | 'members',
                    })
                  }
                >
                  <MenuItem value="all">すべてのユーザー</MenuItem>
                  <MenuItem value="members">登録済みユーザーのみ</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </AdminModal>

        <Stack spacing={2}>
          {loading && notifications.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              読み込み中...
            </Typography>
          ) : notifications.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              お知らせはまだありません
            </Typography>
          ) : (
            notifications.map((notification) => (
              <Paper
                key={notification.notificationId}
                variant="outlined"
                sx={{ p: 2 }}
              >
                <Stack spacing={1}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        配信日: {notification.startDate}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={
                          notification.type === 'important'
                            ? '🔴 重要'
                            : notification.type === 'sale'
                              ? '🎉 セール'
                              : 'ℹ️ 情報'
                        }
                        color={
                          notification.type === 'important'
                            ? 'error'
                            : notification.type === 'sale'
                              ? 'success'
                              : 'default'
                        }
                      />
                      <Chip
                        size="small"
                        label={
                          notification.target === 'all'
                            ? '👥 全ユーザー'
                            : '👤 会員のみ'
                        }
                      />
                    </Stack>
                  </Box>
                  <Typography>{notification.content}</Typography>
                  <Box>
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() =>
                        handleStartDelete(notification.notificationId)
                      }
                      disabled={loading}
                    >
                      削除
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>

        {notifications.length > 0 && (
          <Box display="flex" justifyContent="center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => loadNotifications(page)}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
