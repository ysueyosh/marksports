'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import { adminProductAPI } from '@/api/admin-products';
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
  });
  const [productErrors, setProductErrors] = useState<Record<string, string>>(
    {},
  );
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
        redirectUrl: formData.redirectUrl,
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
                                sx={{ whiteSpace: 'pre-line' }}
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
