'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ダミー商品データ（検索ページと同じ）
const DUMMY_PRODUCTS = [
  {
    id: 1,
    name: 'バレーボール 5号球',
    price: 3200,
    tags: ['バレー', 'ボール'],
  },
  {
    id: 2,
    name: 'バスケットシューズ',
    price: 8900,
    tags: ['バスケ', 'シューズ'],
  },
  { id: 3, name: '卓球ラケット', price: 4500, tags: ['卓球', 'ラケット'] },
  {
    id: 4,
    name: 'バレーユニフォーム',
    price: 2800,
    tags: ['バレー', 'ウェア'],
  },
  { id: 5, name: 'バスケットボール', price: 3500, tags: ['バスケ', 'ボール'] },
  { id: 6, name: '卓球台', price: 29800, tags: ['卓球', 'テーブル'] },
];

const PRICE_RANGES = [
  { id: 'all', label: 'すべての価格' },
  { id: 'lt1000', label: '〜¥1,000' },
  { id: '1000-5000', label: '¥1,000〜¥5,000' },
  { id: '5000-10000', label: '¥5,000〜¥10,000' },
  { id: 'gt10000', label: '¥10,000〜' },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const router = useRouter();

  // タグ一覧を生成（検索ページと同じ）
  const allTags = useMemo(
    () => Array.from(new Set(DUMMY_PRODUCTS.flatMap((p) => p.tags))),
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append('q', searchQuery);
    }
    if (selectedTag) {
      params.append('tag', selectedTag);
    }
    if (selectedPriceRange !== 'all') {
      params.append('priceRange', selectedPriceRange);
    }

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>商品を検索</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSearch}>
          {/* Search Input */}
          <div className={styles.formGroup}>
            <label htmlFor="search">キーワード検索</label>
            <input
              id="search"
              type="text"
              placeholder="商品名を入力..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Tag Selection */}
          <div className={styles.formGroup}>
            <label htmlFor="tag">タグ</label>
            <select
              id="tag"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={styles.select}
            >
              <option value="">すべてのタグ</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className={styles.formGroup}>
            <label htmlFor="priceRange">価格範囲</label>
            <select
              id="priceRange"
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className={styles.select}
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button type="submit" className={styles.searchButton}>
            検索
          </button>
        </form>
      </div>
    </div>
  );
}
