'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './notifications.module.css';
import adminNotificationAPI from '@/api/admin-notifications';

const styles = { ...sharedStyles, ...pageStyles };

interface Notification {
  notificationId: string;
  type: 'info' | 'important' | 'sale';
  target: 'all' | 'members';
  title: string;
  content: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'important' | 'sale',
    target: 'all' as 'all' | 'members',
    startDate: '',
    endDate: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
      loadNotifications();
    }
  }, [router]);

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminNotificationAPI.getAllNotifications(
        page,
        itemsPerPage
      );

      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      } else {
        setErrorMessage(response.message || 'データ取得に失敗しました');
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      setErrorMessage(error.message || 'お知らせ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  const handleAddNotification = async () => {
    if (
      newNotification.title &&
      newNotification.content &&
      newNotification.startDate
    ) {
      try {
        setLoading(true);
        const response = await adminNotificationAPI.createNotification({
          type: newNotification.type,
          target: newNotification.target,
          title: newNotification.title,
          content: newNotification.content,
          startDate: newNotification.startDate,
          endDate: newNotification.endDate || undefined,
        });

        if (response.success) {
          setSuccessMessage('お知らせを配信しました');
          setNewNotification({
            title: '',
            content: '',
            type: 'info',
            target: 'all',
            startDate: '',
            endDate: '',
          });
          setIsModalOpen(false);
          setTimeout(() => setSuccessMessage(''), 3000);
          loadNotifications();
        } else {
          setErrorMessage(response.message || '配信に失敗しました');
        }
      } catch (error: any) {
        console.error('Error creating notification:', error);
        setErrorMessage(error.message || 'お知らせの作成に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId !== null) {
      const targetNotification = notifications.find(
        (n) => n.notificationId === deleteTargetId
      );
      if (targetNotification && deleteInputValue === targetNotification.title) {
        try {
          setLoading(true);
          const response = await adminNotificationAPI.deleteNotification(
            deleteTargetId
          );

          if (response.success) {
            setSuccessMessage('お知らせを削除しました');
            setIsDeleteConfirming(false);
            setDeleteTargetId(null);
            setDeleteInputValue('');
            setTimeout(() => setSuccessMessage(''), 3000);
            loadNotifications(currentPage);
          } else {
            setErrorMessage(response.message || '削除に失敗しました');
          }
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          setErrorMessage(error.message || 'お知らせの削除に失敗しました');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewNotification({
      title: '',
      content: '',
      type: 'info',
      target: 'all',
      startDate: '',
      endDate: '',
    });
    setIsDeleteConfirming(false);
    setDeleteTargetId(null);
    setDeleteInputValue('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>お知らせ配信</h1>
        <button
          className={styles.primaryButton}
          onClick={() => setIsModalOpen(!isModalOpen)}
          disabled={loading}
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

      {errorMessage && (
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
          {errorMessage}
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
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                className={`${styles.primaryButton} ${styles.danger}`}
                onClick={handleConfirmDelete}
                disabled={
                  deleteInputValue !==
                    notifications.find(
                      (n) => n.notificationId === deleteTargetId
                    )?.title || loading
                }
                style={{
                  opacity:
                    deleteInputValue !==
                      notifications.find(
                        (n) => n.notificationId === deleteTargetId
                      )?.title || loading
                      ? 0.5
                      : 1,
                  cursor:
                    deleteInputValue !==
                      notifications.find(
                        (n) => n.notificationId === deleteTargetId
                      )?.title || loading
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                削除する
              </button>
            </div>
          }
        >
          {notifications.find((n) => n.notificationId === deleteTargetId) && (
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
                {
                  notifications.find((n) => n.notificationId === deleteTargetId)
                    ?.title
                }
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
                  notifications.find((n) => n.notificationId === deleteTargetId)
                    ?.title
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
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleAddNotification}
              disabled={loading}
            >
              {loading ? '配信中...' : '配信実行'}
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
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className={styles.formGroup}>
            <label>掲載開始日 *</label>
            <input
              type="date"
              value={newNotification.startDate}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  startDate: e.target.value,
                })
              }
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label>掲載終了日</label>
            <input
              type="date"
              value={newNotification.endDate}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  endDate: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className={styles.formGroup}>
            <label>通知タイプ</label>
            <select
              value={newNotification.type}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  type: e.target.value as 'info' | 'important' | 'sale',
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
              <option value="info">一般情報</option>
              <option value="important">重要</option>
              <option value="sale">セール</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>配信対象</label>
            <select
              value={newNotification.target}
              onChange={(e) =>
                setNewNotification({
                  ...newNotification,
                  target: e.target.value as 'all' | 'members',
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
        </div>
      </AdminModal>

      {/* 通知一覧 */}
      <div className={styles.notificationsList}>
        {loading && notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999',
            }}
          >
            読み込み中...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999',
            }}
          >
            <p>お知らせはまだありません</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notificationId}
              className={styles.notificationCard}
            >
              <div className={styles.notificationHeader}>
                <div>
                  <h3>{notification.title}</h3>
                  <p className={styles.notificationDate}>
                    配信日: {notification.startDate}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={styles.badge}>
                    {notification.type === 'important'
                      ? '🔴 重要'
                      : notification.type === 'sale'
                      ? '🎉 セール'
                      : 'ℹ️ 情報'}
                  </span>
                  <span className={styles.badge}>
                    {notification.target === 'all'
                      ? '👥 全ユーザー'
                      : '👤 会員のみ'}
                  </span>
                </div>
              </div>
              <p className={styles.notificationContent}>
                {notification.content}
              </p>
              <div className={styles.notificationActions}>
                <button
                  className={`${styles.secondaryButton} ${styles.danger}`}
                  onClick={() => handleStartDelete(notification.notificationId)}
                  disabled={loading}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ページネーション */}
      {notifications.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => loadNotifications(page)}
        />
      )}
    </div>
  );
}
