'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import LoadingSpinner from '@/components/Admin/LoadingSpinner';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './products.module.css';

const styles = { ...sharedStyles, ...pageStyles };
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Product {
  id: number;
  name: string;
  category1: string; // 大カテゴリ
  category2: string; // 中カテゴリ
  category3: string; // 小カテゴリ
  price: number;
  description: string;
  published: boolean;
  createdDate: string;
  mainImage: string; // メイン画像（Base64またはURL）
  subImages: string[]; // サブ画像（最大5枚、Base64またはURL）
  accessStats?: {
    date: string; // YYYY-MM-DD
    count: number;
  }[];
}

// カテゴリー構造定義
const categoryStructure: {
  [key: string]: { [key: string]: string[] };
} = {
  スポーツ用品: {
    バレー: ['ボール', 'ラケット', 'ネット'],
    バスケット: ['ボール', 'シューズ', 'バッグ'],
    卓球: ['ボール', 'ラケット', 'ネット'],
  },
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'バレーボール',
      category1: 'スポーツ用品',
      category2: 'バレー',
      category3: 'ボール',
      price: 3500,
      description: '高品質なバレーボール。練習試合に最適です。',
      published: true,
      createdDate: '2024-01-20',
      mainImage: '',
      subImages: [],
      accessStats: [
        { date: '2024-01-20', count: 5 },
        { date: '2024-01-21', count: 12 },
        { date: '2024-01-22', count: 8 },
        { date: '2024-02-01', count: 15 },
        { date: '2024-02-15', count: 22 },
        { date: '2024-03-01', count: 18 },
        { date: '2024-03-10', count: 25 },
        { date: '2024-04-05', count: 30 },
        { date: '2024-05-12', count: 28 },
        { date: '2024-12-01', count: 45 },
        { date: '2024-12-10', count: 52 },
        { date: '2024-12-20', count: 38 },
        { date: '2024-12-25', count: 65 },
      ],
    },
    {
      id: 2,
      name: 'バスケットボール',
      category1: 'スポーツ用品',
      category2: 'バスケット',
      category3: 'ボール',
      price: 4200,
      description: 'プロ仕様のバスケットボール。グリップが良く扱いやすい。',
      published: true,
      createdDate: '2024-02-10',
      mainImage: '',
      subImages: [],
      accessStats: [
        { date: '2024-02-10', count: 3 },
        { date: '2024-02-15', count: 10 },
        { date: '2024-03-05', count: 14 },
        { date: '2024-04-10', count: 20 },
        { date: '2024-05-05', count: 25 },
        { date: '2024-12-15', count: 35 },
        { date: '2024-12-20', count: 42 },
        { date: '2024-12-25', count: 50 },
      ],
    },
    {
      id: 3,
      name: '卓球ラケット',
      category1: 'スポーツ用品',
      category2: '卓球',
      category3: 'ラケット',
      price: 2800,
      description:
        '初心者から上級者まで使用できるラケット。バランスに優れています。',
      published: true,
      createdDate: '2024-02-15',
      mainImage: '',
      subImages: [],
      accessStats: [
        { date: '2024-02-15', count: 7 },
        { date: '2024-03-01', count: 11 },
        { date: '2024-04-05', count: 16 },
        { date: '2024-05-10', count: 18 },
        { date: '2024-12-10', count: 28 },
        { date: '2024-12-20', count: 35 },
      ],
    },
    {
      id: 4,
      name: 'ネット（バレー用）',
      category1: 'スポーツ用品',
      category2: 'バレー',
      category3: 'ネット',
      price: 8500,
      description: '公式規格のバレーボールネット。耐久性に優れています。',
      published: false,
      createdDate: '2024-03-01',
      mainImage: '',
      subImages: [],
      accessStats: [
        { date: '2024-03-01', count: 4 },
        { date: '2024-03-15', count: 9 },
        { date: '2024-04-20', count: 13 },
        { date: '2024-12-18', count: 22 },
      ],
    },
    {
      id: 5,
      name: 'ボール（卓球）',
      category1: 'スポーツ用品',
      category2: '卓球',
      category3: 'ボール',
      price: 800,
      description: '公式試合用の卓球ボール。セット販売です。',
      published: true,
      createdDate: '2024-03-05',
      mainImage: '',
      subImages: [],
      accessStats: [
        { date: '2024-03-05', count: 2 },
        { date: '2024-03-20', count: 6 },
        { date: '2024-04-15', count: 12 },
        { date: '2024-05-20', count: 15 },
        { date: '2024-12-12', count: 25 },
        { date: '2024-12-22', count: 30 },
      ],
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory1, setSelectedCategory1] = useState('');
  const [selectedCategory2, setSelectedCategory2] = useState('');
  const [selectedCategory3, setSelectedCategory3] = useState('');
  const [sortByPrice, setSortByPrice] = useState<'none' | 'asc' | 'desc'>(
    'none'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');
  const [showAccessStatsModal, setShowAccessStatsModal] = useState(false);
  const [selectedProductForStats, setSelectedProductForStats] =
    useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    category1: '',
    category2: '',
    category3: '',
    price: '',
    description: '',
    mainImage: '',
    subImages: [] as string[],
    published: true,
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    category1: '',
    category2: '',
    category3: '',
  });

  const itemsPerPage = 5;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
      setIsLoading(false);
    } else {
      setIsLoggedIn(true);
      // 1秒間スピナーを表示
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // ページ遷移時に1秒間スピナーを表示
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  // 大カテゴリ1一覧
  const category1List = Object.keys(categoryStructure);

  // 中カテゴリ2一覧（大カテゴリ1が選択されている場合のみ）
  const category2List = selectedCategory1
    ? Object.keys(categoryStructure[selectedCategory1])
    : [];

  // 小カテゴリ3一覧（中カテゴリ2が選択されている場合のみ）
  const category3List =
    selectedCategory1 && selectedCategory2
      ? categoryStructure[selectedCategory1][selectedCategory2]
      : [];

  // フィルタリングロジック
  let filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory1 =
      selectedCategory1 === '' || product.category1 === selectedCategory1;
    const matchesCategory2 =
      selectedCategory2 === '' || product.category2 === selectedCategory2;
    const matchesCategory3 =
      selectedCategory3 === '' || product.category3 === selectedCategory3;
    return (
      matchesSearch && matchesCategory1 && matchesCategory2 && matchesCategory3
    );
  });

  // ソートロジック
  if (sortByPrice !== 'none') {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      if (sortByPrice === 'asc') {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  }

  // ページング
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTogglePublish = (id: number) => {
    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, published: !product.published }
          : product
      )
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category1: '',
      category2: '',
      category3: '',
      price: '',
      description: '',
      mainImage: '',
      subImages: [],
      published: true,
    });
    setEditingId(null);
  };

  const handleAddProduct = () => {
    if (
      formData.name &&
      formData.category1 &&
      formData.category2 &&
      formData.category3 &&
      formData.price &&
      formData.description
    ) {
      if (editingId !== null) {
        // 編集
        setProducts(
          products.map((product) =>
            product.id === editingId
              ? {
                  ...product,
                  name: formData.name,
                  category1: formData.category1,
                  category2: formData.category2,
                  category3: formData.category3,
                  price: parseInt(formData.price),
                  description: formData.description,
                  mainImage: formData.mainImage,
                  subImages: formData.subImages,
                  published: formData.published,
                }
              : product
          )
        );
      } else {
        // 新規追加
        const product: Product = {
          id: Math.max(...products.map((p) => p.id), 0) + 1,
          name: formData.name,
          category1: formData.category1,
          category2: formData.category2,
          category3: formData.category3,
          price: parseInt(formData.price),
          description: formData.description,
          mainImage: formData.mainImage,
          subImages: formData.subImages,
          published: true,
          createdDate: new Date().toISOString().split('T')[0],
        };
        setProducts([...products, product]);
      }
      setShowNewProductForm(false);
      resetForm();
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      category1: product.category1,
      category2: product.category2,
      category3: product.category3,
      price: product.price.toString(),
      description: product.description,
      mainImage: product.mainImage,
      subImages: product.subImages,
      published: product.published,
    });
    setEditingId(product.id);
    setEditingProduct(product);
    setShowNewProductForm(true);
  };

  const handleStartDelete = () => {
    setIsDeleteConfirming(true);
    setDeleteInputValue('');
    // モーダル内容をスクロール上まで
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirming(false);
    setDeleteInputValue('');
  };

  const handleConfirmDelete = () => {
    if (editingProduct && deleteInputValue === editingProduct.name) {
      handleDeleteProduct(editingProduct.id);
      setShowNewProductForm(false);
      resetForm();
      setEditingProduct(null);
      setIsDeleteConfirming(false);
      setDeleteInputValue('');
    } else {
      alert('商品名が正しくありません');
    }
  };
  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          mainImage: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newSubImages = [...formData.subImages];
      for (
        let i = 0;
        i < Math.min(files.length, 5 - newSubImages.length);
        i++
      ) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            subImages: [...prev.subImages, reader.result as string],
          }));
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const handleRemoveSubImage = (index: number) => {
    setFormData({
      ...formData,
      subImages: formData.subImages.filter((_, i) => i !== index),
    });
  };

  const handleAddCategory = () => {
    if (
      categoryFormData.category1 &&
      categoryFormData.category2 &&
      categoryFormData.category3
    ) {
      // 既存の大カテゴリをチェック
      if (!categoryStructure[categoryFormData.category1]) {
        categoryStructure[categoryFormData.category1] = {};
      }
      // 既存の中カテゴリをチェック
      if (
        !categoryStructure[categoryFormData.category1][
          categoryFormData.category2
        ]
      ) {
        categoryStructure[categoryFormData.category1][
          categoryFormData.category2
        ] = [];
      }
      // 小カテゴリを追加（重複チェック）
      if (
        !categoryStructure[categoryFormData.category1][
          categoryFormData.category2
        ].includes(categoryFormData.category3)
      ) {
        categoryStructure[categoryFormData.category1][
          categoryFormData.category2
        ].push(categoryFormData.category3);
        // 状態を更新してUIをリフレッシュ
        setProducts([...products]);
        setShowCategoryForm(false);
        setCategoryFormData({
          category1: '',
          category2: '',
          category3: '',
        });
      } else {
        alert('このカテゴリは既に存在します。');
      }
    } else {
      alert('すべてのカテゴリを入力してください。');
    }
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>商品管理</h1>
          <div className={styles.headerButtons}>
            <button
              className={styles.primaryButton}
              onClick={() => {
                if (showNewProductForm) {
                  setShowNewProductForm(false);
                  resetForm();
                } else {
                  setShowNewProductForm(true);
                }
              }}
            >
              {showNewProductForm ? 'キャンセル' : '新規商品登録'}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => setShowCategoryForm(!showCategoryForm)}
            >
              {showCategoryForm ? 'キャンセル' : 'カテゴリ追加'}
            </button>
          </div>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="商品名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBox}>
          <select
            value={selectedCategory1}
            onChange={(e) => {
              setSelectedCategory1(e.target.value);
              setSelectedCategory2('');
              setSelectedCategory3('');
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">すべての大カテゴリ</option>
            {category1List.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {selectedCategory1 && (
            <select
              value={selectedCategory2}
              onChange={(e) => {
                setSelectedCategory2(e.target.value);
                setSelectedCategory3('');
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">すべての中カテゴリ</option>
              {category2List.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          {selectedCategory2 && (
            <select
              value={selectedCategory3}
              onChange={(e) => {
                setSelectedCategory3(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">すべての小カテゴリ</option>
              {category3List.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          <select
            value={sortByPrice}
            onChange={(e) => setSortByPrice(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="none">価格でソート</option>
            <option value="asc">安い順</option>
            <option value="desc">高い順</option>
          </select>
        </div>

        <AdminModal
          isOpen={showCategoryForm}
          onClose={() => {
            setShowCategoryForm(false);
            setCategoryFormData({
              category1: '',
              category2: '',
              category3: '',
            });
          }}
          title="カテゴリを追加"
          buttons={
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setShowCategoryForm(false);
                  setCategoryFormData({
                    category1: '',
                    category2: '',
                    category3: '',
                  });
                }}
              >
                キャンセル
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleAddCategory}
              >
                追加
              </button>
            </div>
          }
        >
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>大カテゴリ</label>
              <input
                type="text"
                value={categoryFormData.category1}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    category1: e.target.value,
                  })
                }
                placeholder="例：スポーツ用品"
              />
            </div>
            <div className={styles.formGroup}>
              <label>中カテゴリ</label>
              <input
                type="text"
                value={categoryFormData.category2}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    category2: e.target.value,
                  })
                }
                placeholder="例：バレー"
              />
            </div>
            <div className={styles.formGroup}>
              <label>小カテゴリ</label>
              <input
                type="text"
                value={categoryFormData.category3}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    category3: e.target.value,
                  })
                }
                placeholder="例：ボール"
              />
            </div>
          </div>
        </AdminModal>

        <AdminModal
          isOpen={showNewProductForm}
          onClose={() => {
            setShowNewProductForm(false);
            resetForm();
            setIsDeleteConfirming(false);
            setDeleteInputValue('');
          }}
          title={editingId !== null ? '商品を編集' : '新規商品登録'}
          shouldScrollToTop={isDeleteConfirming}
          buttons={
            <div
              className={styles.formActions}
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 0,
              }}
            >
              <div style={{ display: 'flex' }}>
                {editingId !== null && !isDeleteConfirming && (
                  <button
                    className={`${styles.secondaryButton} ${styles.danger}`}
                    onClick={handleStartDelete}
                  >
                    削除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    setShowNewProductForm(false);
                    resetForm();
                    setIsDeleteConfirming(false);
                    setDeleteInputValue('');
                  }}
                >
                  キャンセル
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleAddProduct}
                >
                  {editingId !== null ? '更新' : '登録'}
                </button>
              </div>
            </div>
          }
        >
          {isDeleteConfirming && editingProduct && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#991b1b',
                }}
              >
                ⚠️ 確認: 以下の商品を削除します
              </label>
              <p
                style={{
                  margin: '8px 0',
                  fontSize: '14px',
                  color: '#1f2937',
                }}
              >
                <strong>商品名:</strong> {editingProduct.name}
              </p>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  marginTop: '12px',
                }}
              >
                削除を確認するには、商品名を入力してください
              </label>
              <input
                type="text"
                value={deleteInputValue}
                onChange={(e) => setDeleteInputValue(e.target.value)}
                placeholder={`「${editingProduct.name}」と入力`}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteInputValue !== editingProduct.name}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor:
                      deleteInputValue === editingProduct.name
                        ? '#dc2626'
                        : '#f3f4f6',
                    color:
                      deleteInputValue === editingProduct.name
                        ? 'white'
                        : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    cursor:
                      deleteInputValue === editingProduct.name
                        ? 'pointer'
                        : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  削除
                </button>
                <button
                  onClick={handleCancelDelete}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>商品名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="商品名を入力"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>大カテゴリ</label>
              <select
                value={formData.category1}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    category1: e.target.value,
                    category2: '',
                    category3: '',
                  });
                }}
              >
                <option value="">選択してください</option>
                {category1List.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {formData.category1 && (
              <div className={styles.formGroup}>
                <label>中カテゴリ</label>
                <select
                  value={formData.category2}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category2: e.target.value,
                      category3: '',
                    });
                  }}
                >
                  <option value="">選択してください</option>
                  {Object.keys(categoryStructure[formData.category1]).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
            {formData.category2 && (
              <div className={styles.formGroup}>
                <label>小カテゴリ</label>
                <select
                  value={formData.category3}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category3: e.target.value,
                    });
                  }}
                >
                  <option value="">選択してください</option>
                  {categoryStructure[formData.category1][
                    formData.category2
                  ].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>価格</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="価格を入力"
            />
          </div>
          <div className={styles.formGroup}>
            <label>説明</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="商品説明を入力"
              rows={4}
            />
          </div>
          <div className={styles.formGroup}>
            <label>公開状況</label>
            <select
              value={formData.published ? 'public' : 'private'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  published: e.target.value === 'public',
                })
              }
            >
              <option value="public">公開</option>
              <option value="private">非公開</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>メイン画像</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              className={styles.fileInput}
            />
            {formData.mainImage && (
              <div className={styles.imagePreview}>
                <img src={formData.mainImage} alt="メイン画像プレビュー" />
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>サブ画像（最大5枚）</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSubImageUpload}
              className={styles.fileInput}
              disabled={formData.subImages.length >= 5}
            />
            {formData.subImages.length > 0 && (
              <div className={styles.subImagesContainer}>
                {formData.subImages.map((img, index) => (
                  <div key={index} className={styles.subImageWrapper}>
                    <img src={img} alt={`サブ画像 ${index + 1}`} />
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveSubImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminModal>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>商品名</th>
                <th>価格</th>
                <th>説明</th>
                <th>公開状態</th>
                <th>作成日</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <tr
                    data-product-id={product.id}
                    className={styles.productRow}
                    onMouseEnter={(e) => {
                      const productId =
                        e.currentTarget.getAttribute('data-product-id');
                      document
                        .querySelectorAll(`[data-product-id="${productId}"]`)
                        .forEach((el) => {
                          el.classList.add(styles.hovered);
                        });
                    }}
                    onMouseLeave={(e) => {
                      const productId =
                        e.currentTarget.getAttribute('data-product-id');
                      document
                        .querySelectorAll(`[data-product-id="${productId}"]`)
                        .forEach((el) => {
                          el.classList.remove(styles.hovered);
                        });
                    }}
                    style={
                      {
                        backgroundColor:
                          editingId === product.id ? '#dbeafe' : null,
                      } as any
                    }
                  >
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>¥{product.price.toLocaleString()}</td>
                    <td className={styles.descriptionCell}>
                      {product.description}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          product.published ? styles.active : styles.suspended
                        }`}
                      >
                        {product.published ? '公開' : '非公開'}
                      </span>
                    </td>
                    <td>{product.createdDate}</td>
                    <td rowSpan={2}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => {
                          setIsLoading(true);
                          // API通信をシミュレート
                          setTimeout(() => {
                            setSelectedProductForStats(product);
                            setShowAccessStatsModal(true);
                            setIsLoading(false);
                          }, 1000);
                        }}
                      >
                        統計
                      </button>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleEditProduct(product)}
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                  <tr
                    data-product-id={product.id}
                    className={styles.categoryRow}
                    onMouseEnter={(e) => {
                      const productId =
                        e.currentTarget.getAttribute('data-product-id');
                      document
                        .querySelectorAll(`[data-product-id="${productId}"]`)
                        .forEach((el) => {
                          el.classList.add(styles.hovered);
                        });
                    }}
                    onMouseLeave={(e) => {
                      const productId =
                        e.currentTarget.getAttribute('data-product-id');
                      document
                        .querySelectorAll(`[data-product-id="${productId}"]`)
                        .forEach((el) => {
                          el.classList.remove(styles.hovered);
                        });
                    }}
                  >
                    <td colSpan={6} className={styles.categoryCell}>
                      {product.category1} &gt; {product.category2} &gt;{' '}
                      {product.category3}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {showAccessStatsModal && selectedProductForStats && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAccessStatsModal(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '30px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}
                >
                  アクセス統計 - {selectedProductForStats.name}
                </h2>
                <button
                  onClick={() => setShowAccessStatsModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                  }}
                >
                  ×
                </button>
              </div>
              <AccessStatsDisplay product={selectedProductForStats} />
            </div>
          </div>
        )}

        <div className={styles.pagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </>
  );
}

interface AccessStatsDisplayProps {
  product: Product;
}

function AccessStatsDisplay({ product }: AccessStatsDisplayProps) {
  const [displayMode, setDisplayMode] = useState<
    'all' | 'year' | 'month' | 'day'
  >('month');
  const stats = product.accessStats || [];

  // 全期間の合計
  const totalAccess = stats.reduce((sum, s) => sum + s.count, 0);

  // 年別アクセス数
  const yearStats = stats.reduce((acc, stat) => {
    const year = stat.date.split('-')[0];
    const existing = acc.find((s) => s.name === year);
    if (existing) {
      existing.count += stat.count;
    } else {
      acc.push({ name: year, count: stat.count });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // 月別アクセス数
  const monthStats = stats.reduce((acc, stat) => {
    const month = stat.date.substring(0, 7); // YYYY-MM
    const existing = acc.find((s) => s.name === month);
    if (existing) {
      existing.count += stat.count;
    } else {
      acc.push({ name: month, count: stat.count });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  // 日別アクセス数（最新30日）
  const dayStats = stats.slice(-30).map((stat) => ({
    name: stat.date.split('-')[2], // DD
    fullDate: stat.date,
    count: stat.count,
  }));

  let chartData;
  let title;

  switch (displayMode) {
    case 'year':
      chartData = yearStats;
      title = '年別アクセス数';
      break;
    case 'month':
      chartData = monthStats;
      title = '月別アクセス数';
      break;
    case 'day':
      chartData = dayStats;
      title = '日別アクセス数（最新30日）';
      break;
    case 'all':
    default:
      chartData = [{ name: '全期間', count: totalAccess }];
      title = '全期間アクセス数';
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            表示期間
          </h4>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { value: 'all' as const, label: '全期間' },
              { value: 'year' as const, label: '年別' },
              { value: 'month' as const, label: '月別' },
              { value: 'day' as const, label: '日別' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDisplayMode(option.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor:
                    displayMode === option.value ? '#3b82f6' : '#ffffff',
                  color: displayMode === option.value ? '#ffffff' : '#000000',
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {title}
          </h4>
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
            }}
          >
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {displayMode === 'all' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="アクセス数" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={displayMode === 'day' ? -45 : 0}
                      textAnchor={displayMode === 'day' ? 'end' : 'middle'}
                      height={displayMode === 'day' ? 80 : 30}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="アクセス数"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>
                アクセスデータがありません
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#dbeafe',
              padding: '12px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              全期間
            </p>
            <p
              style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}
            >
              {totalAccess}
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#dbeafe',
              padding: '12px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              最大アクセス日
            </p>
            <p
              style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}
            >
              {Math.max(...stats.map((s) => s.count), 0)} 回
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#dbeafe',
              padding: '12px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
              }}
            >
              平均アクセス/日
            </p>
            <p
              style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}
            >
              {stats.length > 0 ? Math.round(totalAccess / stats.length) : 0} 回
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
