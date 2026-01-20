'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import ClientAddToCart from '@/components/AddToCartButton/ClientAddToCart';
import styles from './product.module.css';
import { formatPriceIncludedTax } from '@/utils/price';
import {
  getProductDetail,
  ProductDetail,
  getRelatedProducts,
  Product,
} from '@/api/products';
import { useSearch } from '@/context/SearchContext';
import { useSnackbar } from '@/context/SnackbarContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string>('/search');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const { conditions } = useSearch();
  const { show: showSnackbar } = useSnackbar();

  // Get ID from params
  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

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
        <div className={styles.container}></div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <h1>商品が見つかりません</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href={searchUrl}>検索</Link>
          <span>/</span>
          <span>商品詳細</span>
        </div>

        <div className={styles.productContent}>
          {/* Product Images */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
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
                  className={styles.image}
                  priority
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                  }}
                />
              )}
            </div>
            <div className={styles.thumbnails}>
              {product?.imageUrls &&
                product.imageUrls.map((imageUrl, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${
                      selectedImageIndex === index ? styles.active : ''
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`画像${index + 1}を表示`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${product?.name || '商品'} - 画像${index + 1}`}
                      fill
                      className={styles.thumbnailImage}
                    />
                  </button>
                ))}
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.priceSection}>
              <div className={styles.price}>
                {formatPriceIncludedTax(product.price)}
              </div>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>
                    {formatPriceIncludedTax(product.originalPrice)}
                  </span>
                  {product.discount && (
                    <span className={styles.discount}>{product.discount}</span>
                  )}
                </>
              )}
            </div>

            {/* Product Details Text */}
            <div className={styles.productDetails}>
              <ReactMarkdown>{product.description || ''}</ReactMarkdown>
            </div>

            <div style={{ marginTop: 8 }}>
              {product.redirectUrl ? (
                <a
                  href={product.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#007bff';
                  }}
                >
                  サイトに移動
                </a>
              ) : (
                <ClientAddToCart
                  id={String(product.id)}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                />
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className={styles.relatedSection}>
          <h2>関連商品</h2>
          <div className={styles.relatedGrid}>
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
              <div className={styles.noRelatedProducts}>
                関連商品がありません
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
