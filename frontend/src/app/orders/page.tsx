'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import { getOrders, Order } from '@/api/orders';
import styles from './orders.module.css';

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 初回アクセス時に注文一覧を取得
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getOrders();
        if (response.success && response.data) {
          setAllOrders(response.data.orders);
        } else {
          setError('注文情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('注文情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const totalItems = allOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = allOrders.slice(startIndex, endIndex);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '未入金', color: '#FF9800' }; // オレンジ
      case 'processing':
        return { label: '入金済', color: '#00BCD4' }; // 水色
      case 'shipped':
        return { label: '配送中', color: '#2196F3' }; // 青
      case 'delivered':
        return { label: '配送済', color: '#4CAF50' }; // 緑
      default:
        return { label: status, color: '#9E9E9E' };
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            読み込み中...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div style={{ padding: '40px', color: '#ef4444' }}>{error}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <span>注文履歴</span>
        </div>

        <div className={styles.header}>
          <h1>注文履歴</h1>
        </div>

        {currentOrders.length === 0 ? (
          <div className={styles.empty}>
            <p>注文履歴がありません</p>
            <Link href="/" className={styles.shopButton}>
              ショッピングを続ける
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.ordersList}>
              {currentOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderNumber}>
                        <span className={styles.label}>注文番号</span>
                        <span className={styles.value}>
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className={styles.orderDate}>
                        <span className={styles.label}>注文日</span>
                        <span className={styles.value}>
                          {new Date(order.orderDate).toLocaleDateString(
                            'ja-JP'
                          )}
                        </span>
                      </div>
                    </div>
                    <div className={styles.orderStatus}>
                      {order.cancelRequestSent && (
                        <span
                          className={styles.status}
                          style={{
                            backgroundColor: '#ef4444',
                            marginRight: '8px',
                          }}
                        >
                          キャンセル申請中
                        </span>
                      )}
                      <span
                        className={styles.status}
                        style={{
                          backgroundColor: getStatusDisplay(order.status).color,
                        }}
                      >
                        {getStatusDisplay(order.status).label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <div className={styles.itemsPreview}>
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className={styles.itemPreview}>
                          <div>
                            <span className={styles.itemName}>
                              {item.productName}
                            </span>
                            <span className={styles.itemQty}>
                              {' '}
                              x{item.quantity}
                            </span>
                          </div>
                          <span>
                            ¥{(item.unitPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.totalAmount}>
                      <span className={styles.label}>合計</span>
                      <span className={styles.value}>
                        ¥{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <Link
                      href={`/orders/${order.id}`}
                      className={styles.detailButton}
                    >
                      詳細を見る
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
