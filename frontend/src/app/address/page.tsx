'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import Link from 'next/link';
import { getAddresses, deleteAddress, setDefaultAddress } from '@/api/address';
import { convertPrefectureToJapanese } from '@/constants/prefectures';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';

const ITEMS_PER_PAGE = 20;

interface Address {
  id: string;
  postalCode: string;
  prefecture: string;
  address: string;
  option?: string;
  isMain: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AddressPage() {
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = addresses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [totalItems]);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await getAddresses();
        if (response.success && response.data) {
          setAddresses(response.data);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
        showSnackbar('住所の読み込みに失敗しました', 'error');
      }
    };

    loadAddresses();
  }, []);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box textAlign="center" py={6}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            配送先住所管理
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            ログインしていません
          </Typography>
          <Button variant="outlined" component={Link} href="/">
            ホームへ戻る
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const handleDeleteAddress = async (id: string) => {
    if (confirm('この住所を削除してもよろしいですか？')) {
      try {
        const response = await deleteAddress(id);

        if (response.success) {
          const remaining = addresses.filter((addr) => addr.id !== id);
          if (
            remaining.length > 0 &&
            addresses.find((a) => a.id === id)?.isMain
          ) {
            remaining[0].isMain = true;
          }
          setAddresses(remaining);
          setCurrentPage(1);
          showSnackbar('住所を削除しました', 'success');
        } else {
          showSnackbar('住所の削除に失敗しました', 'error');
        }
      } catch (err) {
        showSnackbar('エラーが発生しました', 'error');
        console.error('Error:', err);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await setDefaultAddress(id);

      if (response.success) {
        setAddresses(
          addresses.map((addr) => ({
            ...addr,
            isMain: addr.id === id,
          })),
        );
        showSnackbar('メイン住所を変更しました', 'success');
      } else {
        showSnackbar('メイン住所の変更に失敗しました', 'error');
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    }
  };

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href="/account" color="inherit">
            アカウント
          </MuiLink>
          <Typography color="text.primary">配送先住所管理</Typography>
        </Breadcrumbs>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            配送先住所管理
          </Typography>
          <Button variant="contained" component={Link} href="/address/add">
            + 新しい住所を追加
          </Button>
        </Box>

        {addresses.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary" gutterBottom>
              登録された住所はありません
            </Typography>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {(() => {
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const endIndex = startIndex + ITEMS_PER_PAGE;
              const paginatedAddresses = addresses.slice(startIndex, endIndex);

              return (
                <>
                  {paginatedAddresses.map((addr) => (
                    <Card key={addr.id} variant="outlined">
                      <CardContent>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          gap={1}
                        >
                          <Typography variant="subtitle1" fontWeight={700}>
                            {addr.postalCode}{' '}
                            {convertPrefectureToJapanese(addr.prefecture)}
                          </Typography>
                          {addr.isMain && (
                            <Chip label="メイン" color="primary" />
                          )}
                        </Stack>
                        <Typography mt={1} color="text.secondary">
                          {addr.address}
                          {addr.option && (
                            <>
                              <br />
                              {addr.option}
                            </>
                          )}
                        </Typography>
                        <Stack direction="row" spacing={1} mt={2}>
                          {!addr.isMain && (
                            <Button
                              variant="outlined"
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              メインに設定
                            </Button>
                          )}
                          <Button
                            variant="text"
                            component={Link}
                            href={`/address/detail?id=${addr.id}`}
                          >
                            編集
                          </Button>
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            削除
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              );
            })()}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
