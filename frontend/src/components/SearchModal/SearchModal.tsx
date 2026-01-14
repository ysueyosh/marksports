'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRICE_RANGES = [
  { id: 'all', label: 'すべての価格' },
  { id: 'lt1000', label: '〜¥1,000' },
  { id: '1000-5000', label: '¥1,000〜¥5,000' },
  { id: '5000-10000', label: '¥5,000〜¥10,000' },
  { id: 'gt10000', label: '¥10,000〜' },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(useCategories().categories.map((c) => c.id))
  );
  const router = useRouter();
  const { categories } = useCategories();

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleParentCategoryChange = (
    category: { id: string; subcategories: any[] },
    isChecked: boolean
  ) => {
    const subcategoryIds = category.subcategories.map((sub) => sub.id);

    if (isChecked) {
      // 大カテゴリをチェック -> すべての小カテゴリを追加
      setSelectedCategories((prev) => {
        const newSelection = new Set([...prev, ...subcategoryIds]);
        return Array.from(newSelection);
      });
    } else {
      // 大カテゴリをアンチェック -> すべての小カテゴリを削除
      setSelectedCategories((prev) =>
        prev.filter((id) => !subcategoryIds.includes(id))
      );
    }
  };

  const isParentCategorySelected = (category: {
    id: string;
    subcategories: any[];
  }) => {
    const subcategoryIds = category.subcategories.map((sub) => sub.id);
    return (
      subcategoryIds.length > 0 &&
      subcategoryIds.every((id) => selectedCategories.includes(id))
    );
  };

  const isParentCategoryIndeterminate = (category: {
    id: string;
    subcategories: any[];
  }) => {
    const subcategoryIds = category.subcategories.map((sub) => sub.id);
    const selectedCount = subcategoryIds.filter((id) =>
      selectedCategories.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < subcategoryIds.length;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append('q', searchQuery);
    }
    selectedCategories.forEach((category) => {
      params.append('categories', category);
    });
    if (selectedPriceRange !== 'all') {
      params.append('priceRange', selectedPriceRange);
    }

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ''}`);
    onClose();
  };

  const resetSearchConditions = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedPriceRange('all');
    setIsDropdownOpen(false);
    setIsPriceDropdownOpen(false);
  };

  const handleCloseModal = () => {
    resetSearchConditions();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
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
            onClick={handleCloseModal}
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

          {/* Category Selection Dropdown */}
          <div className={styles.formGroup}>
            <label>カテゴリ</label>
            <Dropdown
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
              buttonText={
                selectedCategories.length === 0
                  ? 'すべてのカテゴリ'
                  : `${selectedCategories.length}個選択中`
              }
              containerClassName={styles.dropdownContainer}
            >
              {categories.map((category) => (
                <div key={category.id}>
                  <div className={styles.dropdownParentCheckboxWrapper}>
                    <label className={styles.dropdownParentCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={isParentCategorySelected(category)}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              isParentCategoryIndeterminate(category);
                          }
                        }}
                        onChange={(e) =>
                          handleParentCategoryChange(category, e.target.checked)
                        }
                      />
                      <span className={styles.parentCategoryName}>
                        {category.name}
                      </span>
                    </label>
                    <button
                      type="button"
                      className={styles.expandButton}
                      onClick={() => toggleCategoryExpand(category.id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`${styles.expandArrow} ${
                          expandedCategories.has(category.id)
                            ? styles.expanded
                            : ''
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  {expandedCategories.has(category.id) &&
                    category.subcategories.map((subcategory) => (
                      <label
                        key={subcategory.id}
                        className={styles.dropdownCheckboxLabel}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(subcategory.id)}
                          onChange={(e) =>
                            handleCategoryChange(
                              subcategory.id,
                              e.target.checked
                            )
                          }
                        />
                        <span>{subcategory.name}</span>
                      </label>
                    ))}
                </div>
              ))}
            </Dropdown>
          </div>

          {/* Price Range */}
          <div className={styles.formGroup}>
            <label>価格範囲</label>
            <Dropdown
              isOpen={isPriceDropdownOpen}
              onToggle={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
              onClose={() => setIsPriceDropdownOpen(false)}
              buttonText={
                PRICE_RANGES.find((r) => r.id === selectedPriceRange)?.label ||
                'すべての価格'
              }
              containerClassName={styles.priceRangeContainer}
            >
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.id}
                  className={styles.priceRangeOption}
                  onClick={() => {
                    setSelectedPriceRange(range.id);
                    setIsPriceDropdownOpen(false);
                  }}
                >
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.id}
                    checked={selectedPriceRange === range.id}
                    onChange={() => {}}
                    className={styles.priceRangeInput}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </Dropdown>
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
