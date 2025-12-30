'use client';

import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import Pagination from '@/components/Pagination/Pagination';
import Link from 'next/link';
import styles from './search.module.css';
import { useState, useMemo, useEffect } from 'react';

// ダミー商品データ（タグ追加）
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

export default function SearchPage() {
  // 入力状態（リアルタイムに更新）
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState('relevance');

  // 検索条件状態（検索ボタン押下時に更新）
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [searchPriceRange, setSearchPriceRange] = useState('all');
  const [searchSort, setSearchSort] = useState('relevance');

  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const ITEMS_PER_PAGE = 6;

  // 画面サイズを判定
  useEffect(() => {
    const checkMobileSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobileSize();
    window.addEventListener('resize', checkMobileSize);
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);

  // 検索ボタンのクリックハンドラ
  const handleSearch = () => {
    setSearchKeyword(keyword);
    setSearchTag(tag);
    setSearchPriceRange(priceRange);
    setSearchSort(sort);
    setCurrentPage(1); // ページを1にリセット
  };

  // タグ一覧を生成
  const allTags = Array.from(new Set(DUMMY_PRODUCTS.flatMap((p) => p.tags)));

  // 検索・フィルタ・ソート処理
  const filteredProducts = useMemo(() => {
    let result = DUMMY_PRODUCTS.filter((p) => {
      const matchName = searchKeyword === '' || p.name.includes(searchKeyword);
      const matchTag = searchTag === '' || p.tags.includes(searchTag);
      let matchPrice = true;
      if (searchPriceRange === 'lt1000') matchPrice = p.price <= 1000;
      else if (searchPriceRange === '1000-5000')
        matchPrice = p.price > 1000 && p.price <= 5000;
      else if (searchPriceRange === '5000-10000')
        matchPrice = p.price > 5000 && p.price <= 10000;
      else if (searchPriceRange === 'gt10000') matchPrice = p.price > 10000;
      return matchName && matchTag && matchPrice;
    });
    if (searchSort === 'asc')
      result = result.slice().sort((a, b) => a.price - b.price);
    if (searchSort === 'desc')
      result = result.slice().sort((a, b) => b.price - a.price);
    return result;
  }, [searchKeyword, searchTag, searchPriceRange, searchSort]);

  // ページング処理
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <span>検索結果</span>
        </div>

        <div className={styles.header}>
          <h1>検索結果</h1>
        </div>

        {/* 検索欄 */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="商品名で検索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {!isMobile && (
            <button className={styles.searchButton} onClick={handleSearch}>
              検索
            </button>
          )}
        </div>

        {/* フィルタ・ソート */}
        <div className={styles.filterSection}>
          <select
            className={styles.filterSelect}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">すべてのタグ</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
          >
            <option value="all">すべての価格</option>
            <option value="lt1000">〜¥1,000</option>
            <option value="1000-5000">¥1,000〜¥5,000</option>
            <option value="5000-10000">¥5,000〜¥10,000</option>
            <option value="gt10000">¥10,000〜</option>
          </select>
          <select
            className={styles.filterSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="relevance">関連度が高い順</option>
            <option value="asc">価格が安い順</option>
            <option value="desc">価格が高い順</option>
          </select>
        </div>

        {/* スマホ版の検索ボタン */}
        {isMobile && (
          <button className={styles.searchButton} onClick={handleSearch}>
            検索
          </button>
        )}

        {/* 件数表示 */}
        <div className={styles.resultCount}>
          <p>全 {filteredProducts.length} 件を表示</p>
        </div>

        {/* 商品グリッド */}
        <div className={styles.productGrid}>
          {paginatedProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              showDetails={true}
            />
          ))}
        </div>

        {/* ページネーション */}
        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </MainLayout>
  );
}
