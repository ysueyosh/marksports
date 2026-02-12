'use client';

export const runtime = 'edge';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

export default function TermsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button onClick={() => router.back()} variant="outlined">
          ← 戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          利用規約
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第1条 総則
            </Typography>
            <Typography color="text.secondary">
              本利用規約（以下「本規約」）は、Mark
              Sports（以下「当サイト」）が提供するオンラインショッピングサービスの利用条件を定めるものです。当サイトをご利用いただくすべてのお客様は、本規約に同意いただいたものとみなします。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第2条 会員登録
            </Typography>
            <Typography color="text.secondary">
              当サイトのサービスをご利用いただくには、会員登録が必要です。登録情報は正確かつ最新の情報をご提供ください。虚偽の情報を提供された場合、当サイトは利用を中止させていただく場合があります。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第3条 ご注文から配送まで
            </Typography>
            <Typography color="text.secondary">
              ご注文いただいた商品は、お支払い確認後に発送いたします。配送料金および配送期間は、選択された配送方法によって異なります。天災その他予期できない事由により、配送が遅延する場合がございます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第4条 商品の在庫
            </Typography>
            <Typography color="text.secondary">
              当サイトに掲載されている商品の在庫は、リアルタイムで更新されます。ご注文のタイミングによっては在庫がない場合がございます。その場合はメールでご連絡いたします。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第5条 返品・交換
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              商品到着後7日以内であれば、返品をお受けいたします。返品には、以下の条件があります：
            </Typography>
            <List dense>
              {[
                '未使用かつ未開封の状態であること',
                '商品到着時のパッケージ状態が保持されていること',
                '返品理由が明記されていること',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            <Typography color="text.secondary">
              商品に不備・不良があった場合は、当該条件に限らず返品をお受けいたします。詳しくは「返品・キャンセル条件」をご参照ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第6条 禁止事項
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              ご利用者様は以下の行為を行ってはいけません：
            </Typography>
            <List dense>
              {[
                '不正な方法でのサービス利用',
                '他者の個人情報を利用した登録',
                '著作権その他の知的財産権の侵害',
                '詐欺行為、虚偽の情報提供',
                'その他法令に違反する行為',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第7条 免責事項
            </Typography>
            <Typography color="text.secondary">
              当サイトは、提供するサービスの内容、正確性、安全性について、明示的・暗示的を問わず保証しません。お客様がサービスを利用されたことにより生じた損害について、当サイトは一切の責任を負いません。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              第8条 規約の変更
            </Typography>
            <Typography color="text.secondary">
              当サイトは、事前の通知なく本規約の内容を変更することができます。変更後のご利用は、新規約に同意いただいたものとみなします。
            </Typography>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
