'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './ProductCard.module.css';
import { formatPriceIncludedTax } from '@/utils/price';

interface ProductCardProps {
  id: number | string;
  name?: string;
  price?: number;
  showDetails?: boolean;
  onClick?: () => void;
}

export default function ProductCard({
  id,
  name,
  price,
  showDetails = true,
  onClick,
}: ProductCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const content = (
    <div
      className={styles.productCard}
      onClick={handleClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <div className={styles.productImage}>
        <Image
          src="https://d23pzr22xoegue.cloudfront.net/main.jpg"
          alt={name || '商品画像'}
          fill
          className={styles.image}
          priority
        />
      </div>
      {showDetails && (
        <>
          {name && <h3 className={styles.productName}>{name}</h3>}
          {price != null && (
            <p className={styles.productPrice}>
              {formatPriceIncludedTax(price)}
            </p>
          )}
        </>
      )}
      {onClick && (
        <button
          className={styles.detailButton}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          詳細を見る
        </button>
      )}
    </div>
  );

  // Link でラップされている場合と、そうでない場合の両方に対応
  if (onClick) {
    return content;
  }

  return <Link href={`/product/${id}`}>{content}</Link>;
}
