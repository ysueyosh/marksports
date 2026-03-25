/**
 * Products API
 */

import { apiClient } from './client';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category_id: string;
  category_name: string;
  redirectUrl?: string;
}

export interface ProductDetail extends Product {
  brand: string;
  color: string;
  material: string;
  level: string;
  originalPrice?: number;
  discount?: string;
  productDetails?: string;
  imageUrls?: string[];
  redirectUrl?: string;
  sizes?: string[];
  colors?: string[];
}

export interface FeaturedProductsResponse {
  success: boolean;
  message: string;
  data?: {
    [categoryId: string]: Product[];
  };
}

export interface ProductDetailResponse {
  success: boolean;
  message: string;
  data?: ProductDetail;
}

export interface RelatedProductsResponse {
  success: boolean;
  message: string;
  data?: {
    products: Product[];
    total: number;
  };
}

export interface ProductExistsResponse {
  success: boolean;
  message: string;
  data?: {
    exists: boolean;
  };
}

export interface ProductsExistResponse {
  success: boolean;
  message: string;
  data?: {
    results: {
      [productId: string]: boolean;
    };
  };
}

export async function getFeaturedProducts(): Promise<FeaturedProductsResponse> {
  return apiClient.get<FeaturedProductsResponse>('/featured-products');
}

export async function getProductDetail(
  productId: number | string,
): Promise<ProductDetailResponse> {
  return apiClient.get<ProductDetailResponse>(`/product/${productId}`);
}

export async function getRelatedProducts(
  productId: number | string,
  limit: number = 4,
): Promise<RelatedProductsResponse> {
  const params = new URLSearchParams({
    productId: String(productId),
    limit: String(limit),
  });

  return apiClient.get<RelatedProductsResponse>(
    `/related-products?${params.toString()}`,
  );
}

export async function checkProductExists(
  productId: number | string,
): Promise<ProductExistsResponse> {
  return apiClient.get<ProductExistsResponse>(`/product/${productId}/exists`);
}

export async function checkProductsExist(
  productIds: (number | string)[],
): Promise<ProductsExistResponse> {
  return apiClient.post<ProductsExistResponse>('/products/exists', {
    product_ids: productIds,
  });
}
