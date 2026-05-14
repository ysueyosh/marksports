'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import ClientAddToCart from '@/components/AddToCartButton/ClientAddToCart';
import { formatPriceIncludedTax, getPriceWithTax } from '@/utils/price';
import { recordPageViewIfNeeded } from '@/utils/page-view';
import {
  getProductDetail,
  ProductDetail,
  ProductOption,
  ProductOptionChoice,
  getRelatedProducts,
  Product,
} from '@/api/products';
import { useSearch } from '@/context/SearchContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { useCart } from '@/context/CartContext';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
} from '@mui/material';

export default function ProductDetailPage() {
  const FREE_SHIPPING_THRESHOLD = 4000;
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const { items: cartItems } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string>('/search');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedOptionChoices, setSelectedOptionChoices] = useState<Record<string, string>>({});
  const { conditions } = useSearch();
  const { show: showSnackbar } = useSnackbar();

  const handleProductClick = (productId: number | string) => {
    router.push(`/product/detail?id=${productId}`);
  };

  // Build search URL from Context conditions
  useEffect(() => {
    const params = new URLSearchParams();

    if (conditions.keyword) params.append('q', conditions.keyword);
    if (conditions.categories && conditions.categories.length > 0) {
      conditions.categories.forEach((cat) => params.append('categories', cat));
    }
    if (conditions.priceRange && conditions.priceRange !== 'all') {
      params.append('priceRange', conditions.priceRange);
    }
    if (conditions.sort && conditions.sort !== 'relevance') {
      params.append('sort', conditions.sort);
    }
    if (conditions.page && conditions.page > 1) {
      params.append('page', conditions.page.toString());
    }

    if (params.toString()) {
      setSearchUrl(`/search?${params.toString()}`);
    }
  }, [conditions]);

  useEffect(() => {
    if (!id) return;
    recordPageViewIfNeeded(`/${id}`);
  }, [id]);

  // Fetch product detail
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await getProductDetail(id);
        console.log('Product Detail Response:', response);
        if (response.success && response.data) {
          console.log('Product Data:', response.data);
          console.log('Product Details Text:', response.data.productDetails);
          console.log('Redirect URL:', response.data.redirectUrl);
          setProduct(response.data);
          setError(null);
          // Reset variant selections when product changes
          setSelectedSize('');
          setSelectedColor('');
          setSelectedOptionChoices({});
        } else {
          setError('商品情報を取得できませんでした');
          showSnackbar('商品情報を取得できませんでした', 'error');
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('商品情報の取得に失敗しました');
        showSnackbar('商品情報の取得に失敗しました', 'error');
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (!id) return;

    const fetchRelatedProducts = async () => {
      try {
        const response = await getRelatedProducts(id, 4);
        if (response.success && response.data) {
          setRelatedProducts(response.data.products);
        } else {
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [id]);

  if (!id) {
    return (
      <MainLayout>
        <Box py={6} />
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <Box py={6} textAlign="center">
          <Typography variant="h5" fontWeight={700}>
            商品が見つかりません
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" gap={3}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/" color="inherit">
            ホーム
          </MuiLink>
          <MuiLink component={Link} href={searchUrl} color="inherit">
            検索
          </MuiLink>
          <Typography color="text.primary">商品詳細</Typography>
        </Breadcrumbs>

        <Box
          display="grid"
          gap={3}
          gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
        >
          <Box>
            <Box
              position="relative"
              width="100%"
              pt="100%"
              borderRadius={2}
              overflow="hidden"
              bgcolor="grey.100"
            >
              {product?.imageUrls && product.imageUrls.length > 0 ? (
                <Image
                  src={
                    product.imageUrls[selectedImageIndex] ||
                    product.imageUrls[0]
                  }
                  alt={`${product?.name || '商品'} - 画像${
                    selectedImageIndex + 1
                  }`}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              ) : null}
            </Box>
            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              {product?.imageUrls &&
                product.imageUrls.map((imageUrl, index) => (
                  <Button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      minWidth: 60,
                      p: 0,
                      minHeight: 60,
                      overflow: 'hidden',
                      border:
                        selectedImageIndex === index ? '2px solid' : '0px',
                    }}
                  >
                    <Box
                      position="relative"
                      width={60}
                      height={60}
                      overflow="hidden"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${product?.name || '商品'} - 画像${index + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>
                  </Button>
                ))}
            </Stack>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h4" fontWeight={700}>
              {product.name}
            </Typography>

            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" fontWeight={700}>
                {formatPriceIncludedTax(product.price)}
              </Typography>
              {product.originalPrice && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    {formatPriceIncludedTax(product.originalPrice)}
                  </Typography>
                  {product.discount && (
                    <Chip label={product.discount} color="error" size="small" />
                  )}
                </>
              )}
            </Box>

            <Box>
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {product.description || ''}
              </ReactMarkdown>
            </Box>

            {(() => {
              // カート内の商品合計金額（税込）を計算
              const cartTotal = cartItems.reduce((sum, item) => {
                return sum + getPriceWithTax(item.price) * item.quantity;
              }, 0);

              // カート合計 + この商品の価格（税込）
              const totalWithThisProduct =
                cartTotal + getPriceWithTax(product.price);

              if (totalWithThisProduct >= FREE_SHIPPING_THRESHOLD) {
                return (
                  <Alert severity="success">
                    この商品をカートに追加すると基本送料無料になります（地域別配送料は別途かかります）。
                  </Alert>
                );
              } else {
                return (
                  <Alert severity="info">
                    この商品をカートに追加後、あと¥
                    {(
                      FREE_SHIPPING_THRESHOLD - totalWithThisProduct
                    ).toLocaleString()}
                    で基本送料無料です（地域別配送料は別途かかります）。
                  </Alert>
                );
              }
            })()}

            {product.paymentMethodRestriction && (() => {
              const labelMap: Record<string, string> = {
                bank_transfer: '口座振替',
                credit_card: 'クレジットカード',
                apple_pay: 'Apple Pay',
                google_pay: 'Google Pay',
              };
              const label = labelMap[product.paymentMethodRestriction] ?? product.paymentMethodRestriction;
              return (
                <Alert severity="warning">
                  この商品は <strong>{label}</strong> のみご利用いただけます。
                </Alert>
              );
            })()}

            {product.redirectUrl ? (
              <Button
                variant="contained"
                component="a"
                href={product.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                サイトに移動
              </Button>
            ) : (
              <>
                {product.sizes && product.sizes.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      gutterBottom
                    >
                      サイズ{' '}
                      <Typography
                        component="span"
                        color="error"
                        variant="caption"
                      >
                        *必須
                      </Typography>
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {product.sizes.map((s) => (
                        <Button
                          key={s}
                          variant={
                            selectedSize === s ? 'contained' : 'outlined'
                          }
                          size="small"
                          onClick={() => setSelectedSize(s)}
                          sx={{ minWidth: 56 }}
                        >
                          {s}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}
                {product.colors && product.colors.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      gutterBottom
                    >
                      カラー{' '}
                      <Typography
                        component="span"
                        color="error"
                        variant="caption"
                      >
                        *必須
                      </Typography>
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {product.colors.map((c) => (
                        <Button
                          key={c}
                          variant={
                            selectedColor === c ? 'contained' : 'outlined'
                          }
                          size="small"
                          onClick={() => setSelectedColor(c)}
                          sx={{ minWidth: 72 }}
                        >
                          {c}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}
                {/* カスタムオプション選択 */}
                {product.customOptions && product.customOptions.length > 0 && (
                  <>
                    {product.customOptions.map((opt) => (
                      <Box key={opt.optionId}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          {opt.name}{' '}
                          <Typography component="span" color="error" variant="caption">
                            *必須
                          </Typography>
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {opt.choices.map((choice) => (
                            <Button
                              key={choice.choiceId}
                              variant={selectedOptionChoices[opt.optionId] === choice.choiceId ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() =>
                                setSelectedOptionChoices((prev) => ({
                                  ...prev,
                                  [opt.optionId]: choice.choiceId,
                                }))
                              }
                              sx={{ minWidth: 80 }}
                            >
                              {choice.name}
                              {choice.additionalPrice > 0 && (
                                <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                  (+¥{Math.floor(choice.additionalPrice * 1.1).toLocaleString()}税込)
                                </Typography>
                              )}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </>
                )}

                {(() => {
                  const missingItems: string[] = [];
                  if (product.sizes && product.sizes.length > 0 && !selectedSize) missingItems.push('サイズ');
                  if (product.colors && product.colors.length > 0 && !selectedColor) missingItems.push('カラー');
                  if (product.customOptions) {
                    product.customOptions.forEach((opt) => {
                      if (!selectedOptionChoices[opt.optionId]) missingItems.push(opt.name);
                    });
                  }
                  return missingItems.length > 0 ? (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      {missingItems.join('・')}を選択してください
                    </Alert>
                  ) : null;
                })()}

                {(() => {
                  // 選択されたオプションから追加料金と choiceId/name を取得（全オプション対応）
                  let totalAdditionalPrice = 0;
                  const choiceIds: string[] = [];
                  const choiceNames: string[] = [];
                  if (product.customOptions && product.customOptions.length > 0) {
                    for (const opt of product.customOptions) {
                      const choiceId = selectedOptionChoices[opt.optionId];
                      if (choiceId) {
                        const choice = opt.choices.find((c) => c.choiceId === choiceId);
                        if (choice) {
                          totalAdditionalPrice += choice.additionalPrice;
                          choiceIds.push(choice.choiceId);
                          choiceNames.push(`${opt.name}: ${choice.name}`);
                        }
                      }
                    }
                  }
                  const firstChoiceId = choiceIds.length > 0 ? choiceIds.join('_') : undefined;
                  const firstChoiceName = choiceNames.length > 0 ? choiceNames.join(' / ') : undefined;

                  const isOptionRequired = product.customOptions && product.customOptions.length > 0;
                  const allOptionsSelected = !isOptionRequired || product.customOptions!.every((opt) => selectedOptionChoices[opt.optionId]);

                  return (
                    <ClientAddToCart
                      id={String(product.id)}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      size={selectedSize || undefined}
                      color={selectedColor || undefined}
                      selectedOptionChoiceId={firstChoiceId}
                      selectedOptionChoiceName={firstChoiceName}
                      additionalPrice={totalAdditionalPrice || undefined}
                      minQuantity={product.minQuantity}
                      maxQuantity={product.maxQuantity}
                      disabled={
                        (product.sizes != null && product.sizes.length > 0 && !selectedSize) ||
                        (product.colors != null && product.colors.length > 0 && !selectedColor) ||
                        !allOptionsSelected
                      }
                    />
                  );
                })()}
              </>
            )}
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            関連商品
          </Typography>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
            }}
          >
            {relatedProducts.length > 0 ? (
              relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={relatedProduct.price}
                  showDetails={true}
                  image={relatedProduct.image}
                  onClick={() => handleProductClick(relatedProduct.id)}
                />
              ))
            ) : (
              <Typography color="text.secondary">
                関連商品がありません
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
