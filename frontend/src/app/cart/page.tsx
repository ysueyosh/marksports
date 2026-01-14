'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { useCart, CartItem } from '@/context/CartContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { formatPriceIncludedTax, getPriceWithTax } from '@/utils/price';
import { checkProductsExist } from '@/api/products';
import { applyCoupon } from '@/api/coupon';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const {
    items: cartItems,
    removeItem,
    updateQuantity,
    coupon,
    setCoupon,
  } = useCart();
  const { show: showSnackbar } = useSnackbar();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deletedProductsList, setDeletedProductsList] = useState<CartItem[]>(
    []
  );
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  // レジに進む前に商品存在確認
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);
    try {
      // 1度のAPI呼び出しですべての商品を確認
      const response = await checkProductsExist(
        cartItems.map((item) => item.id)
      );

      if (!response.success || !response.data?.results) {
        showSnackbar('商品確認に失敗しました', 'error');
        return;
      }

      // 存在しない商品を検出
      const deletedProducts: CartItem[] = [];
      cartItems.forEach((item) => {
        if (!response.data?.results[String(item.id)]) {
          deletedProducts.push(item);
        }
      });

      // 存在しない商品がある場合、カートから削除して通知
      if (deletedProducts.length > 0) {
        deletedProducts.forEach((product) => {
          removeItem(product.id);
        });

        setDeletedProductsList(deletedProducts);
        const deletedNames = deletedProducts.map((p) => p.name).join('、');
        showSnackbar(`以下の商品が削除されています: ${deletedNames}`, 'error');
        return;
      }

      // すべての商品が存在する場合、レジに進む
      router.push('/checkout');
    } catch (err) {
      console.error('Failed to check products:', err);
      showSnackbar('商品確認に失敗しました', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // クーポンコードを適用
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('クーポンコードを入力してください');
      return;
    }

    setCouponError('');
    setIsApplyingCoupon(true);
    try {
      // クーポン割引対象額：商品代金 + 消費税
      const couponTargetAmount = subtotal + tax;
      const response = await applyCoupon(couponCode, couponTargetAmount);

      if (!response.success) {
        setCouponError(response.message);
        setCoupon(null);
        return;
      }

      const appliedCouponData = {
        code: response.data!.coupon_code,
        description: response.data!.coupon_description,
        discount_type: response.data!.discount_type as 'percentage' | 'fixed',
        discount_value: response.data!.discount_value,
        max_discount_amount:
          response.data!.discount_value === 10
            ? 500
            : response.data!.discount_value === 15
            ? 1000
            : undefined,
        min_order_amount:
          response.data!.discount_value === 500 ? 1000 : undefined,
      };
      setCoupon(appliedCouponData);
      setCouponError('');
      showSnackbar(
        `${response.data!.coupon_description}が適用されました`,
        'success'
      );
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      setCouponError('クーポン適用に失敗しました');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // 税抜き小計から税込み合計を計算
  const subtotal = cartItems.reduce<number>(
    (sum, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const shipping = cartItems.length > 0 ? 500 : 0;
  // 消費税は商品代金にのみかかる（送料は非課税）
  const tax = cartItems.length > 0 ? Math.floor(subtotal * 0.1) : 0;

  // クーポン割引額を動的に計算
  let discountAmount = 0;
  if (coupon) {
    const couponTargetAmount = subtotal + tax;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.floor(
        (couponTargetAmount * coupon.discount_value) / 100
      );
      // 最高割引額でキャップ
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      // fixed型
      discountAmount = Math.min(coupon.discount_value, couponTargetAmount);
    }
  }

  // クーポンで最低注文金額チェック
  let couponValidationError = '';
  if (coupon && coupon.min_order_amount) {
    if (subtotal < coupon.min_order_amount) {
      couponValidationError = `このクーポンを適用するには${coupon.min_order_amount}円以上の注文が必要です。`;
    }
  }

  const total =
    cartItems.length > 0 ? subtotal + shipping + tax - discountAmount : 0;
  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>ショッピングカート</h1>

        <div className={styles.content}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {deletedProductsList.length > 0 && (
              <div
                style={{
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  color: '#c33',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}
              >
                <strong>
                  ⚠️ 商品が存在しないため、以下の商品が削除されています。
                </strong>
                <ul
                  style={{
                    marginTop: '8px',
                    marginBottom: '0',
                    paddingLeft: '20px',
                  }}
                >
                  {deletedProductsList.map((product) => (
                    <li key={product.id} style={{ marginBottom: '4px' }}>
                      {product.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                      <Link href={`/product/${item.id}`}>
                        <div className={styles.itemImage}>
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className={styles.productImage}
                            />
                          ) : (
                            <div className={styles.imagePlaceholder}>
                              No Image
                            </div>
                          )}
                        </div>
                      </Link>
                      <div>
                        <h3 className={styles.itemName}>
                          <Link href={`/product/${item.id}`}>{item.name}</Link>
                        </h3>
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      {formatPriceIncludedTax(item.price)}
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
                      ¥
                      {(
                        getPriceWithTax(item.price) * item.quantity
                      ).toLocaleString('ja-JP')}
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
              <span>¥{(subtotal + tax).toLocaleString('ja-JP')}</span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px',
                textAlign: 'right',
              }}
            >
              （内消費税 ¥{tax.toLocaleString('ja-JP')}）
            </div>

            {cartItems.length > 0 && (
              <div className={styles.summaryRow}>
                <span>送料</span>
                <span>¥{shipping.toLocaleString('ja-JP')}</span>
              </div>
            )}

            {coupon && (
              <div className={styles.summaryRow}>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  割引（クーポン）
                </span>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  -¥{discountAmount.toLocaleString('ja-JP')}
                </span>
              </div>
            )}

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
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError('');
                }}
                disabled={coupon !== null || isApplyingCoupon}
              />
              <button
                className={styles.couponButton}
                onClick={handleApplyCoupon}
                disabled={coupon !== null || isApplyingCoupon}
                style={{
                  display: isApplyingCoupon || coupon ? 'none' : 'block',
                }}
              >
                {isApplyingCoupon ? '確認中...' : '適用'}
              </button>
              {coupon && (
                <button
                  onClick={() => {
                    setCoupon(null);
                    setCouponCode('');
                    setCouponError('');
                  }}
                  disabled={false}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    color: '#666',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '4px',
                  }}
                >
                  削除
                </button>
              )}
            </div>

            {couponError && (
              <div
                style={{
                  color: '#c33',
                  fontSize: '12px',
                  marginTop: '4px',
                  marginBottom: '12px',
                }}
              >
                {couponError}
              </div>
            )}

            {couponValidationError && (
              <div
                style={{
                  color: '#c33',
                  fontSize: '12px',
                  marginTop: '12px',
                  marginBottom: '0px',
                  padding: '8px 12px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                }}
              >
                {couponValidationError}
              </div>
            )}

            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              disabled={
                cartItems.length === 0 ||
                isCheckingOut ||
                !!couponValidationError
              }
            >
              {isCheckingOut ? '確認中...' : 'レジに進む'}
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
