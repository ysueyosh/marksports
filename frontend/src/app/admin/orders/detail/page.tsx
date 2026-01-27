'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import { getOrderDetail, OrderDetail } from '@/api/orders';
import { updateOrderStatus } from '@/api/admin-orders';
import styles from '../orders.module.css';
import BankTransferDetails from '@/components/BankTransferDetails/BankTransferDetails';

export default function AdminOrderDetailPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered'
  >('unpaid');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // 初回アクセス時に注文詳細を取得
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetail(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
          setSelectedStatus(response.data.status);
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

  const handleStatusChange = async () => {
    if (!order || selectedStatus === order.status) {
      return;
    }

    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const response = await updateOrderStatus({
        orderId: order.id,
        status: selectedStatus,
      });

      if (response.success) {
        setOrder((prev) => (prev ? { ...prev, status: selectedStatus } : null));
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setError(response.message || 'ステータスの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('ステータスの更新中にエラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>読み込み中...</div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <div style={{ padding: '40px', color: '#ef4444' }}>
          {error || '注文情報が見つかりません'}
        </div>
        <Link
          href="/admin/orders"
          style={{ marginLeft: '20px', color: '#3b82f6' }}
        >
          注文管理に戻る
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/admin/orders"
        style={{
          marginBottom: '20px',
          display: 'inline-block',
          color: '#3b82f6',
        }}
      >
        ← 注文管理に戻る
      </Link>

      <div className={styles.detailContainer}>
        <h1 className={styles.title}>注文詳細（管理画面）</h1>

        {updateSuccess && (
          <div
            style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #6ee7b7',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px',
              color: '#047857',
            }}
          >
            ✓ ステータスを更新しました
          </div>
        )}

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
                <OrderStatusChip status={order.status} />
              </span>
            </div>
          </div>
        </div>

        {/* ステータス変更セクション */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>ステータス変更</h2>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '6px',
                }}
              >
                新しいステータス
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="unpaid">未払い</option>
                <option value="awaiting_shipment">配送待ち</option>
                <option value="in_transit">配送中</option>
                <option value="delivered">配送済</option>
              </select>
            </div>
            <button
              onClick={handleStatusChange}
              disabled={isUpdating || selectedStatus === order.status}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  isUpdating || selectedStatus === order.status
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  isUpdating || selectedStatus === order.status ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {isUpdating ? '更新中...' : '更新'}
            </button>
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
            {(order.items || []).map((item) => (
              <div key={item.orderItemId} className={styles.itemsRow}>
                <div className={styles.itemName}>
                  {item.productName || '不明な商品'}
                </div>
                <div className={styles.itemQuantity}>{item.quantity || 0}</div>
                <div className={styles.itemPrice}>
                  ¥{item.unitPrice ? item.unitPrice.toLocaleString() : '0'}
                </div>
                <div className={styles.itemSubtotal}>
                  ¥{item.totalAmount ? item.totalAmount.toLocaleString() : '0'}
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
              <span>
                ¥{order.subtotal ? order.subtotal.toLocaleString() : '0'}
              </span>
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px',
                textAlign: 'right',
              }}
            >
              （内消費税 ¥{order.tax ? order.tax.toLocaleString() : '0'}）
            </div>
            <div className={styles.summaryRow}>
              <span>送料</span>
              <span>
                ¥
                {order.shippingCost ? order.shippingCost.toLocaleString() : '0'}
              </span>
            </div>
            {order.discount > 0 && (
              <div className={styles.summaryRow}>
                <span>割引</span>
                <span>-¥{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div
              className={styles.summaryRow}
              style={{ fontWeight: '600', fontSize: '16px' }}
            >
              <span>合計</span>
              <span>
                ¥{order.totalAmount ? order.totalAmount.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* 配送先情報 */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>配送先情報</h2>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            <div>
              {order.shippingAddress?.lastName || ''}{' '}
              {order.shippingAddress?.firstName || ''}
            </div>
            <div>〒{order.shippingAddress?.postalCode || ''}</div>
            {order.shippingAddress?.prefecture || ''}
            {order.shippingAddress?.address || ''}
            {order.shippingAddress?.building && (
              <div>{order.shippingAddress.building}</div>
            )}
          </div>
        </div>

        {/* 支払い情報 */}
        <div className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>支払い情報</h2>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            {order.paymentMethod?.cardType === 'credit_card' && (
              <>
                <div>クレジットカード</div>
                <div>{order.paymentMethod.cardType}</div>
                <div>****{order.paymentMethod.lastFourDigits}</div>
              </>
            )}
            {order.paymentMethod === 'bank_transfer' && (
              <div>
                <div>銀行振込</div>
                <BankTransferDetails />
              </div>
            )}
            {order.paymentMethod === 'apple_pay' && <div>Apple Pay</div>}
            {order.paymentMethod === 'google_pay' && <div>Google Pay</div>}
            {!order.paymentMethod && <div>不明な支払い方法</div>}
          </div>
        </div>
      </div>
    </>
  );
}
