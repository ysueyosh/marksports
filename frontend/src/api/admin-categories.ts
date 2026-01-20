/**
 * カテゴリ管理 API クライアント
 */

import { apiClient } from './client';
import { refreshAdminToken } from './admin';

// グローバルなローディング状態管理関数
let incrementLoadingFn: (() => void) | null = null;
let decrementLoadingFn: (() => void) | null = null;

export const setLoadingInterceptors = (
  increment: () => void,
  decrement: () => void
) => {
  incrementLoadingFn = increment;
  decrementLoadingFn = decrement;
};

const requestInterceptor = () => {
  if (incrementLoadingFn) {
    incrementLoadingFn();
  }
};

const responseInterceptor = () => {
  if (decrementLoadingFn) {
    decrementLoadingFn();
  }
};

interface Category {
  categoryId: string;
  categoryName: string;
  parentCategoryId?: string | null;
  createdAt?: string;
  children?: Category[]; // 子カテゴリ
}

interface CreateCategoryRequest {
  categoryName: string;
  parentCategoryId?: string | null;
}

interface UpdateCategoryRequest {
  categoryName: string;
  parentCategoryId?: string | null;
}

interface CategoriesResponse {
  success: boolean;
  data?: {
    categories?: Category[];
    allCategories?: Category[];
  };
  error?: string;
}

interface CategoryResponse {
  success: boolean;
  data?: Category;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') ||
    localStorage.getItem('adminTokens')
    ? JSON.parse(localStorage.getItem('adminTokens') || '{}').accessToken
    : null;
}

export const adminCategoryAPI = {
  /**
   * 新しいカテゴリを作成
   */
  async createCategory(
    request: CreateCategoryRequest
  ): Promise<CategoryResponse> {
    requestInterceptor();
    try {
      const response = await apiClient.post<CategoryResponse>(
        '/admin/categories',
        request
      );
      return response as CategoryResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create category',
      };
    } finally {
      responseInterceptor();
    }
  },

  /**
   * すべてのカテゴリを取得
   */
  async getAllCategories(): Promise<CategoriesResponse> {
    requestInterceptor();
    try {
      const response = await apiClient.get<CategoriesResponse>(
        '/admin/categories'
      );
      return response as CategoriesResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch categories',
      };
    } finally {
      responseInterceptor();
    }
  },

  /**
   * カテゴリを更新
   */
  async updateCategory(
    categoryId: string,
    request: UpdateCategoryRequest
  ): Promise<CategoryResponse> {
    requestInterceptor();
    try {
      const response = await apiClient.put<CategoryResponse>(
        `/admin/categories/${categoryId}`,
        request
      );
      return response as CategoryResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update category',
      };
    } finally {
      responseInterceptor();
    }
  },

  /**
   * カテゴリを削除
   */
  async deleteCategory(categoryId: string): Promise<DeleteResponse> {
    requestInterceptor();
    try {
      const response = await apiClient.delete<DeleteResponse>(
        `/admin/categories/${categoryId}`
      );
      return response as DeleteResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete category',
      };
    } finally {
      responseInterceptor();
    }
  },
};

export type { Category, CreateCategoryRequest, UpdateCategoryRequest };
