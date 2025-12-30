'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './notifications.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface Notification {
  id: number;
  title: string;
  content: string;
  createdDate: string;
  published: boolean;
  distributionMethod: 'email' | 'site'; // メール配信 or サイト内通知
  targetAudience: 'all' | 'members'; // すべてのユーザー or 登録済みユーザーのみ
  sentDate?: string;
  recipientCount?: number;
  tag?: 'important' | 'sale';
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: '新商品「バスケットボール」を追加しました',
      content: 'Mark Sportsに新しいバスケットボールが入荷しました。',
      createdDate: '2024-04-10',
      published: true,
      distributionMethod: 'email',
      targetAudience: 'all',
      sentDate: '2024-04-10',
      recipientCount: 48,
    },
    {
      id: 2,
      title: 'GW セール開催のお知らせ',
      content:
        '4月27日（土）～5月6日（月）の期間、全商品20%OFFのセールを開催します。',
      createdDate: '2024-04-05',
      published: true,
      distributionMethod: 'site',
      targetAudience: 'members',
      sentDate: '2024-04-05',
      recipientCount: 48,
    },
    {
      id: 3,
      title: 'システムメンテナンスのお知らせ',
      content:
        '4月15日 23:00～4月16日 2:00 の間、システムメンテナンスのためサイトがご利用いただけません。',
      createdDate: '2024-04-01',
      published: true,
      distributionMethod: 'email',
      targetAudience: 'all',
      sentDate: '2024-04-01',
      recipientCount: 48,
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    distributionMethod: 'email' as 'email' | 'site',
    targetAudience: 'all' as 'all' | 'members',
    tag: '' as '' | 'important' | 'sale',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'email' | 'site'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title'>(
    'date-desc'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  const handleAddNotification = () => {
    if (newNotification.title && newNotification.content) {
      const notification: Notification = {
        id: Math.max(...notifications.map((n) => n.id), 0) + 1,
        title: newNotification.title,
        content: newNotification.content,
        createdDate: new Date().toISOString().split('T')[0],
        published: true,
        distributionMethod: newNotification.distributionMethod,
        targetAudience: newNotification.targetAudience,
        sentDate: new Date().toISOString().split('T')[0],
        recipientCount: newNotification.targetAudience === 'all' ? 48 : 48, // ダミーユーザー数
        tag: newNotification.tag || undefined,
      };
      setNotifications([notification, ...notifications]);
      setNewNotification({
        title: '',
        content: '',
        distributionMethod: 'email',
        targetAudience: 'all',
        tag: '',
      });
      setIsModalOpen(false);
      setSuccessMessage('お知らせを配信しました');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleStartDelete = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId !== null) {
      const targetNotification = notifications.find(
        (n) => n.id === deleteTargetId
      );
      if (targetNotification && deleteInputValue === targetNotification.title) {
        setNotifications(
          notifications.filter(
            (notification) => notification.id !== deleteTargetId
          )
        );
        setIsDeleteConfirming(false);
        setDeleteTargetId(null);
        setDeleteInputValue('');
        setSuccessMessage('お知らせを削除しました');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewNotification({
      title: '',
      content: '',
      distributionMethod: 'email',
      targetAudience: 'all',
      tag: '',
    });
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  // フィルタリング、検索、ソート
  const filteredNotifications = notifications
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMethod =
        filterMethod === 'all' || n.distributionMethod === filterMethod;
      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
      } else if (sortBy === 'date-asc') {
        return (
          new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        );
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'ja');
      }
      return 0;
    });

  // ページング計算
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>お知らせ配信</h1>
        <button
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(!isModalOpen)}
        >
          {isModalOpen ? 'キャンセル' : 'お知らせを配信'}
        </button>
      </div>

      {successMessage && (
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
          {successMessage}
        </div>
      )}

      {isDeleteConfirming && deleteTargetId !== null && (
        <AdminModal
          isOpen={isDeleteConfirming}
          onClose={handleCancelDelete}
          title="お知らせを削除"
          buttons={
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              <button
                className={styles.secondaryButton}
                onClick={handleCancelDelete}
              >
                キャンセル
              </button>
              <button
                className={`${styles.primaryButton} ${styles.danger}`}
                onClick={handleConfirmDelete}
                disabled={
                  deleteInputValue !==
                  notifications.find((n) => n.id === deleteTargetId)?.title
                }
                style={{
                  opacity:
                    deleteInputValue !==
                    notifications.find((n) => n.id === deleteTargetId)?.title
                      ? 0.5
                      : 1,
                  cursor:
                    deleteInputValue !==
                    notifications.find((n) => n.id === deleteTargetId)?.title
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                削除する
              </button>
            </div>
          }
        >
          {notifications.find((n) => n.id === deleteTargetId) && (
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
                ⚠️ 確認: 以下のお知らせを削除します
              </label>
              <p
                style={{
                  margin: '8px 0',
                  fontSize: '14px',
                  color: '#1f2937',
                }}
              >
                <strong>タイトル:</strong>{' '}
                {notifications.find((n) => n.id === deleteTargetId)?.title}
              </p>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  marginTop: '12px',
                }}
              >
                削除を確認するため、タイトルを入力してください
              </label>
              <input
                type="text"
                value={deleteInputValue}
                onChange={(e) => setDeleteInputValue(e.target.value)}
                placeholder={`「${
                  notifications.find((n) => n.id === deleteTargetId)?.title
                }」と入力`}
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
            </div>
          )}
        </AdminModal>
      )}

      <AdminModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="お知らせを配信"
        buttons={
          <div
            className={styles.formActions}
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <button
              className={styles.secondaryButton}
              onClick={handleCloseModal}
            >
              キャンセル
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleAddNotification}
            >
              配信実行
            </button>
          </div>
        }
      >
        <div className={styles.formGroup}>
          <label>タイトル *</label>
          <input
            type="text"
            value={newNotification.title}
            onChange={(e) =>
              setNewNotification({
                ...newNotification,
                title: e.target.value,
              })
            }
            placeholder="タイトルを入力"
            required
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
        <div className={styles.formGroup}>
          <label>本文 *</label>
          <textarea
            value={newNotification.content}
            onChange={(e) =>
              setNewNotification({
                ...newNotification,
                content: e.target.value,
              })
            }
            placeholder="本文を入力"
            rows={5}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className={styles.formGroup}>
            <label>配信方法</label>
            <select
              value={newNotification.distributionMethod}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  distributionMethod: e.target.value as 'email' | 'site',
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
              <option value="email">メール配信</option>
              <option value="site">サイト内通知</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>配信対象</label>
            <select
              value={newNotification.targetAudience}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  targetAudience: e.target.value as 'all' | 'members',
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
              <option value="all">すべてのユーザー</option>
              <option value="members">登録済みユーザーのみ</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>タグ</label>
            <select
              value={newNotification.tag}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  tag: e.target.value as '' | 'important' | 'sale',
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
              <option value="">なし</option>
              <option value="important">重要</option>
              <option value="sale">セール</option>
            </select>
          </div>
        </div>
      </AdminModal>

      {/* 検索・フィルタリング・ソート */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="タイトルや本文で検索..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterBox}>
        <select
          value={filterMethod}
          onChange={(e) => {
            setFilterMethod(e.target.value as any);
            setCurrentPage(1);
          }}
          className={styles.filterSelect}
        >
          <option value="all">すべての配信方法</option>
          <option value="email">メール配信</option>
          <option value="site">サイト内通知</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as any);
          }}
          className={styles.filterSelect}
        >
          <option value="date-desc">日時：新しい順</option>
          <option value="date-asc">日時：古い順</option>
          <option value="title">タイトル：A-Z順</option>
        </select>
      </div>

      <div className={styles.notificationsList}>
        {paginatedNotifications.map((notification) => (
          <div key={notification.id} className={styles.notificationCard}>
            <div className={styles.notificationHeader}>
              <div>
                <h3>{notification.title}</h3>
                <p className={styles.notificationDate}>
                  配信日: {notification.sentDate || notification.createdDate}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  className={`${styles.badge} ${
                    notification.distributionMethod === 'email'
                      ? styles.active
                      : styles.suspended
                  }`}
                >
                  {notification.distributionMethod === 'email'
                    ? '📧 メール'
                    : '📢 サイト内'}
                </span>
                <span
                  className={`${styles.badge} ${
                    notification.published ? styles.active : styles.suspended
                  }`}
                >
                  {notification.published ? '配信済み' : '下書き'}
                </span>
              </div>
            </div>
            <p className={styles.notificationContent}>{notification.content}</p>
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '12px',
              }}
            >
              <p>
                配信対象:{' '}
                {notification.targetAudience === 'all'
                  ? 'すべてのユーザー'
                  : '登録済みユーザーのみ'}
                {notification.recipientCount &&
                  ` (${notification.recipientCount}件)`}
              </p>
            </div>
            <div className={styles.notificationActions}>
              <button
                className={`${styles.secondaryButton} ${styles.danger}`}
                onClick={() => handleStartDelete(notification.id)}
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ページネーション */}
      {filteredNotifications.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
