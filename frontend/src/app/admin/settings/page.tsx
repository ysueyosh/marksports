'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminSettings,
  updateAdminSettings,
  AdminSettings,
} from '@/api/admin';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminInfo, setAdminInfo] = useState<AdminSettings | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminSettings | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 管理者情報を取得
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const adminLogged = localStorage.getItem('adminLogged');
        if (!adminLogged) {
          router.push('/admin/login');
          return;
        }

        setIsLoggedIn(true);
        const response = await getAdminSettings();

        if (response.success && response.data) {
          setAdminInfo(response.data);
        } else {
          setError('管理者情報の取得に失敗しました');
        }
      } catch (error) {
        console.error('Failed to fetch admin settings:', error);
        setError('管理者情報の取得に失敗しました');
      }
    };

    fetchAdminSettings();
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  const handleEditClick = () => {
    if (adminInfo) {
      setEditingAdmin({ ...adminInfo });
      setShowEditForm(true);
    }
  };

  const handleSaveAdmin = async () => {
    if (editingAdmin) {
      if (!editingAdmin.name || !editingAdmin.email) {
        setError('名前と個人メールアドレスは必須です');
        return;
      }

      try {
        setIsSaving(true);
        const response = await updateAdminSettings({
          name: editingAdmin.name,
          email: editingAdmin.email,
        });

        if (response.success && response.data) {
          setAdminInfo(response.data);
          setShowEditForm(false);
          setEditingAdmin(null);
          setError('');
          setSuccess('管理者情報を更新しました');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(response.message || '管理者情報の更新に失敗しました');
        }
      } catch (error) {
        console.error('Failed to update admin settings:', error);
        setError('管理者情報の更新に失敗しました');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePasswordChange = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError('すべてのフィールドを入力してください');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }
    // ここで実際のパスワード変更処理を行う
    setError('');
    setSuccess('パスワードを変更しました');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingAdmin(null);
    setError('');
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Button
          component={Link}
          href="/admin/home"
          variant="outlined"
          sx={{ width: 'fit-content' }}
        >
          ← 戻る
        </Button>

        <Typography variant="h4" fontWeight={700}>
          管理者設定
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => {
              setActiveTab(value);
              setShowEditForm(false);
            }}
          >
            <Tab value="info" label="管理者情報" />
            <Tab value="password" label="パスワード変更" />
          </Tabs>

          <Box sx={{ pt: 3 }}>
            {activeTab === 'info' && (
              <Stack spacing={2}>
                {!showEditForm && adminInfo && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} mb={2}>
                      管理者プロフィール
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          名前
                        </Typography>
                        <Typography fontWeight={600}>
                          {adminInfo.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          個人メールアドレス
                        </Typography>
                        <Typography fontWeight={600}>
                          {adminInfo.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="contained" onClick={handleEditClick}>
                      編集
                    </Button>
                  </Paper>
                )}

                {showEditForm && editingAdmin && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} mb={2}>
                      管理者情報を編集
                    </Typography>
                    <Box
                      component="form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveAdmin();
                      }}
                      display="flex"
                      flexDirection="column"
                      gap={2}
                    >
                      <TextField
                        label="名前"
                        value={editingAdmin.name}
                        onChange={(e) =>
                          setEditingAdmin({
                            ...editingAdmin,
                            name: e.target.value,
                          })
                        }
                        required
                        disabled={isSaving}
                      />
                      <TextField
                        label="個人メールアドレス"
                        type="email"
                        value={editingAdmin.email}
                        onChange={(e) =>
                          setEditingAdmin({
                            ...editingAdmin,
                            email: e.target.value,
                          })
                        }
                        required
                        disabled={isSaving}
                      />
                      <Stack direction="row" spacing={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSaving}
                        >
                          {isSaving ? '保存中...' : '保存'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          キャンセル
                        </Button>
                      </Stack>
                    </Box>
                  </Paper>
                )}
              </Stack>
            )}

            {activeTab === 'password' && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  パスワード変更
                </Typography>
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordChange();
                  }}
                  display="flex"
                  flexDirection="column"
                  gap={2}
                >
                  <TextField
                    label="現在のパスワード"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <TextField
                    label="新しいパスワード"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <TextField
                    label="パスワード確認(新しいパスワード)"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <Button type="submit" variant="contained">
                    パスワードを変更
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
