/**
 * Admin product management API client
 */

import { apiClient } from './client';

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  parentCategoryId: string;
  mainImage?: string;
  subImages?: string[];
  imageUrls?: string[];
  status?: string;
  stock?: number;
  isActive?: boolean;
  redirectUrl?: string;
  sizes?: string[];
  colors?: string[];
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  parentCategoryId?: string;
  mainImage?: string;
  subImages?: string[];
  imageUrls?: string[];
  status?: string;
  stock?: number;
  isActive?: boolean;
  redirectUrl?: string;
  sizes?: string[];
  colors?: string[];
}

export interface Product {
  PK: string;
  SK: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  parentCategoryId: string;
  imageUrls: string[];
  status: string;
  stock: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  redirectUrl?: string;
}

export interface AdminProductResponse {
  success: boolean;
  message: string;
  data?:
    | Product
    | {
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
}

export interface AdminProductCreateResponse {
  success: boolean;
  message: string;
  data?: Product;
}

export const adminProductAPI = {
  /**
   * Create a new product
   */
  createProduct: async (
    request: ProductCreateRequest,
  ): Promise<AdminProductCreateResponse> => {
    return apiClient.post<AdminProductCreateResponse>(
      '/admin/products',
      request,
    );
  },

  /**
   * Get all products (admin view)
   */
  getAllProducts: async (
    page: number = 1,
    limit: number = 20,
    keyword?: string,
  ): Promise<AdminProductResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (keyword && keyword.trim()) {
      params.append('keyword', keyword.trim());
    }

    return apiClient.get<AdminProductResponse>(
      `/admin/products?${params.toString()}`,
    );
  },

  /**
   * Update a product
   */
  updateProduct: async (
    productId: string,
    request: ProductUpdateRequest,
  ): Promise<AdminProductResponse> => {
    return apiClient.put<AdminProductResponse>(
      `/admin/products/${productId}`,
      request,
    );
  },

  /**
   * Delete a product
   */
  deleteProduct: async (productId: string): Promise<AdminProductResponse> => {
    return apiClient.delete<AdminProductResponse>(
      `/admin/products/${productId}`,
    );
  },
};
