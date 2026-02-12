'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material';

export default function SpecificTransactionPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button onClick={() => router.back()} variant="outlined">
          ← 戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          特定商取引法に基づく表記
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              販売者情報
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  {[
                    ['販売業者', 'Mark Sports'],
                    ['代表者', '〇〇 〇〇'],
                    ['住所', '〒000-0000 東京都渋谷区〇〇〇〇'],
                    ['電話番号', '0120-XXX-XXXX'],
                    ['メール', 'info@sports-store.jp'],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ width: 160, fontWeight: 700 }}>
                        {label}
                      </TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              商品代金以外の必要料金
            </Typography>
            <Typography color="text.secondary">
              配送料金：商品金額が税抜き10,000円未満の場合、送料800円が必要です。10,000円以上の場合は送料無料です。
            </Typography>
            <Typography color="text.secondary">
              消費税：商品代金に対して10%の消費税を申し受けます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              支払い方法
            </Typography>
            <Typography color="text.secondary">
              クレジットカード、銀行振込、代金引換など複数の支払い方法をご用意しています。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              商品代金の支払い時期
            </Typography>
            <Typography color="text.secondary">
              クレジットカード、PayPal：注文確定時
              <br />
              銀行振込：注文確定後7日以内のご入金
              <br />
              代金引換：商品受け取り時
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              商品の引き渡し時期
            </Typography>
            <Typography color="text.secondary">
              ご入金確認後、原則として5営業日以内に発送いたします。在庫がない場合はメールでご連絡いたします。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返品・交換について
            </Typography>
            <Typography color="text.secondary">
              商品到着後7日以内であれば、返品をお受けいたします。商品に不備・不良があった場合は、送料当社負担で対応いたします。詳しくは「返品・キャンセル条件」をご参照ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              営業時間
            </Typography>
            <Typography color="text.secondary">
              月～金：9:00～18:00（土日祝日を除く）
            </Typography>
            <Typography color="text.secondary">
              メール・オンラインストアは24時間受け付けております。
            </Typography>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
