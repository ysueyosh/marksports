'use client';

import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Paper,
  Divider,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
} from '@mui/material';

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

const DUMMY_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    date: '2025年12月20日',
    total: 15800,
    status: 'completed',
    items: [
      { id: '1', name: 'ランニングシューズ', quantity: 1, price: 8800 },
      { id: '2', name: 'スポーツウェア', quantity: 2, price: 3500 },
    ],
  },
  {
    id: 'ORD-002',
    date: '2025年12月15日',
    total: 5500,
    status: 'completed',
    items: [{ id: '3', name: 'ヨガマット', quantity: 1, price: 5500 }],
  },
  {
    id: 'ORD-003',
    date: '2025年12月10日',
    total: 12000,
    status: 'completed',
    items: [{ id: '4', name: 'ダンベルセット', quantity: 1, price: 12000 }],
  },
];

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') as string;
  const { isLoggedIn, user } = useAuth();
  const order = DUMMY_ORDERS.find((o) => o.id === orderId);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        const clonedReceipt = receiptRef.current.cloneNode(true) as HTMLElement;

        printWindow.document.write(
          '<!DOCTYPE html><html><head><meta charset="UTF-8">',
        );

        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const sheet = document.styleSheets[i];
            const rules = sheet.cssRules || sheet.rules;
            let css = '';
            for (let j = 0; j < rules.length; j++) {
              css += rules[j].cssText + '\n';
            }
            if (css) {
              printWindow.document.write(`<style>${css}</style>`);
            }
          } catch (e) {
            // クロスオリジンのスタイルシートはスキップ
          }
        }

        printWindow.document.write(
          '</head><body style="margin: 0; padding: 20px;">',
        );
        printWindow.document.write(clonedReceipt.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            ログインしていません
          </Alert>
          <Button variant="outlined" component={Link} href="/">
            ホームへ戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            領収証が見つかりません
          </Alert>
          <Button variant="outlined" component={Link} href="/orders">
            注文履歴に戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 10000 ? 0 : 800;
  const tax = Math.floor(subtotal * 0.1);

  return (
    <MainLayout>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href="/account" color="inherit">
            アカウント
          </MuiLink>
          <MuiLink component={Link} href="/orders" color="inherit">
            注文履歴
          </MuiLink>
          <Typography color="text.primary">領収証</Typography>
        </Breadcrumbs>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
            mb={3}
          >
            <Typography variant="h4" fontWeight={700}>
              領収証
            </Typography>
            <Button variant="contained" onClick={handlePrint}>
              印刷する
            </Button>
          </Stack>

          <Box ref={receiptRef}>
            <Box mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Mark Sports
              </Typography>
              <Typography color="text.secondary">
                住所：〒000-0000 東京都渋谷区
              </Typography>
              <Typography color="text.secondary">
                電話：0120-XXX-XXXX
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1} mb={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">領収書番号</Typography>
                <Typography>{order.id}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">発行日</Typography>
                <Typography>{order.date}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">お客様名</Typography>
                <Typography>{user.name}</Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box mb={2}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                ご購入商品
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>商品名</TableCell>
                    <TableCell align="right">数量</TableCell>
                    <TableCell align="right">単価</TableCell>
                    <TableCell align="right">金額</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        ¥{item.price.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1} mb={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">小計</Typography>
                <Typography>¥{(subtotal + tax).toLocaleString()}</Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="right"
              >
                （内消費税 ¥{tax.toLocaleString()}）
              </Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">配送料</Typography>
                <Typography>¥{shipping.toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>合計金額</Typography>
                <Typography fontWeight={700} fontSize="1.1rem">
                  ¥{order.total.toLocaleString()}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography color="text.secondary" mb={1}>
                本領収証は、お支払いの証として発行させていただきました。
              </Typography>
              <Typography color="text.secondary">
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </Typography>
            </Box>
          </Box>

          <Box mt={3} textAlign="center">
            <Button variant="outlined" component={Link} href="/orders">
              注文履歴に戻る
            </Button>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
