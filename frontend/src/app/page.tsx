'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import ProductCard from '@/components/ProductCard/ProductCard';
import Link from 'next/link';
import { useCategories } from '@/context/CategoryContext';
import { getFeaturedProducts, Product } from '@/api/products';
import { Box, Typography, Button } from '@mui/material';

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
      <Box display="flex" flexDirection="column" gap={5}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Mark Sports
          </Typography>
          <Typography color="text.secondary">
            お好みのスポーツ用品をお探しください
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            おすすめ商品
          </Typography>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
          >
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
          </Box>
        </Box>

        {categories.map((category) => (
          <Box key={category.id}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h5" fontWeight={700}>
                {category.name}
              </Typography>
              <Button
                component={Link}
                href={`/search?categories=${category.subcategories
                  .map((sub) => sub.id)
                  .join('&categories=')}`}
              >
                すべて見る →
              </Button>
            </Box>
            <Box
              display="grid"
              gap={2}
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              }}
            >
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
            </Box>
          </Box>
        ))}
      </Box>
    </MainLayout>
  );
}
