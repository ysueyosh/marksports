'use client';

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

export default function ReturnsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button onClick={() => router.back()} variant="outlined">
          ← 戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          返品・キャンセル条件
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返品について
            </Typography>
            <Typography color="text.secondary">
              当サイトでは、お客様ご都合による返品および不良品の返品をお受けしております。以下の条件をご確認の上、ご対応ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返品期限
            </Typography>
            <Typography color="text.secondary">
              商品到着後7日以内に返品のお申し出がない場合は、返品をお受けできません。返品のご希望がある場合は、お手数ですが速やかにご連絡ください。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              お客様都合による返品の条件
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              以下の条件をすべて満たしている場合に限り、返品をお受けいたします：
            </Typography>
            <List dense>
              {[
                '商品が未使用かつ未開封の状態であること',
                '商品到着時のパッケージおよび付属品がすべて揃っていること',
                '返品理由を明記いただくこと',
                '返送料はお客様ご負担であること',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            <Typography color="text.secondary">
              返品いただいた商品のご確認後、返金処理いたします。返金日は、返品商品の到着から10営業日程度となります。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              不良品・破損品の返品
            </Typography>
            <Typography color="text.secondary">
              商品の不良、破損、誤送などの当サイトの責によるご返品については、送料を当サイト負担とさせていただきます。恐れ入りますが、お急ぎのところ商品到着後速やかにご連絡をいただき、返品手続きをお願い申し上げます。
            </Typography>
            <Typography color="text.secondary">
              不良品の場合、代替品の送付または全額返金のいずれかをお選びいただけます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返品の手続き
            </Typography>
            <List dense>
              {[
                'お問い合わせフォームより返品のご連絡をいただきます',
                '返品手続きのご案内メールをお送りいたします',
                'ご指定の住所へ商品をご返送ください',
                '返品商品のご確認後、返金処理いたします',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              注文のキャンセルについて
            </Typography>
            <Typography color="text.secondary">
              商品配送前であれば、注文のキャンセルをお受けいたします。配送済みの商品については、返品として対応させていただきます。
            </Typography>
            <Typography color="text.secondary">
              キャンセルのお申し出は、お支払い確認後速やかにお願い申し上げます。キャンセル料金は発生いたしませんが、手数料をご負担いただく場合がございます。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返金方法
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              お客様のお支払い方法に応じて、以下のとおり返金させていただきます：
            </Typography>
            <List dense>
              {[
                'クレジットカード：カード会社への返金手続きとなります。返金日はカード会社によって異なります',
                '銀行振込：ご指定の銀行口座へ返金いたします。振込手数料はお客様ご負担とさせていただきます',
                '代金引換：返金チェックをお送りするか、ご指定の銀行口座へお振込みいたします',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              返品不可について
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              以下の商品は、返品をお受けできません：
            </Typography>
            <List dense>
              {[
                'お客様の過失により破損・汚損した商品',
                'セール・アウトレット商品',
                'カスタマイズ商品（特注品など）',
                '商品到着後7日以上経過した商品',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              お問い合わせ
            </Typography>
            <Typography color="text.secondary">
              返品・キャンセルに関するご質問は、以下までお気軽にお問い合わせください。
            </Typography>
            <Typography color="text.secondary">
              メール：marshall.step.0025@gmail.com
            </Typography>
            <Typography color="text.secondary">
              電話：070-8957-7058（月～金 9:00～17:00）
            </Typography>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
