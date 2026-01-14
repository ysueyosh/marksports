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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LoadingProvider>
          <GlobalLoadingSpinner />
          <SnackbarProvider>
            <NotificationProvider>
              <CartProvider>
                <CategoryProvider>
                  <SearchProvider>
                    <SidebarProvider>
                      <AuthProvider>{children}</AuthProvider>
                    </SidebarProvider>
                  </SearchProvider>
                </CategoryProvider>
              </CartProvider>
            </NotificationProvider>
          </SnackbarProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
