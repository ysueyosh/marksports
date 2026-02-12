'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTable from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import { getAllOrders, AdminOrder } from '@/api/admin-orders';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Chip,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface Order extends AdminOrder {
  customerName?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  shippingStatus?: 'pending' | 'shipped' | 'delivered';
  items?: {
    name: string;
    quantity: number;
    price: number;
    productId?: number;
  }[];
  customerEmail?: string;
  shippingCost?: number;
  couponDiscount?: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    'all' | 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // 初回読み込み時はすべての注文を取得
      const fetchOrders = async () => {
        try {
          const response = await getAllOrders();
          if (response.success && response.data) {
            const formattedOrders: Order[] = response.data.map((order) => ({
              ...order,
              id: order.id as any,
            }));
            setOrders(formattedOrders);
          } else {
            console.error('Failed to fetch orders:', response.message);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [router]);

  // 検索実行
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setCurrentPage(1);
      const response = await getAllOrders(
        searchQuery || undefined,
        filterPaymentStatus,
      );
      if (response.success && response.data) {
        const formattedOrders: Order[] = response.data.map((order) => ({
          ...order,
          id: order.id as any,
        }));
        setOrders(formattedOrders);
      } else {
        console.error('Search failed:', response.message);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 検索条件変更時
  const handleResetSearch = async () => {
    try {
      setSearchQuery('');
      setFilterPaymentStatus('all');
      setCurrentPage(1);
      setIsSearching(true);
      const response = await getAllOrders();
      if (response.success && response.data) {
        const formattedOrders: Order[] = response.data.map((order) => ({
          ...order,
          id: order.id as any,
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error resetting search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage]);

  if (!isLoggedIn) {
    return null;
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '決済待ち',
      completed: '決済済',
      failed: '決済失敗',
    };
    return labels[status] || status;
  };

  const getShippingStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '配送待ち',
      shipped: '配送中',
      delivered: '配送完了',
    };
    return labels[status] || status;
  };

  // ページング
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <Box>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            受注管理
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  placeholder="注文番号で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <Select
                    value={filterPaymentStatus}
                    onChange={(e) =>
                      setFilterPaymentStatus(e.target.value as any)
                    }
                  >
                    <MenuItem value="all">ステータス: すべて</MenuItem>
                    <MenuItem value="unpaid">決済待ち</MenuItem>
                    <MenuItem value="awaiting_shipment">配送待ち</MenuItem>
                    <MenuItem value="in_transit">配送中</MenuItem>
                    <MenuItem value="delivered">配送完了</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={isSearching}
                  sx={{ flexShrink: 0 }}
                >
                  {isSearching ? '検索中...' : '検索'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetSearch}
                  disabled={isSearching}
                  sx={{ flexShrink: 0 }}
                >
                  リセット
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <AdminTable
            columns={
              isMobile
                ? [
                    {
                      key: 'orderNumber',
                      label: '注文番号',
                      width: '100px',
                      render: (v) => `#${v}`,
                    },
                    {
                      key: 'status',
                      label: 'ステータス',
                      render: (v, row: Order) => (
                        <Stack spacing={1} alignItems="flex-start">
                          {row.isCancelRequest &&
                            v !== 'cancelled_customer' &&
                            v !== 'cancelled_internal' && (
                              <Chip
                                size="small"
                                label="キャンセル申請中"
                                color="error"
                              />
                            )}
                          {row.refundAt && (
                            <Chip
                              size="small"
                              label="返金処理完了"
                              color="success"
                            />
                          )}
                          <OrderStatusChip
                            status={
                              v as
                                | 'unpaid'
                                | 'awaiting_shipment'
                                | 'in_transit'
                                | 'delivered'
                            }
                          />
                        </Stack>
                      ),
                    },
                  ]
                : isTablet
                  ? [
                      {
                        key: 'orderNumber',
                        label: '注文番号',
                        width: '120px',
                        render: (v) => `#${v}`,
                      },
                      {
                        key: 'totalAmount',
                        label: '金額',
                        render: (v) => `¥${(v || 0).toLocaleString()}`,
                      },
                      {
                        key: 'status',
                        label: 'ステータス',
                        render: (v, row: Order) => (
                          <Stack spacing={1} alignItems="flex-start">
                            {row.isCancelRequest &&
                              v !== 'cancelled_customer' &&
                              v !== 'cancelled_internal' && (
                                <Chip
                                  size="small"
                                  label="キャンセル申請中"
                                  color="error"
                                />
                              )}
                            {row.refundAt && (
                              <Chip
                                size="small"
                                label="返金処理完了"
                                color="success"
                              />
                            )}
                            <OrderStatusChip
                              status={
                                v as
                                  | 'unpaid'
                                  | 'awaiting_shipment'
                                  | 'in_transit'
                                  | 'delivered'
                              }
                            />
                          </Stack>
                        ),
                      },
                    ]
                  : [
                      {
                        key: 'orderNumber',
                        label: '注文番号',
                        width: '80px',
                        render: (v) => `#${v}`,
                      },
                      {
                        key: 'totalAmount',
                        label: '金額',
                        render: (v) => `¥${(v || 0).toLocaleString()}`,
                      },
                      {
                        key: 'status',
                        label: 'ステータス',
                        render: (v, row: Order) => (
                          <Stack spacing={1} alignItems="flex-start">
                            {row.isCancelRequest &&
                              v !== 'cancelled_customer' &&
                              v !== 'cancelled_internal' && (
                                <Chip
                                  size="small"
                                  label="キャンセル申請中"
                                  color="error"
                                />
                              )}
                            {row.refundAt && (
                              <Chip
                                size="small"
                                label="返金処理完了"
                                color="success"
                              />
                            )}
                            <OrderStatusChip
                              status={
                                v as
                                  | 'unpaid'
                                  | 'awaiting_shipment'
                                  | 'in_transit'
                                  | 'delivered'
                              }
                            />
                          </Stack>
                        ),
                      },
                      {
                        key: 'orderDate',
                        label: '注文日',
                        render: (v) => new Date(v).toLocaleDateString('ja-JP'),
                      },
                    ]
            }
            data={paginatedOrders}
            rowKey="id"
            actions={[
              {
                label: '詳細表示',
                onClick: (row) =>
                  router.push(`/admin/orders/detail?id=${row.id}`),
                variant: 'primary',
              },
            ]}
            emptyMessage="注文が見つかりません"
          />

          <Box display="flex" justifyContent="center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Box>
        </Stack>
      </Box>
    </>
  );
}
