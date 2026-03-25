'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAdminOrderDetail, AdminOrderDetail } from '@/api/admin-orders';
import { updateOrderStatus } from '@/api/admin-orders';
import BankTransferDetails from '@/components/BankTransferDetails/BankTransferDetails';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Alert,
  CircularProgress,
  Link as MuiLink,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const ORDER_STATUSES = [
  { value: 'unpaid', label: '未払い' },
  { value: 'awaiting_shipment', label: '発送待ち' },
  { value: 'in_transit', label: '配送中' },
  { value: 'delivered', label: '配送済み' },
  { value: 'cancelled_customer', label: 'キャンセル（顧客）' },
  { value: 'cancelled_internal', label: 'キャンセル（内部）' },
] as const;

export default function AdminOrderDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('unpaid');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    }
  }, [router]);

  // 初回アクセス時に注文詳細を取得
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await getAdminOrderDetail(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
          setSelectedStatus(response.data.status || 'unpaid');
        } else {
          setError('注文情報の取得に失敗しました');
          console.error('API error:', response.message);
        }
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError('注文情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleStatusChange = async () => {
    if (!order) return;

    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const response = await updateOrderStatus({
        orderId,
        status: selectedStatus as
          | 'unpaid'
          | 'awaiting_shipment'
          | 'in_transit'
          | 'delivered'
          | 'cancelled_customer'
          | 'cancelled_internal',
      });
      if (response.success) {
        setOrder({
          ...order,
          status: selectedStatus as
            | 'unpaid'
            | 'awaiting_shipment'
            | 'in_transit'
            | 'delivered'
            | 'cancelled_customer'
            | 'cancelled_internal',
        });
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setError('ステータスの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error || '注文が見つかりません'}</Alert>
      </Box>
    );
  }

  const paymentMethodLabel =
    typeof order.paymentMethod === 'string'
      ? order.paymentMethod === 'bank_transfer'
        ? '銀行振込'
        : order.paymentMethod === 'credit_card' ||
            order.paymentMethod === 'card'
          ? 'クレジットカード'
          : order.paymentMethod === 'apple_pay' ||
              order.paymentMethod === 'applepay'
            ? 'Apple Pay'
            : order.paymentMethod === 'google_pay' ||
                order.paymentMethod === 'googlepay'
              ? 'Google Pay'
              : 'その他'
      : 'クレジットカード';

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            注文詳細
          </Typography>
          <Typography color="text.secondary">
            注文番号: {order.orderNumber}
          </Typography>
        </Box>

        {updateSuccess && (
          <Alert severity="success">ステータスを更新しました</Alert>
        )}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  ステータス
                </Typography>
                <OrderStatusChip
                  status={
                    order.status as
                      | 'unpaid'
                      | 'awaiting_shipment'
                      | 'in_transit'
                      | 'delivered'
                      | 'cancelled_customer'
                      | 'cancelled_internal'
                  }
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  ステータス変更
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="ステータス"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={handleStatusChange}
              disabled={isUpdating || selectedStatus === order.status}
            >
              {isUpdating ? '更新中...' : 'ステータスを更新'}
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            注文情報
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">注文日</Typography>
              <Typography>
                {new Date(order.orderDate).toLocaleDateString('ja-JP')}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">注文番号</Typography>
              <Typography>{order.orderNumber}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">注文金額</Typography>
              <Typography fontWeight={700}>
                ¥{order.totalAmount.toLocaleString()}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            商品一覧
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>商品名</TableCell>
                  <TableCell align="right">単価</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell align="right">合計</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {item.productName}
                        </Typography>
                        {(item.size || item.color) && (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            flexWrap="wrap"
                            sx={{ mt: 0.5 }}
                          >
                            {item.size && (
                              <Chip
                                label={`サイズ: ${item.size}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {item.color && (
                              <Chip
                                label={`カラー: ${item.color}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      ¥{item.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      ¥{item.totalAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        {order.shippingAddress && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              配送先
            </Typography>
            <Stack spacing={1}>
              <Typography>〒{order.shippingAddress.postalCode}</Typography>
              <Typography>
                {order.shippingAddress.prefecture}{' '}
                {order.shippingAddress.address}
              </Typography>
            </Stack>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            支払い方法
          </Typography>
          <Stack spacing={2}>
            <Typography>{paymentMethodLabel}</Typography>
            {typeof order.paymentMethod === 'string' &&
              order.paymentMethod === 'bank_transfer' && (
                <BankTransferDetails />
              )}
            {order.last4 && (
              <Typography variant="body2" color="text.secondary">
                ****{order.last4}
              </Typography>
            )}
          </Stack>
        </Paper>

        <Button variant="outlined" component={Link} href="/admin/orders">
          注文一覧に戻る
        </Button>
      </Stack>
    </Box>
  );
}
