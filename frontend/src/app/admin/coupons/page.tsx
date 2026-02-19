'use client';

import React, { useEffect, useState } from 'react';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import Snackbar from '@/components/Snackbar/Snackbar';
import { adminCouponAPI, Coupon } from '@/api/admin-coupons';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Paper,
  Chip,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent,
} from '@mui/material';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
        pageSize,
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
    setFormErrors({});
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
    const errors: Record<string, string> = {};

    if (!formData.couponCode.trim()) {
      errors.couponCode = 'クーポンコードを入力してください';
    }

    if (!formData.discountValue) {
      errors.discountValue = '割引値を入力してください';
    } else if (
      Number.isNaN(Number(formData.discountValue)) ||
      Number(formData.discountValue) <= 0
    ) {
      errors.discountValue = '割引値は1以上の数値で入力してください';
    }

    if (formData.discountType === 'percentage' && !formData.maxDiscountAmount) {
      errors.maxDiscountAmount = '最大割引額を入力してください';
    }

    if (formData.discountType === 'amount' && !formData.minOrderAmount) {
      errors.minOrderAmount = '最小注文額を入力してください';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      errors.endDate = '有効期間を正しく設定してください';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

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
          },
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
        editingCoupon.couponId!,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ページネーション
  const totalPages = Math.ceil(coupons.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedCoupons = coupons.slice(startIndex, startIndex + pageSize);

  return (
    <Box>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            クーポンコード管理
          </Typography>
          <Button
            variant="contained"
            onClick={handleAddClick}
            disabled={isLoading}
          >
            新規クーポン
          </Button>
        </Box>

        <AdminTable
          columns={[
            {
              key: 'couponCode',
              label: 'クーポンコード',
              render: (value) => (
                <Typography fontWeight={600}>{value}</Typography>
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
                <Stack spacing={0.5}>
                  <Typography variant="body2">{value || '-'}</Typography>
                  <Typography variant="body2">{row.endDate || '-'}</Typography>
                </Stack>
              ),
              hide: { mobile: true },
            },
            {
              key: 'isActive',
              label: 'ステータス',
              render: (value) => (
                <Chip
                  size="small"
                  label={value ? '有効' : '無効'}
                  color={value ? 'success' : 'default'}
                />
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

        <Box display="flex" justifyContent="center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Box>

        <AdminModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsDeleteConfirming(false);
            setDeleteInputValue('');
          }}
          title={editingCoupon ? 'クーポンを編集' : '新規クーポンを作成'}
          buttons={
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Box>
                {editingCoupon && !isDeleteConfirming && (
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={handleStartDelete}
                  >
                    削除
                  </Button>
                )}
              </Box>
              <Stack direction="row" spacing={2}>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsDeleteConfirming(false);
                    setDeleteInputValue('');
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddCoupon}
                  disabled={isLoading}
                >
                  {editingCoupon ? '更新' : '作成'}
                </Button>
              </Stack>
            </Stack>
          }
        >
          <Stack spacing={2}>
            {isDeleteConfirming && editingCoupon && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderColor: 'error.main' }}
              >
                <Typography color="error" fontWeight={700} mb={1}>
                  ⚠️ 確認: 以下のクーポンを削除します
                </Typography>
                <Typography variant="body2" mb={2}>
                  <strong>クーポンコード:</strong> {editingCoupon.couponCode}
                </Typography>
                <TextField
                  fullWidth
                  label="削除確認"
                  value={deleteInputValue}
                  onChange={(e) => setDeleteInputValue(e.target.value)}
                  placeholder={`「${editingCoupon.couponCode}」と入力`}
                />
                <Stack direction="row" spacing={1} mt={2}>
                  <Button
                    color="error"
                    variant="contained"
                    fullWidth
                    onClick={handleConfirmDelete}
                    disabled={deleteInputValue !== editingCoupon.couponCode}
                  >
                    削除
                  </Button>
                  <Button fullWidth onClick={handleCancelDelete}>
                    キャンセル
                  </Button>
                </Stack>
              </Paper>
            )}

            <TextField
              label="クーポンコード"
              name="couponCode"
              value={formData.couponCode}
              onChange={handleFormChange}
              placeholder="例: SUMMER2024"
              error={Boolean(formErrors.couponCode)}
              helperText={formErrors.couponCode}
              fullWidth
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <FormControl fullWidth>
                <Select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="percentage">パーセンテージ</MenuItem>
                  <MenuItem value="amount">固定額</MenuItem>
                </Select>
              </FormControl>
              <TextField
                type="number"
                name="discountValue"
                label="割引値"
                value={formData.discountValue}
                onChange={handleFormChange}
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
                error={Boolean(formErrors.discountValue)}
                helperText={formErrors.discountValue}
                fullWidth
              />
            </Box>

            {formData.discountType === 'percentage' && (
              <TextField
                type="number"
                name="maxDiscountAmount"
                label="最大割引額"
                value={formData.maxDiscountAmount}
                onChange={handleFormChange}
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
                error={Boolean(formErrors.maxDiscountAmount)}
                helperText={formErrors.maxDiscountAmount}
                fullWidth
              />
            )}

            {formData.discountType === 'amount' && (
              <TextField
                type="number"
                name="minOrderAmount"
                label="最小注文額"
                value={formData.minOrderAmount}
                onChange={handleFormChange}
                placeholder="0"
                inputProps={{ min: 0, step: 0.01 }}
                error={Boolean(formErrors.minOrderAmount)}
                helperText={formErrors.minOrderAmount}
                fullWidth
              />
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                type="date"
                name="startDate"
                label="有効開始日"
                value={formData.startDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formErrors.startDate)}
                helperText={formErrors.startDate}
              />
              <TextField
                type="date"
                name="endDate"
                label="有効終了日"
                value={formData.endDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                error={Boolean(formErrors.endDate)}
                helperText={formErrors.endDate}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                />
              }
              label="有効にする"
            />
          </Stack>
        </AdminModal>

        {snackbar && (
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => setSnackbar(null)}
          />
        )}
      </Stack>
    </Box>
  );
}
