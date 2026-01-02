'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import styles from './admin-home.module.css';
import sharedStyles from '../admin-shared.module.css';

interface Order {
  id: number;
  customerName: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingStatus: 'pending' | 'shipped' | 'delivered';
  orderDate: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    productId?: number;
  }[];
  customerEmail: string;
  shippingCost?: number;
  couponDiscount?: number;
}

export default function AdminHomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [unshippedOrders, setUnshippedOrders] = useState<Order[]>([]);

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // ダミーの注文データから未配送を取得
      const allOrders: Order[] = [
        {
          id: 101,
          customerName: '山田太郎',
          amount: 8700,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-27',
          customerEmail: 'yamada@example.com',
          items: [{ name: 'バレーボール', quantity: 1, price: 8700 }],
        },
        {
          id: 102,
          customerName: '佐藤花子',
          amount: 5200,
          paymentStatus: 'completed',
          shippingStatus: 'shipped',
          orderDate: '2024-12-26',
          customerEmail: 'sato@example.com',
          items: [{ name: 'バスケットシューズ', quantity: 1, price: 5200 }],
        },
        {
          id: 103,
          customerName: '鈴木次郎',
          amount: 4500,
          paymentStatus: 'pending',
          shippingStatus: 'pending',
          orderDate: '2024-12-25',
          customerEmail: 'suzuki@example.com',
          items: [{ name: '卓球ラケット', quantity: 1, price: 4500 }],
        },
        {
          id: 104,
          customerName: '田中美咲',
          amount: 2800,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-24',
          customerEmail: 'tanaka@example.com',
          items: [{ name: 'バレーユニフォーム', quantity: 1, price: 2800 }],
        },
        {
          id: 105,
          customerName: '伊藤健太',
          amount: 3500,
          paymentStatus: 'completed',
          shippingStatus: 'delivered',
          orderDate: '2024-12-23',
          customerEmail: 'itou@example.com',
          items: [{ name: 'バスケットボール', quantity: 1, price: 3500 }],
        },
        {
          id: 106,
          customerName: '渡辺由美',
          amount: 6200,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-22',
          customerEmail: 'watanabe@example.com',
          items: [{ name: 'ヨガマット', quantity: 1, price: 6200 }],
        },
        {
          id: 107,
          customerName: '木村翔太',
          amount: 12500,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-21',
          customerEmail: 'kimura@example.com',
          items: [{ name: 'テニスラケット', quantity: 1, price: 12500 }],
        },
        {
          id: 108,
          customerName: '清水優子',
          amount: 3900,
          paymentStatus: 'completed',
          shippingStatus: 'pending',
          orderDate: '2024-12-20',
          customerEmail: 'shimizu@example.com',
          items: [{ name: 'バドミントンシャトル', quantity: 1, price: 3900 }],
        },
      ];

      const unshipped = allOrders
        .filter(
          (o) =>
            o.shippingStatus === 'pending' && o.paymentStatus === 'completed'
        )
        .slice(0, 5);
      setUnshippedOrders(unshipped);

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

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <h1 className={sharedStyles.title}>ダッシュボード</h1>

        {/* 未配送の注文 */}
        <div className={styles.unshippedOrdersSection}>
          <h2 className={styles.sectionTitle}>未配送の注文（上位5件）</h2>
          <AdminTable
            columns={[
              { key: 'id', label: '注文ID', width: '100px' },
              { key: 'customerName', label: '顧客名', width: '150px' },
              { key: 'orderDate', label: '注文日', width: '120px' },
              { key: 'amount', label: '金額', width: '120px' },
              {
                key: 'paymentStatus',
                label: '決済状況',
                render: (value: string) => (
                  <span
                    className={`${styles.paymentStatus} ${
                      value === 'completed' ? styles.completed : styles.pending
                    }`}
                  >
                    {value === 'completed' ? '決済済' : '決済待ち'}
                  </span>
                ),
              },
            ]}
            data={unshippedOrders.map((order) => ({
              id: `#${order.id}`,
              customerName: order.customerName,
              orderDate: order.orderDate,
              amount: `¥${order.amount.toLocaleString()}`,
              paymentStatus: order.paymentStatus,
            }))}
            rowKey="id"
            onRowClick={(row) => {
              const orderId = row.id.replace('#', '');
              router.push(`/admin/orders/${orderId}`);
            }}
            emptyMessage="未配送の注文はありません"
          />
          <Link href="/admin/orders" className={styles.viewAllLink}>
            すべての注文を見る →
          </Link>
        </div>

        {/* 操作メニュー */}
        <div className={styles.statsSection}>
          <h2 className={sharedStyles.title}>管理メニュー</h2>
          <div className={styles.statsGrid}>
            <Link href="/admin/products" className={styles.menuCard}>
              <div className={styles.menuIcon}>📦</div>
              <h3>商品管理</h3>
              <p className={styles.menuDescription}>
                商品情報の追加・編集・削除
              </p>
            </Link>

            <Link href="/admin/orders" className={styles.menuCard}>
              <div className={styles.menuIcon}>📋</div>
              <h3>注文管理</h3>
              <p className={styles.menuDescription}>受注確認・配送状況管理</p>
            </Link>

            <Link href="/admin/coupons" className={styles.menuCard}>
              <div className={styles.menuIcon}>🎟️</div>
              <h3>クーポン管理</h3>
              <p className={styles.menuDescription}>割引クーポンの作成・管理</p>
            </Link>

            <Link href="/admin/users" className={styles.menuCard}>
              <div className={styles.menuIcon}>👥</div>
              <h3>ユーザー管理</h3>
              <p className={styles.menuDescription}>
                ユーザー情報・ステータス管理
              </p>
            </Link>

            <Link href="/admin/notifications" className={styles.menuCard}>
              <div className={styles.menuIcon}>📢</div>
              <h3>お知らせ配信</h3>
              <p className={styles.menuDescription}>
                メール・サイト内通知の配信
              </p>
            </Link>

            <Link href="/admin/settings" className={styles.menuCard}>
              <div className={styles.menuIcon}>⚙️</div>
              <h3>設定</h3>
              <p className={styles.menuDescription}>管理者情報・システム設定</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
