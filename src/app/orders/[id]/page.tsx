"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/Layout/MainLayout";
import LoadingSpinner from "@/components/Admin/LoadingSpinner";
import Link from "next/link";
import styles from "../orders.module.css";

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
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  const orderId = params?.id as string;

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }

    // ダミーデータから注文を取得
    const foundOrder = DUMMY_ORDERS.find((o) => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
    setIsLoading(false);
  }, [isLoggedIn, orderId, router]);

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <h1 className={styles.title}>注文が見つかりません</h1>
          <Link href="/orders" className={styles.backButton}>
            ← 注文履歴に戻る
          </Link>
        </div>
      </MainLayout>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 10000 ? 0 : 800;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "配送完了";
      case "pending":
        return "準備中";
      case "cancelled":
        return "キャンセル";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <Link href="/orders" className={styles.backButton}>
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
                <span className={styles.detailValue}>{order.id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>注文日</span>
                <span className={styles.detailValue}>{order.date}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ステータス</span>
                <span
                  className={styles.detailValue}
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
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
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemQuantity}>{item.quantity}</div>
                  <div className={styles.itemPrice}>
                    ¥
                    {(
                      item.price + Math.floor(item.price * 0.1)
                    ).toLocaleString()}
                  </div>
                  <div className={styles.itemSubtotal}>
                    ¥
                    {(
                      (item.price + Math.floor(item.price * 0.1)) *
                      item.quantity
                    ).toLocaleString()}
                  </div>
                </div>
              ))}

              {/* 合計行 */}
              <div className={styles.itemsFooter}>
                <div className={styles.itemName}></div>
                <div className={styles.itemQuantity}></div>
                <div className={styles.itemPrice}></div>
                <div className={styles.itemSubtotal}></div>
              </div>
            </div>

            {/* 金額詳細 */}
            <div className={styles.summaryContainer}>
              <div className={styles.summaryRow}>
                <span>小計</span>
                <span>¥{(subtotal + tax).toLocaleString()}</span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                  textAlign: "right",
                  paddingRight: "0",
                }}
              >
                （内消費税 ¥{tax.toLocaleString()}）
              </div>
              <div className={styles.summaryRow}>
                <span>送料</span>
                <span>¥{shipping.toLocaleString()}</span>
              </div>
              <div
                className={styles.summaryRow}
                style={{
                  borderTop: "2px solid #e5e7eb",
                  paddingTop: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                <span>合計金額</span>
                <span>¥{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* アクション */}
          <div className={styles.detailActions}>
            <Link href={`/receipt/${order.id}`} className={styles.detailButton}>
              領収証を表示
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
