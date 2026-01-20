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
    request: ProductCreateRequest
  ): Promise<AdminProductCreateResponse> => {
    return apiClient.post<AdminProductCreateResponse>(
      '/admin/products',
      request
    );
  },

  /**
   * Get all products (admin view)
   */
  getAllProducts: async (
    page: number = 1,
    limit: number = 10
  ): Promise<AdminProductResponse> => {
    return apiClient.get<AdminProductResponse>(
      `/admin/products?page=${page}&limit=${limit}`
    );
  },

  /**
   * Update a product
   */
  updateProduct: async (
    productId: string,
    request: ProductUpdateRequest
  ): Promise<AdminProductResponse> => {
    return apiClient.put<AdminProductResponse>(
      `/admin/products/${productId}`,
      request
    );
  },

  /**
   * Delete a product
   */
  deleteProduct: async (productId: string): Promise<AdminProductResponse> => {
    return apiClient.delete<AdminProductResponse>(
      `/admin/products/${productId}`
    );
  },
};
