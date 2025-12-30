'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import sharedStyles from '../../admin-shared.module.css';
import pageStyles from '../orders.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface Order {
  id: number;
  customerName: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingStatus: 'pending' | 'shipped' | 'delivered';
  orderDate: string;
  customerEmail: string;
  customerAddress?: string;
  paymentMethod?: string;
  squareTransactionId?: string;
  cardLast4?: string;
  cardBrand?: string;
  paymentDateTime?: string;
  processingFee?: number;
  refundAmount?: number;
  refundDateTime?: string | null;
  items: {
    name: string;
    quantity: number;
    price: number;
    productId?: number;
  }[];
  shippingCost: number;
  couponDiscount: number;
}

interface ContactMessage {
  message: string;
  sentDate: string;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  // サンプルデータ（本来はAPIから取得）
  // ダミーデータ1件のみ使用

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // 1秒間スピナーを表示
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  // サンプルデータ（本来はAPIから取得）
  // ダミーデータ1件のみ使用
  const dummyOrder: Order = {
    id: 101,
    customerName: '山田太郎',
    amount: 9200,
    paymentStatus: 'completed',
    shippingStatus: 'delivered',
    orderDate: '2024-04-01',
    customerEmail: 'yamada@example.com',
    customerAddress: '東京都渋谷区1-1-1',
    paymentMethod: 'クレジットカード',
    squareTransactionId: 'txn_abc123def456',
    cardLast4: '4242',
    cardBrand: 'Visa',
    paymentDateTime: '2024-04-01 14:30:00',
    processingFee: 280,
    refundAmount: 0,
    refundDateTime: null,
    items: [{ name: 'バレーボール', quantity: 1, price: 8700, productId: 1 }],
    shippingCost: 800,
    couponDiscount: 300,
  };

