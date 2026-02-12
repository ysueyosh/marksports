'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { TextInput } from '@/components/Input/TextInput';
import {
  updateProfile,
  changePassword,
  deleteAccount,
  getUserProfile,
} from '@/api/auth';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from '@mui/material';

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  sex?: string;
}

type TabType = 'profile' | 'password' | 'other';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    sex: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  const sexOptions = [
    { id: 'male', label: '男性' },
    { id: 'female', label: '女性' },
    { id: 'other', label: 'その他' },
  ];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const normalizeSex = (value?: string) => {
    if (!value) return '';
    const map: Record<string, string> = {
      male: 'male',
      female: 'female',
      other: 'other',
      男性: 'male',
      女性: 'female',
      その他: 'other',
    };
    return map[value] ?? value;
  };

  // 設定ページ遷移時に認証ユーザー情報をフォームへ反映
  useEffect(() => {
    if (isLoggedIn && user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        sex: normalizeSex(user.sex || ''),
      }));
    }
  }, [isLoggedIn, user, pathname]);

  // ページ読み込み時にユーザープロフィールを取得
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.success && response.data) {
          setFormData((prev) => ({
            ...prev,
            name: response.data?.name || prev.name,
            email: response.data?.email || prev.email,
            phone: response.data?.phone || prev.phone,
            sex: normalizeSex(response.data?.sex) || prev.sex,
          }));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        showSnackbar('プロフィール情報の読み込みに失敗しました', 'error');
      }
    };

    if (isLoggedIn && user) {
      loadProfile();
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            設定
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name) errors.name = 'お名前を入力してください';
    if (!formData.email) errors.email = 'メールアドレスを入力してください';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword)
      errors.currentPassword = '現在のパスワードを入力してください';
    if (!newPassword) errors.newPassword = '新しいパスワードを入力してください';
    if (!confirmPassword)
      errors.confirmPassword = 'パスワード確認を入力してください';

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }

    if (newPassword && newPassword.length < 6) {
      errors.newPassword = 'パスワードは6文字以上で設定してください';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return false;
    }

    setPasswordErrors({});
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) {
      return;
    }

    try {
      const response = await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        sex: formData.sex,
      });

      if (response.success) {
        showSnackbar('プロフィールを更新しました', 'success');
      } else {
        showSnackbar(
          response.message || 'プロフィール更新に失敗しました',
          'error',
        );
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showSnackbar('プロフィール更新に失敗しました', 'error');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        showSnackbar('パスワードを変更しました', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showSnackbar(
          response.message || 'パスワード変更に失敗しました',
          'error',
        );
      }
    } catch (err) {
      console.error('Password change error:', err);
      showSnackbar('パスワード変更に失敗しました', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'アカウントを削除すると、すべてのデータが永遠に削除されます。本当に削除してもよろしいですか？',
      )
    ) {
      if (confirm('もう一度確認します。本当にアカウントを削除しますか？')) {
        try {
          await deleteAccount();
          showSnackbar('アカウントを削除しました', 'success');
          setTimeout(() => {
            logout();
            router.push('/');
          }, 1500);
        } catch (err) {
          console.error('Account deletion error:', err);
          showSnackbar('アカウント削除に失敗しました', 'error');
        }
      }
    }
  };

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href="/account" color="inherit">
            アカウント
          </MuiLink>
          <Typography color="text.primary">設定</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          設定
        </Typography>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="プロフィール" value="profile" />
          <Tab label="パスワード変更" value="password" />
          <Tab label="その他" value="other" />
        </Tabs>

        {activeTab === 'profile' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box
              component="form"
              onSubmit={handleProfileSubmit}
              display="flex"
              flexDirection="column"
              gap={2}
            >
              <TextInput
                label="お名前"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例：山田 太郎"
                error={fieldErrors.name}
              />

              <TextInput
                label="メールアドレス"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@example.com"
                error={fieldErrors.email}
              />

              <TextInput
                label="電話番号"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="例：09012345678"
              />

              <FormControl fullWidth>
                <InputLabel id="sex-label">性別</InputLabel>
                <Select
                  labelId="sex-label"
                  label="性別"
                  value={formData.sex || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sex: String(e.target.value),
                    }))
                  }
                >
                  {sexOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button type="submit" variant="contained">
                更新する
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 'password' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box
              component="form"
              onSubmit={handlePasswordSubmit}
              display="flex"
              flexDirection="column"
              gap={2}
            >
              <TextInput
                label="現在のパスワード"
                name="currentPassword"
                inputType="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="現在のパスワードを入力"
                error={passwordErrors.currentPassword}
              />

              <TextInput
                label="新しいパスワード"
                name="newPassword"
                inputType="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワードを入力"
                error={passwordErrors.newPassword}
              />

              <TextInput
                label="新しいパスワード（確認）"
                name="confirmPassword"
                inputType="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワードを再度入力"
                error={passwordErrors.confirmPassword}
              />

              <Button type="submit" variant="contained">
                パスワードを変更
              </Button>
            </Box>
          </Paper>
        )}

        {activeTab === 'other' && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                アカウント
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteAccount}
              >
                アカウントを削除
              </Button>
              <Typography color="text.secondary">
                アカウントを削除すると、すべてのデータが永遠に削除されます。この操作は取り消せません。
              </Typography>
            </Stack>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}
