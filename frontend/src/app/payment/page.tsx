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
import styles from './payment.module.css';

const ITEMS_PER_PAGE = 20;

export default function PaymentPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
          'error'
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
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>お支払方法管理</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
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
          }))
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

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>お支払方法管理</span>
        </div>

        <div className={styles.header}>
          <h1>お支払方法管理</h1>
        </div>

        <div className={styles.addCardSection}>
          <Link href="/payment/add" className={styles.addCardButton}>
            + 新しいカードを追加
          </Link>
        </div>

        <div className={styles.cardsList}>
          {isLoading ? (
            <p className={styles.loadingMessage}>読み込み中...</p>
          ) : cards.length === 0 ? (
            <div className={styles.noCards}>
              <p>登録されているカードはありません</p>
              <Link href="/payment/add" className={styles.addCardButton}>
                カードを追加
              </Link>
            </div>
          ) : (
            (() => {
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const endIndex = startIndex + ITEMS_PER_PAGE;
              const paginatedCards = cards.slice(startIndex, endIndex);
              const totalPages = Math.ceil(cards.length / ITEMS_PER_PAGE);

              return (
                <>
                  {paginatedCards.map((card) => (
                    <div key={card.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardInfo}>
                          <div className={styles.cardDetails}>
                            <p className={styles.cardType}>{card.cardType}</p>
                            <p className={styles.cardNumbers}>
                              **** **** **** {card.lastFourDigits}
                            </p>
                            <p className={styles.cardholderName}>
                              {card.cardholderName}
                            </p>
                          </div>
                        </div>
                        {card.isDefault && (
                          <span className={styles.defaultBadge}>メイン</span>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        <p className={styles.expiryDate}>
                          有効期限:{' '}
                          {formatExpiryDate(card.expiryMonth, card.expiryYear)}
                        </p>
                        <div className={styles.cardActions}>
                          {!card.isDefault && (
                            <button
                              className={styles.defaultButton}
                              onClick={() => handleSetDefaultCard(card.id)}
                            >
                              メインに設定
                            </button>
                          )}
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              );
            })()
          )}
        </div>
      </div>
    </MainLayout>
  );
}
