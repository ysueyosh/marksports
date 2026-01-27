'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import Link from 'next/link';
import { getAddresses, deleteAddress, setDefaultAddress } from '@/api/address';
import styles from './address.module.css';

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
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>配送先住所管理</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
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
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>配送先住所管理</span>
        </div>

        <h1 className={styles.title}>配送先住所管理</h1>

        <Link href="/address/add" className={styles.addButton}>
          + 新しい住所を追加
        </Link>

        <div className={styles.addressList}>
          {addresses.length === 0 ? (
            <>
              <p className={styles.emptyMessage}>登録された住所はありません</p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <>
              {(() => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const endIndex = startIndex + ITEMS_PER_PAGE;
                const paginatedAddresses = addresses.slice(
                  startIndex,
                  endIndex,
                );

                return (
                  <>
                    {paginatedAddresses.map((addr) => (
                      <div key={addr.id} className={styles.addressCard}>
                        <div className={styles.addressHeader}>
                          <h3>
                            {addr.postalCode} {addr.prefecture}
                          </h3>
                          {addr.isMain && (
                            <span className={styles.defaultBadge}>メイン</span>
                          )}
                        </div>
                        <div className={styles.addressContent}>
                          <p>
                            {addr.address}
                            {addr.option && <br />}
                            {addr.option && <span>{addr.option}</span>}
                          </p>
                        </div>
                        <div className={styles.addressActions}>
                          {!addr.isMain && (
                            <button
                              className={styles.setDefaultButton}
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              メインに設定
                            </button>
                          )}
                          <Link
                            href={`/address/detail?id=${addr.id}`}
                            className={styles.editButton}
                          >
                            編集
                          </Link>
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
              })()}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
