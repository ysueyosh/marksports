'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import Link from 'next/link';
import {
  getSavedCards,
  deleteCard,
  setDefaultCard,
  SavedCard,
} from '@/api/payment';
import {
  Box,
  Breadcrumbs,
  Typography,
  Stack,
  Button,
  Paper,
  Chip,
  Divider,
  Link as MuiLink,
  Alert,
  CircularProgress,
} from '@mui/material';

const ITEMS_PER_PAGE = 20;

export default function PaymentPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = cards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [totalItems]);

  useEffect(() => {
    const loadCards = async () => {
      try {
        setIsLoading(true);
        const response = await getSavedCards();
        if (response.success && response.data) {
          setCards(response.data);
        } else {
          showSnackbar('お支払方法の読み込みに失敗しました', 'error');
        }
      } catch (err) {
        console.error('Failed to load cards:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        showSnackbar(
          `お支払方法の読み込みに失敗しました: ${errorMsg}`,
          'error',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      loadCards();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="h4" fontWeight={700}>
                お支払方法管理
              </Typography>
              <Alert severity="info">ログインしていません</Alert>
              <Button variant="outlined" component={Link} href="/">
                ホームへ戻る
              </Button>
            </Stack>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('このカードを削除してもよろしいですか？')) {
      try {
        const response = await deleteCard(cardId);

        if (response.success) {
          const remaining = cards.filter((card) => card.id !== cardId);
          if (
            remaining.length > 0 &&
            cards.find((c) => c.id === cardId)?.isDefault
          ) {
            remaining[0].isDefault = true;
          }
          setCards(remaining);
          setCurrentPage(1);
          showSnackbar('カードを削除しました', 'success');
        } else {
          showSnackbar('カードの削除に失敗しました', 'error');
        }
      } catch (err) {
        showSnackbar('エラーが発生しました', 'error');
        console.error('Error:', err);
      }
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      const response = await setDefaultCard(cardId);

      if (response.success) {
        setCards(
          cards.map((card) => ({
            ...card,
            isDefault: card.id === cardId,
          })),
        );
        setCurrentPage(1);
        showSnackbar('デフォルトカードを変更しました', 'success');
      } else {
        showSnackbar('デフォルトカードの変更に失敗しました', 'error');
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCards = cards.slice(startIndex, endIndex);

  return (
    <MainLayout>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <Stack spacing={3}>
          <Breadcrumbs>
            <MuiLink
              component={Link}
              href="/"
              underline="hover"
              color="inherit"
            >
              ホーム
            </MuiLink>
            <MuiLink
              component={Link}
              href="/account"
              underline="hover"
              color="inherit"
            >
              アカウント
            </MuiLink>
            <Typography color="text.secondary">お支払方法管理</Typography>
          </Breadcrumbs>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Typography variant="h4" fontWeight={700}>
              お支払方法管理
            </Typography>
            <Button variant="contained" component={Link} href="/payment/add">
              + 新しいカードを追加
            </Button>
          </Stack>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : cards.length === 0 ? (
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2}>
                <Typography>登録されているカードはありません</Typography>
                <Button
                  variant="contained"
                  component={Link}
                  href="/payment/add"
                >
                  カードを追加
                </Button>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={2}>
                {paginatedCards.map((card) => (
                  <Paper key={card.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={2}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {card.cardType}
                          </Typography>
                          <Typography color="text.secondary">
                            **** **** **** {card.lastFourDigits}
                          </Typography>
                          <Typography color="text.secondary">
                            {card.cardholderName}
                          </Typography>
                        </Stack>
                        {card.isDefault && (
                          <Chip label="メイン" color="primary" />
                        )}
                      </Stack>

                      <Divider />

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={2}
                      >
                        <Typography color="text.secondary">
                          有効期限:{' '}
                          {formatExpiryDate(card.expiryMonth, card.expiryYear)}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {!card.isDefault && (
                            <Button
                              variant="outlined"
                              onClick={() => handleSetDefaultCard(card.id)}
                            >
                              メインに設定
                            </Button>
                          )}
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            削除
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Box>
    </MainLayout>
  );
}
