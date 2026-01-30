'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import ClientAddToCart from '@/components/AddToCartButton/ClientAddToCart';
import { formatPriceIncludedTax } from '@/utils/price';
import {
  getProductDetail,
  ProductDetail,
  getRelatedProducts,
  Product,
} from '@/api/products';
import { useSearch } from '@/context/SearchContext';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Stack,
  Chip,
} from '@mui/material';

export default function ProductDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string>('/search');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const { conditions } = useSearch();
  const { show: showSnackbar } = useSnackbar();

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
                    variant={
                      selectedImageIndex === index ? 'contained' : 'outlined'
                    }
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{ minWidth: 60, p: 0, height: 60 }}
                  >
                    <Box position="relative" width={60} height={60}>
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
              <ReactMarkdown>{product.description || ''}</ReactMarkdown>
            </Box>

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
              <ClientAddToCart
                id={String(product.id)}
                name={product.name}
                price={product.price}
                image={product.image}
              />
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            関連商品
          </Typography>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
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
