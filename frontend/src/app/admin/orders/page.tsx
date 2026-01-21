'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import OrderStatusChip from '@/components/OrderStatusChip/OrderStatusChip';
import { getAllOrders, AdminOrder } from '@/api/admin-orders';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './orders.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface Order extends AdminOrder {
  customerName?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  shippingStatus?: 'pending' | 'shipped' | 'delivered';
  items?: {
    name: string;
    quantity: number;
    price: number;
    productId?: number;
  }[];
  customerEmail?: string;
  shippingCost?: number;
  couponDiscount?: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<
    'all' | 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered'
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
      // API から注文データを取得
      const fetchOrders = async () => {
        try {
          const response = await getAllOrders('date');
          if (response.success && response.data) {
            // APIレスポンスをフォーマット
            const formattedOrders: Order[] = response.data.map((order) => ({
              ...order,
              id: order.id as any, // 互換性のため
            }));
            setOrders(formattedOrders);
          } else {
            console.error('Failed to fetch orders:', response.message);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrders();
    }
  }, [router]);

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage]);

  // フィルタが変更されたらページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPaymentStatus, sortByDate]);

  if (!isLoggedIn) {
    return null;
  }

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
    const matchesSearch = order.id.toString().includes(searchQuery);
    const matchesStatus =
      filterPaymentStatus === 'all' || order.status === filterPaymentStatus;
    return matchesSearch && matchesStatus;
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
            <option value="all">ステータス: すべて</option>
            <option value="unpaid">決済待ち</option>
            <option value="awaiting_shipment">配送待ち</option>
            <option value="in_transit">配送中</option>
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
            {
              key: 'totalAmount',
              label: '金額',
              render: (v) => `¥${(v || 0).toLocaleString()}`,
              hide: { mobile: true },
            },
            {
              key: 'status',
              label: 'ステータス',
              render: (v) => (
                <OrderStatusChip
                  status={
                    v as
                      | 'unpaid'
                      | 'awaiting_shipment'
                      | 'in_transit'
                      | 'delivered'
                  }
                />
              ),
            },
            {
              key: 'orderDate',
              label: '注文日',
              hide: { mobile: true },
              render: (v) => new Date(v).toLocaleDateString('ja-JP'),
            },
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
            row.status === 'awaiting_shipment' ? styles.pendingShipping : ''
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
