'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import Pagination from '@/components/Pagination/Pagination';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
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
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [totalItems]);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = allOrders.slice(startIndex, endIndex);

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
          <div className={styles.emptyWrapper}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>🛒</div>
              <h2 className={styles.emptyTitle}>まだ注文がありません</h2>
              <p className={styles.emptyText}>
                気になるアイテムを見つけて、はじめてのご注文をお楽しみください。
              </p>
              <div className={styles.emptyActions}>
                <Link href="/" className={styles.primaryAction}>
                  ショッピングを続ける
                </Link>
                <Link href="/search" className={styles.secondaryAction}>
                  カテゴリーから探す
                </Link>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
                            'ja-JP',
                          )}
                        </span>
                      </div>
                    </div>
                    <div className={styles.orderStatus}>
                      {(order.cancelRequestSent || order.isCancelRequest) &&
                        order.status !== 'cancelled_customer' &&
                        order.status !== 'cancelled_internal' && (
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
                      {order.refundAt && (
                        <span
                          className={styles.status}
                          style={{
                            backgroundColor: '#10b981',
                            marginRight: '8px',
                          }}
                        >
                          返金処理完了
                        </span>
                      )}
                      <OrderStatusChip
                        status={
                          order.status as
                            | 'unpaid'
                            | 'awaiting_shipment'
                            | 'in_transit'
                            | 'delivered'
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <div className={styles.itemsPreview}>
                      {order.items &&
                        order.items.slice(0, 2).map((item, idx) => {
                          const unitPrice = item.unitPrice ?? item.price ?? 0;
                          const lineTotal =
                            item.totalAmount ??
                            unitPrice * (item.quantity ?? 0);

                          return (
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
                              <span>¥{lineTotal.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      <div className={styles.itemPreview}>
                        <div>
                          <span className={styles.itemName}>送料</span>
                        </div>
                        <span>¥{order.shippingCost.toLocaleString()}</span>
                      </div>
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
                      href={`/orders/detail?id=${order.id}`}
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
