'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import AdminTable, { TableColumn } from '@/components/Admin/AdminTable';
import Pagination from '@/components/Pagination/Pagination';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './products.module.css';
import { adminProductAPI } from '@/api/admin-products';
import { adminCategoryAPI, type Category } from '@/api/admin-categories';
import { adminImageAPI } from '@/api/admin-images';

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
  productId?: string;
  name: string;
  parentCategoryId: string;
  categoryId: string;
  price: number;
  description: string;
  published: boolean;
  status?: string;
  isActive?: boolean;
  createdDate: string;
  mainImage: string;
  image?: string;
  imageUrls?: string[];
  subImages: string[];
  stock?: number;
  redirectUrl?: string;
  accessStats?: {
    date: string;
    count: number;
  }[];
}

// カテゴリー構造定義
let categoryStructure: {
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
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
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
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    parentCategoryId: '',
    categoryId: '',
    price: '',
    description: '',
    mainImage: '',
    subImages: [] as string[],
    published: true,
    status: 'active',
    isSpecial: false,
    redirectUrl: '',
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    categoryName: '',
    parentCategoryId: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<
    Category[]
  >([]);

  const itemsPerPage = 5;

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
      loadCategories();
      loadProducts();
    }
  }, [router]);

  // カテゴリを取得
  const loadCategories = async () => {
    try {
      const response = await adminCategoryAPI.getAllCategories();
      if (response.success && response.data?.categories) {
        // 階層構造を保存
        setHierarchicalCategories(response.data.categories);

        // フラット化: 階層構造をフラットなリストに変換
        const flatCategories: Category[] = [];
        const flattenCategories = (cats: Category[]) => {
          cats.forEach((cat) => {
            flatCategories.push({
              categoryId: cat.categoryId,
              categoryName: cat.categoryName,
              parentCategoryId: cat.parentCategoryId,
              createdAt: cat.createdAt,
            });
            if (cat.children && cat.children.length > 0) {
              flattenCategories(cat.children);
            }
          });
        };
        flattenCategories(response.data.categories);
        setCategories(flatCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // API から商品データを取得
  const loadProducts = async () => {
    try {
      const response = await adminProductAPI.getAllProducts(1, 100);
      if (response.success && response.data) {
        const data = response.data as any;
        const loadedProducts = (data.products || []).map(
          (p: any, idx: number) => {
            // imageUrls から mainImage と subImages を分割
            const imageUrls = p.imageUrls || [];
            const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
            const subImages = imageUrls.slice(1);

            return {
              id: idx + 1,
              productId: p.productId,
              name: p.name || '',
              price: p.price || 0,
              description: p.description || '',
              parentCategoryId: p.parentCategoryId || '',
              categoryId: p.categoryId || '',
              published: p.isActive ?? true,
              status: p.status || 'active',
              createdDate: new Date(p.createdAt).toLocaleDateString('ja-JP'),
              mainImage: mainImage,
              imageUrls: imageUrls,
              subImages: subImages,
              stock: p.stock || 0,
            };
          }
        );
        setProducts(loadedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  // 親カテゴリー一覧（hierarchicalCategories から取得）
  const parentCategoryList = hierarchicalCategories;

  // 子カテゴリー一覧（選択された親カテゴリーの子のみ）
  const childCategoryList = selectedParentCategoryId
    ? categories.filter(
        (cat) => cat.parentCategoryId === selectedParentCategoryId
      )
    : [];

  // フィルタリングロジック
  let filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParentCategory =
      selectedParentCategoryId === '' ||
      product.parentCategoryId === selectedParentCategoryId;
    const matchesCategory =
      selectedCategoryId === '' || product.categoryId === selectedCategoryId;
    return matchesSearch && matchesParentCategory && matchesCategory;
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
  const totalPages =
    filteredProducts.length === 0
      ? 1
      : Math.ceil(filteredProducts.length / itemsPerPage);
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
      parentCategoryId: '',
      categoryId: '',
      price: '',
      description: '',
      mainImage: '',
      subImages: [],
      published: true,
      status: 'active',
      isSpecial: false,
      redirectUrl: '',
    });
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    // デバッグ：フォームデータを確認
    console.log('Form Data:', formData);
    console.log('Validation:', {
      name: !!formData.name,
      parentCategoryId: !!formData.parentCategoryId,
      categoryId: !!formData.categoryId,
      price: !!formData.price,
      description: !!formData.description,
    });

    if (
      formData.name &&
      formData.parentCategoryId &&
      formData.categoryId &&
      formData.price &&
      formData.description
    ) {
      if (editingId !== null) {
        // 編集 - Base64またはS3 URLの画像をそのまま送信
        const updateRequest = {
          name: formData.name,
          parentCategoryId: formData.parentCategoryId,
          categoryId: formData.categoryId,
          price: parseInt(formData.price),
          description: formData.description,
          mainImage: formData.mainImage,
          subImages: formData.subImages,
          status: formData.status,
          redirectUrl: formData.redirectUrl,
        };

        if (editingProduct?.productId) {
          try {
            await adminProductAPI.updateProduct(
              editingProduct.productId,
              updateRequest
            );

            // 成功後、リストをリロード
            loadProducts();
            setShowNewProductForm(false);
            resetForm();
          } catch (error) {
            console.error('Failed to update product:', error);
            alert('商品の更新に失敗しました');
          }
        }
      } else {
        // 新規追加 - Base64画像をバックエンド側で処理
        const createRequest = {
          name: formData.name,
          parentCategoryId: formData.parentCategoryId,
          categoryId: formData.categoryId,
          price: parseInt(formData.price),
          description: formData.description,
          mainImage: formData.mainImage,
          subImages: formData.subImages,
          status: formData.status,
          isActive: formData.published,
          redirectUrl: formData.redirectUrl,
        };

        console.log('Creating product with request:', createRequest);

        try {
          console.log('API呼び出し開始: createProduct');
          const createResponse = await adminProductAPI.createProduct(
            createRequest
          );
          console.log('API応答:', createResponse);

          if (createResponse.success) {
            console.log('商品作成成功、リストをリロード');
            // 成功後、リストをリロード
            loadProducts();
            setShowNewProductForm(false);
            resetForm();
            alert('商品を登録しました');
          } else {
            console.error('APIはエラーレスポンスを返しました:', createResponse);
            alert('商品の作成に失敗しました');
          }
        } catch (error) {
          console.error('Failed to create product:', error);
          alert(
            `商品の作成に失敗しました: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    } else {
      // 検証失敗時のメッセージ
      const missingFields = [];
      if (!formData.name) missingFields.push('商品名');
      if (!formData.parentCategoryId) missingFields.push('親カテゴリ');
      if (!formData.categoryId) missingFields.push('カテゴリ');
      if (!formData.price) missingFields.push('価格');
      if (!formData.description) missingFields.push('説明');

      alert(`以下のフィールドが必須です:\n${missingFields.join('\n')}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      parentCategoryId: product.parentCategoryId,
      categoryId: product.categoryId,
      price: product.price.toString(),
      description: product.description,
      mainImage: product.mainImage,
      subImages: product.subImages,
      published: product.published,
      status: product.status || 'active',
      isSpecial: false,
      redirectUrl: product.redirectUrl || '',
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
      if (editingProduct.productId) {
        adminProductAPI
          .deleteProduct(editingProduct.productId)
          .then(() => {
            handleDeleteProduct(editingProduct.id);
            setShowNewProductForm(false);
            resetForm();
            setEditingProduct(null);
            setIsDeleteConfirming(false);
            setDeleteInputValue('');
          })
          .catch((error) => {
            console.error('Failed to delete product:', error);
            alert('削除に失敗しました');
          });
      }
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
      // 常に Base64 で一時保存（後で商品登録時に S3 アップロード）
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

  const handleAddCategory = async () => {
    if (!categoryFormData.categoryName.trim()) {
      alert('カテゴリ名を入力してください。');
      return;
    }

    try {
      const response = await adminCategoryAPI.createCategory({
        categoryName: categoryFormData.categoryName,
        parentCategoryId: categoryFormData.parentCategoryId || null,
      });

      if (response.success) {
        alert('カテゴリを追加しました。');
        setShowCategoryForm(false);
        setCategoryFormData({
          categoryName: '',
          parentCategoryId: '',
        });
        // カテゴリを再読み込み
        await loadCategories();
      } else {
        alert(`カテゴリの追加に失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      alert('カテゴリの追加に恐れ。');
    }
  };

  return (
    <>
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
            value={selectedParentCategoryId}
            onChange={(e) => {
              setSelectedParentCategoryId(e.target.value);
              setSelectedCategoryId('');
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          >
            <option value="">すべての大カテゴリ</option>
            {parentCategoryList.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          {selectedParentCategoryId && (
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">すべての小カテゴリ</option>
              {childCategoryList.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
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
              categoryName: '',
              parentCategoryId: '',
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
                    categoryName: '',
                    parentCategoryId: '',
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
              <label>カテゴリ名</label>
              <input
                type="text"
                value={categoryFormData.categoryName}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    categoryName: e.target.value,
                  })
                }
                placeholder="例：スポーツ用品"
              />
            </div>
            <div className={styles.formGroup}>
              <label>親カテゴリ（オプション）</label>
              <select
                value={categoryFormData.parentCategoryId}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    parentCategoryId: e.target.value,
                  })
                }
              >
                <option value="">なし（親カテゴリとして登録）</option>
                {categories
                  .filter((cat) => !cat.parentCategoryId)
                  .map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
              </select>
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
                  onClick={() => {
                    console.log('登録ボタンがクリックされました');
                    handleAddProduct();
                  }}
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
                value={formData.parentCategoryId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    parentCategoryId: e.target.value,
                    categoryId: '',
                  });
                }}
              >
                <option value="">選択してください</option>
                {parentCategoryList.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>小カテゴリ</label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                  });
                }}
                disabled={!formData.parentCategoryId}
              >
                <option value="">選択してください</option>
                {formData.parentCategoryId &&
                  parentCategoryList
                    .find((cat) => cat.categoryId === formData.parentCategoryId)
                    ?.children?.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <input
                type="checkbox"
                id="isSpecial"
                checked={formData.isSpecial}
                onChange={(e) =>
                  setFormData({ ...formData, isSpecial: e.target.checked })
                }
              />
              <label
                htmlFor="isSpecial"
                style={{ fontSize: '14px', margin: 0 }}
              >
                特別商品
              </label>
            </div>
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
          {formData.isSpecial && (
            <div className={styles.formGroup}>
              <label>遷移先URL</label>
              <input
                type="text"
                value={formData.redirectUrl}
                onChange={(e) =>
                  setFormData({ ...formData, redirectUrl: e.target.value })
                }
                placeholder="https://example.com/product/123"
              />
            </div>
          )}
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
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      fontSize: '16px',
                      color: '#999',
                    }}
                  >
                    商品が存在しません。
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => (
                  <React.Fragment key={product.id}>
                    <tr
                      data-product-id={product.id}
                      className={`${styles.productRow} ${
                        index % 2 === 0 ? styles.oddProduct : styles.evenProduct
                      }`}
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
                            // API通信をシミュレート
                            setTimeout(() => {
                              setSelectedProductForStats(product);
                              setShowAccessStatsModal(true);
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
                      className={`${styles.categoryRow} ${
                        index % 2 === 0 ? styles.oddProduct : styles.evenProduct
                      }`}
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
                        {categories.find(
                          (c) => c.categoryId === product.parentCategoryId
                        )?.categoryName || '親'}{' '}
                        &gt;{' '}
                        {categories.find(
                          (c) => c.categoryId === product.categoryId
                        )?.categoryName || '子'}
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
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
