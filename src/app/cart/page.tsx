'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { useCart, CartItem } from '@/context/CartContext';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const { items: cartItems, removeItem, updateQuantity } = useCart();

  const handleRemoveItem = (id: number | string) => {
    removeItem(id);
  };

  const handleIncrease = (id: number | string, current: number) => {
    updateQuantity(id, current + 1);
  };

  const handleDecrease = (id: number | string, current: number) => {
    const next = Math.max(1, current - 1);
    updateQuantity(id, next);
  };

  const subtotal = cartItems.reduce<number>(
    (sum, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const shipping = cartItems.length > 0 ? 500 : 0;
  const tax = cartItems.length > 0 ? Math.floor(subtotal * 0.1) : 0;
  const total = cartItems.length > 0 ? subtotal + shipping + tax : 0;

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>ショッピングカート</h1>

        <div className={styles.content}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>カートに商品がありません。</div>
            ) : (
              <>
                <div className={styles.itemsHeader}>
                  <span>商品</span>
                  <span>価格</span>
                  <span>数量</span>
                  <span>小計</span>
                  <span></span>
                </div>
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemImage}>
                        <div className={styles.imagePlaceholder}>
                          {item.image}
                        </div>
                      </div>
                      <div>
                        <h3 className={styles.itemName}>{item.name}</h3>
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      ¥{item.price.toLocaleString('ja-JP')}
                    </div>
                    <div className={styles.itemQuantity}>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleDecrease(item.id, item.quantity)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        className={styles.quantityInput}
                        readOnly
                      />
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleIncrease(item.id, item.quantity)}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.itemSubtotal}>
                      ¥{(item.price * item.quantity).toLocaleString('ja-JP')}
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h2>注文概要</h2>

            <div className={styles.summaryRow}>
              <span>小計</span>
              <span>¥{subtotal.toLocaleString('ja-JP')}</span>
            </div>

            {cartItems.length > 0 && (
              <div className={styles.summaryRow}>
                <span>送料</span>
                <span>¥{shipping.toLocaleString('ja-JP')}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>消費税</span>
              <span>¥{tax.toLocaleString('ja-JP')}</span>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryTotal}>
              <span>合計</span>
              <span>¥{total.toLocaleString('ja-JP')}</span>
            </div>

            <div className={styles.couponSection}>
              <input
                type="text"
                placeholder="クーポンコードを入力"
                className={styles.couponInput}
              />
              <button className={styles.couponButton}>適用</button>
            </div>

            <button
              className={styles.checkoutButton}
              onClick={() => router.push('/checkout')}
              disabled={cartItems.length === 0}
            >
              レジに進む
            </button>

            <Link href="/" className={styles.continueShoppingButton}>
              ショッピングを続ける
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>✓</span>
            <span>30日間返金保証</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>✓</span>
            <span>送料無料（¥5,000以上）</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
