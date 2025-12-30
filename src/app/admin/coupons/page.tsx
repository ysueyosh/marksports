'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './coupons.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed'; // パーセンテージまたは固定額
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  minPurchaseAmount?: number;
  isActive: boolean;
  createdDate: string;
  description?: string;
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: 1,
      code: 'SUMMER2024',
      discountType: 'percentage',
      discountValue: 20,
      maxUses: 100,
      currentUses: 45,
      validFrom: '2024-06-01',
      validUntil: '2024-08-31',
      minPurchaseAmount: 5000,
      isActive: true,
      createdDate: '2024-05-15',
      description: '夏のセールクーポン',
    },
    {
      id: 2,
      code: 'WELCOME500',
      discountType: 'fixed',
      discountValue: 500,
      maxUses: 200,
      currentUses: 120,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      minPurchaseAmount: 3000,
      isActive: true,
      createdDate: '2024-01-01',
      description: '新規顧客向けウェルカムクーポン',
    },
    {
      id: 3,
      code: 'VIPSPECIAL',
      discountType: 'percentage',
      discountValue: 30,
      maxUses: 50,
      currentUses: 15,
      validFrom: '2024-12-01',
      validUntil: '2024-12-31',
      minPurchaseAmount: 10000,
      isActive: true,
      createdDate: '2024-11-15',
      description: 'VIP限定クーポン',
    },
    {
      id: 4,
      code: 'HOLIDAY1000',
      discountType: 'fixed',
      discountValue: 1000,
      maxUses: 30,
      currentUses: 30,
      validFrom: '2024-12-20',
      validUntil: '2024-12-25',
      minPurchaseAmount: 5000,
      isActive: false,
      createdDate: '2024-12-01',
      description: 'クリスマス限定クーポン',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'createdDate'>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUses: 0,
    currentUses: 0,
    validFrom: '',
    validUntil: '',
    minPurchaseAmount: undefined,
    isActive: true,
    description: '',
  });

  useEffect(() => {
    // 管理者ログイン状態を確認
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

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // フィルタリング
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ページネーション
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedCoupons = filteredCoupons.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleAddClick = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUses: 0,
      currentUses: 0,
      validFrom: '',
      validUntil: '',
      minPurchaseAmount: undefined,
      isActive: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      currentUses: coupon.currentUses,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      minPurchaseAmount: coupon.minPurchaseAmount,
      isActive: coupon.isActive,
      description: coupon.description,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.code.trim()) {
      alert('クーポンコードを入力してください');
      return;
    }
    if (formData.validFrom >= formData.validUntil) {
      alert('有効期間を正しく設定してください');
      return;
    }

    if (editingCoupon) {
      // 編集
      setCoupons(
        coupons.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                ...formData,
              }
            : c
        )
      );
    } else {
      // 新規追加
      const newCoupon: Coupon = {
        id: Math.max(...coupons.map((c) => c.id), 0) + 1,
        ...formData,
        createdDate: new Date().toISOString().split('T')[0],
      };
      setCoupons([newCoupon, ...coupons]);
    }

    setIsModalOpen(false);
  };

  const handleStartDelete = () => {
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  const handleConfirmDelete = () => {
    if (editingCoupon && deleteInputValue === editingCoupon.code) {
      setCoupons(coupons.filter((c) => c.id !== editingCoupon.id));
      setIsModalOpen(false);
      setEditingCoupon(null);
      setIsDeleteConfirming(false);
      setDeleteInputValue('');
    } else {
      alert('クーポンコードが正しくありません');
    }
  };

  const handleDelete = () => {
    handleStartDelete();
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>クーポンコード管理</h1>
        <div className={styles.headerButtons}>
          <button onClick={handleAddClick} className={styles.primaryButton}>
            新規クーポン
          </button>
        </div>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="クーポンコードで検索..."
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
            key: 'code',
            label: 'クーポンコード',
            render: (value) => (
              <span style={{ fontWeight: '500' }}>{value}</span>
            ),
          },
          {
            key: 'discountType',
            label: '割引タイプ',
            render: (value) => (value === 'percentage' ? '%割引' : '円割引'),
            hide: { mobile: true, tablet: true },
          },
          {
            key: 'discountValue',
            label: '割引値',
            render: (value, row) =>
              row.discountType === 'percentage'
                ? `${value}%`
                : `¥${value.toLocaleString()}`,
          },
          {
            key: 'currentUses',
            label: '利用状況',
            render: (value, row) => `${value}/${row.maxUses}回`,
            hide: { mobile: true },
          },
          {
            key: 'validFrom',
            label: '有効期限',
            render: (value, row) => (
              <>
                <div>{value}</div>
                <div>{row.validUntil}</div>
              </>
            ),
            hide: { mobile: true },
          },
          {
            key: 'isActive',
            label: 'ステータス',
            render: (value) => (
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: value ? '#d1fae5' : '#fee2e2',
                  color: value ? '#065f46' : '#991b1b',
                }}
              >
                {value ? '有効' : '無効'}
              </span>
            ),
          },
        ]}
        data={displayedCoupons}
        rowKey="id"
        actions={[
          {
            label: '編集',
            onClick: (row) => handleEditClick(row),
            variant: 'primary',
          },
        ]}
        emptyMessage="クーポンが見つかりません"
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
        title={editingCoupon ? 'クーポンを編集' : '新規クーポンを作成'}
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
              {editingCoupon && !isDeleteConfirming && (
                <button
                  className={`${styles.secondaryButton} ${styles.danger}`}
                  onClick={handleDelete}
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
              <button className={styles.primaryButton} onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        }
      >
        {isDeleteConfirming && editingCoupon && (
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
              ⚠️ 確認: 以下のクーポンを削除します
            </label>
            <p
              style={{
                margin: '8px 0',
                fontSize: '14px',
                color: '#1f2937',
              }}
            >
              <strong>クーポンコード:</strong> {editingCoupon.code}
            </p>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                marginTop: '12px',
              }}
            >
              削除を確認するため、クーポンコードを入力してください
            </label>
            <input
              type="text"
              value={deleteInputValue}
              onChange={(e) => setDeleteInputValue(e.target.value)}
              placeholder={`「${editingCoupon.code}」と入力`}
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
                disabled={deleteInputValue !== editingCoupon.code}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor:
                    deleteInputValue === editingCoupon.code
                      ? '#dc2626'
                      : '#f3f4f6',
                  color:
                    deleteInputValue === editingCoupon.code
                      ? 'white'
                      : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    deleteInputValue === editingCoupon.code
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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            クーポンコード*
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleFormChange}
            placeholder="例: SUMMER2024"
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
          <label style={{ display: 'block', marginBottom: '4px' }}>説明</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            placeholder="クーポンの説明"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              minHeight: '60px',
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
              割引タイプ*
            </label>
            <select
              name="discountType"
              value={formData.discountType}
              onChange={handleFormChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="percentage">パーセンテージ</option>
              <option value="fixed">固定額</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              割引値*
            </label>
            <input
              type="number"
              name="discountValue"
              value={formData.discountValue}
              onChange={handleFormChange}
              placeholder="0"
              min="0"
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
              最大利用回数*
            </label>
            <input
              type="number"
              name="maxUses"
              value={formData.maxUses}
              onChange={handleFormChange}
              placeholder="0"
              min="0"
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              現在の利用回数
            </label>
            <input
              type="number"
              name="currentUses"
              value={formData.currentUses}
              onChange={handleFormChange}
              placeholder="0"
              min="0"
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
              有効開始日*
            </label>
            <input
              type="date"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleFormChange}
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

          <div>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              有効終了日*
            </label>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleFormChange}
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
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            最小購入額（オプション）
          </label>
          <input
            type="number"
            name="minPurchaseAmount"
            value={formData.minPurchaseAmount || ''}
            onChange={handleFormChange}
            placeholder="0"
            min="0"
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

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleFormChange}
            />
            <span>有効にする</span>
          </label>
        </div>
      </AdminModal>
    </div>
  );
}
