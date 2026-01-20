/**
 * Categories API
 */

import { apiClient } from './client';

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data?: Category[];
}

export async function getCategories(): Promise<CategoriesResponse> {
  return apiClient.get<CategoriesResponse>('/categories');
}
