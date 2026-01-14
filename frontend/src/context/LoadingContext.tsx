/**
 * Loading Context
 * Global loading state management for API calls
 * Uses request counter to handle multiple simultaneous API calls
 */

'use client';

import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  incrementLoading: () => void;
  decrementLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const incrementLoading = () => {
    setLoadingCount((prev) => {
      const newCount = prev + 1;
      if (newCount > 0) {
        setIsLoading(true);
      }
      return newCount;
    });
  };

  const decrementLoading = () => {
    setLoadingCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (newCount === 0) {
        setIsLoading(false);
      }
      return newCount;
    });
  };

  const showSpinner = () => setIsLoading(true);
  const hideSpinner = () => setIsLoading(false);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setIsLoading,
        showSpinner,
        hideSpinner,
        incrementLoading,
        decrementLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
