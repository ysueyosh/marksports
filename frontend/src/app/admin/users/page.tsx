'use client';

import React, { useEffect, useState } from 'react';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import Snackbar from '@/components/Snackbar/Snackbar';
import sharedStyles from '../admin-shared.module.css';
import { adminUserAPI, User } from '@/api/admin-users';

const styles = sharedStyles;

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ページネーション
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>ユーザー管理</h1>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="メールアドレスまたは名前で検索..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <AdminTable
        columns={[
          {
            key: 'email',
            label: 'メールアドレス',
            render: (value) => (
              <span style={{ fontWeight: '500' }}>{value}</span>
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
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: value === 'active' ? '#d1fae5' : '#fee2e2',
                  color: value === 'active' ? '#065f46' : '#991b1b',
                }}
              >
                {value === 'active' ? 'アクティブ' : '非アクティブ'}
              </span>
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsDeleteConfirming(false);
          setDeleteInputValue('');
        }}
        title={editingUser ? 'ユーザーを編集' : 'ユーザー情報'}
        buttons={
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex' }}>
              {editingUser && !isDeleteConfirming && (
                <button
                  className={`${styles.secondaryButton} ${styles.danger}`}
                  onClick={handleStartDelete}
                >
                  削除
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setIsModalOpen(false);
                  setIsDeleteConfirming(false);
                  setDeleteInputValue('');
                }}
              >
                キャンセル
              </button>
              {editingUser && !isDeleteConfirming && (
                <button
                  className={styles.primaryButton}
                  onClick={handleSaveUser}
                  disabled={isLoading}
                >
                  更新
                </button>
              )}
            </div>
          </div>
        }
      >
        {isDeleteConfirming && editingUser && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
            }}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#991b1b',
              }}
            >
              ⚠️ 確認: 以下のユーザーを削除します
            </label>
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#1f2937' }}>
              <strong>ユーザーID:</strong> {editingUser.userId}
            </p>
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#1f2937' }}>
              <strong>メール:</strong> {editingUser.email}
            </p>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                marginTop: '12px',
              }}
            >
              削除を確認するため、ユーザーIDを入力してください
            </label>
            <input
              type="text"
              value={deleteInputValue}
              onChange={(e) => setDeleteInputValue(e.target.value)}
              placeholder={`「${editingUser.userId}」と入力`}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: '#fff',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteInputValue !== editingUser.userId}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor:
                    deleteInputValue === editingUser.userId
                      ? '#dc2626'
                      : '#f3f4f6',
                  color:
                    deleteInputValue === editingUser.userId
                      ? 'white'
                      : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    deleteInputValue === editingUser.userId
                      ? 'pointer'
                      : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                削除
              </button>
              <button
                onClick={handleCancelDelete}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {editingUser && !isDeleteConfirming && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                名前
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="名前を入力"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                電話番号
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="電話番号を入力"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  性別
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">未設定</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}>
                  ステータス
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                </select>
              </div>
            </div>
          </>
        )}
      </AdminModal>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar(null)}
        />
      )}
    </div>
  );
}
