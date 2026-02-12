'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import Link from 'next/link';
import { TextInput } from '@/components/Input/TextInput';
import { updateProfile, changePassword } from '@/api/auth';
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
  Stack,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

interface ProfileFormData {
  name: string;
  gender: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    gender: '',
  });
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  const genderOptions = [
    { id: 'male', label: '男性' },
    { id: 'female', label: '女性' },
    { id: 'other', label: 'その他' },
  ];

  // 1秒間スピナーを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('');
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
      setError('');
      return false;
    }

    setPasswordErrors({});
    return true;
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        {isLoading && <LoadingSpinner />}
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            プロフィール編集
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) {
      return;
    }

    try {
      const response = await updateProfile({
        name: formData.name,
        phone: undefined,
        sex: formData.gender,
      });

      if (response.success) {
        setError('');
        setSuccess('プロフィールを更新しました');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'プロフィール更新に失敗しました');
        setSuccess('');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('プロフィール更新に失敗しました');
      setSuccess('');
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
        setError('');
        setSuccess('パスワードを変更しました');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'パスワード変更に失敗しました');
        setSuccess('');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('パスワード変更に失敗しました');
      setSuccess('');
    }
  };

  return (
    <MainLayout>
      {isLoading && <LoadingSpinner />}
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href="/account" color="inherit">
            アカウント
          </MuiLink>
          <Typography color="text.primary">プロフィール編集</Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={700}>
          プロフィール編集
        </Typography>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="プロフィール" value="profile" />
          <Tab label="パスワード変更" value="password" />
        </Tabs>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

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

              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="subtitle2">メールアドレス</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isEmailEditable}
                        onChange={(e) => setIsEmailEditable(e.target.checked)}
                      />
                    }
                    label="編集する"
                  />
                </Box>
                <TextInput
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEmailEditable}
                  placeholder="example@example.com"
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel id="gender-label">性別</InputLabel>
                <Select
                  labelId="gender-label"
                  label="性別"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gender: String(e.target.value),
                    }))
                  }
                >
                  {genderOptions.map((option) => (
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
      </Box>
    </MainLayout>
  );
}
