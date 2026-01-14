'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

export interface SearchConditions {
  keyword: string;
  categories: string[];
  priceRange: string;
  sort: string;
  page: number;
}

interface SearchContextType {
  conditions: SearchConditions;
  setConditions: (conditions: SearchConditions) => void;
  saveConditions: (conditions: SearchConditions) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [conditions, setConditions] = useState<SearchConditions>({
    keyword: '',
    categories: [],
    priceRange: 'all',
    sort: 'relevance',
    page: 1,
  });

  const saveConditions = useCallback((newConditions: SearchConditions) => {
    setConditions(newConditions);
  }, []);

  return (
    <SearchContext.Provider
      value={{ conditions, setConditions, saveConditions }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
