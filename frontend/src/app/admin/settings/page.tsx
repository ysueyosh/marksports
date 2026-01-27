'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import {
  getAdminSettings,
  updateAdminSettings,
  AdminSettings,
} from '@/api/admin';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './settings.module.css';

const styles = { ...sharedStyles, ...pageStyles };

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // ページロード時にスピナーを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 管理者情報を取得
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const adminLogged = localStorage.getItem('adminLogged');
        if (!adminLogged) {
          router.push('/admin/login');
          setIsLoading(false);
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

  const tabStyles = {
    tabContainer: {
      display: 'flex',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '20px',
      gap: '0',
    },
    tab: (isActive: boolean) => ({
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '500',
      color: isActive ? '#3b82f6' : '#6b7280',
      border: 'none',
      borderBottom: isActive ? '2px solid #3b82f6' : 'none',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      transition: 'all 0.2s',
    }),
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <Link href="/admin/home">
            <button className={styles.secondaryButton}>← 戻る</button>
          </Link>
        </div>

        <h1 className={styles.title}>管理者設定</h1>

        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              border: '1px solid #f00',
              color: '#c00',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: '#efe',
              border: '1px solid #0f0',
              color: '#060',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* タブナビゲーション */}
          <div style={tabStyles.tabContainer}>
            <button
              style={tabStyles.tab(activeTab === 'info') as React.CSSProperties}
              onClick={() => {
                setActiveTab('info');
                setShowEditForm(false);
              }}
            >
              管理者情報
            </button>
            <button
              style={
                tabStyles.tab(activeTab === 'password') as React.CSSProperties
              }
              onClick={() => {
                setActiveTab('password');
                setShowEditForm(false);
              }}
            >
              パスワード変更
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {/* 管理者情報タブ */}
            {activeTab === 'info' && (
              <>
                {!showEditForm && adminInfo && (
                  <div>
                    <h2
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '15px',
                      }}
                    >
                      管理者プロフィール
                    </h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '5px',
                          }}
                        >
                          名前
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          {adminInfo.name}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '5px',
                          }}
                        >
                          個人メールアドレス
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: '500' }}>
                          {adminInfo.email}
                        </p>
                      </div>
                    </div>
                    <button
                      className={styles.primaryButton}
                      onClick={handleEditClick}
                    >
                      編集
                    </button>
                  </div>
                )}

                {showEditForm && editingAdmin && (
                  <div>
                    <h2
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '15px',
                      }}
                    >
                      管理者情報を編集
                    </h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveAdmin();
                      }}
                    >
                      <div style={{ marginBottom: '15px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            marginBottom: '5px',
                          }}
                        >
                          名前 *
                        </label>
                        <input
                          type="text"
                          value={editingAdmin.name}
                          onChange={(e) =>
                            setEditingAdmin({
                              ...editingAdmin,
                              name: e.target.value,
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                          required
                          disabled={isSaving}
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            marginBottom: '5px',
                          }}
                        >
                          個人メールアドレス *
                        </span>
                        <input
                          type="email"
                          value={editingAdmin.email}
                          onChange={(e) =>
                            setEditingAdmin({
                              ...editingAdmin,
                              email: e.target.value,
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                          required
                          disabled={isSaving}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="submit"
                          className={styles.primaryButton}
                          disabled={isSaving}
                        >
                          {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          キャンセル
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* パスワード変更タブ */}
            {activeTab === 'password' && (
              <div>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '15px',
                  }}
                >
                  パスワード変更
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordChange();
                  }}
                >
                  <div style={{ marginBottom: '15px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '5px',
                      }}
                    >
                      現在のパスワード *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '5px',
                      }}
                    >
                      新しいパスワード *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '5px',
                      }}
                    >
                      パスワード確認(新しいパスワード) *
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.primaryButton}>
                    パスワードを変更
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
