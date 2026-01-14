'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import CancelOrderModal from '@/components/CancelOrderModal/CancelOrderModal';
import { getOrderDetail, OrderDetail } from '@/api/orders';
import styles from '../orders.module.css';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // 初回アクセス時に注文詳細を取得
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetail(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError('注文情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError('注文情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

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

  if (error || !order) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div style={{ padding: '40px', color: '#ef4444' }}>
            {error || '注文情報が見つかりません'}
          </div>
          <Link href="/orders" style={{ marginLeft: '20px', color: '#3b82f6' }}>
            注文履歴に戻る
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleCancelSuccess = (response: {
    orderId: string;
    status: string;
    cancelRequestSent: boolean;
  }) => {
    // キャンセルリクエスト送信フラグを更新
    if (order) {
      setOrder({
        ...order,
        cancelRequestSent: response.cancelRequestSent,
      });
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <Link
          href="/orders"
          style={{
            marginBottom: '20px',
            display: 'inline-block',
            color: '#3b82f6',
          }}
        >
          ← 注文履歴に戻る
        </Link>

        <div className={styles.detailContainer}>
          <h1 className={styles.title}>注文詳細</h1>

          {/* 注文情報 */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>注文情報</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>注文番号</span>
                <span className={styles.detailValue}>{order.orderNumber}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>注文日</span>
                <span className={styles.detailValue}>
                  {new Date(order.orderDate).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ステータス</span>
                <span className={styles.detailValue}>
                  {order.cancelRequestSent && (
                    <span
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        display: 'inline-block',
                        fontSize: '14px',
                      }}
                    >
                      キャンセル申請中
                    </span>
                  )}
                  <span
                    style={{
                      display: 'inline-block',
                    }}
                  >
                    {order.statusLabel}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 注文商品と金額詳細 */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>注文内容</h2>
            <div className={styles.itemsTable}>
              <div className={styles.itemsHeader}>
                <div className={styles.itemName}>商品名</div>
                <div className={styles.itemQuantity}>数量</div>
                <div className={styles.itemPrice}>単価</div>
                <div className={styles.itemSubtotal}>小計</div>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className={styles.itemsRow}>
                  <div className={styles.itemName}>{item.productName}</div>
                  <div className={styles.itemQuantity}>{item.quantity}</div>
                  <div className={styles.itemPrice}>
                    ¥{item.unitPrice.toLocaleString()}
                  </div>
                  <div className={styles.itemSubtotal}>
                    ¥{item.totalPrice.toLocaleString()}
                  </div>
                </div>
              ))}

              {/* 合計行 */}
              <div className={styles.itemsFooter}></div>
            </div>

            {/* 金額詳細 */}
            <div className={styles.summaryContainer}>
              <div className={styles.summaryRow}>
                <span>小計</span>
                <span>¥{order.subtotal.toLocaleString()}</span>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginBottom: '8px',
                  textAlign: 'right',
                }}
              >
                （内消費税 ¥{order.tax.toLocaleString()}）
              </div>
              <div className={styles.summaryRow}>
                <span>送料</span>
                <span>¥{order.shippingCost.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className={styles.summaryRow}>
                  <span>割引</span>
                  <span>-¥{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div
                className={styles.summaryRow}
                style={{
                  borderTop: '2px solid #e5e7eb',
                  paddingTop: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                <span>合計金額</span>
                <span>¥{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 配送先・支払い情報 */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>配送・支払い情報</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '10px',
                  }}
                >
                  配送先
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div>
                    {order.shippingAddress.lastName}{' '}
                    {order.shippingAddress.firstName}
                  </div>
                  <div>〒{order.shippingAddress.postalCode}</div>
                  <div>
                    {order.shippingAddress.prefecture}
                    {order.shippingAddress.address}
                  </div>
                  {order.shippingAddress.building && (
                    <div>{order.shippingAddress.building}</div>
                  )}
                  <div>TEL: {order.shippingAddress.phone}</div>
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '10px',
                  }}
                >
                  支払い方法
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div>{order.paymentMethod.cardType}</div>
                  <div>****{order.paymentMethod.lastFourDigits}</div>
                </div>
              </div>
            </div>
          </div>

          {/* アクション */}
          <div className={styles.detailActions}>
            <Link href={`/receipt/${order.id}`} className={styles.detailButton}>
              領収証を表示
            </Link>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className={styles.detailButton}
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                注文をキャンセル
              </button>
            )}
          </div>
        </div>
      </div>

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        orderId={orderId}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={handleCancelSuccess}
      />
    </MainLayout>
  );
}
