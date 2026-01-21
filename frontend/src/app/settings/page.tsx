'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { TextInput } from '@/components/Input/TextInput';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import {
  updateProfile,
  changePassword,
  deleteAccount,
  getUserProfile,
} from '@/api/auth';
import styles from './settings.module.css';

interface ProfileFormData {
  name: string;
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
    phone: '',
    sex: '',
  });
  const [isSexDropdownOpen, setIsSexDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  const sexOptions = [
    { id: 'male', label: '男性' },
    { id: 'female', label: '女性' },
    { id: 'other', label: 'その他' },
  ];

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ページ読み込み時にユーザープロフィールを取得
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.success && response.data) {
          setFormData((prev) => ({
            ...prev,
            name: response.data?.name || prev.name,
            phone: response.data?.phone || prev.phone,
            sex: response.data?.sex || prev.sex,
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
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>設定</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
        phone: formData.phone,
        sex: formData.sex,
      });

      if (response.success) {
        showSnackbar('プロフィールを更新しました', 'success');
      } else {
        showSnackbar(
          response.message || 'プロフィール更新に失敗しました',
          'error'
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
          'error'
        );
      }
    } catch (err) {
      console.error('Password change error:', err);
      showSnackbar('パスワード変更に失敗しました', 'error');
    }
  };

  const handleNotificationToggle = () => {
    const updated = {
      ...notificationSettings,
      emailNotifications: !notificationSettings.emailNotifications,
    };
    setNotificationSettings(updated);
    setNotificationSwitchChanged(true);
  };

  const handleNotificationUpdate = async () => {
    try {
      await updateNotificationSettings({
        emailNotifications: notificationSettings.emailNotifications,
      });
      localStorage.setItem(
        'notificationSettings',
        JSON.stringify(notificationSettings)
      );
      setNotificationSwitchChanged(false);
      showSnackbar('通知設定を更新しました', 'success');
    } catch (err) {
      console.error('Notification settings update error:', err);
      showSnackbar('通知設定の更新に失敗しました', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'アカウントを削除すると、すべてのデータが永遠に削除されます。本当に削除してもよろしいですか？'
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
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>設定</span>
        </div>

        <h1 className={styles.title}>設定</h1>

        <div className={styles.tabButtons}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'profile' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('profile')}
          >
            プロフィール
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'password' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('password')}
          >
            パスワード変更
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'other' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('other')}
          >
            その他
          </button>
        </div>

        {activeTab === 'profile' && (
          <form className={styles.form} onSubmit={handleProfileSubmit}>
            <div className={styles.formGroup}>
              <TextInput
                label="お名前"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例：山田 太郎"
                error={fieldErrors.name}
              />
            </div>

            <div className={styles.formGroup}>
              <TextInput
                label="電話番号"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="例：09012345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>性別</label>
              <Dropdown
                isOpen={isSexDropdownOpen}
                onToggle={() => setIsSexDropdownOpen(!isSexDropdownOpen)}
                onClose={() => setIsSexDropdownOpen(false)}
                buttonText={
                  sexOptions.find((opt) => opt.id === formData.sex)?.label ||
                  '選択してください'
                }
              >
                {sexOptions.map((option) => (
                  <div
                    key={option.id}
                    className={styles.dropdownOption}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        sex: option.id,
                      }));
                      setIsSexDropdownOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                  </div>
                ))}
              </Dropdown>
            </div>

            <button type="submit" className={styles.submitButton}>
              更新する
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form className={styles.form} onSubmit={handlePasswordSubmit}>
            <div className={styles.formGroup}>
              <TextInput
                label="現在のパスワード"
                name="currentPassword"
                inputType="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="現在のパスワードを入力"
                error={passwordErrors.currentPassword}
              />
            </div>

            <div className={styles.formGroup}>
              <TextInput
                label="新しいパスワード"
                name="newPassword"
                inputType="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワードを入力"
                error={passwordErrors.newPassword}
              />
            </div>

            <div className={styles.formGroup}>
              <TextInput
                label="新しいパスワード（確認）"
                name="confirmPassword"
                inputType="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワードを再度入力"
                error={passwordErrors.confirmPassword}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              パスワードを変更
            </button>
          </form>
        )}

        {activeTab === 'other' && (
          <div className={styles.otherSection}>
            <div className={styles.settingsCard}>
              <h2 className={styles.cardTitle}>アカウント</h2>

              <button
                className={styles.deleteAccountButton}
                onClick={handleDeleteAccount}
              >
                アカウントを削除
              </button>
              <p className={styles.deleteAccountWarning}>
                アカウントを削除すると、すべてのデータが永遠に削除されます。この操作は取り消せません。
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
