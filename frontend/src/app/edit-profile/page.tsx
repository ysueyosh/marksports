'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import Link from 'next/link';
import { TextInput } from '@/components/Input/TextInput';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import { updateProfile, changePassword } from '@/api/auth';
import styles from './edit-profile.module.css';

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
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
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
    {}
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
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>プロフィール編集</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
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
        email: email,
        gender: formData.gender,
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
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>プロフィール編集</span>
        </div>

        <h1 className={styles.title}>プロフィール編集</h1>

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
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

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
              <div className={styles.formLabelWithCheckbox}>
                <label>メールアドレス</label>
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    id="emailEditable"
                    checked={isEmailEditable}
                    onChange={(e) => setIsEmailEditable(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label
                    htmlFor="emailEditable"
                    className={styles.checkboxLabel}
                  >
                    編集する
                  </label>
                </div>
              </div>
              <TextInput
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEmailEditable}
                placeholder="example@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>性別</label>
              <Dropdown
                isOpen={isGenderDropdownOpen}
                onToggle={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                onClose={() => setIsGenderDropdownOpen(false)}
                buttonText={
                  genderOptions.find((opt) => opt.id === formData.gender)
                    ?.label || '選択してください'
                }
              >
                {genderOptions.map((option) => (
                  <div
                    key={option.id}
                    className={styles.dropdownOption}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        gender: option.id,
                      }));
                      setIsGenderDropdownOpen(false);
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
      </div>
    </MainLayout>
  );
}
