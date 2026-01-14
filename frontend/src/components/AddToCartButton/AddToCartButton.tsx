'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { checkProductExists } from '@/api/products';
import styles from './AddToCartButton.module.css';

interface Props {
  id: string | number;
  name: string;
  price: number;
  image?: string;
}

export default function AddToCartButton({ id, name, price, image }: Props) {
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  const { show: showSnackbar } = useSnackbar();

  const increase = () => setQty((q) => q + 1);
  const decrease = () => setQty((q) => Math.max(1, q - 1));

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      // 商品が存在するか確認
      const response = await checkProductExists(id);
      if (!response.success || !response.data?.exists) {
        showSnackbar('商品が見つかりません', 'error');
        return;
      }

      // 商品をカートに追加
      addItem({ id, name, price, image }, qty);
      showSnackbar(`${name}をカートに追加しました`, 'success');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      showSnackbar('カートに追加できませんでした', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.quantityLabel}>数量</label>
      <div className={styles.quantityControl}>
        <button
          className={styles.quantityButton}
          onClick={decrease}
          disabled={isLoading}
        >
          −
        </button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className={styles.quantityInput}
          disabled={isLoading}
        />
        <button
          className={styles.quantityButton}
          onClick={increase}
          disabled={isLoading}
        >
          +
        </button>
      </div>

      <button
        className={styles.addToCartButton}
        onClick={handleAddToCart}
        disabled={isLoading}
      >
        {isLoading ? 'チェック中...' : 'カートに追加'}
      </button>
    </div>
  );
}
