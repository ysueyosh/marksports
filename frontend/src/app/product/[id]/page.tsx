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

type ImageView = 'main' | 'back' | 'right' | 'left';

export default function ProductDetailPage({ params }: PageProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [searchUrl, setSearchUrl] = useState<string>('/search');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageView, setSelectedImageView] = useState<ImageView>('main');
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
        if (response.success && response.data) {
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
              <Image
                src={`https://d23pzr22xoegue.cloudfront.net/${selectedImageView}.jpg`}
                alt={`${product?.name || '商品'} - ${selectedImageView}`}
                fill
                className={styles.image}
                priority
              />
            </div>
            <div className={styles.thumbnails}>
              {(['main', 'back', 'right', 'left'] as ImageView[]).map(
                (view) => (
                  <button
                    key={view}
                    className={`${styles.thumbnail} ${
                      selectedImageView === view ? styles.active : ''
                    }`}
                    onClick={() => setSelectedImageView(view)}
                    aria-label={`${view}の画像を表示`}
                  >
                    <Image
                      src={`https://d23pzr22xoegue.cloudfront.net/${view}.jpg`}
                      alt={`${product?.name || '商品'} - ${view}`}
                      fill
                      className={styles.thumbnailImage}
                    />
                  </button>
                )
              )}
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
              {product.productDetails ? (
                <ReactMarkdown>{product.productDetails}</ReactMarkdown>
              ) : (
                <>
                  <p>
                    <strong>ブランド:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>カラー:</strong> {product.color}
                  </p>
                  <p>
                    <strong>素材:</strong> {product.material}
                  </p>
                  <p>
                    <strong>対応:</strong> {product.level}
                  </p>
                </>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <ClientAddToCart
                id={String(product.id)}
                name={product.name}
                price={product.price}
                image={product.image}
              />
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
