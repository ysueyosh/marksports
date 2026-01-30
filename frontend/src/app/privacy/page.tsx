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

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Button onClick={() => router.back()} variant="outlined">
          ← 戻る
        </Button>
        <Typography variant="h4" fontWeight={700}>
          プライバシーポリシー
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              個人情報の取扱い
            </Typography>
            <Typography color="text.secondary">
              当サイト（Mark
              Sports）は、お客様がご提供いただく個人情報を大切に取り扱い、個人情報保護方針に従い、適切に管理してまいります。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              個人情報の定義
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              本プライバシーポリシーにおける「個人情報」とは、以下の情報を指します：
            </Typography>
            <List dense>
              {[
                '氏名、住所、電話番号、メールアドレス',
                '生年月日、性別などの属性情報',
                'クレジットカード番号、銀行口座番号などの決済情報',
                '購買履歴、閲覧履歴などの行動情報',
                'IP アドレス、Cookie などのデバイス情報',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              個人情報の収集
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              当サイトは、以下の目的で個人情報を収集いたします：
            </Typography>
            <List dense>
              {[
                '商品の配送およびご連絡のため',
                '決済処理のため',
                'サービスの向上および改善のため',
                'マーケティング調査および分析のため',
                '不正アクセス、詐欺その他の法令違反行為の防止のため',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              個人情報の使用
            </Typography>
            <Typography color="text.secondary">
              収集した個人情報は、本プライバシーポリシーに定められた目的以外には使用いたしません。ただし、法令に基づき開示を求められた場合はこの限りではありません。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              個人情報の第三者への提供
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              当サイトは、お客様の同意なしに個人情報を第三者へ提供することはありません。ただし、以下の場合は除きます：
            </Typography>
            <List dense>
              {[
                '法令に基づき開示が必要な場合',
                '人の生命、身体、財産の保護のため必要な場合',
                '公務執行の妨害を防止する必要がある場合',
              ].map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              セキュリティ
            </Typography>
            <Typography color="text.secondary">
              当サイトは、個人情報を厳重に保護するため、適切なセキュリティ対策を講じています。通信の暗号化、アクセス制限、定期的なセキュリティ監査を実施しております。
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              お問い合わせ
            </Typography>
            <Typography color="text.secondary">
              本プライバシーポリシーに関するご質問やご不明な点がございましたら、以下までお気軽にお問い合わせください。
            </Typography>
            <Typography color="text.secondary">
              メール：info@sports-store.jp
            </Typography>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
