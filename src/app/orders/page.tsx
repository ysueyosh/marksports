"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/Layout/MainLayout";
import LoadingSpinner from "@/components/Admin/LoadingSpinner";
import Pagination from "@/components/Pagination/Pagination";
import Link from "next/link";
import { useMemo } from "react";
import styles from "./orders.module.css";

interface Order {
  id: string;
  date: string;
  total: number;
  status: "completed" | "pending" | "cancelled";
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

const DUMMY_ORDERS: Order[] = [
  {
    id: "ORD-001",
    date: "2025年12月20日",
    total: 17380,
    status: "completed",
    items: [
      { id: "1", name: "ランニングシューズ", quantity: 1, price: 8800 },
      { id: "2", name: "スポーツウェア", quantity: 2, price: 3500 },
    ],
  },
  {
    id: "ORD-002",
    date: "2025年12月15日",
    total: 6050,
    status: "completed",
    items: [{ id: "3", name: "ヨガマット", quantity: 1, price: 5500 }],
  },
  {
    id: "ORD-003",
    date: "2025年12月10日",
    total: 13200,
    status: "completed",
    items: [{ id: "4", name: "ダンベルセット", quantity: 1, price: 12000 }],
  },
  {
    id: "ORD-004",
    date: "2025年12月05日",
    total: 9790,
    status: "completed",
    items: [{ id: "5", name: "テニスラケット", quantity: 1, price: 8900 }],
  },
  {
    id: "ORD-005",
    date: "2025年11月28日",
    total: 24200,
    status: "completed",
    items: [{ id: "6", name: "ロードバイク", quantity: 1, price: 22000 }],
  },
  {
    id: "ORD-006",
    date: "2025年11月20日",
    total: 7150,
    status: "completed",
    items: [{ id: "7", name: "サッカーボール", quantity: 2, price: 3250 }],
  },
  {
    id: "ORD-007",
    date: "2025年11月15日",
    total: 5280,
    status: "completed",
    items: [{ id: "8", name: "スポーツソックス", quantity: 3, price: 1600 }],
  },
  {
    id: "ORD-008",
    date: "2025年11月10日",
    total: 19800,
    status: "pending",
    items: [{ id: "9", name: "スイムスーツセット", quantity: 1, price: 18000 }],
  },
  {
    id: "ORD-009",
    date: "2025年11月05日",
    total: 10120,
    status: "completed",
    items: [{ id: "10", name: "ランニングウォッチ", quantity: 1, price: 9200 }],
  },
  {
    id: "ORD-010",
    date: "2025年10月30日",
    total: 8360,
    status: "completed",
    items: [{ id: "11", name: "スポーツバッグ", quantity: 1, price: 7600 }],
  },
  {
    id: "ORD-011",
    date: "2025年10月25日",
    total: 12650,
    status: "completed",
    items: [{ id: "12", name: "ヨガブロック", quantity: 2, price: 5750 }],
  },
  {
    id: "ORD-012",
    date: "2025年10月20日",
    total: 5940,
    status: "completed",
    items: [{ id: "13", name: "水筒", quantity: 1, price: 5400 }],
  },
  {
    id: "ORD-013",
    date: "2025年10月15日",
    total: 13200,
    status: "completed",
    items: [{ id: "14", name: "キャプテンバンド", quantity: 2, price: 6600 }],
  },
  {
    id: "ORD-014",
    date: "2025年10月10日",
    total: 9800,
    status: "completed",
    items: [{ id: "15", name: "トレーニングマット", quantity: 1, price: 9800 }],
  },
  {
    id: "ORD-015",
    date: "2025年10月05日",
    total: 6200,
    status: "cancelled",
    items: [{ id: "16", name: "シューズクリーナー", quantity: 1, price: 6200 }],
  },
];

const getStatusLabel = (status: Order["status"]): string => {
  const statusMap = {
    completed: "配送完了",
    pending: "準備中",
    cancelled: "キャンセル",
  };
  return statusMap[status];
};

const getStatusClass = (status: Order["status"]): string => {
  const statusMap = {
    completed: styles.statusCompleted,
    pending: styles.statusPending,
    cancelled: styles.statusCancelled,
  };
  return statusMap[status];
};

export default function OrdersPage() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1秒間スピナーを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ページ遷移時にスピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return DUMMY_ORDERS.slice(startIndex, endIndex);
  }, [currentPage]);

  const totalPages = Math.ceil(DUMMY_ORDERS.length / itemsPerPage);

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        {isLoading && <LoadingSpinner />}
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>注文履歴</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <span>注文履歴</span>
        </div>

        <h1 className={styles.title}>注文履歴</h1>

        {DUMMY_ORDERS.length === 0 ? (
          <div className={styles.emptyState}>
            <p>注文履歴がありません</p>
            <Link href="/" className={styles.browseButton}>
              商品を見る
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.ordersContainer}>
              {paginatedOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderId}>注文番号: {order.id}</div>
                      <div className={styles.orderDate}>{order.date}</div>
                    </div>
                    <div
                      className={`${styles.status} ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <div className={styles.itemsHeader}>
                      <div className={styles.itemName}>商品名</div>
                      <div className={styles.itemQuantity}>数量</div>
                      <div className={styles.itemPrice}>金額</div>
                    </div>
                    {order.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.itemName}>
                          <Link
                            href={`/product/${item.id}`}
                            className={styles.productLink}
                          >
                            {item.name}
                          </Link>
                        </div>
                        <div className={styles.itemQuantity}>
                          {item.quantity}
                        </div>
                        <div className={styles.itemPrice}>
                          ¥
                          {(
                            item.price + Math.floor(item.price * 0.1)
                          ).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.totalAmount}>
                      合計金額:{" "}
                      <span className={styles.totalPrice}>
                        ¥{order.total.toLocaleString()}
                      </span>
                    </div>
                    <Link
                      href={`/orders/${order.id}`}
                      className={styles.detailButton}
                    >
                      詳細
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {paginatedOrders.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
