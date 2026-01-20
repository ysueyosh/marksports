'use client';

import React, { useEffect, useState } from 'react';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import Snackbar from '@/components/Snackbar/Snackbar';
import sharedStyles from '../admin-shared.module.css';
import { adminCouponAPI, Coupon } from '@/api/admin-coupons';

const styles = sharedStyles;

interface CouponForm {
  couponCode: string;
  discountType: 'percentage' | 'amount';
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [formData, setFormData] = useState<CouponForm>({
    couponCode: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  // ページロード時の初期化
  useEffect(() => {
    loadCoupons();
  }, [currentPage]);

  // クーポン一覧を読み込み
  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const response = await adminCouponAPI.getAllCoupons(
        currentPage,
        pageSize
      );
      if (response.success && response.data) {
        // response.data は { coupons: Coupon[] } または Coupon の場合がある
        const data = response.data as any;
        if ('coupons' in data && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        } else if (Array.isArray(data)) {
          setCoupons(data);
        } else {
          setCoupons([]);
        }
      } else {
        setSnackbar({
          message: response.message || 'クーポンの読み込みに失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      setSnackbar({
        message: 'クーポンの読み込みに失敗しました',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      couponCode: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setEditingCoupon(null);
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  // 新規クーポンボタンをクリック
  const handleAddClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // 編集ボタンをクリック
  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      couponCode: coupon.couponCode || '',
      discountType:
        (coupon.discountType as 'percentage' | 'amount') || 'percentage',
      discountValue: coupon.discountValue?.toString() || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      startDate: coupon.startDate || '',
      endDate: coupon.endDate || '',
      isActive: coupon.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // フォーム送信（作成・更新）
  const handleAddCoupon = async () => {
    if (!formData.couponCode.trim()) {
      setSnackbar({
        message: 'クーポンコードを入力してください',
        type: 'error',
      });
      return;
    }

    if (formData.discountType === 'percentage' && !formData.maxDiscountAmount) {
      setSnackbar({
        message: 'パーセンテージ割引の場合、最大割引額を入力してください',
        type: 'error',
      });
      return;
    }

    if (formData.discountType === 'amount' && !formData.minOrderAmount) {
      setSnackbar({
        message: '固定額割引の場合、最小注文額を入力してください',
        type: 'error',
      });
      return;
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      setSnackbar({
        message: '有効期間を正しく設定してください',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (editingCoupon) {
        // 更新
        const response = await adminCouponAPI.updateCoupon(
          editingCoupon.couponId!,
          {
            couponCode: formData.couponCode,
            discountType: formData.discountType,
            discountValue: parseFloat(formData.discountValue),
            minOrderAmount: formData.minOrderAmount
              ? parseFloat(formData.minOrderAmount)
              : undefined,
            maxDiscountAmount: formData.maxDiscountAmount
              ? parseFloat(formData.maxDiscountAmount)
              : undefined,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            isActive: formData.isActive,
          }
        );

        if (response.success) {
          setSnackbar({ message: 'クーポンを更新しました', type: 'success' });
          await loadCoupons();
          setIsModalOpen(false);
          resetForm();
        } else {
          setSnackbar({
            message: response.message || 'クーポンの更新に失敗しました',
            type: 'error',
          });
        }
      } else {
        // 作成
        const response = await adminCouponAPI.createCoupon({
          couponCode: formData.couponCode,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          minOrderAmount: formData.minOrderAmount
            ? parseFloat(formData.minOrderAmount)
            : undefined,
          maxDiscountAmount: formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : undefined,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          isActive: formData.isActive,
        });

        if (response.success) {
          setSnackbar({ message: 'クーポンを作成しました', type: 'success' });
          await loadCoupons();
          setIsModalOpen(false);
          resetForm();
        } else {
          setSnackbar({
            message: response.message || 'クーポンの作成に失敗しました',
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      setSnackbar({ message: 'クーポンの保存に失敗しました', type: 'error' });
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
    if (!editingCoupon || deleteInputValue !== editingCoupon.couponCode) {
      setSnackbar({
        message: 'クーポンコードが正しくありません',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminCouponAPI.deleteCoupon(
        editingCoupon.couponId!
      );

      if (response.success) {
        setSnackbar({ message: 'クーポンを削除しました', type: 'success' });
        await loadCoupons();
        setIsModalOpen(false);
        resetForm();
      } else {
        setSnackbar({
          message: response.message || 'クーポンの削除に失敗しました',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setSnackbar({ message: 'クーポンの削除に失敗しました', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // フォーム入力を処理
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

  // フィルタリング
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.couponCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ページネーション
  const totalPages = Math.ceil(filteredCoupons.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedCoupons = filteredCoupons.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>クーポンコード管理</h1>
        <div className={styles.headerButtons}>
          <button
            onClick={handleAddClick}
            className={styles.primaryButton}
            disabled={isLoading}
          >
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
            key: 'couponCode',
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
                : `¥${value?.toLocaleString?.() || value}`,
          },
          {
            key: 'startDate',
            label: '有効期間',
            render: (value, row) => (
              <>
                <div>{value || '-'}</div>
                <div>{row.endDate || '-'}</div>
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
        rowKey="couponId"
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
              <button
                className={styles.primaryButton}
                onClick={handleAddCoupon}
                disabled={isLoading}
              >
                {editingCoupon ? '更新' : '作成'}
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
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#1f2937' }}>
              <strong>クーポンコード:</strong> {editingCoupon.couponCode}
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
              placeholder={`「${editingCoupon.couponCode}」と入力`}
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
                disabled={deleteInputValue !== editingCoupon.couponCode}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor:
                    deleteInputValue === editingCoupon.couponCode
                      ? '#dc2626'
                      : '#f3f4f6',
                  color:
                    deleteInputValue === editingCoupon.couponCode
                      ? 'white'
                      : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    deleteInputValue === editingCoupon.couponCode
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
            name="couponCode"
            value={formData.couponCode}
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
              <option value="amount">固定額</option>
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
              step="0.01"
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

        {formData.discountType === 'percentage' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              最大割引額*
            </label>
            <input
              type="number"
              name="maxDiscountAmount"
              value={formData.maxDiscountAmount}
              onChange={handleFormChange}
              placeholder="0"
              min="0"
              step="0.01"
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
        )}

        {formData.discountType === 'amount' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              最小注文額*
            </label>
            <input
              type="number"
              name="minOrderAmount"
              value={formData.minOrderAmount}
              onChange={handleFormChange}
              placeholder="0"
              min="0"
              step="0.01"
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
        )}

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
              有効開始日
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
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
              有効終了日
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
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
