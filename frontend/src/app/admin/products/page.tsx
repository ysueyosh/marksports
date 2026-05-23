'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import {
  adminProductAPI,
  type ProductOption,
  type ProductOptionChoice,
} from '@/api/admin-products';
import { adminCategoryAPI, type Category } from '@/api/admin-categories';
import { adminImageAPI } from '@/api/admin-images';
import { getPriceWithTax } from '@/utils/price';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  Stack,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  FormControlLabel,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';

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
  sizes?: string[];
  colors?: string[];
  customOptions?: ProductOption[];
  minQuantity?: number | null;
  maxQuantity?: number | null;
  paymentMethodRestriction?: string | null;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [sortByPrice, setSortByPrice] = useState<'none' | 'asc' | 'desc'>(
    'none',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [deleteInputValue, setDeleteInputValue] = useState('');
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
    sizes: [] as string[],
    colors: [] as string[],
    customOptions: [] as ProductOption[],
    minQuantity: '' as string,
    maxQuantity: '' as string,
    paymentMethodRestriction: '' as string,
  });
  const [productErrors, setProductErrors] = useState<Record<string, string>>(
    {},
  );
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    categoryName: '',
    parentCategoryId: '',
  });
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>(
    {},
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<
    Category[]
  >([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );
  const [deletingCategoryInputValue, setDeletingCategoryInputValue] =
    useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  // カスタムオプション用一時入力
  const [optionNameInput, setOptionNameInput] = useState('');
  // グループごとの選択肢入力状態（optionId単位で管理）
  const [optionChoiceInputs, setOptionChoiceInputs] = useState<
    Record<string, { name: string; price: string }>
  >({});

  const itemsPerPage = 20;

  const parsePriceInput = (value: string): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  };

  const priceInputValue = parsePriceInput(formData.price);
  const taxExclusivePrice = priceInputValue === null ? null : priceInputValue;
  const taxIncludedPrice =
    taxExclusivePrice === null ? null : getPriceWithTax(taxExclusivePrice);

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadCategories();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadProducts(searchKeyword);
  }, [isLoggedIn, searchKeyword]);

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
  const loadProducts = async (keyword: string = '') => {
    try {
      const response = await adminProductAPI.getAllProducts(1, 100, keyword);
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
              sizes: p.sizes || [],
              colors: p.colors || [],
              customOptions: p.customOptions || [],
              minQuantity: p.minQuantity ?? null,
              maxQuantity: p.maxQuantity ?? null,
              paymentMethodRestriction: p.paymentMethodRestriction ?? null,
            };
          },
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
        (cat) => cat.parentCategoryId === selectedParentCategoryId,
      )
    : [];

  // フィルタリングロジック
  let filteredProducts = products.filter((product) => {
    const matchesSearch = !searchKeyword
      ? true
      : product.name.toLowerCase().includes(searchKeyword.toLowerCase());
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
    currentPage * itemsPerPage,
  );

  const handleTogglePublish = (id: number) => {
    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, published: !product.published }
          : product,
      ),
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
      sizes: [],
      colors: [],
      customOptions: [],
      minQuantity: '',
      maxQuantity: '',
      paymentMethodRestriction: '',
    });
    setProductErrors({});
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = '商品名を入力してください';
    if (!formData.parentCategoryId)
      errors.parentCategoryId = '親カテゴリを選択してください';
    if (!formData.categoryId) errors.categoryId = 'カテゴリを選択してください';
    if (!formData.price) {
      errors.price = '価格を入力してください';
    } else if (
      Number.isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      errors.price = '価格は1以上の数値で入力してください';
    }
    if (!formData.description.trim())
      errors.description = '説明を入力してください';
    if (formData.isSpecial && !formData.redirectUrl.trim()) {
      errors.redirectUrl = '遷移先URLを入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setProductErrors(errors);
      return;
    }

    setProductErrors({});
    // デバッグ：フォームデータを確認
    console.log('Form Data:', formData);
    console.log('Validation:', {
      name: !!formData.name,
      parentCategoryId: !!formData.parentCategoryId,
      categoryId: !!formData.categoryId,
      price: !!formData.price,
      description: !!formData.description,
    });

    if (editingId !== null) {
      // 編集 - Base64またはS3 URLの画像をそのまま送信
      const updateRequest = {
        name: formData.name,
        parentCategoryId: formData.parentCategoryId,
        categoryId: formData.categoryId,
        price: taxExclusivePrice ?? 0,
        description: formData.description,
        mainImage: formData.mainImage,
        subImages: formData.subImages,
        status: formData.status,
        isActive: formData.published,
        redirectUrl: formData.redirectUrl,
        sizes: formData.sizes,
        colors: formData.colors,
        customOptions: formData.customOptions,
        minQuantity:
          formData.minQuantity !== '' ? Number(formData.minQuantity) : null,
        maxQuantity:
          formData.maxQuantity !== '' ? Number(formData.maxQuantity) : null,
        paymentMethodRestriction: formData.paymentMethodRestriction || null,
      };

      if (editingProduct?.productId) {
        try {
          await adminProductAPI.updateProduct(
            editingProduct.productId,
            updateRequest,
          );

          // 成功後、リストをリロード
          loadProducts(searchKeyword);
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
        price: taxExclusivePrice ?? 0,
        description: formData.description,
        mainImage: formData.mainImage,
        subImages: formData.subImages,
        status: formData.status,
        isActive: formData.published,
        redirectUrl: formData.redirectUrl,
        sizes: formData.sizes,
        colors: formData.colors,
        customOptions: formData.customOptions,
        minQuantity:
          formData.minQuantity !== '' ? Number(formData.minQuantity) : null,
        maxQuantity:
          formData.maxQuantity !== '' ? Number(formData.maxQuantity) : null,
        paymentMethodRestriction: formData.paymentMethodRestriction || null,
      };

      console.log('Creating product with request:', createRequest);

      try {
        console.log('API呼び出し開始: createProduct');
        const createResponse =
          await adminProductAPI.createProduct(createRequest);
        console.log('API応答:', createResponse);

        if (createResponse.success) {
          console.log('商品作成成功、リストをリロード');
          // 成功後、リストをリロード
          loadProducts(searchKeyword);
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
          }`,
        );
      }
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
      sizes: product.sizes || [],
      colors: product.colors || [],
      customOptions: product.customOptions || [],
      minQuantity:
        product.minQuantity != null ? String(product.minQuantity) : '',
      maxQuantity:
        product.maxQuantity != null ? String(product.maxQuantity) : '',
      paymentMethodRestriction: product.paymentMethodRestriction || '',
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

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) return;
    try {
      const cat = categories.find((c) => c.categoryId === categoryId);
      const response = await adminCategoryAPI.updateCategory(categoryId, {
        categoryName: editingCategoryName.trim(),
        parentCategoryId: cat?.parentCategoryId || null,
      });
      if (response.success) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
        await loadCategories();
      } else {
        alert(`更新に失敗しました: ${response.error}`);
      }
    } catch (error) {
      alert('カテゴリの更新に失敗しました');
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string,
  ) => {
    if (deletingCategoryInputValue !== categoryName) {
      alert('カテゴリ名が正しくありません');
      return;
    }
    try {
      const response = await adminCategoryAPI.deleteCategory(categoryId);
      if (response.success) {
        setDeletingCategoryId(null);
        setDeletingCategoryInputValue('');
        await loadCategories();
      } else {
        alert(`削除に失敗しました: ${response.error}`);
      }
    } catch (error) {
      alert('カテゴリの削除に失敗しました');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryFormData.categoryName.trim()) {
      setCategoryErrors({ categoryName: 'カテゴリ名を入力してください' });
      return;
    }

    setCategoryErrors({});

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
      <Box>
        <Stack spacing={2}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="h4" fontWeight={700}>
              商品管理
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant={showNewProductForm ? 'outlined' : 'contained'}
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
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
              >
                {showCategoryForm ? 'キャンセル' : 'カテゴリ追加'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowCategoryManager(!showCategoryManager)}
              >
                {showCategoryManager ? 'カテゴリ管理を閉じる' : 'カテゴリ管理'}
              </Button>
            </Stack>
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                placeholder="商品名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() => {
                  setSearchKeyword(searchQuery.trim());
                  setCurrentPage(1);
                }}
              >
                検索
              </Button>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <Select
                  value={selectedParentCategoryId}
                  onChange={(e) => {
                    setSelectedParentCategoryId(e.target.value);
                    setSelectedCategoryId('');
                    setCurrentPage(1);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">すべての大カテゴリ</MenuItem>
                  {parentCategoryList.map((cat) => (
                    <MenuItem key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedParentCategoryId && (
                <FormControl
                  fullWidth
                  error={Boolean(productErrors.parentCategoryId)}
                >
                  <Select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setCurrentPage(1);
                    }}
                    displayEmpty
                  >
                    <MenuItem value="">すべての小カテゴリ</MenuItem>
                    {childCategoryList.map((cat) => (
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl fullWidth>
                <Select
                  value={sortByPrice}
                  onChange={(e) => setSortByPrice(e.target.value as any)}
                >
                  <MenuItem value="none">価格でソート</MenuItem>
                  <MenuItem value="asc">安い順</MenuItem>
                  <MenuItem value="desc">高い順</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          <AdminModal
            isOpen={showCategoryForm}
            onClose={() => {
              setShowCategoryForm(false);
              setCategoryFormData({
                categoryName: '',
                parentCategoryId: '',
              });
              setCategoryErrors({});
            }}
            title="カテゴリを追加"
            buttons={
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  onClick={() => {
                    setShowCategoryForm(false);
                    setCategoryFormData({
                      categoryName: '',
                      parentCategoryId: '',
                    });
                  }}
                >
                  キャンセル
                </Button>
                <Button variant="contained" onClick={handleAddCategory}>
                  追加
                </Button>
              </Stack>
            }
          >
            <Stack spacing={2}>
              <TextField
                label="カテゴリ名"
                value={categoryFormData.categoryName}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    categoryName: e.target.value,
                  })
                }
                onBlur={() => {
                  if (categoryErrors.categoryName) {
                    setCategoryErrors((prev) => ({
                      ...prev,
                      categoryName: '',
                    }));
                  }
                }}
                placeholder="例：スポーツ用品"
                error={Boolean(categoryErrors.categoryName)}
                helperText={categoryErrors.categoryName}
                fullWidth
              />
              <FormControl fullWidth>
                <Select
                  value={categoryFormData.parentCategoryId}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      parentCategoryId: e.target.value,
                    })
                  }
                  displayEmpty
                >
                  <MenuItem value="">なし（親カテゴリとして登録）</MenuItem>
                  {categories
                    .filter((cat) => !cat.parentCategoryId)
                    .map((cat) => (
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </AdminModal>

          {/* カテゴリ管理パネル */}
          {showCategoryManager && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>
                カテゴリ管理（編集・削除）
              </Typography>
              {hierarchicalCategories.map((parent) => (
                <Box key={parent.categoryId} mb={2}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    mb={0.5}
                  >
                    {editingCategoryId === parent.categoryId ? (
                      <>
                        <TextField
                          size="small"
                          value={editingCategoryName}
                          onChange={(e) =>
                            setEditingCategoryName(e.target.value)
                          }
                          sx={{ width: 200 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            handleUpdateCategory(parent.categoryId)
                          }
                        >
                          保存
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </>
                    ) : deletingCategoryId === parent.categoryId ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="error">
                          「{parent.categoryName}」と入力して確認:
                        </Typography>
                        <TextField
                          size="small"
                          value={deletingCategoryInputValue}
                          onChange={(e) =>
                            setDeletingCategoryInputValue(e.target.value)
                          }
                          sx={{ width: 160 }}
                        />
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          disabled={
                            deletingCategoryInputValue !== parent.categoryName
                          }
                          onClick={() =>
                            handleDeleteCategory(
                              parent.categoryId,
                              parent.categoryName,
                            )
                          }
                        >
                          削除
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setDeletingCategoryId(null);
                            setDeletingCategoryInputValue('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </Stack>
                    ) : (
                      <>
                        <Typography fontWeight={700}>
                          {parent.categoryName}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setEditingCategoryId(parent.categoryId);
                            setEditingCategoryName(parent.categoryName);
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setDeletingCategoryId(parent.categoryId);
                            setDeletingCategoryInputValue('');
                          }}
                        >
                          削除
                        </Button>
                      </>
                    )}
                  </Stack>
                  {parent.children &&
                    parent.children.map((child) => (
                      <Stack
                        key={child.categoryId}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        ml={3}
                        mb={0.5}
                      >
                        {editingCategoryId === child.categoryId ? (
                          <>
                            <TextField
                              size="small"
                              value={editingCategoryName}
                              onChange={(e) =>
                                setEditingCategoryName(e.target.value)
                              }
                              sx={{ width: 200 }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() =>
                                handleUpdateCategory(child.categoryId)
                              }
                            >
                              保存
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                              }}
                            >
                              キャンセル
                            </Button>
                          </>
                        ) : deletingCategoryId === child.categoryId ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography variant="body2" color="error">
                              「{child.categoryName}」と入力して確認:
                            </Typography>
                            <TextField
                              size="small"
                              value={deletingCategoryInputValue}
                              onChange={(e) =>
                                setDeletingCategoryInputValue(e.target.value)
                              }
                              sx={{ width: 160 }}
                            />
                            <Button
                              size="small"
                              color="error"
                              variant="contained"
                              disabled={
                                deletingCategoryInputValue !==
                                child.categoryName
                              }
                              onClick={() =>
                                handleDeleteCategory(
                                  child.categoryId,
                                  child.categoryName,
                                )
                              }
                            >
                              削除
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setDeletingCategoryId(null);
                                setDeletingCategoryInputValue('');
                              }}
                            >
                              キャンセル
                            </Button>
                          </Stack>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              └ {child.categoryName}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setEditingCategoryId(child.categoryId);
                                setEditingCategoryName(child.categoryName);
                              }}
                            >
                              編集
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => {
                                setDeletingCategoryId(child.categoryId);
                                setDeletingCategoryInputValue('');
                              }}
                            >
                              削除
                            </Button>
                          </>
                        )}
                      </Stack>
                    ))}
                </Box>
              ))}
              {hierarchicalCategories.length === 0 && (
                <Typography color="text.secondary">
                  カテゴリが存在しません
                </Typography>
              )}
            </Paper>
          )}

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
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Box>
                  {editingId !== null && !isDeleteConfirming && (
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={handleStartDelete}
                    >
                      削除
                    </Button>
                  )}
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    onClick={() => {
                      setShowNewProductForm(false);
                      resetForm();
                      setIsDeleteConfirming(false);
                      setDeleteInputValue('');
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      console.log('登録ボタンがクリックされました');
                      handleAddProduct();
                    }}
                  >
                    {editingId !== null ? '更新' : '登録'}
                  </Button>
                </Stack>
              </Stack>
            }
          >
            <Stack spacing={2}>
              {isDeleteConfirming && editingProduct && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderColor: 'error.main' }}
                >
                  <Typography color="error" fontWeight={700} mb={1}>
                    ⚠️ 確認: 以下の商品を削除します
                  </Typography>
                  <Typography variant="body2" mb={2}>
                    <strong>商品名:</strong> {editingProduct.name}
                  </Typography>
                  <TextField
                    fullWidth
                    label="削除確認"
                    value={deleteInputValue}
                    onChange={(e) => setDeleteInputValue(e.target.value)}
                    placeholder={`「${editingProduct.name}」と入力`}
                  />
                  <Stack direction="row" spacing={1} mt={2}>
                    <Button
                      color="error"
                      variant="contained"
                      fullWidth
                      onClick={handleConfirmDelete}
                      disabled={deleteInputValue !== editingProduct.name}
                    >
                      削除
                    </Button>
                    <Button fullWidth onClick={handleCancelDelete}>
                      キャンセル
                    </Button>
                  </Stack>
                </Paper>
              )}

              <TextField
                label="商品名"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="商品名を入力"
                error={Boolean(productErrors.name)}
                helperText={productErrors.name}
                fullWidth
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <FormControl
                  fullWidth
                  error={Boolean(productErrors.categoryId)}
                >
                  <Select
                    value={formData.parentCategoryId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        parentCategoryId: e.target.value,
                        categoryId: '',
                      });
                    }}
                    displayEmpty
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {parentCategoryList.map((cat) => (
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </MenuItem>
                    ))}
                  </Select>
                  {productErrors.parentCategoryId && (
                    <FormHelperText error>
                      {productErrors.parentCategoryId}
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl fullWidth>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                      });
                    }}
                    disabled={!formData.parentCategoryId}
                    displayEmpty
                  >
                    <MenuItem value="">選択してください</MenuItem>
                    {formData.parentCategoryId &&
                      parentCategoryList
                        .find(
                          (cat) => cat.categoryId === formData.parentCategoryId,
                        )
                        ?.children?.map((cat) => (
                          <MenuItem key={cat.categoryId} value={cat.categoryId}>
                            {cat.categoryName}
                          </MenuItem>
                        ))}
                  </Select>
                  {productErrors.categoryId && (
                    <FormHelperText error>
                      {productErrors.categoryId}
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isSpecial}
                    onChange={(e) =>
                      setFormData({ ...formData, isSpecial: e.target.checked })
                    }
                  />
                }
                label="特別商品"
              />
              <Stack spacing={1}>
                <TextField
                  label="価格（税抜き）"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="税抜き価格を入力"
                  error={Boolean(productErrors.price)}
                  fullWidth
                />
                <Box>
                  {productErrors.price ? (
                    <FormHelperText error>{productErrors.price}</FormHelperText>
                  ) : taxIncludedPrice !== null ? (
                    <FormHelperText>
                      {`税込価格: ¥${taxIncludedPrice.toLocaleString('ja-JP')}`}
                    </FormHelperText>
                  ) : null}
                </Box>
              </Stack>
              <TextField
                label="説明"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="商品説明を入力"
                rows={4}
                multiline
                error={Boolean(productErrors.description)}
                helperText={productErrors.description}
                fullWidth
              />
              {/* サイズ選択肢 */}
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  サイズ選択肢（任意）
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {formData.sizes.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      onDelete={() =>
                        setFormData((prev) => ({
                          ...prev,
                          sizes: prev.sizes.filter((x) => x !== s),
                        }))
                      }
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = sizeInput.trim();
                        if (v && !formData.sizes.includes(v)) {
                          setFormData((prev) => ({
                            ...prev,
                            sizes: [...prev.sizes, v],
                          }));
                          setSizeInput('');
                        }
                      }
                    }}
                    placeholder="例: S, M, L, XL"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const v = sizeInput.trim();
                      if (v && !formData.sizes.includes(v)) {
                        setFormData((prev) => ({
                          ...prev,
                          sizes: [...prev.sizes, v],
                        }));
                        setSizeInput('');
                      }
                    }}
                  >
                    追加
                  </Button>
                </Stack>
              </Box>
              {/* カラー選択肢 */}
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  カラー選択肢（任意）
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {formData.colors.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      onDelete={() =>
                        setFormData((prev) => ({
                          ...prev,
                          colors: prev.colors.filter((x) => x !== c),
                        }))
                      }
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = colorInput.trim();
                        if (v && !formData.colors.includes(v)) {
                          setFormData((prev) => ({
                            ...prev,
                            colors: [...prev.colors, v],
                          }));
                          setColorInput('');
                        }
                      }
                    }}
                    placeholder="例: レッド, ブルー, ブラック"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const v = colorInput.trim();
                      if (v && !formData.colors.includes(v)) {
                        setFormData((prev) => ({
                          ...prev,
                          colors: [...prev.colors, v],
                        }));
                        setColorInput('');
                      }
                    }}
                  >
                    追加
                  </Button>
                </Stack>
              </Box>
              {/* 数量制限 */}
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  数量制限
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="最小数量"
                    type="number"
                    size="small"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minQuantity: e.target.value,
                      }))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: 140 }}
                    placeholder="例: 1"
                  />
                  <TextField
                    label="最大数量"
                    type="number"
                    size="small"
                    value={formData.maxQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxQuantity: e.target.value,
                      }))
                    }
                    inputProps={{ min: 1 }}
                    sx={{ width: 140 }}
                    placeholder="例: 10"
                  />
                </Stack>
              </Box>

              {/* 支払い方法制限 */}
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  支払い方法制限
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.paymentMethodRestriction}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethodRestriction: e.target.value,
                      }))
                    }
                    displayEmpty
                  >
                    <MenuItem value="">制限なし</MenuItem>
                    <MenuItem value="bank_transfer">口座振替のみ</MenuItem>
                    <MenuItem value="credit_card">
                      クレジットカードのみ
                    </MenuItem>
                    <MenuItem value="apple_pay">Apple Payのみ</MenuItem>
                    <MenuItem value="google_pay">Google Payのみ</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* カスタムオプション */}
              <Box>
                <Typography variant="subtitle2" mb={0.5}>
                  カスタムオプション（サイズ・カラー以外）
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  ※
                  追加料金はすべて税抜き金額で入力してください（消費税は自動計算されます）
                </Typography>
                {formData.customOptions.map((opt, optIdx) => (
                  <Paper
                    key={opt.optionId}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography fontWeight={700} variant="body2">
                        {opt.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            customOptions: prev.customOptions.filter(
                              (_, i) => i !== optIdx,
                            ),
                          }))
                        }
                      >
                        オプション削除
                      </Button>
                    </Stack>
                    <Stack spacing={0.5} mb={1}>
                      {opt.choices.map((choice, choiceIdx) => (
                        <Stack
                          key={choice.choiceId}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography variant="body2">{choice.name}</Typography>
                          {choice.additionalPrice > 0 ? (
                            <Chip
                              size="small"
                              label={`+¥${choice.additionalPrice.toLocaleString()}(税抜) / +¥${Math.floor(choice.additionalPrice * 1.1).toLocaleString()}(税込)`}
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="追加料金なし"
                              variant="outlined"
                            />
                          )}
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                customOptions: prev.customOptions.map((o, i) =>
                                  i === optIdx
                                    ? {
                                        ...o,
                                        choices: o.choices.filter(
                                          (_, ci) => ci !== choiceIdx,
                                        ),
                                      }
                                    : o,
                                ),
                              }))
                            }
                          >
                            ×
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      flexWrap="wrap"
                    >
                      <TextField
                        size="small"
                        label="選択肢名"
                        placeholder="例: 赤"
                        value={optionChoiceInputs[opt.optionId]?.name || ''}
                        onChange={(e) =>
                          setOptionChoiceInputs((prev) => ({
                            ...prev,
                            [opt.optionId]: {
                              ...prev[opt.optionId],
                              name: e.target.value,
                            },
                          }))
                        }
                        sx={{ width: 140 }}
                        helperText=" "
                      />
                      <TextField
                        size="small"
                        label="追加料金・税抜(円)"
                        placeholder="0"
                        type="number"
                        value={optionChoiceInputs[opt.optionId]?.price || ''}
                        onChange={(e) =>
                          setOptionChoiceInputs((prev) => ({
                            ...prev,
                            [opt.optionId]: {
                              ...prev[opt.optionId],
                              price: e.target.value,
                            },
                          }))
                        }
                        inputProps={{ min: 0 }}
                        sx={{ width: 160 }}
                        helperText={
                          optionChoiceInputs[opt.optionId]?.price &&
                          Number(optionChoiceInputs[opt.optionId]?.price) > 0
                            ? `税込: ¥${Math.floor(Number(optionChoiceInputs[opt.optionId]?.price) * 1.1).toLocaleString()}`
                            : ' '
                        }
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mt: '4px' }}
                        onClick={() => {
                          const input = optionChoiceInputs[opt.optionId];
                          const name = input?.name?.trim();
                          if (!name) return;
                          const price = Number(input?.price) || 0;
                          setFormData((prev) => ({
                            ...prev,
                            customOptions: prev.customOptions.map((o, i) =>
                              i === optIdx
                                ? {
                                    ...o,
                                    choices: [
                                      ...o.choices,
                                      {
                                        choiceId: crypto.randomUUID(),
                                        name,
                                        additionalPrice: price,
                                      },
                                    ],
                                  }
                                : o,
                            ),
                          }));
                          setOptionChoiceInputs((prev) => ({
                            ...prev,
                            [opt.optionId]: { name: '', price: '' },
                          }));
                        }}
                      >
                        選択肢追加
                      </Button>
                    </Stack>
                  </Paper>
                ))}
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    label="オプショングループ名"
                    placeholder="例: 刺繍"
                    value={optionNameInput}
                    onChange={(e) => setOptionNameInput(e.target.value)}
                    sx={{ width: 200 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      const name = optionNameInput.trim();
                      if (!name) return;
                      setFormData((prev) => ({
                        ...prev,
                        customOptions: [
                          ...prev.customOptions,
                          { optionId: crypto.randomUUID(), name, choices: [] },
                        ],
                      }));
                      setOptionNameInput('');
                    }}
                  >
                    グループ追加
                  </Button>
                </Stack>
              </Box>

              {formData.isSpecial && (
                <TextField
                  label="遷移先URL"
                  value={formData.redirectUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, redirectUrl: e.target.value })
                  }
                  placeholder="https://example.com/product/123"
                  error={Boolean(productErrors.redirectUrl)}
                  helperText={productErrors.redirectUrl}
                  fullWidth
                />
              )}
              <FormControl fullWidth>
                <Select
                  value={formData.published ? 'public' : 'private'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      published: e.target.value === 'public',
                    })
                  }
                >
                  <MenuItem value="public">公開</MenuItem>
                  <MenuItem value="private">非公開</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" mb={1}>
                  メイン画像
                </Typography>
                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    padding: '12px 16px',
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#999' },
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    style={{ display: 'none' }}
                  />
                  ファイルを選択
                </Box>
                {formData.mainImage && (
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={formData.mainImage}
                      alt="メイン画像プレビュー"
                      style={{ maxWidth: '100%', borderRadius: 8 }}
                    />
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" mb={1}>
                  サブ画像（最大5枚）
                </Typography>
                <Box
                  component="label"
                  sx={{
                    display: 'block',
                    padding: '12px 16px',
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    textAlign: 'center',
                    cursor:
                      formData.subImages.length >= 5
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: formData.subImages.length >= 5 ? 0.5 : 1,
                    '&:hover': {
                      borderColor:
                        formData.subImages.length >= 5 ? '#ccc' : '#999',
                    },
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleSubImageUpload}
                    disabled={formData.subImages.length >= 5}
                    style={{ display: 'none' }}
                  />
                  ファイルを選択
                </Box>
                {formData.subImages.length > 0 && (
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                    {formData.subImages.map((img, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={img}
                          alt={`サブ画像 ${index + 1}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSubImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            minWidth: 'auto',
                            p: 0.5,
                          }}
                        >
                          ×
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </AdminModal>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  {!isMobile && !isTablet && <TableCell>商品名</TableCell>}
                  {isMobile && <TableCell>商品名</TableCell>}
                  {isTablet && (
                    <>
                      <TableCell>商品名</TableCell>
                      <TableCell>価格</TableCell>
                    </>
                  )}
                  {!isMobile && !isTablet && (
                    <>
                      <TableCell>価格</TableCell>
                      <TableCell>説明</TableCell>
                      <TableCell>公開状態</TableCell>
                      <TableCell>作成日</TableCell>
                    </>
                  )}
                  {(isMobile || isTablet) && <TableCell>公開状態</TableCell>}
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : isTablet ? 5 : 7}>
                      <Typography
                        textAlign="center"
                        color="text.secondary"
                        py={4}
                      >
                        商品が存在しません。
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <TableRow hover selected={editingId === product.id}>
                        <TableCell>
                          {product.mainImage ? (
                            <Box
                              component="img"
                              src={product.mainImage}
                              alt={`${product.name} メイン画像`}
                              sx={{
                                width: 56,
                                height: 56,
                                objectFit: 'cover',
                                borderRadius: 1,
                                display: 'block',
                                bgcolor: 'grey.100',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.100',
                                color: 'text.disabled',
                                fontSize: 12,
                              }}
                            >
                              画像なし
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        {(isTablet || (!isMobile && !isTablet)) && (
                          <TableCell>
                            ¥{product.price.toLocaleString()}
                          </TableCell>
                        )}
                        {!isMobile && !isTablet && (
                          <>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  whiteSpace: 'pre-line',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {product.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={product.published ? '公開' : '非公開'}
                                color={
                                  product.published ? 'success' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>{product.createdDate}</TableCell>
                          </>
                        )}
                        {(isMobile || isTablet) && (
                          <TableCell>
                            <Chip
                              size="small"
                              label={product.published ? '公開' : '非公開'}
                              color={product.published ? 'success' : 'default'}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleEditProduct(product)}
                            >
                              編集
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      {!isMobile && (
                        <TableRow>
                          <TableCell colSpan={isTablet ? 5 : 7}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {categories.find(
                                (c) =>
                                  c.categoryId === product.parentCategoryId,
                              )?.categoryName || '親'}{' '}
                              &gt;{' '}
                              {categories.find(
                                (c) => c.categoryId === product.categoryId,
                              )?.categoryName || '子'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          <Box display="flex" justifyContent="center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Box>
        </Stack>
      </Box>
    </>
  );
}
