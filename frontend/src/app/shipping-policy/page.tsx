'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import { getShippingPolicy } from '@/api/shipping';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';

type RegionSurcharge = {
  regionKey:
    | 'hokkaido'
    | 'tohoku'
    | 'chubuKanto'
    | 'chugokuKansai'
    | 'kyushu'
    | 'okinawa';
  regionLabel: string;
  fee: number;
};

export default function ShippingPolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [baseFee, setBaseFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(4000);
  const [regionSurcharges, setRegionSurcharges] = useState<RegionSurcharge[]>(
    [],
  );

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await getShippingPolicy();
        if (response.success && response.data) {
          setBaseFee(response.data.baseFee);
          setFreeShippingThreshold(response.data.freeShippingThreshold);
          setRegionSurcharges(response.data.regionSurcharges || []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button onClick={() => router.back()} variant="outlined">
          ← 戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          送料ポリシー
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        ) : null}

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              基本送料について
            </Typography>
            <Typography color="text.secondary">
              送料は「基本送料」と「地域追加送料」の合計で計算されます。現在の基本送料は税込
              ¥{baseFee.toLocaleString()} です。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              地域追加送料について
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              配送先の都道府県に応じて、以下の地域区分で追加送料が適用される場合があります。
            </Typography>
            <List dense>
              {regionSurcharges.map((item) => (
                <ListItem key={item.regionKey} disableGutters>
                  <ListItemText
                    primary={`${item.regionLabel}：税込 ¥${item.fee.toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              送料無料条件
            </Typography>
            <Typography color="text.secondary">
              カート内の商品金額（送料を除く・税込）が ¥
              {freeShippingThreshold.toLocaleString()}
              以上の場合、基本送料は無料です。なお、地域追加送料が設定されている地域への配送では、送料無料条件を満たしていても地域追加送料は発生します。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              送料の確定タイミング
            </Typography>
            <Typography color="text.secondary">
              送料は配送先住所の選択後に再計算され、チェックアウト画面でご確認いただけます。最終的な送料はご注文確定時にサーバー側で計算された金額が適用されます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              注意事項
            </Typography>
            <List dense>
              {[
                '離島・一部地域への配送は、通常より日数がかかる場合があります。',
                '送料設定は予告なく変更される場合があります。',
                '表示金額はすべて税込です。',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