  useEffect(() => {
    if (isLoggedIn) {
      // 本来はAPIから取得するが、今はダミーデータを使用
      setOrder(dummyOrder);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  if (!order) {
    return <>{isLoading && <LoadingSpinner />}</>;
  }

  const handleSendContact = () => {
    if (contactMessage.trim()) {
      setMessages([
        ...messages,
        {
          message: contactMessage,
          sentDate: new Date().toLocaleString('ja-JP'),
        },
      ]);
      setContactMessage('');
      setShowContactForm(false);
    }
  };

  const handleRefund = () => {
    if (refundReason.trim()) {
      setOrder({
        ...order,
        paymentStatus: 'failed',
      });
      setMessages([
        ...messages,
        {
          message: `返金処理完了: ${refundReason}`,
          sentDate: new Date().toLocaleString('ja-JP'),
        },
      ]);
      setRefundReason('');
      setShowRefundForm(false);
    }
  };

  const handleStatusChange = (
    field: 'paymentStatus' | 'shippingStatus',
    value: string
  ) => {
    setOrder({
      ...order,
      [field]: value,
    });
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <Link href="/admin/orders">
            <button className={styles.secondaryButton}>← 戻る</button>
          </Link>
        </div>

        <h1 className={styles.title}>注文詳細 - #{order.id}</h1>

        {/* 基本情報 */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            基本情報
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '5px',
                }}
              >
                顧客名
              </p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {order.customerName}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '5px',
                }}
              >
                メールアドレス
              </p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {order.customerEmail}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '5px',
                }}
              >
                注文日
              </p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {order.orderDate}
              </p>
            </div>
            <div
              style={{
                gridColumn: 'span 2',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '5px',
                }}
              >
                配送先住所
              </p>
              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                {order.customerAddress || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 注文内容 */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            注文内容
          </h2>
          <div style={{ marginBottom: '20px', fontSize: '14px' }}>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '5px',
              }}
            >
              決済方法
            </p>
            <p style={{ fontWeight: '500', marginBottom: '15px' }}>
              {order.paymentMethod || '-'}
            </p>

            {/* Square決済情報 */}
            <div
              style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '15px',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: '#1f2937',
                }}
              >
                決済情報詳細
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '3px',
                    }}
                  >
                    トランザクションID
                  </p>
                  <p style={{ fontWeight: '500', wordBreak: 'break-all' }}>
                    {order.squareTransactionId || '-'}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '3px',
                    }}
                  >
                    カード情報
                  </p>
                  <p style={{ fontWeight: '500' }}>
                    {order.cardBrand || '-'} ••••{order.cardLast4 || '••••'}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '3px',
                    }}
                  >
                    決済日時
                  </p>
                  <p style={{ fontWeight: '500' }}>
                    {order.paymentDateTime || '-'}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginBottom: '3px',
                    }}
                  >
                    処理手数料
                  </p>
                  <p style={{ fontWeight: '500' }}>
                    ¥{(order.processingFee || 0).toLocaleString()}
                  </p>
                </div>
                {(order.refundAmount || 0) > 0 && (
                  <>
                    <div>
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '3px',
                        }}
                      >
                        返金額
                      </p>
                      <p style={{ fontWeight: '500', color: '#ef4444' }}>
                        ¥{(order.refundAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '3px',
                        }}
                      >
                        返金日時
                      </p>
                      <p style={{ fontWeight: '500' }}>
                        {order.refundDateTime || '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  商品名
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  数量
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  単価
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                  }}
                >
                  小計
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 0', fontSize: '14px' }}>
                    <Link
                      href={`/product/${item.productId || 1}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      textAlign: 'center',
                      padding: '10px 0',
                      fontSize: '14px',
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '10px 0',
                      fontSize: '14px',
                    }}
                  >
                    ¥{item.price.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '10px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              textAlign: 'right',
              paddingTop: '15px',
              marginTop: '15px',
            }}
          >
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '8px',
                }}
              >
                <span style={{ minWidth: '150px', color: '#6b7280' }}>
                  小計:
                </span>
                <span style={{ fontWeight: '600', marginLeft: '20px' }}>
                  ¥
                  {order.items
                    .reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '8px',
                }}
              >
                <span style={{ minWidth: '150px', color: '#6b7280' }}>
                  送料:
                </span>
                <span style={{ fontWeight: '600', marginLeft: '20px' }}>
                  ¥{(order.shippingCost || 0).toLocaleString()}
                </span>
              </div>
              {(order.couponDiscount || 0) > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ minWidth: '150px', color: '#6b7280' }}>
                    クーポン割引:
                  </span>
                  <span
                    style={{
                      fontWeight: '600',
                      marginLeft: '20px',
                      color: '#ef4444',
                    }}
                  >
                    -¥{(order.couponDiscount || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '5px',
                }}
              >
                合計金額
              </p>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937',
                }}
              >
                ¥{order.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ステータス管理 */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            ステータス管理
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                決済ステータス
              </label>
              <select
                value={order.paymentStatus}
                onChange={(e) =>
                  handleStatusChange('paymentStatus', e.target.value as any)
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="pending">決済待ち</option>
                <option value="completed">決済済</option>
                <option value="failed">決済失敗</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                配送ステータス
              </label>
              <select
                value={order.shippingStatus}
                onChange={(e) =>
                  handleStatusChange('shippingStatus', e.target.value as any)
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="pending">配送待ち</option>
                <option value="shipped">配送中</option>
                <option value="delivered">配送完了</option>
              </select>
            </div>
          </div>
        </div>

        {/* 返金 */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            返金処理
          </h2>
          {!showRefundForm ? (
            <button
              onClick={() => setShowRefundForm(true)}
              className={styles.primaryButton}
            >
              返金を開始
            </button>
          ) : (
            <div>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="返金理由を入力してください..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleRefund} className={styles.primaryButton}>
                  返金実行
                </button>
                <button
                  onClick={() => setShowRefundForm(false)}
                  className={styles.secondaryButton}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ユーザーへの連絡 */}
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '15px',
            }}
          >
            ユーザーへの連絡
          </h2>

          {messages.length > 0 && (
            <div
              style={{
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '15px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '8px',
                    borderLeft: '3px solid #3b82f6',
                  }}
                >
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '5px',
                    }}
                  >
                    {msg.sentDate}
                  </p>
                  <p style={{ fontSize: '14px', margin: '0' }}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}

          {!showContactForm ? (
            <button
              onClick={() => setShowContactForm(true)}
              className={styles.primaryButton}
            >
              メッセージを送信
            </button>
          ) : (
            <div>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="メッセージを入力してください..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSendContact}
                  className={styles.primaryButton}
                >
                  送信
                </button>
                <button
                  onClick={() => setShowContactForm(false)}
                  className={styles.secondaryButton}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
