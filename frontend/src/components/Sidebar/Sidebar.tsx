'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import { useSidebar } from '@/context/SidebarContext';
import Overlay from '@/components/Common/Overlay';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { categories } = useCategories();
  const { expandedCategory, setExpandedCategory } = useSidebar();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleCategoryNameClick = (
    categoryId: string,
    subcategories: any[]
  ) => {
    // 大カテゴリを展開状態にする
    setExpandedCategory(categoryId);

    // 大カテゴリのすべての小カテゴリで検索ページに遷移
    const categoriesParams = subcategories
      .map((sub) => sub.id)
      .join('&categories=');
    router.push(`/search?categories=${categoriesParams}`);

    // モバイル時はサイドバーを閉じる
    if (onClose) {
      onClose();
    }
  };

  const handleChevronClick = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    toggleCategory(categoryId);
  };

  const isActive = (subcategoryId: string) => {
    const categories = searchParams.getAll('categories');
    return categories.includes(subcategoryId);
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
            {categories.map((category) => (
              <li key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <button
                    className={`${styles.categoryButton} ${
                      expandedCategory === category.id ? styles.expanded : ''
                    }`}
                    onClick={() =>
                      handleCategoryNameClick(
                        category.id,
                        category.subcategories
                      )
                    }
                    aria-expanded={expandedCategory === category.id}
                  >
                    <span>{category.name}</span>
                  </button>
                  <button
                    className={styles.chevronButton}
                    onClick={(e) => handleChevronClick(e, category.id)}
                    aria-label={`${category.name}を${
                      expandedCategory === category.id ? '縮小' : '展開'
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`${styles.chevron} ${
                        expandedCategory === category.id ? styles.expanded : ''
                      }`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                {expandedCategory === category.id && (
                  <ul className={styles.subcategoryList}>
                    {category.subcategories.map((sub) => (
                      <li key={sub.id} className={styles.subcategoryItem}>
                        <Link
                          href={`/search?categories=${sub.id}`}
                          className={`${styles.subcategoryLink} ${
                            isActive(sub.id) ? styles.active : ''
                          }`}
                          onClick={() => {
                            // モバイル時はサイドバーを閉じる
                            if (onClose) {
                              onClose();
                            }
                          }}
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
