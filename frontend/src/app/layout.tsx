'use client';

import { Geist, Geist_Mono } from 'next/font/google';
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
import theme from '@/theme';
import './globals.css';
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>Mark Sports</title>
        {/* Square Web Payments SDK */}
        <script
          async
          src="https://sandbox.web.squarecdn.com/v1/square.js"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
