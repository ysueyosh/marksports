'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './users.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface User {
  id: number;
  name: string;
  email: string;
  registeredDate: string;
  status: 'active' | 'suspended';
  address?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: '山田太郎',
      email: 'yamada@example.com',
      registeredDate: '2024-01-15',
      status: 'active',
      address: '東京都渋谷区1-1-1',
    },
    {
      id: 2,
      name: '佐藤花子',
      email: 'sato@example.com',
      registeredDate: '2024-02-20',
      status: 'active',
      address: '大阪府大阪市2-2-2',
    },
    {
      id: 3,
      name: '鈴木次郎',
      email: 'suzuki@example.com',
      registeredDate: '2024-03-10',
      status: 'suspended',
      address: '愛知県名古屋市3-3-3',
    },
    {
      id: 4,
      name: '田中美咲',
      email: 'tanaka@example.com',
      registeredDate: '2024-03-15',
      status: 'active',
      address: '福岡県福岡市4-4-4',
    },
    {
      id: 5,
      name: '渡辺健一',
      email: 'watanabe@example.com',
      registeredDate: '2024-04-05',
      status: 'active',
      address: '神奈川県横浜市5-5-5',
    },
    {
      id: 6,
      name: '山本有希',
      email: 'yamamoto@example.com',
      registeredDate: '2024-04-10',
      status: 'active',
      address: '京都府京都市6-6-6',
    },
    {
      id: 7,
      name: '伊藤勇太',
      email: 'itoh@example.com',
      registeredDate: '2024-04-12',
      status: 'active',
      address: '兵庫県神戸市7-7-7',
    },
    {
      id: 8,
      name: '高橋あかり',
      email: 'takahashi@example.com',
      registeredDate: '2024-04-15',
      status: 'active',
      address: '北海道札幌市8-8-8',
    },
    {
      id: 9,
      name: '中村翔一',
      email: 'nakamura@example.com',
      registeredDate: '2024-04-18',
      status: 'suspended',
      address: '岡山県岡山市9-9-9',
    },
    {
      id: 10,
      name: '小林ひろみ',
      email: 'kobayashi@example.com',
      registeredDate: '2024-04-20',
      status: 'active',
      address: '沖縄県那覇市10-10-10',
    },
    {
      id: 11,
      name: '長谷川毅',
      email: 'hasegawa@example.com',
      registeredDate: '2024-04-22',
      status: 'active',
      address: '広島県広島市11-11-11',
    },
    {
      id: 12,
      name: '青木麗奈',
      email: 'aoki@example.com',
      registeredDate: '2024-04-24',
      status: 'active',
      address: '群馬県高崎市12-12-12',
    },
    {
      id: 13,
      name: '鶴岡竜二',
      email: 'tsuruoka@example.com',
      registeredDate: '2024-04-26',
      status: 'active',
      address: '茨城県水戸市13-13-13',
    },
    {
      id: 14,
      name: '脇本由梨',
      email: 'wakimoto@example.com',
      registeredDate: '2024-04-28',
      status: 'active',
      address: '栃木県宇都宮市14-14-14',
    },
    {
      id: 15,
      name: '土屋こはる',
      email: 'tsuchiya@example.com',
      registeredDate: '2024-04-30',
      status: 'suspended',
      address: '千葉県千葉市15-15-15',
    },
    {
      id: 16,
      name: '根岸隆',
      email: 'negishi@example.com',
      registeredDate: '2024-05-02',
      status: 'active',
      address: '埼玉県さいたま市16-16-16',
    },
    {
      id: 17,
      name: '福島優美',
      email: 'fukushima@example.com',
      registeredDate: '2024-05-04',
      status: 'active',
      address: '静岡県浜松市17-17-17',
    },
    {
      id: 18,
      name: '栗原拓海',
      email: 'kurihara@example.com',
      registeredDate: '2024-05-06',
      status: 'active',
      address: '岐阜県岐阜市18-18-18',
    },
    {
      id: 19,
      name: '能勢瑞希',
      email: 'nose@example.com',
      registeredDate: '2024-05-08',
      status: 'active',
      address: '三重県津市19-19-19',
    },
    {
      id: 20,
      name: '福田七海',
      email: 'fukuda@example.com',
      registeredDate: '2024-05-10',
      status: 'active',
      address: '滋賀県大津市20-20-20',
    },
    {
      id: 21,
      name: '荒井由衣',
      email: 'arai@example.com',
      registeredDate: '2024-05-12',
      status: 'suspended',
      address: '和歌山県和歌山市21-21-21',
    },
    {
      id: 22,
      name: '石川弘樹',
      email: 'ishikawa@example.com',
      registeredDate: '2024-05-14',
      status: 'active',
      address: '香川県高松市22-22-22',
    },
    {
      id: 23,
      name: '北原宏太',
      email: 'kitahara@example.com',
      registeredDate: '2024-05-16',
      status: 'active',
      address: '愛媛県松山市23-23-23',
    },
    {
      id: 24,
      name: '柴田留美',
      email: 'shibata@example.com',
      registeredDate: '2024-05-18',
      status: 'active',
      address: '高知県高知市24-24-24',
    },
    {
      id: 25,
      name: '深田優亮',
      email: 'fukada@example.com',
      registeredDate: '2024-05-20',
      status: 'active',
      address: '福岡県北九州市25-25-25',
    },
  ]);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', address: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // 1秒間スピナーを表示
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // 検索条件が変更されたらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // ページ遷移時に1秒間スピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  const handleToggleStatus = (id: number) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === 'active' ? 'suspended' : 'active',
            }
          : user
      )
    );
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user: User = {
        id: Math.max(...users.map((u) => u.id), 0) + 1,
        name: newUser.name,
        email: newUser.email,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'active',
        address: newUser.address,
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', address: '' });
      setIsModalOpen(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser && editingUser.name && editingUser.email) {
      setUsers(
        users.map((user) => (user.id === editingUser.id ? editingUser : user))
      );
      setEditingUser(null);
      setIsModalOpen(false);
      setIsEditMode(false);
    }
  };

  const handleDeleteUser = () => {
    if (editingUser && deleteInputValue === editingUser.name) {
      setUsers(users.filter((user) => user.id !== editingUser.id));
      setEditingUser(null);
      setIsModalOpen(false);
      setIsEditMode(false);
      setIsDeleteConfirming(false);
      setDeleteInputValue('');
    } else {
      alert('ユーザー名が正しくありません');
    }
  };

  const handleStartDelete = () => {
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', address: '' });
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  // ユーザーをフィルタリング
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // ページング計算
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>ユーザー管理</h1>
          <button className={styles.primaryButton} onClick={handleOpenAddModal}>
            新規ユーザー登録
          </button>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="ユーザー名またはメールアドレスで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <AdminTable
          columns={[
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'name', label: 'ユーザー名' },
            {
              key: 'email',
              label: 'メールアドレス',
              hide: { mobile: true, tablet: true },
            },
            {
              key: 'address',
              label: '住所',
              render: (value) => value || '-',
              hide: { mobile: true },
            },
            { key: 'registeredDate', label: '登録日', hide: { mobile: true } },
            {
              key: 'status',
              label: 'ステータス',
              render: (value) => (
                <span className={`${styles.badge} ${styles[value]}`}>
                  {value === 'active' ? '有効' : '停止'}
                </span>
              ),
            },
          ]}
          data={paginatedUsers}
          rowKey="id"
          actions={[
            {
              label: '編集',
              onClick: (row) => handleEditUser(row),
              variant: 'primary',
            },
          ]}
          emptyMessage="ユーザーが見つかりません"
        />

        <div className={styles.pagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        <AdminModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={isEditMode ? 'ユーザーを編集' : '新規ユーザーを登録'}
          buttons={
            <div
              className={styles.formActions}
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex' }}>
                {isEditMode && !isDeleteConfirming && (
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
                  onClick={handleCloseModal}
                >
                  キャンセル
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={isEditMode ? handleSaveUser : handleAddUser}
                >
                  {isEditMode ? '保存' : '登録'}
                </button>
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
              <p
                style={{
                  margin: '8px 0',
                  fontSize: '14px',
                  color: '#1f2937',
                }}
              >
                <strong>ユーザー名:</strong> {editingUser.name}
              </p>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  marginTop: '12px',
                }}
              >
                削除するには、ユーザー名を入力してください
              </label>
              <input
                type="text"
                value={deleteInputValue}
                onChange={(e) => setDeleteInputValue(e.target.value)}
                placeholder={`「${editingUser.name}」と入力`}
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
                  onClick={handleDeleteUser}
                  disabled={deleteInputValue !== editingUser.name}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor:
                      deleteInputValue === editingUser.name
                        ? '#dc2626'
                        : '#f3f4f6',
                    color:
                      deleteInputValue === editingUser.name
                        ? 'white'
                        : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    cursor:
                      deleteInputValue === editingUser.name
                        ? 'pointer'
                        : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  削除する
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
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              ユーザー名*
            </label>
            <input
              type="text"
              value={isEditMode ? editingUser?.name || '' : newUser.name}
              onChange={(e) => {
                if (isEditMode && editingUser) {
                  setEditingUser({ ...editingUser, name: e.target.value });
                } else {
                  setNewUser({ ...newUser, name: e.target.value });
                }
              }}
              placeholder="ユーザー名を入力"
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
              メールアドレス*
            </label>
            <input
              type="email"
              value={isEditMode ? editingUser?.email || '' : newUser.email}
              onChange={(e) => {
                if (isEditMode && editingUser) {
                  setEditingUser({ ...editingUser, email: e.target.value });
                } else {
                  setNewUser({ ...newUser, email: e.target.value });
                }
              }}
              placeholder="メールアドレスを入力"
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
              住所
            </label>
            <input
              type="text"
              value={isEditMode ? editingUser?.address || '' : newUser.address}
              onChange={(e) => {
                if (isEditMode && editingUser) {
                  setEditingUser({
                    ...editingUser,
                    address: e.target.value,
                  });
                } else {
                  setNewUser({ ...newUser, address: e.target.value });
                }
              }}
              placeholder="住所を入力"
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

          {isEditMode && editingUser && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                ステータス
              </label>
              <select
                value={editingUser.status}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    status: e.target.value as 'active' | 'suspended',
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="active">有効</option>
                <option value="suspended">停止</option>
              </select>
            </div>
          )}
        </AdminModal>
      </div>
    </>
  );
}
