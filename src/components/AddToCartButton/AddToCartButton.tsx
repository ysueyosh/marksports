'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './AddToCartButton.module.css';

interface Props {
  id: string | number;
  name: string;
  price: number;
}

export default function AddToCartButton({ id, name, price }: Props) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const increase = () => setQty((q) => q + 1);
  const decrease = () => setQty((q) => Math.max(1, q - 1));

  return (
    <div className={styles.container}>
      <label className={styles.quantityLabel}>数量</label>
      <div className={styles.quantityControl}>
        <button className={styles.quantityButton} onClick={decrease}>
          −
        </button>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className={styles.quantityInput}
        />
        <button className={styles.quantityButton} onClick={increase}>
          +
        </button>
      </div>

      <button
        className={styles.addToCartButton}
        onClick={() => addItem({ id, name, price }, qty)}
      >
        カートに追加
      </button>
    </div>
  );
}
