'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './orders.module.css';

const styles = { ...sharedStyles, ...pageStyles };

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 101,
      customerName: '山田太郎',
      amount: 8700,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-01',
      customerEmail: 'yamada@example.com',
      items: [{ name: 'バレーボール', quantity: 1, price: 8700 }],
    },
    {
      id: 102,
      customerName: '佐藤花子',
      amount: 5200,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-05',
      customerEmail: 'satoh@example.com',
      items: [{ name: 'バスケットボール', quantity: 1, price: 5200 }],
    },
    {
      id: 103,
      customerName: '鈴木次郎',
      amount: 3400,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      orderDate: '2024-04-08',
      customerEmail: 'suzuki@example.com',
      items: [{ name: '卓球ラケット', quantity: 1, price: 3400 }],
    },
    {
      id: 104,
      customerName: '田中美咲',
      amount: 12500,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-10',
      customerEmail: 'tanaka@example.com',
      items: [{ name: 'テニスラケット', quantity: 1, price: 12500 }],
    },
    {
      id: 105,
      customerName: '渡辺健一',
      amount: 2800,
      paymentStatus: 'failed',
      shippingStatus: 'pending',
      orderDate: '2024-04-12',
      customerEmail: 'watanabe@example.com',
      items: [{ name: 'シャトルコック', quantity: 10, price: 2800 }],
    },
    {
      id: 106,
      customerName: '山本有希',
      amount: 6200,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-13',
      customerEmail: 'yamamoto@example.com',
      items: [{ name: 'バドミントンラケット', quantity: 1, price: 6200 }],
    },
    {
      id: 107,
      customerName: '伊藤勇太',
      amount: 9500,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-14',
      customerEmail: 'itoh@example.com',
      items: [{ name: 'サッカーボール', quantity: 1, price: 9500 }],
    },
    {
      id: 108,
      customerName: '高橋あかり',
      amount: 4300,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      orderDate: '2024-04-15',
      customerEmail: 'takahashi@example.com',
      items: [{ name: 'ボールネット', quantity: 1, price: 4300 }],
    },
    {
      id: 109,
      customerName: '中村翔一',
      amount: 11200,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-16',
      customerEmail: 'nakamura@example.com',
      items: [{ name: 'ゴルフクラブセット', quantity: 1, price: 11200 }],
    },
    {
      id: 110,
      customerName: '小林ひろみ',
      amount: 3900,
      paymentStatus: 'failed',
      shippingStatus: 'pending',
      orderDate: '2024-04-17',
      customerEmail: 'kobayashi@example.com',
      items: [{ name: 'テニスボール缶', quantity: 3, price: 3900 }],
    },
    {
      id: 111,
      customerName: '長谷川毅',
      amount: 7600,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-18',
      customerEmail: 'hasegawa@example.com',
      items: [{ name: 'スポーツシューズ', quantity: 1, price: 7600 }],
    },
    {
      id: 112,
      customerName: '青木麗奈',
      amount: 5500,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-19',
      customerEmail: 'aoki@example.com',
      items: [{ name: 'スポーツウェア', quantity: 2, price: 5500 }],
    },
    {
      id: 113,
      customerName: '鶴岡竜二',
      amount: 8900,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      orderDate: '2024-04-20',
      customerEmail: 'tsuruoka@example.com',
      items: [{ name: 'グローブ', quantity: 1, price: 8900 }],
    },
    {
      id: 114,
      customerName: '脇本由梨',
      amount: 4200,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-21',
      customerEmail: 'wakimoto@example.com',
      items: [{ name: 'ヘッドバンド', quantity: 2, price: 4200 }],
    },
    {
      id: 115,
      customerName: '土屋こはる',
      amount: 10300,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-22',
      customerEmail: 'tsuchiya@example.com',
      items: [{ name: 'スポーツバッグ', quantity: 1, price: 10300 }],
    },
    {
      id: 116,
      customerName: '根岸隆',
      amount: 6700,
      paymentStatus: 'failed',
      shippingStatus: 'pending',
      orderDate: '2024-04-23',
      customerEmail: 'negishi@example.com',
      items: [{ name: 'ウォーターボトル', quantity: 2, price: 6700 }],
    },
    {
      id: 117,
      customerName: '福島優美',
      amount: 5400,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-24',
      customerEmail: 'fukushima@example.com',
      items: [{ name: 'タオル', quantity: 3, price: 5400 }],
    },
    {
      id: 118,
      customerName: '栗原拓海',
      amount: 9100,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      orderDate: '2024-04-25',
      customerEmail: 'kurihara@example.com',
      items: [{ name: 'ベルト', quantity: 1, price: 9100 }],
    },
    {
      id: 119,
      customerName: '能勢瑞希',
      amount: 7200,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-26',
      customerEmail: 'nose@example.com',
      items: [{ name: 'キャップ', quantity: 1, price: 7200 }],
    },
    {
      id: 120,
      customerName: '福田七海',
      amount: 4600,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-04-27',
      customerEmail: 'fukuda@example.com',
      items: [{ name: 'ソックス', quantity: 5, price: 4600 }],
    },
    {
      id: 121,
      customerName: '荒井由衣',
      amount: 8800,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      orderDate: '2024-04-28',
      customerEmail: 'arai@example.com',
      items: [{ name: 'リストバンド', quantity: 2, price: 8800 }],
    },
    {
      id: 122,
      customerName: '石川弘樹',
      amount: 6400,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-04-29',
      customerEmail: 'ishikawa@example.com',
      items: [{ name: 'インソール', quantity: 1, price: 6400 }],
    },
    {
      id: 123,
      customerName: '北原宏太',
      amount: 5100,
      paymentStatus: 'failed',
      shippingStatus: 'pending',
      orderDate: '2024-04-30',
      customerEmail: 'kitahara@example.com',
      items: [{ name: 'プロテクター', quantity: 1, price: 5100 }],
    },
    {
      id: 124,
      customerName: '柴田留美',
      amount: 9900,
      paymentStatus: 'completed',
      shippingStatus: 'shipped',
      orderDate: '2024-05-01',
      customerEmail: 'shibata@example.com',
      items: [{ name: 'スポーツドリンク', quantity: 6, price: 9900 }],
    },
    {
      id: 125,
      customerName: '深田優亮',
      amount: 7800,
      paymentStatus: 'completed',
      shippingStatus: 'delivered',
      orderDate: '2024-05-02',
      customerEmail: 'fukada@example.com',
      items: [{ name: 'スポーツメガネ', quantity: 1, price: 7800 }],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    'all' | 'pending' | 'completed' | 'failed'
  >('all');
  const [filterShippingStatus, setFilterShippingStatus] = useState<
    'all' | 'pending' | 'shipped' | 'delivered'
  >('all');
  const [sortByDate, setSortByDate] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // フィルタが変更されたらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPaymentStatus, filterShippingStatus, sortByDate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleUpdatePaymentStatus = (
    id: number,
    status: 'pending' | 'completed' | 'failed'
  ) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, paymentStatus: status } : order
      )
    );
  };

  const handleUpdateShippingStatus = (
    id: number,
    status: 'pending' | 'shipped' | 'delivered'
  ) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, shippingStatus: status } : order
      )
    );
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '決済待ち',
      completed: '決済済',
      failed: '決済失敗',
    };
    return labels[status] || status;
  };

  const getShippingStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '配送待ち',
      shipped: '配送中',
      delivered: '配送完了',
    };
    return labels[status] || status;
  };

  // フィルタリングとソート
  let filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    const matchesPayment =
      filterPaymentStatus === 'all' ||
      order.paymentStatus === filterPaymentStatus;
    const matchesShipping =
      filterShippingStatus === 'all' ||
      order.shippingStatus === filterShippingStatus;
    return matchesSearch && matchesPayment && matchesShipping;
  });

  // 注文日でソート
  filteredOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.orderDate).getTime();
    const dateB = new Date(b.orderDate).getTime();
    return sortByDate === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // ページング
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <h1 className={styles.title}>受注管理</h1>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="注文IDまたは顧客名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">決済ステータス: すべて</option>
            <option value="pending">決済待ち</option>
            <option value="completed">決済済</option>
            <option value="failed">決済失敗</option>
          </select>
          <select
            value={filterShippingStatus}
            onChange={(e) => setFilterShippingStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">配送ステータス: すべて</option>
            <option value="pending">配送待ち</option>
            <option value="shipped">配送中</option>
            <option value="delivered">配送完了</option>
          </select>
          <select
            value={sortByDate}
            onChange={(e) => setSortByDate(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="desc">注文日: 新しい順</option>
            <option value="asc">注文日: 古い順</option>
          </select>
        </div>

        <AdminTable
          columns={[
            {
              key: 'id',
              label: '注文ID',
              width: '80px',
              render: (v) => `#${v}`,
            },
            { key: 'customerName', label: '顧客名' },
            {
              key: 'amount',
              label: '金額',
              render: (v) => `¥${v.toLocaleString()}`,
              hide: { mobile: true },
            },
            {
              key: 'status',
              label: 'ステータス',
              render: (_, row) => {
                const paymentStatusLabel =
                  row.paymentStatus === 'pending'
                    ? '決済待ち'
                    : row.paymentStatus === 'completed'
                    ? '決済済'
                    : '決済失敗';
                const shippingStatusLabel =
                  row.shippingStatus === 'pending'
                    ? '配送待ち'
                    : row.shippingStatus === 'shipped'
                    ? '配送中'
                    : '配送完了';
                return (
                  <>
                    <div className={styles.statusLine}>
                      {paymentStatusLabel}
                    </div>
                    <div className={styles.statusLine}>
                      {shippingStatusLabel}
                    </div>
                  </>
                );
              },
            },
            { key: 'orderDate', label: '注文日', hide: { mobile: true } },
          ]}
          data={paginatedOrders}
          rowKey="id"
          actions={[
            {
              label: '詳細表示',
              onClick: (row) => router.push(`/admin/orders/${row.id}`),
              variant: 'secondary',
            },
          ]}
          rowClassName={(row) =>
            row.shippingStatus === 'pending' ? styles.pendingShipping : ''
          }
          emptyMessage="注文が見つかりません"
        />

        <div className={styles.pagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </>
  );
}
