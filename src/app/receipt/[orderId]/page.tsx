'use client';

import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef } from 'react';
import styles from './receipt.module.css';

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

const DUMMY_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    date: '2025年12月20日',
    total: 15800,
    status: 'completed',
    items: [
      { id: '1', name: 'ランニングシューズ', quantity: 1, price: 8800 },
      { id: '2', name: 'スポーツウェア', quantity: 2, price: 3500 },
    ],
  },
  {
    id: 'ORD-002',
    date: '2025年12月15日',
    total: 5500,
    status: 'completed',
    items: [{ id: '3', name: 'ヨガマット', quantity: 1, price: 5500 }],
  },
  {
    id: 'ORD-003',
    date: '2025年12月10日',
    total: 12000,
    status: 'completed',
    items: [{ id: '4', name: 'ダンベルセット', quantity: 1, price: 12000 }],
  },
];

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { isLoggedIn, user } = useAuth();
  const order = DUMMY_ORDERS.find((o) => o.id === orderId);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        // クローンした領収証要素を新しいウィンドウに追加
        const clonedReceipt = receiptRef.current.cloneNode(true) as HTMLElement;

        printWindow.document.write(
          '<!DOCTYPE html><html><head><meta charset="UTF-8">'
        );

        // すべてのスタイルシートを新しいウィンドウにコピー
        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const sheet = document.styleSheets[i];
            const rules = sheet.cssRules || sheet.rules;
            let css = '';
            for (let j = 0; j < rules.length; j++) {
              css += rules[j].cssText + '\n';
            }
            if (css) {
              printWindow.document.write(`<style>${css}</style>`);
            }
          } catch (e) {
            // クロスオリジンのスタイルシートはスキップ
          }
        }

        printWindow.document.write(
          '</head><body style="margin: 0; padding: 20px;">'
        );
        printWindow.document.write(clonedReceipt.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>領収証</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h1>領収証が見つかりません</h1>
            <p>指定された注文が見つかりませんでした</p>
            <Link href="/orders" className={styles.backButton}>
              注文履歴に戻る
            </Link>
          </div>
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

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <Link href="/orders">注文履歴</Link>
          <span>/</span>
          <span>領収証</span>
        </div>

        <div className={styles.receiptContainer}>
          <div className={styles.receiptHeader}>
            <h1>領収証</h1>
            <button className={styles.printButton} onClick={handlePrint}>
              印刷する
            </button>
          </div>

          <div ref={receiptRef} className={styles.receipt}>
            <div className={styles.companyInfo}>
              <h2>Mark Sports</h2>
              <p>住所：〒000-0000 東京都渋谷区</p>
              <p>電話：0120-XXX-XXXX</p>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.receiptInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>領収書番号</span>
                <span className={styles.value}>{order.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>発行日</span>
                <span className={styles.value}>{order.date}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>お客様名</span>
                <span className={styles.value}>{user.name}</span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.itemsSection}>
              <h3>ご購入商品</h3>
              <div className={styles.itemsTable}>
                <div className={styles.itemsHeader}>
                  <div className={styles.colName}>商品名</div>
                  <div className={styles.colQuantity}>数量</div>
                  <div className={styles.colPrice}>単価</div>
                  <div className={styles.colAmount}>金額</div>
                </div>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.colName}>{item.name}</div>
                    <div className={styles.colQuantity}>{item.quantity}</div>
                    <div className={styles.colPrice}>
                      ¥{item.price.toLocaleString()}
                    </div>
                    <div className={styles.colAmount}>
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>小計</span>
                <span className={styles.summaryValue}>
                  ¥{subtotal.toLocaleString()}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>配送料</span>
                <span className={styles.summaryValue}>
                  ¥{shipping.toLocaleString()}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>税金（10%）</span>
                <span className={styles.summaryValue}>
                  ¥{tax.toLocaleString()}
                </span>
              </div>
              <div className={styles.summaryRow + ' ' + styles.total}>
                <span className={styles.summaryLabel}>合計金額</span>
                <span className={styles.summaryValue}>
                  ¥{order.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.footer}>
              <p>本領収証は、お支払いの証として発行させていただきました。</p>
              <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/orders" className={styles.backLink}>
              注文履歴に戻る
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
