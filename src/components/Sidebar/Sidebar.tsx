'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Overlay from '@/components/Common/Overlay';
import styles from './Sidebar.module.css';

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
}

const DUMMY_CATEGORIES: Category[] = [
  {
    id: 'volley',
    name: 'バレー',
    subcategories: [
      { id: 'volley-ball', name: 'ボール' },
      { id: 'volley-shoes', name: 'シューズ' },
      { id: 'volley-wear', name: 'ウェア' },
      { id: 'volley-acc', name: 'アクセサリー' },
    ],
  },
  {
    id: 'basketball',
    name: 'バスケットボール',
    subcategories: [
      { id: 'basket-ball', name: 'ボール' },
      { id: 'basket-shoes', name: 'シューズ' },
      { id: 'basket-wear', name: 'ウェア' },
      { id: 'basket-acc', name: 'アクセサリー' },
    ],
  },
  {
    id: 'ping-pong',
    name: '卓球',
    subcategories: [
      { id: 'ping-ball', name: 'ボール' },
      { id: 'ping-racket', name: 'ラケット' },
      { id: 'ping-table', name: 'テーブル' },
      { id: 'ping-acc', name: 'アクセサリー' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    'volley'
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const isActive = (categoryId: string, subcategoryId: string) => {
    const category = searchParams.get('category');
    const sub = searchParams.get('sub');
    return category === categoryId && sub === subcategoryId;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <Overlay isOpen={isOpen || false} onClick={onClose} zIndex="sidebar" />

      <aside className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
        <nav className={styles.nav}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="サイドバーを閉じる"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
            <span>閉じる</span>
          </button>
          <h2 className={styles.title}>カテゴリー</h2>

          <ul className={styles.categoryList}>
            {DUMMY_CATEGORIES.map((category) => (
              <li key={category.id} className={styles.categoryItem}>
                <button
                  className={`${styles.categoryButton} ${
                    expandedCategory === category.id ? styles.expanded : ''
                  }`}
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={expandedCategory === category.id}
                >
                  <span>{category.name}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.chevron}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedCategory === category.id && (
                  <ul className={styles.subcategoryList}>
                    {category.subcategories.map((sub) => (
                      <li key={sub.id} className={styles.subcategoryItem}>
                        <Link
                          href={`/search?category=${category.id}&sub=${sub.id}`}
                          className={`${styles.subcategoryLink} ${
                            isActive(category.id, sub.id) ? styles.active : ''
                          }`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
