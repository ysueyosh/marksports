'use client';

import Link from 'next/link';
import { Box, Container, Typography, Divider } from '@mui/material';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" bgcolor="grey.100" mt={4} py={4}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              ポリシー
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Box
                component={Link}
                href="/privacy"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                プライバシーポリシー
              </Box>
              <Box
                component={Link}
                href="/terms"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                利用規約
              </Box>
              <Box
                component={Link}
                href="/specific-transaction"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                特定商取引法に基づく表示
              </Box>
              <Box
                component={Link}
                href="/returns"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                返品・キャンセル条件
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              会社情報
            </Typography>
            <Typography color="text.secondary">Mark Sports</Typography>
            <Typography color="text.secondary">
              〒000-0000 東京都渋谷区
            </Typography>
            <Typography color="text.secondary">電話：0120-XXX-XXXX</Typography>
            <Typography color="text.secondary">
              メール：info@sports-store.jp
            </Typography>
            <Typography color="text.secondary">
              営業時間：9:00～18:00（日祝除く）
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              その他
            </Typography>
            <Box
              component={Link}
              href="/admin/login"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              管理者ログイン
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {currentYear} Mark Sports. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
