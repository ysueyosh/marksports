'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTable from '@/components/Admin/AdminTable';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  getPendingOrders,
  getPaymentConfirmation,
  DashboardOrder,
} from '@/api/admin-dashboard';

export default function AdminHomePage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [pendingOrders, setPendingOrders] = useState<DashboardOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [paymentOrders, setPaymentOrders] = useState<DashboardOrder[]>([]);
  const [paymentCount, setPaymentCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch pending orders (awaiting_shipment)
        const pendingResponse = await getPendingOrders();
        if (pendingResponse.success && pendingResponse.data) {
          setPendingOrders(pendingResponse.data.orders);
          setPendingCount(pendingResponse.data.count);
        }

        // Fetch payment confirmation orders (unpaid + bank_transfer)
        const paymentResponse = await getPaymentConfirmation();
        if (paymentResponse.success && paymentResponse.data) {
          setPaymentOrders(paymentResponse.data.orders);
          setPaymentCount(paymentResponse.data.count);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadData();
  }, []);

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          ダッシュボード
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              未配送の注文（上位5件）
              {pendingCount > 0 && (
                <Chip
                  label={`${pendingCount}件`}
                  size="small"
                  color="warning"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <AdminTable
              columns={
                isMobile
                  ? [
                      { key: 'customerName', label: '顧客名', width: '50%' },
                      {
                        key: 'status',
                        label: 'ステータス',
                        width: '50%',
                        render: (value: string) => (
                          <Chip
                            size="small"
                            label={
                              value === 'awaiting_shipment' ? '配送待ち' : value
                            }
                            color="warning"
                            variant="outlined"
                          />
                        ),
                      },
                    ]
                  : isTablet
                    ? [
                        {
                          key: 'customerName',
                          label: '顧客名',
                          width: '35%',
                        },
                        { key: 'amount', label: '金額', width: '30%' },
                        {
                          key: 'status',
                          label: 'ステータス',
                          width: '35%',
                          render: (value: string) => (
                            <Chip
                              size="small"
                              label={
                                value === 'awaiting_shipment'
                                  ? '配送待ち'
                                  : value
                              }
                              color="warning"
                              variant="outlined"
                            />
                          ),
                        },
                      ]
                    : [
                        {
                          key: 'orderNumber',
                          label: '注文番号',
                          width: '150px',
                        },
                        {
                          key: 'customerName',
                          label: '顧客名',
                          width: '150px',
                        },
                        { key: 'orderDate', label: '注文日', width: '120px' },
                        { key: 'amount', label: '金額', width: '120px' },
                        {
                          key: 'status',
                          label: 'ステータス',
                          render: (value: string) => (
                            <Chip
                              size="small"
                              label={
                                value === 'awaiting_shipment'
                                  ? '配送待ち'
                                  : value
                              }
                              color="warning"
                              variant="outlined"
                            />
                          ),
                        },
                      ]
              }
              data={pendingOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                orderDate: order.orderDate,
                amount: `¥${order.amount.toLocaleString()}`,
                status: order.status,
              }))}
              rowKey="orderNumber"
              onRowClick={(row) => {
                router.push(`/admin/orders/detail?id=${row.id}`);
              }}
              emptyMessage="未配送の注文はありません"
            />
            <Button
              component={Link}
              href="/admin/orders"
              sx={{ alignSelf: 'flex-start' }}
            >
              すべての注文を見る →
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              支払確認待ち（銀行振込）
              {paymentCount > 0 && (
                <Chip
                  label={`${paymentCount}件`}
                  size="small"
                  color="error"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <AdminTable
              columns={
                isMobile
                  ? [
                      { key: 'customerName', label: '顧客名', width: '50%' },
                      {
                        key: 'status',
                        label: 'ステータス',
                        width: '50%',
                        render: () => (
                          <Chip
                            size="small"
                            label="未払い"
                            color="error"
                            variant="outlined"
                          />
                        ),
                      },
                    ]
                  : isTablet
                    ? [
                        {
                          key: 'customerName',
                          label: '顧客名',
                          width: '35%',
                        },
                        { key: 'amount', label: '金額', width: '30%' },
                        {
                          key: 'status',
                          label: 'ステータス',
                          width: '35%',
                          render: () => (
                            <Chip
                              size="small"
                              label="未払い"
                              color="error"
                              variant="outlined"
                            />
                          ),
                        },
                      ]
                    : [
                        {
                          key: 'orderNumber',
                          label: '注文番号',
                          width: '150px',
                        },
                        {
                          key: 'customerName',
                          label: '顧客名',
                          width: '150px',
                        },
                        { key: 'orderDate', label: '注文日', width: '120px' },
                        { key: 'amount', label: '金額', width: '120px' },
                        {
                          key: 'status',
                          label: 'ステータス',
                          render: (value: string) => (
                            <Chip
                              size="small"
                              label={value === 'unpaid' ? '未払い' : value}
                              color="error"
                              variant="outlined"
                            />
                          ),
                        },
                      ]
              }
              data={paymentOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                orderDate: order.orderDate,
                amount: `¥${order.amount.toLocaleString()}`,
                status: order.status,
              }))}
              rowKey="orderNumber"
              onRowClick={(row) => {
                router.push(`/admin/orders/detail?id=${row.id}`);
              }}
              emptyMessage="支払確認待ちの注文はありません"
            />
            <Button
              component={Link}
              href="/admin/orders"
              sx={{ alignSelf: 'flex-start' }}
            >
              すべての注文を見る →
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            管理メニュー
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {[
              {
                href: '/admin/products',
                icon: '📦',
                title: '商品管理',
                desc: '商品情報の追加・編集・削除',
              },
              {
                href: '/admin/orders',
                icon: '📋',
                title: '注文管理',
                desc: '受注確認・配送状況管理',
              },
              {
                href: '/admin/coupons',
                icon: '🎟️',
                title: 'クーポン管理',
                desc: '割引クーポンの作成・管理',
              },
              {
                href: '/admin/users',
                icon: '👥',
                title: 'ユーザー管理',
                desc: 'ユーザー情報・ステータス管理',
              },
              {
                href: '/admin/notifications',
                icon: '📢',
                title: 'お知らせ配信',
                desc: 'メール・サイト内通知の配信',
              },
              {
                href: '/admin/settings',
                icon: '⚙️',
                title: '設定',
                desc: '管理者情報・システム設定',
              },
            ].map((item) => (
              <Paper
                key={item.href}
                component={Link}
                href={item.href}
                variant="outlined"
                sx={{
                  p: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                }}
              >
                <Typography fontSize="1.5rem">{item.icon}</Typography>
                <Typography fontWeight={700} mt={1}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {item.desc}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
