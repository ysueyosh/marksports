'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import { getOrders, Order } from '@/api/orders';
import {
  Box,
  Breadcrumbs,
  Typography,
  Stack,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Link as MuiLink,
} from '@mui/material';

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 初回アクセス時に注文一覧を取得
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getOrders();
        if (response.success && response.data) {
          setAllOrders(response.data.orders);
        } else {
          setError('注文情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('注文情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const totalItems = allOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [totalItems]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = allOrders.slice(startIndex, endIndex);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 6 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">読み込み中...</Typography>
          </Stack>
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 6 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        <Stack spacing={3}>
          <Breadcrumbs>
            <MuiLink component={Link} href="/" color="inherit">
              ホーム
            </MuiLink>
            <MuiLink component={Link} href="/account" color="inherit">
              アカウント
            </MuiLink>
            <Typography color="text.primary">注文履歴</Typography>
          </Breadcrumbs>

          <Typography variant="h4" fontWeight={700}>
            注文履歴
          </Typography>

          {currentOrders.length === 0 ? (
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Typography fontSize={40}>🛒</Typography>
                <Typography variant="h6" fontWeight={700}>
                  まだ注文がありません
                </Typography>
                <Typography color="text.secondary">
                  気になるアイテムを見つけて、はじめてのご注文をお楽しみください。
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button variant="contained" component={Link} href="/">
                    ショッピングを続ける
                  </Button>
                  <Button variant="outlined" component={Link} href="/search">
                    カテゴリーから探す
                  </Button>
                </Stack>
              </Stack>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </Box>
            </Paper>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={2}>
                {currentOrders.map((order) => (
                  <Paper key={order.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            注文番号
                          </Typography>
                          <Typography fontWeight={700}>
                            {order.orderNumber}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            注文日
                          </Typography>
                          <Typography>
                            {new Date(order.orderDate).toLocaleDateString(
                              'ja-JP',
                            )}
                          </Typography>
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          {(order.cancelRequestSent || order.isCancelRequest) &&
                            order.status !== 'cancelled_customer' &&
                            order.status !== 'cancelled_internal' && (
                              <Chip color="error" label="キャンセル申請中" />
                            )}
                          {order.refundAt && (
                            <Chip color="success" label="返金処理完了" />
                          )}
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

                      <Divider />

                      <Stack spacing={1}>
                        {order.items &&
                          order.items.slice(0, 2).map((item, idx) => {
                            const unitPrice = item.unitPrice ?? item.price ?? 0;
                            const lineTotal =
                              item.totalAmount ??
                              unitPrice * (item.quantity ?? 0);

                            return (
                              <Stack
                                key={idx}
                                direction="row"
                                justifyContent="space-between"
                              >
                                <Typography color="text.secondary">
                                  {item.productName} x{item.quantity}
                                </Typography>
                                <Typography color="text.secondary">
                                  ¥{lineTotal.toLocaleString()}
                                </Typography>
                              </Stack>
                            );
                          })}
                        <Stack direction="row" justifyContent="space-between">
                          <Typography color="text.secondary">送料</Typography>
                          <Typography color="text.secondary">
                            ¥{order.shippingCost.toLocaleString()}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Divider />

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                      >
                        <Typography variant="subtitle1" fontWeight={700}>
                          合計 ¥{order.totalAmount.toLocaleString()}
                        </Typography>
                        <Button
                          variant="contained"
                          component={Link}
                          href={`/orders/detail?id=${order.id}`}
                        >
                          詳細を見る
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>
    </MainLayout>
  );
}
