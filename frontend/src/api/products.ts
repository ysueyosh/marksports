/**
 * Products API
 */

import { apiRequest } from './client';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category_id: string;
  category_name: string;
}

export interface ProductDetail extends Product {
  brand: string;
  color: string;
  material: string;
  level: string;
  originalPrice?: number;
  discount?: string;
  productDetails?: string;
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
  return apiRequest<FeaturedProductsResponse>('/featured-products', {
    method: 'GET',
  });
}

export async function getProductDetail(
  productId: number | string
): Promise<ProductDetailResponse> {
  return apiRequest<ProductDetailResponse>(`/product/${productId}`, {
    method: 'GET',
  });
}

export async function getRelatedProducts(
  productId: number | string,
  limit: number = 4
): Promise<RelatedProductsResponse> {
  const params = new URLSearchParams({
    productId: String(productId),
    limit: String(limit),
  });

  return apiRequest<RelatedProductsResponse>(
    `/related-products?${params.toString()}`,
    {
      method: 'GET',
    }
  );
}

export async function checkProductExists(
  productId: number | string
): Promise<ProductExistsResponse> {
  return apiRequest<ProductExistsResponse>(`/product/${productId}/exists`, {
    method: 'GET',
  });
}

export async function checkProductsExist(
  productIds: (number | string)[]
): Promise<ProductsExistResponse> {
  return apiRequest<ProductsExistResponse>('/products/exists', {
    method: 'POST',
    body: JSON.stringify({
      product_ids: productIds,
    }),
  });
}
