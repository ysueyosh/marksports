'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import CancelOrderModal from '@/components/CancelOrderModal/CancelOrderModal';
import { getOrderDetail, OrderDetail } from '@/api/orders';
import BankTransferDetails from '@/components/BankTransferDetails/BankTransferDetails';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Alert,
  Link as MuiLink,
} from '@mui/material';

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id') as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // 初回アクセス時に注文詳細を取得
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetail(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError('注文情報の取得に失敗しました');
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

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 6 }}>
          <Stack alignItems="center" spacing={2}>
            <Typography color="text.secondary">読み込み中...</Typography>
          </Stack>
        </Box>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
          <Stack spacing={2}>
            <Alert severity="error">
              {error || '注文情報が見つかりません'}
            </Alert>
            <Button component={Link} href="/orders" variant="outlined">
              注文履歴に戻る
            </Button>
          </Stack>
        </Box>
      </MainLayout>
    );
  }

  const handleCancelSuccess = (response: {
    orderId: string;
    status: string;
    cancelRequestSent: boolean;
  }) => {
    // キャンセルリクエスト送信フラグを更新
    if (order) {
      setOrder((prevOrder) =>
        prevOrder
          ? {
              ...prevOrder,
              cancelRequestSent: response.cancelRequestSent,
            }
          : null,
      );
    }
  };

  const safeGet = (obj: any, path: string, defaultValue: any) => {
    return path
      .split('.')
      .reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue),
        obj,
      );
  };

  return (
    <MainLayout>
      <Box>
        <Stack spacing={2}>
          <Button
            component={Link}
            href="/orders"
            variant="outlined"
            sx={{ alignSelf: 'flex-start' }}
          >
            ← 注文履歴に戻る
          </Button>

          <Typography variant="h4" fontWeight={700}>
            注文詳細
          </Typography>

          {/* 注文情報 */}
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                注文情報
              </Typography>
              <Divider />
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                >
                  <Typography color="text.secondary">注文番号</Typography>
                  <Typography fontWeight={700}>{order.orderNumber}</Typography>
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                >
                  <Typography color="text.secondary">注文日</Typography>
                  <Typography>
                    {new Date(order.orderDate).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Typography color="text.secondary">ステータス</Typography>
                  <OrderStatusChip
                    status={
                      order.status as
                        | 'unpaid'
                        | 'awaiting_shipment'
                        | 'in_transit'
                        | 'delivered'
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* 注文内容 */}
          <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 3 }, overflow: 'auto' }}
          >
            <Stack spacing={0}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                注文内容
              </Typography>
              <Divider sx={{ my: 0 }} />
              <Box
                sx={{
                  overflowX: 'auto',
                  mx: { xs: -2, md: -3 },
                  px: { xs: 2, md: 3 },
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell>商品名</TableCell>
                      <TableCell align="right">数量</TableCell>
                      <TableCell align="right">単価</TableCell>
                      <TableCell align="right">小計</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.items || []).map((item) => (
                      <TableRow key={item.orderItemId}>
                        <TableCell>
                          {item.productName || '不明な商品'}
                        </TableCell>
                        <TableCell align="right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell align="right">
                          ¥
                          {item.unitPrice
                            ? item.unitPrice.toLocaleString()
                            : '0'}
                        </TableCell>
                        <TableCell align="right">
                          ¥
                          {item.unitPrice && item.quantity
                            ? (item.unitPrice * item.quantity).toLocaleString()
                            : '0'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <Stack spacing={1} sx={{ mt: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  textAlign="right"
                >
                  <Typography>小計</Typography>
                  <Typography>
                    ¥
                    {(
                      (order.subtotal || 0) + (order.tax || 0)
                    ).toLocaleString()}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="right"
                >
                  （内消費税 ¥{order.tax ? order.tax.toLocaleString() : '0'}）
                </Typography>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  textAlign="right"
                >
                  <Typography>送料</Typography>
                  <Typography>
                    ¥
                    {order.shippingCost
                      ? order.shippingCost.toLocaleString()
                      : '0'}
                  </Typography>
                </Stack>
                {order.discount > 0 && (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    textAlign="right"
                  >
                    <Typography>割引</Typography>
                    <Typography>-¥{order.discount.toLocaleString()}</Typography>
                  </Stack>
                )}
                <Divider />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  textAlign="right"
                >
                  <Typography fontWeight={700}>合計</Typography>
                  <Typography fontWeight={700}>
                    ¥
                    {order.totalAmount
                      ? order.totalAmount.toLocaleString()
                      : '0'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          {/* 配送先情報 */}
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                配送先情報
              </Typography>
              <Divider />
              <Typography>
                {order.shippingAddress?.lastName || ''}{' '}
                {order.shippingAddress?.firstName || ''}
              </Typography>
              <Typography>
                〒{order.shippingAddress?.postalCode || ''}
              </Typography>
              <Typography>
                {order.shippingAddress?.prefecture || ''}
                {order.shippingAddress?.address || ''}
              </Typography>
              {order.shippingAddress?.building && (
                <Typography>{order.shippingAddress.building}</Typography>
              )}
            </Stack>
          </Paper>

          {/* 支払い情報 */}
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                支払い情報
              </Typography>
              <Divider />
              {typeof order.paymentMethod === 'string' ? (
                <>
                  {order.paymentMethod === 'credit_card' && (
                    <Typography>クレジットカード</Typography>
                  )}
                  {order.paymentMethod === 'bank_transfer' && (
                    <Stack spacing={1}>
                      <Typography>銀行振込</Typography>
                      <BankTransferDetails />
                    </Stack>
                  )}
                  {order.paymentMethod === 'apple_pay' && (
                    <Typography>Apple Pay</Typography>
                  )}
                  {order.paymentMethod === 'google_pay' && (
                    <Typography>Google Pay</Typography>
                  )}
                </>
              ) : order.paymentMethod?.cardType === 'credit_card' ? (
                <Typography>
                  クレジットカード ****{order.paymentMethod.lastFourDigits}
                </Typography>
              ) : (
                <Typography>不明な支払い方法</Typography>
              )}
            </Stack>
          </Paper>

          {/* アクション */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* <Button
              variant="contained"
              component={Link}
              href={`/receipt/detail?orderId=${order.id}`}
            >
              領収証を表示
            </Button> */}
            {order.status !== 'cancelled' &&
              order.status !== 'delivered' &&
              order.status !== 'cancelled_customer' &&
              order.status !== 'cancelled_internal' && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  注文のキャンセルをリクエスト
                </Button>
              )}
          </Stack>
        </Stack>
      </Box>

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        orderId={orderId}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={handleCancelSuccess}
      />
    </MainLayout>
  );
}
