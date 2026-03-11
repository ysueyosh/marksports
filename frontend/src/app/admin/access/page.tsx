'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination/Pagination';
import { adminProductAPI } from '@/api/admin-products';
import { adminCategoryAPI, type Category } from '@/api/admin-categories';
import {
  getPageViewStats,
  type AccessView,
  type PageViewStat,
} from '@/api/admin-page-views';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Stack,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface ProductRow {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  status: 'public' | 'private';
  pageId: string;
  mainImage?: string;
  isSite?: boolean;
}

const siteAccessRow: ProductRow = {
  id: 'SITE',
  name: 'サイトアクセス',
  categoryId: '',
  price: 0,
  status: 'public',
  pageId: '/',
  mainImage: '',
  isSite: true,
};

const ITEMS_PER_PAGE = 20;

export default function AdminAccessPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewById, setViewById] = useState<Record<string, AccessView>>({});
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categoryMap, setCategoryMap] = useState<
    Record<string, { name: string; parentId?: string | null }>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statsCache, setStatsCache] = useState<
    Record<string, Partial<Record<AccessView, PageViewStat[]>>>
  >({});
  const [statsLoading, setStatsLoading] = useState<
    Record<string, Partial<Record<AccessView, boolean>>>
  >({});

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

    const loadCategories = async () => {
      try {
        const response = await adminCategoryAPI.getAllCategories();
        if (response.success && response.data) {
          const sourceCategories =
            response.data.categories || response.data.allCategories || [];
          const map: Record<
            string,
            { name: string; parentId?: string | null }
          > = {};
          const flatten = (cats: Category[]) => {
            cats.forEach((cat) => {
              map[cat.categoryId] = {
                name: cat.categoryName,
                parentId: cat.parentCategoryId,
              };
              if (cat.children && cat.children.length > 0) {
                flatten(cat.children);
              }
            });
          };
          flatten(sourceCategories);
          setCategoryMap(map);
        } else {
          setCategoryMap({});
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategoryMap({});
      }
    };

    loadCategories();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadProducts = async () => {
      try {
        const response = await adminProductAPI.getAllProducts(
          currentPage,
          ITEMS_PER_PAGE,
          searchKeyword,
        );
        if (response.success && response.data && 'products' in response.data) {
          const mappedProducts = response.data.products.map((product) => ({
            id: product.productId,
            name: product.name || '-',
            categoryId: product.categoryId || '',
            price: product.price || 0,
            status: product.isActive
              ? ('public' as const)
              : ('private' as const),
            pageId: `/${product.productId}`,
            mainImage: product.imageUrls?.[0] || '',
          }));
          setProducts(mappedProducts);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
        setTotalPages(1);
      }
    };

    loadProducts();
  }, [isLoggedIn, currentPage, searchKeyword]);

  const filteredProducts = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(query),
    );
  }, [products, searchKeyword]);

  const displayRows = useMemo(() => {
    return [siteAccessRow, ...filteredProducts];
  }, [filteredProducts]);

  useEffect(() => {
    if (!expandedId) return;
    const currentView = viewById[expandedId] || 'week';
    const row = displayRows.find((item) => item.id === expandedId);
    if (!row) return;

    const cached = statsCache[row.pageId]?.[currentView];
    const loading = statsLoading[row.pageId]?.[currentView];
    if (cached || loading) return;

    const fetchStats = async () => {
      setStatsLoading((prev) => ({
        ...prev,
        [row.pageId]: {
          ...prev[row.pageId],
          [currentView]: true,
        },
      }));
      try {
        const response = await getPageViewStats(row.pageId, currentView);
        if (response.success && response.data?.items) {
          setStatsCache((prev) => ({
            ...prev,
            [row.pageId]: {
              ...prev[row.pageId],
              [currentView]: response.data?.items || [],
            },
          }));
        } else {
          setStatsCache((prev) => ({
            ...prev,
            [row.pageId]: {
              ...prev[row.pageId],
              [currentView]: [],
            },
          }));
        }
      } catch (error) {
        console.error('Failed to load access stats:', error);
        setStatsCache((prev) => ({
          ...prev,
          [row.pageId]: {
            ...prev[row.pageId],
            [currentView]: [],
          },
        }));
      } finally {
        setStatsLoading((prev) => ({
          ...prev,
          [row.pageId]: {
            ...prev[row.pageId],
            [currentView]: false,
          },
        }));
      }
    };

    fetchStats();
  }, [displayRows, expandedId, statsCache, statsLoading, viewById]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          アクセス管理
        </Typography>
        <Typography color="text.secondary">
          商品別のアクセス推移を確認できます
        </Typography>
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={56}></TableCell>
              <TableCell></TableCell>
              <TableCell>商品名</TableCell>
              {!isMobile && <TableCell>カテゴリ</TableCell>}
              {!isMobile && <TableCell>価格</TableCell>}
              {!isMobile && <TableCell>公開状態</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.length === 1 && filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 3 : 6}>
                  <Typography textAlign="center" color="text.secondary" py={4}>
                    該当する商品がありません。
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((product) => {
                const isExpanded = expandedId === product.id;
                const view = viewById[product.id] || 'week';
                const stats = statsCache[product.pageId]?.[view] || [];
                const isStatsLoading =
                  statsLoading[product.pageId]?.[view] || false;
                const chartData = stats.map((item) => ({
                  name: item.label || item.date,
                  count: item.count,
                }));
                const categoryName = (() => {
                  if (product.isSite) return '-';
                  const current = categoryMap[product.categoryId];
                  if (!current) return product.categoryId || '-';
                  if (!current.parentId) return current.name;
                  const parent = categoryMap[current.parentId];
                  if (!parent) return current.name;
                  return `${parent.name} > ${current.name}`;
                })();
                const totalAccess = chartData.reduce(
                  (sum, item) => sum + item.count,
                  0,
                );
                const todayAccess =
                  view === 'week'
                    ? chartData[chartData.length - 1]?.count || 0
                    : 0;

                return (
                  <Fragment key={product.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : product.id)
                          }
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {product.isSite ? null : product.mainImage ? (
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
                      {!isMobile && <TableCell>{categoryName}</TableCell>}
                      {!isMobile && (
                        <TableCell>
                          {product.isSite
                            ? '-'
                            : `¥${product.price.toLocaleString()}`}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              product.isSite
                                ? 'サイト'
                                : product.status === 'public'
                                  ? '公開'
                                  : '非公開'
                            }
                            color={
                              product.isSite
                                ? 'info'
                                : product.status === 'public'
                                  ? 'success'
                                  : 'default'
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={isMobile ? 3 : 6} sx={{ py: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, py: 3 }}>
                            <Stack spacing={2}>
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                              >
                                {(
                                  [
                                    { value: 'week', label: '週' },
                                    { value: 'month', label: '月' },
                                    { value: 'year', label: '年' },
                                    { value: 'all', label: '全期間' },
                                  ] as const
                                ).map((option) => (
                                  <Button
                                    key={option.value}
                                    size="small"
                                    variant={
                                      view === option.value
                                        ? 'contained'
                                        : 'outlined'
                                    }
                                    onClick={() =>
                                      setViewById((prev) => ({
                                        ...prev,
                                        [product.id]: option.value,
                                      }))
                                    }
                                  >
                                    {option.label}
                                  </Button>
                                ))}
                              </Stack>
                              <Stack direction="row" spacing={1.5}>
                                {view === 'week' && (
                                  <Paper
                                    variant="outlined"
                                    sx={{ p: 1.5, minWidth: 140 }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      mb={0.5}
                                    >
                                      今日
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                      {todayAccess.toLocaleString()}
                                    </Typography>
                                  </Paper>
                                )}
                                <Paper
                                  variant="outlined"
                                  sx={{ p: 1.5, minWidth: 140 }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mb={0.5}
                                  >
                                    表示対象合計
                                  </Typography>
                                  <Typography variant="h6" fontWeight={700}>
                                    {totalAccess.toLocaleString()}
                                  </Typography>
                                </Paper>
                              </Stack>
                              <Paper
                                variant="outlined"
                                sx={{ p: 2, bgcolor: '#fafafa' }}
                              >
                                {isStatsLoading ? (
                                  <Box py={6}>
                                    <Typography
                                      textAlign="center"
                                      color="text.secondary"
                                    >
                                      読み込み中...
                                    </Typography>
                                  </Box>
                                ) : chartData.length > 0 ? (
                                  <ResponsiveContainer
                                    width="100%"
                                    height={280}
                                  >
                                    <LineChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" />
                                      <YAxis />
                                      <Tooltip />
                                      <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        dot={{ r: 3 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <Box py={6}>
                                    <Typography
                                      textAlign="center"
                                      color="text.secondary"
                                    >
                                      アクセスデータがありません。
                                    </Typography>
                                  </Box>
                                )}
                              </Paper>
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
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
    </Box>
  );
}
