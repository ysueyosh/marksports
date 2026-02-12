'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { SearchProvider } from '@/context/SearchContext';
import { SidebarProvider } from '@/context/SidebarContext';
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner';
import { ThemeProvider, CssBaseline } from '@mui/material';
import ThemeRegistry from '@/theme/ThemeRegistry';
import theme from '@/theme';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  // Admin routes: Only use basic providers
  if (isAdminRoute) {
    return (
      <LoadingProvider>
        <GlobalLoadingSpinner />
        <SnackbarProvider>{children}</SnackbarProvider>
      </LoadingProvider>
    );
  }

  // Regular routes: Use all user-facing providers
  return (
    <LoadingProvider>
      <GlobalLoadingSpinner />
      <SnackbarProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>
              <CategoryProvider>
                <SearchProvider>
                  <SidebarProvider>{children}</SidebarProvider>
                </SearchProvider>
              </CategoryProvider>
            </CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </SnackbarProvider>
    </LoadingProvider>
  );
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LayoutContent>{children}</LayoutContent>
      </ThemeProvider>
    </ThemeRegistry>
  );
}
