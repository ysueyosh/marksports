/**
 * Global Loading Spinner Component
 * Integrates with LoadingContext to show/hide spinner for API calls
 * Sets up request/response interceptors for managing multiple simultaneous API calls
 */

'use client';

import { useEffect } from 'react';
import { useLoading } from '@/context/LoadingContext';
import { setLoadingInterceptors } from '@/api/client';
import Loading from '@/components/Loading/Loading';

export default function GlobalLoadingSpinner() {
  const { isLoading, incrementLoading, decrementLoading } = useLoading();

  // Initialize API request/response interceptors on component mount
  useEffect(() => {
    setLoadingInterceptors(incrementLoading, decrementLoading);
  }, [incrementLoading, decrementLoading]);

  return isLoading ? <Loading /> : null;
}
