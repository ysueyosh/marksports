'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import Link from 'next/link';
import { useCategories } from '@/context/CategoryContext';
import { getFeaturedProducts, Product } from '@/api/products';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { categories } = useCategories();
  const [featuredProducts, setFeaturedProducts] = useState<{
    [key: string]: Product[];
  }>({});

  const handleProductClick = (productId: number) => {
    router.push(`/product/detail?id=${productId}`);
  };

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await getFeaturedProducts();

        if (response.success && response.data) {
          setFeaturedProducts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Mark Sports</h1>
        <p className={styles.subtitle}>お好みのスポーツ用品をお探しください</p>

        {/* おすすめ商品セクション */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>おすすめ商品</h2>
          <div className={styles.productGrid}>
            {Array.from(
              new Map(
                Object.values(featuredProducts)
                  .flat()
                  .map((product) => [product.id, product]),
              ).values(),
            )
              .slice(0, 6)
              .map((product, index) => (
                <ProductCard
                  image={product.image}
                  key={`featured-${product.id}-${index}`}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
          </div>
        </section>

        {/* カテゴリごとの商品セクション */}
        {categories.map((category) => (
          <section key={category.id} className={styles.section}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.sectionTitle}>{category.name}</h2>
              <Link
                href={`/search?categories=${category.subcategories
                  .map((sub) => sub.id)
                  .join('&categories=')}`}
                className={styles.categoryLink}
              >
                すべて見る →
              </Link>
            </div>
            <div className={styles.productGrid}>
              {featuredProducts[category.id]?.map((product, index) => (
                <ProductCard
                  image={product.image}
                  key={`${category.id}-${product.id}-${index}`}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </MainLayout>
  );
}
