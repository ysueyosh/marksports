'use client';

import React, {
  ReactNode,
  useContext,
  createContext,
  useState,
  useEffect,
} from 'react';
import { Category, getCategories } from '@/api/categories';

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getCategories();

        if (response.success && response.data) {
          setCategories(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to fetch categories');
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to fetch categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        isLoading,
        error,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
}
