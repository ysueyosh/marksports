'use client';

import React, { useEffect, useState } from 'react';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import Snackbar from '@/components/Snackbar/Snackbar';
import { adminUserAPI, User } from '@/api/admin-users';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Stack,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

interface UserForm {
  name: string;
  phone: string;
  sex: string;
  status: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [formData, setFormData] = useState<UserForm>({
    name: '',
    phone: '',
    sex: '',
    status: 'active',
  });

  // ページロード時の初期化
  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  // ユーザー一覧を読み込み
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Loading users for page:', currentPage);
      const response = await adminUserAPI.getAllUsers(currentPage, pageSize);
      console.log('Users API response:', response);

      if (response && response.success && response.data) {
        const data = response.data as any;
        console.log('Response data structure:', data);

        if (data && 'users' in data && Array.isArray(data.users)) {
          console.log('Setting users from data.users:', data.users);
          setUsers(data.users);
        } else if (Array.isArray(data)) {
          console.log('Setting users from data array:', data);
          setUsers(data);
        } else {
          console.warn('Unexpected data structure:', data);
          setUsers([]);
        }
      } else {
        console.warn('Invalid response:', response);
        setSnackbar({
          message: response?.message || 'ユーザーの読み込みに失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        message: 'ユーザーの読み込みに失敗しました',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      sex: '',
      status: 'active',
    });
    setEditingUser(null);
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  // 編集ボタンをクリック
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      sex: user.sex,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  // フォーム送信（更新）
  const handleSaveUser = async () => {
    if (!editingUser) return;

    if (!formData.name.trim()) {
      setSnackbar({ message: '名前を入力してください', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminUserAPI.updateUser(editingUser.userId, {
        name: formData.name,
        phone: formData.phone,
        sex: formData.sex,
        status: formData.status,
      });

      if (response.success) {
        setSnackbar({ message: 'ユーザー情報を更新しました', type: 'success' });
        await loadUsers();
        setIsModalOpen(false);
        resetForm();
      } else {
        setSnackbar({
          message: response.message || 'ユーザーの更新に失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        message: 'ユーザーの更新に失敗しました',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 削除確認を開始
  const handleStartDelete = () => {
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  // 削除確認をキャンセル
  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  // 削除を確定
  const handleConfirmDelete = async () => {
    if (!editingUser || deleteInputValue !== editingUser.userId) {
      setSnackbar({ message: 'ユーザーIDが正しくありません', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminUserAPI.deleteUser(editingUser.userId);

      if (response.success) {
        setSnackbar({ message: 'ユーザーを削除しました', type: 'success' });
        await loadUsers();
        setIsModalOpen(false);
        resetForm();
      } else {
        setSnackbar({
          message: response.message || 'ユーザーの削除に失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        message: 'ユーザーの削除に失敗しました',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム入力を処理
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // フィルタリング
  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ページネーション
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          ユーザー管理
        </Typography>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="メールアドレスまたは名前で検索..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Paper>

        <AdminTable
          columns={[
            {
              key: 'email',
              label: 'メールアドレス',
              render: (value) => (
                <Typography fontWeight={600}>{value}</Typography>
              ),
            },
            {
              key: 'name',
              label: '名前',
              render: (value) => value || '-',
            },
            {
              key: 'phone',
              label: '電話番号',
              render: (value) => value || '-',
              hide: { mobile: true, tablet: true },
            },
            {
              key: 'sex',
              label: '性別',
              render: (value) =>
                value === 'male' ? '男性' : value === 'female' ? '女性' : '-',
              hide: { mobile: true },
            },
            {
              key: 'status',
              label: 'ステータス',
              render: (value) => (
                <Chip
                  size="small"
                  label={value === 'active' ? 'アクティブ' : '非アクティブ'}
                  color={value === 'active' ? 'success' : 'default'}
                />
              ),
            },
            {
              key: 'createdAt',
              label: '登録日',
              render: (value) => new Date(value).toLocaleDateString('ja-JP'),
              hide: { mobile: true },
            },
          ]}
          data={displayedUsers}
          rowKey="userId"
          actions={[
            {
              label: '編集',
              onClick: (row) => handleEditClick(row),
              variant: 'primary',
            },
          ]}
          emptyMessage="ユーザーが見つかりません"
        />

        <Box display="flex" justifyContent="center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Box>

        <AdminModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsDeleteConfirming(false);
            setDeleteInputValue('');
          }}
          title={editingUser ? 'ユーザーを編集' : 'ユーザー情報'}
          buttons={
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Box>
                {editingUser && !isDeleteConfirming && (
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={handleStartDelete}
                  >
                    削除
                  </Button>
                )}
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsDeleteConfirming(false);
                    setDeleteInputValue('');
                  }}
                >
                  キャンセル
                </Button>
                {editingUser && !isDeleteConfirming && (
                  <Button
                    variant="contained"
                    onClick={handleSaveUser}
                    disabled={isLoading}
                  >
                    更新
                  </Button>
                )}
              </Stack>
            </Stack>
          }
        >
          <Stack spacing={2}>
            {isDeleteConfirming && editingUser && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderColor: 'error.main' }}
              >
                <Typography color="error" fontWeight={700} mb={1}>
                  ⚠️ 確認: 以下のユーザーを削除します
                </Typography>
                <Typography variant="body2" mb={1}>
                  <strong>ユーザーID:</strong> {editingUser.userId}
                </Typography>
                <Typography variant="body2" mb={2}>
                  <strong>メール:</strong> {editingUser.email}
                </Typography>
                <TextField
                  fullWidth
                  label="削除確認"
                  value={deleteInputValue}
                  onChange={(e) => setDeleteInputValue(e.target.value)}
                  placeholder={`「${editingUser.userId}」と入力`}
                />
                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    color="error"
                    variant="contained"
                    fullWidth
                    onClick={handleConfirmDelete}
                    disabled={deleteInputValue !== editingUser.userId}
                  >
                    削除
                  </Button>
                  <Button fullWidth onClick={handleCancelDelete}>
                    キャンセル
                  </Button>
                </Stack>
              </Paper>
            )}

            {editingUser && !isDeleteConfirming && (
              <>
                <TextField
                  label="メールアドレス"
                  value={editingUser.email}
                  disabled
                  fullWidth
                />
                <TextField
                  label="名前"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="名前を入力"
                  fullWidth
                />
                <TextField
                  label="電話番号"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="電話番号を入力"
                  fullWidth
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <FormControl fullWidth>
                    <Select
                      name="sex"
                      value={formData.sex}
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="">未設定</MenuItem>
                      <MenuItem value="male">男性</MenuItem>
                      <MenuItem value="female">女性</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="active">アクティブ</MenuItem>
                      <MenuItem value="inactive">非アクティブ</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}
          </Stack>
        </AdminModal>

        {snackbar && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar(null)}
          />
        )}
      </Stack>
    </Box>
  );
}
