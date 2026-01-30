'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import AdminTable from '@/components/Admin/AdminTable';
import { Box, Typography, Paper, Chip, Stack, Button } from '@mui/material';

interface Order {
  id: number;
  customerName: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingStatus: 'pending' | 'shipped' | 'delivered';
  orderDate: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    productId?: number;
  }[];
  customerEmail: string;
  shippingCost?: number;
  couponDiscount?: number;
}

export default function AdminHomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unshippedOrders, setUnshippedOrders] = useState<Order[]>([]);

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // ダミーの注文データから未配送を取得
      const allOrders: Order[] = [
        {
          id: 101,
          customerName: '山田太郎',
          amount: 8700,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-27',
          customerEmail: 'yamada@example.com',
          items: [{ name: 'バレーボール', quantity: 1, price: 8700 }],
        },
        {
          id: 102,
          customerName: '佐藤花子',
          amount: 5200,
          paymentStatus: 'completed',
          shippingStatus: 'shipped',
          orderDate: '2024-12-26',
          customerEmail: 'sato@example.com',
          items: [{ name: 'バスケットシューズ', quantity: 1, price: 5200 }],
        },
        {
          id: 103,
          customerName: '鈴木次郎',
          amount: 4500,
          paymentStatus: 'pending',
          shippingStatus: 'pending',
          orderDate: '2024-12-25',
          customerEmail: 'suzuki@example.com',
          items: [{ name: '卓球ラケット', quantity: 1, price: 4500 }],
        },
        {
          id: 104,
          customerName: '田中美咲',
          amount: 2800,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-24',
          customerEmail: 'tanaka@example.com',
          items: [{ name: 'バレーユニフォーム', quantity: 1, price: 2800 }],
        },
        {
          id: 105,
          customerName: '伊藤健太',
          amount: 3500,
          paymentStatus: 'completed',
          shippingStatus: 'delivered',
          orderDate: '2024-12-23',
          customerEmail: 'itou@example.com',
          items: [{ name: 'バスケットボール', quantity: 1, price: 3500 }],
        },
        {
          id: 106,
          customerName: '渡辺由美',
          amount: 6200,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-22',
          customerEmail: 'watanabe@example.com',
          items: [{ name: 'ヨガマット', quantity: 1, price: 6200 }],
        },
        {
          id: 107,
          customerName: '木村翔太',
          amount: 12500,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-21',
          customerEmail: 'kimura@example.com',
          items: [{ name: 'テニスラケット', quantity: 1, price: 12500 }],
        },
        {
          id: 108,
          customerName: '清水優子',
          amount: 3900,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-20',
          customerEmail: 'shimizu@example.com',
          items: [{ name: 'バドミントンシャトル', quantity: 1, price: 3900 }],
        },
      ];

      const unshipped = allOrders
        .filter(
          (o) =>
            o.shippingStatus === 'pending' && o.paymentStatus === 'completed',
        )
        .slice(0, 5);
      setUnshippedOrders(unshipped);

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

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Stack spacing={4}>
          <Typography variant="h4" fontWeight={700}>
            ダッシュボード
          </Typography>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                未配送の注文（上位5件）
              </Typography>
              <AdminTable
                columns={[
                  { key: 'id', label: '注文ID', width: '100px' },
                  { key: 'customerName', label: '顧客名', width: '150px' },
                  { key: 'orderDate', label: '注文日', width: '120px' },
                  { key: 'amount', label: '金額', width: '120px' },
                  {
                    key: 'paymentStatus',
                    label: '決済状況',
                    render: (value: string) => (
                      <Chip
                        size="small"
                        label={value === 'completed' ? '決済済' : '決済待ち'}
                        color={value === 'completed' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    ),
                  },
                ]}
                data={unshippedOrders.map((order) => ({
                  id: `#${order.id}`,
                  customerName: order.customerName,
                  orderDate: order.orderDate,
                  amount: `¥${order.amount.toLocaleString()}`,
                  paymentStatus: order.paymentStatus,
                }))}
                rowKey="id"
                onRowClick={(row) => {
                  const orderId = row.id.replace('#', '');
                  router.push(`/admin/orders/detail?id=${orderId}`);
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
    </>
  );
}
