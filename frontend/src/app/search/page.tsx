'use client';

import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import Pagination from '@/components/Pagination/Pagination';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import { useSearch } from '@/context/SearchContext';
import { searchProducts } from '@/api/search';
import {
  Box,
  Breadcrumbs,
  Typography,
  Stack,
  TextField,
  Button,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  IconButton,
  Collapse,
  Radio,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ダミー商品データ（カテゴリと小カテゴリのIDを追加）
const DUMMY_PRODUCTS = [
  {
    id: 1,
    name: 'バレーボール 5号球',
    price: 3200,
    category: 'volley',
    subcategory: 'volley-ball',
    tags: ['バレー', 'ボール'],
  },
  {
    id: 2,
    name: 'バスケットシューズ',
    price: 8900,
    category: 'basketball',
    subcategory: 'basketball-shoes',
    tags: ['バスケ', 'シューズ'],
  },
  {
    id: 3,
    name: '卓球ラケット',
    price: 4500,
    category: 'ping-pong',
    subcategory: 'ping-pong-racket',
    tags: ['卓球', 'ラケット'],
  },
  {
    id: 4,
    name: 'バレーユニフォーム',
    price: 2800,
    category: 'volley',
    subcategory: 'volley-wear',
    tags: ['バレー', 'ウェア'],
  },
  {
    id: 5,
    name: 'バスケットボール',
    price: 3500,
    category: 'basketball',
    subcategory: 'basketball-ball',
    tags: ['バスケ', 'ボール'],
  },
  {
    id: 6,
    name: '卓球台',
    price: 29800,
    category: 'ping-pong',
    subcategory: 'ping-pong-table',
    tags: ['卓球', 'テーブル'],
  },
];

const PRICE_RANGES = [
  { id: 'all', label: 'すべての価格' },
  { id: 'lt1000', label: '〜¥1,000' },
  { id: '1000-5000', label: '¥1,000〜¥5,000' },
  { id: '5000-10000', label: '¥5,000〜¥10,000' },
  { id: 'gt10000', label: '¥10,000〜' },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: '関連度が高い順' },
  { id: 'asc', label: '価格が安い順' },
  { id: 'desc', label: '価格が高い順' },
];

