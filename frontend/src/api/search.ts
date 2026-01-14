/**
 * Search API
 */

import { apiRequest } from './client';

export interface SearchProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category_id: string;
  category_name: string;
  subcategory_id?: string;
  subcategory_name?: string;
}

export interface SearchFilters {
  keyword?: string;
  categories?: string[]; // category IDs
  priceRange?: 'all' | 'lt1000' | '1000-5000' | '5000-10000' | 'gt10000';
  sort?: 'relevance' | 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data?: {
    products: SearchProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function searchProducts(
  filters: SearchFilters
): Promise<SearchResponse> {
  const params = new URLSearchParams();

  if (filters.keyword) {
    params.append('keyword', filters.keyword);
  }

  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach((category) => {
      params.append('categories', category);
    });
  }

  if (filters.priceRange && filters.priceRange !== 'all') {
    params.append('priceRange', filters.priceRange);
  }

  if (filters.sort && filters.sort !== 'relevance') {
    params.append('sort', filters.sort);
  }

  if (filters.page) {
    params.append('page', filters.page.toString());
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  const queryString = params.toString();
  const endpoint = `/search${queryString ? `?${queryString}` : ''}`;

  return apiRequest<SearchResponse>(endpoint, {
    method: 'GET',
  });
}
