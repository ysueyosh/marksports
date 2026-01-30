'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminModal from '@/components/Admin/AdminModal';
import Pagination from '@/components/Pagination/Pagination';
import { adminProductAPI } from '@/api/admin-products';
import { adminCategoryAPI, type Category } from '@/api/admin-categories';
import { adminImageAPI } from '@/api/admin-images';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
    'none',
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
              updateRequest,
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
          const createResponse =
            await adminProductAPI.createProduct(createRequest);
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
            }`,
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
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
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
            <TextField
              fullWidth
              placeholder="商品名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                <FormControl fullWidth>
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
                placeholder="例：スポーツ用品"
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
                fullWidth
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <FormControl fullWidth>
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
              <TextField
                label="価格"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="価格を入力"
                fullWidth
              />
              <TextField
                label="説明"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="商品説明を入力"
                rows={4}
                multiline
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
                  <TableCell>ID</TableCell>
                  <TableCell>商品名</TableCell>
                  <TableCell>価格</TableCell>
                  <TableCell>説明</TableCell>
                  <TableCell>公開状態</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
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
                        <TableCell>{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>¥{product.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {product.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={product.published ? '公開' : '非公開'}
                            color={product.published ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{product.createdDate}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setTimeout(() => {
                                  setSelectedProductForStats(product);
                                  setShowAccessStatsModal(true);
                                }, 1000);
                              }}
                            >
                              統計
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditProduct(product)}
                            >
                              編集
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="caption" color="text.secondary">
                            {categories.find(
                              (c) => c.categoryId === product.parentCategoryId,
                            )?.categoryName || '親'}{' '}
                            &gt;{' '}
                            {categories.find(
                              (c) => c.categoryId === product.categoryId,
                            )?.categoryName || '子'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          {showAccessStatsModal && selectedProductForStats && (
            <Dialog
              open={showAccessStatsModal}
              onClose={() => setShowAccessStatsModal(false)}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  maxHeight: '90vh',
                  overflow: 'auto',
                },
              }}
            >
              <DialogTitle
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                アクセス統計 - {selectedProductForStats.name}
                <IconButton
                  onClick={() => setShowAccessStatsModal(false)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <AccessStatsDisplay product={selectedProductForStats} />
              </DialogContent>
            </Dialog>
          )}

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
  const yearStats = stats.reduce(
    (acc, stat) => {
      const year = stat.date.split('-')[0];
      const existing = acc.find((s) => s.name === year);
      if (existing) {
        existing.count += stat.count;
      } else {
        acc.push({ name: year, count: stat.count });
      }
      return acc;
    },
    [] as { name: string; count: number }[],
  );

  // 月別アクセス数
  const monthStats = stats.reduce(
    (acc, stat) => {
      const month = stat.date.substring(0, 7); // YYYY-MM
      const existing = acc.find((s) => s.name === month);
      if (existing) {
        existing.count += stat.count;
      } else {
        acc.push({ name: month, count: stat.count });
      }
      return acc;
    },
    [] as { name: string; count: number }[],
  );

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
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              表示期間
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {[
                { value: 'all' as const, label: '全期間' },
                { value: 'year' as const, label: '年別' },
                { value: 'month' as const, label: '月別' },
                { value: 'day' as const, label: '日別' },
              ].map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setDisplayMode(option.value)}
                  variant={
                    displayMode === option.value ? 'contained' : 'outlined'
                  }
                  size="small"
                >
                  {option.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
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
                <Typography color="text.secondary" textAlign="center" py={3}>
                  アクセスデータがありません
                </Typography>
              )}
            </Paper>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
            gap={1.5}
          >
            <Paper sx={{ p: 1.5, bgcolor: 'info.light', textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                全期間
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {totalAccess}
              </Typography>
            </Paper>
            <Paper sx={{ p: 1.5, bgcolor: 'info.light', textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                最大アクセス日
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {Math.max(...stats.map((s) => s.count), 0)} 回
              </Typography>
            </Paper>
            <Paper sx={{ p: 1.5, bgcolor: 'info.light', textAlign: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                平均アクセス/日
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {stats.length > 0 ? Math.round(totalAccess / stats.length) : 0}{' '}
                回
              </Typography>
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