export default function SearchPage() {
  const { categories } = useCategories();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveConditions } = useSearch();

  // URL パラメータから検索条件を取得
  const urlKeyword = searchParams.get('q') || '';
  const urlCategoriesParam = searchParams.getAll('categories') || [];
  const urlPriceRange = searchParams.get('priceRange') || 'all';
  const urlSort = searchParams.get('sort') || 'relevance';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // 入力状態（ローカル管理）
  const [keyword, setKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState('relevance');

  // ドロップダウンUI状態
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id)),
  );

  // API結果状態
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // ページに戻ってきた際に URL パラメータをリロード
  useEffect(() => {
    const handlePageShow = () => {
      setKeyword(urlKeyword);
      setSelectedCategories(urlCategoriesParam);
      setPriceRange(urlPriceRange);
      setSort(urlSort);
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [searchParams]);

  // URL パラメータから初期状態を読み込む
  useEffect(() => {
    setKeyword(urlKeyword);
    setSelectedCategories(urlCategoriesParam);
    setPriceRange(urlPriceRange);
    setSort(urlSort);
  }, [urlKeyword, urlCategoriesParam.toString(), urlPriceRange, urlSort]);

  // 検索条件が変わったときにAPIを呼び出す（URLパラメータに基づいて）
  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const response = await searchProducts({
          keyword: urlKeyword || undefined,
          categories:
            urlCategoriesParam.length > 0 ? urlCategoriesParam : undefined,
          priceRange: (urlPriceRange as any) || 'all',
          sort: (urlSort as any) || 'relevance',
          page: urlPage,
          limit: ITEMS_PER_PAGE,
        });

        if (response.success && response.data) {
          setApiProducts(response.data.products);
          setTotalCount(response.data.total);
        } else {
          setApiProducts([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error('Search API error:', error);
        setApiProducts([]);
        setTotalCount(0);
      }

      // 検索条件を Context に保存
      saveConditions({
        keyword: urlKeyword,
        categories: urlCategoriesParam,
        priceRange: urlPriceRange,
        sort: urlSort,
        page: urlPage,
      });
    };

    fetchSearchResults();
  }, [
    urlKeyword,
    urlCategoriesParam.toString(),
    urlPriceRange,
    urlSort,
    urlPage,
  ]);

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
    const params = new URLSearchParams();
    if (keyword) params.append('q', keyword);
    selectedCategories.forEach((cat) => params.append('categories', cat));
    if (priceRange && priceRange !== 'all')
      params.append('priceRange', priceRange);
    if (sort && sort !== 'relevance') params.append('sort', sort);
    params.append('page', '1');
    router.push(`/search?${params.toString()}`);
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
    isChecked: boolean,
  ) => {
    const subcategoryIds = category.subcategories.map((sub) => sub.id);
    if (isChecked) {
      setSelectedCategories((prev) => {
        const newSelection = new Set([...prev, ...subcategoryIds]);
        return Array.from(newSelection);
      });
    } else {
      setSelectedCategories((prev) =>
        prev.filter((id) => !subcategoryIds.includes(id)),
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
      selectedCategories.includes(id),
    ).length;
    return selectedCount > 0 && selectedCount < subcategoryIds.length;
  };

  // URLパラメータを更新（ページ変更用）
  const updatePageInUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (urlKeyword) params.append('q', urlKeyword);
    urlCategoriesParam.forEach((cat) => params.append('categories', cat));
    if (urlPriceRange && urlPriceRange !== 'all')
      params.append('priceRange', urlPriceRange);
    if (urlSort && urlSort !== 'relevance') params.append('sort', urlSort);
    params.append('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  // 検索条件をリセット
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceRange('all');
    setSort('relevance');
  };

  // 商品クリック時の処理
  const handleProductClick = (productId: number | string) => {
    router.push(`/product/detail?id=${productId}`);
  };

  // 選択されたカテゴリに含まれる小カテゴリの取得
  const getSubcategoriesForCategory = (categoryId: string): string[] => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return [];
    return category.subcategories.map((sub) => sub.id);
  };

  // ページング処理
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const displayProducts = apiProducts;

  return (
    <MainLayout>
      <Box>
        <Stack spacing={3}>
          <Breadcrumbs>
            <MuiLink
              component={Link}
              href="/"
              color="inherit"
              underline="hover"
            >
              ホーム
            </MuiLink>
            <Typography color="text.secondary">検索結果</Typography>
          </Breadcrumbs>

          <Typography variant="h4" fontWeight={700}>
            検索結果
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              fullWidth
              placeholder="商品名で検索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            {!isMobile && (
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ height: '56px' }}
              >
                検索
              </Button>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Dropdown
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
              buttonText={
                selectedCategories.length === 0
                  ? 'すべてのカテゴリ'
                  : `${selectedCategories.length}個選択中`
              }
            >
              <Stack spacing={1.5} sx={{ minWidth: 280 }}>
                {categories.map((category) => (
                  <Box key={category.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isParentCategorySelected(category)}
                            indeterminate={isParentCategoryIndeterminate(
                              category,
                            )}
                            onChange={(e) =>
                              handleParentCategoryChange(
                                category,
                                e.target.checked,
                              )
                            }
                          />
                        }
                        label={category.name}
                      />
                      <IconButton
                        size="small"
                        onClick={() => toggleCategoryExpand(category.id)}
                        sx={{
                          ml: 'auto',
                          transform: expandedCategories.has(category.id)
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <ExpandMoreIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Collapse in={expandedCategories.has(category.id)}>
                      <Stack spacing={0.5} sx={{ pl: 3, pb: 1 }}>
                        {category.subcategories.map((subcategory) => (
                          <FormControlLabel
                            key={subcategory.id}
                            control={
                              <Checkbox
                                checked={selectedCategories.includes(
                                  subcategory.id,
                                )}
                                onChange={(e) =>
                                  handleCategoryChange(
                                    subcategory.id,
                                    e.target.checked,
                                  )
                                }
                              />
                            }
                            label={subcategory.name}
                          />
                        ))}
                      </Stack>
                    </Collapse>
                  </Box>
                ))}
              </Stack>
            </Dropdown>

            <Dropdown
              isOpen={isPriceDropdownOpen}
              onToggle={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
              onClose={() => setIsPriceDropdownOpen(false)}
              buttonText={
                PRICE_RANGES.find((r) => r.id === priceRange)?.label ||
                'すべての価格'
              }
            >
              <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                {PRICE_RANGES.map((range) => (
                  <FormControlLabel
                    key={range.id}
                    control={
                      <Radio
                        checked={priceRange === range.id}
                        onChange={() => {
                          setPriceRange(range.id);
                          setIsPriceDropdownOpen(false);
                        }}
                      />
                    }
                    label={range.label}
                  />
                ))}
              </Stack>
            </Dropdown>

            <Dropdown
              isOpen={isSortDropdownOpen}
              onToggle={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              onClose={() => setIsSortDropdownOpen(false)}
              buttonText={
                SORT_OPTIONS.find((o) => o.id === sort)?.label ||
                '関連度が高い順'
              }
            >
              <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                {SORT_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    control={
                      <Radio
                        checked={sort === option.id}
                        onChange={() => {
                          setSort(option.id);
                          setIsSortDropdownOpen(false);
                        }}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </Stack>
            </Dropdown>
          </Stack>

          {(selectedCategories.length > 0 || priceRange !== 'all') && (
            <Box>
              <Button variant="text" onClick={handleResetFilters}>
                検索条件をリセット
              </Button>
            </Box>
          )}

          {isMobile && (
            <Button variant="contained" onClick={handleSearch}>
              検索
            </Button>
          )}

          <Typography color="text.secondary">
            全{totalCount}件中
            {totalCount > 0
              ? ` ${(urlPage - 1) * ITEMS_PER_PAGE + 1}~${Math.min(
                  urlPage * ITEMS_PER_PAGE,
                  totalCount,
                )}件を表示`
              : '件を表示'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
                lg: 'repeat(5, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {displayProducts.map((p, index) => (
              <ProductCard
                key={`search-${p.id}-${index}`}
                id={p.id}
                name={p.name}
                price={p.price}
                showDetails={true}
                image={p.image}
                onClick={() => handleProductClick(p.id)}
              />
            ))}
          </Box>

          {displayProducts.length === 0 && (
            <Alert severity="info">検索条件に一致する商品がありません</Alert>
          )}

          {totalCount > 0 && (
            <Box display="flex" justifyContent="center">
              <Pagination
                currentPage={urlPage}
                totalPages={totalPages}
                onPageChange={updatePageInUrl}
              />
            </Box>
          )}
        </Stack>
      </Box>
    </MainLayout>
  );
}
