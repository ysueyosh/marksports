import Link from 'next/link';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import ClientAddToCart from '@/components/AddToCartButton/ClientAddToCart';
import styles from './product.module.css';
import productsData from '@/data/products.json';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  brand: string;
  color: string;
  material: string;
  level: string;
  category: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = (productsData as Product[]).find((p) => p.id === id);

  if (!product) {
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
          <Link href="/search">検索</Link>
          <span>/</span>
          <span>商品詳細</span>
        </div>

        <div className={styles.productContent}>
          {/* Product Images */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              <div className={styles.imagePlaceholder}>商品画像</div>
            </div>
            <div className={styles.thumbnails}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.thumbnail}>
                  <div className={styles.thumbnailPlaceholder}>{i}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.priceSection}>
              <div className={styles.price}>
                ¥{product.price.toLocaleString('ja-JP')}
              </div>
              {product.originalPrice && (
                <>
                  <span className={styles.originalPrice}>
                    ¥{product.originalPrice.toLocaleString('ja-JP')}
                  </span>
                  {product.discount && (
                    <span className={styles.discount}>{product.discount}</span>
                  )}
                </>
              )}
            </div>

            {/* Product Details Text */}
            <div className={styles.productDetails}>
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
            </div>

            <div style={{ marginTop: 8 }}>
              <ClientAddToCart
                id={product.id}
                name={product.name}
                price={product.price}
              />
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className={styles.relatedSection}>
          <h2>関連商品</h2>
          <div className={styles.relatedGrid}>
            {[1, 2, 3, 4].map((i) => (
              <ProductCard
                key={i}
                id={i}
                name={`関連商品 ${i}`}
                price={2000 + i * 500}
                showDetails={true}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
