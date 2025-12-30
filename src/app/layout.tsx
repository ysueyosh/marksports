'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
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
        <SnackbarProvider>
          <NotificationProvider>
            <CartProvider>
              <AuthProvider>{children}</AuthProvider>
            </CartProvider>
          </NotificationProvider>
        </SnackbarProvider>
      </body>
    </html>
  );
}
