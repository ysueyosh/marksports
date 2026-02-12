'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

interface AnalyticsData {
  date: string;
  siteAccess: number;
  productAccess: string;
  accessCount: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [analyticsData] = useState<AnalyticsData[]>([
    {
      date: '2024-04-01',
      siteAccess: 234,
      productAccess: 'バレーボール',
      accessCount: 45,
    },
    {
      date: '2024-04-02',
      siteAccess: 287,
      productAccess: 'バスケットボール',
      accessCount: 52,
    },
    {
      date: '2024-04-03',
      siteAccess: 198,
      productAccess: '卓球ラケット',
      accessCount: 38,
    },
    {
      date: '2024-04-04',
      siteAccess: 342,
      productAccess: 'バレーボール',
      accessCount: 61,
    },
    {
      date: '2024-04-05',
      siteAccess: 289,
      productAccess: 'ボール（卓球）',
      accessCount: 44,
    },
  ]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  const totalAccess = analyticsData.reduce(
    (sum, data) => sum + data.siteAccess,
    0,
  );
  const avgAccess = Math.round(totalAccess / analyticsData.length);
  const topProduct = analyticsData.reduce((prev, current) =>
    prev.accessCount > current.accessCount ? prev : current,
  );

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack spacing={3}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            分析機能
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">過去7日間</MenuItem>
              <MenuItem value="month">過去30日間</MenuItem>
              <MenuItem value="year">過去1年間</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          {[
            {
              label: '総アクセス数',
              value: totalAccess.toLocaleString(),
              sub: '全期間',
            },
            { label: '平均日次アクセス', value: avgAccess, sub: '1日あたり' },
            {
              label: '最も人気な商品',
              value: topProduct.productAccess,
              sub: `${topProduct.accessCount}回のアクセス`,
            },
            {
              label: '分析期間',
              value: analyticsData.length,
              sub: '日間のデータ',
            },
          ].map((stat) => (
            <Paper key={stat.label} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.sub}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            サイトアクセス推移
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1,
              height: 180,
            }}
          >
            {analyticsData.map((data, index) => {
              const maxAccess = Math.max(
                ...analyticsData.map((d) => d.siteAccess),
              );
              const height = (data.siteAccess / maxAccess) * 100;
              return (
                <Box key={index} sx={{ flex: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      height: `${height}%`,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                    }}
                    title={`${data.date}: ${data.siteAccess}アクセス`}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {data.date.split('-')[2]}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            商品別アクセス数
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>サイトアクセス数</TableCell>
                <TableCell>人気商品</TableCell>
                <TableCell>商品アクセス数</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.map((data) => (
                <TableRow key={data.date}>
                  <TableCell>{data.date}</TableCell>
                  <TableCell>{data.siteAccess}</TableCell>
                  <TableCell>{data.productAccess}</TableCell>
                  <TableCell>{data.accessCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Box>
  );
}
