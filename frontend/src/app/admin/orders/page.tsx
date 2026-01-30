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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    'all' | 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // API から注文データを取得
      const fetchOrders = async () => {
        try {
          const response = await getAllOrders();
          if (response.success && response.data) {
            // APIレスポンスをフォーマット
            const formattedOrders: Order[] = response.data.map((order) => ({
              ...order,
              id: order.id as any, // 互換性のため
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

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage]);

  // フィルタが変更されたらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPaymentStatus]);

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

  // フィルタリング（ソートはバックエンド側で実施済み）
  let filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toString().includes(searchQuery);
    const matchesStatus =
      filterPaymentStatus === 'all' || order.status === filterPaymentStatus;
    return matchesSearch && matchesStatus;
  });

  // ページング
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={700}>
            受注管理
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="注文IDまたは顧客名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
              <FormControl sx={{ minWidth: 200 }}>
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
          </Paper>

          <AdminTable
            columns={[
              {
                key: 'id',
                label: '注文ID',
                width: '80px',
                render: (v) => `#${v}`,
              },
              {
                key: 'totalAmount',
                label: '金額',
                render: (v) => `¥${(v || 0).toLocaleString()}`,
                hide: { mobile: true },
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
                      <Chip size="small" label="返金処理完了" color="success" />
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
                hide: { mobile: true },
                render: (v) => new Date(v).toLocaleDateString('ja-JP'),
              },
            ]}
            data={paginatedOrders}
            rowKey="id"
            actions={[
              {
                label: '詳細表示',
                onClick: (row) =>
                  router.push(`/admin/orders/detail?id=${row.id}`),
                variant: 'secondary',
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
