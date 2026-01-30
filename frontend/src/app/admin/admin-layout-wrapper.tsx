'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/Header/AdminHeader';
import { verifyAdminToken, refreshAdminToken } from '@/api/admin';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

interface AdminTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const navItems = [
    { href: '/admin/home', label: 'ホーム' },
    { href: '/admin/products', label: '商品管理' },
    { href: '/admin/orders', label: '注文管理' },
    { href: '/admin/coupons', label: 'クーポン管理' },
    { href: '/admin/users', label: 'ユーザー管理' },
    { href: '/admin/notifications', label: 'お知らせ配信' },
    { href: '/admin/settings', label: '設定' },
  ];

  useEffect(() => {
    // タブレット以上のサイズかチェック
    const checkSize = () => {
      setIsLargeScreen(window.innerWidth >= 960); // md breakpoint
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    // ログインページと新規管理者作成ページは常に表示（リダイレクト処理なし）
    if (pathname === '/admin/login' || pathname === '/admin/create-admin') {
      setIsLoading(false);
      return;
    }

    const initializeAdminAuth = async () => {
      const adminLogged = localStorage.getItem('adminLogged');

      if (!adminLogged) {
        router.push('/admin/login');
        setIsLoading(false);
        return;
      }

      // トークンが保存されている場合、検証を実行
      const savedTokens = localStorage.getItem('adminTokens');

      if (savedTokens) {
        try {
          const parsedTokens = JSON.parse(savedTokens) as AdminTokens;

          // アクセストークンが有効か確認
          if (parsedTokens.expiresAt > Date.now()) {
            // トークンがまだ有効 → /admin/verify-token で自動ログイン
            const response = await verifyAdminToken(parsedTokens.accessToken);

            if (response.success) {
              setIsLoggedIn(true);
              setIsLoading(false);
              return;
            } else {
              // トークン検証失敗 → ログアウト
              console.warn(
                'Admin token verification failed:',
                response.message,
              );
              localStorage.removeItem('adminLogged');
              localStorage.removeItem('adminTokens');
              router.push('/admin/login');
              setIsLoading(false);
              return;
            }
          } else {
            // アクセストークン期限切れ → リフレッシュトークンで更新
            const refreshResponse = await refreshAdminToken(
              parsedTokens.refreshToken,
            );

            if (refreshResponse.success && refreshResponse.data) {
              // 新しいアクセストークンとリフレッシュトークンで更新
              const newTokens: AdminTokens = {
                accessToken: refreshResponse.data.accessToken,
                refreshToken:
                  refreshResponse.data.refreshToken ||
                  parsedTokens.refreshToken,
                expiresAt: Date.now() + refreshResponse.data.expiresIn * 1000,
              };

              // 新しいアクセストークンで検証
              const verifyResponse = await verifyAdminToken(
                newTokens.accessToken,
              );

              if (verifyResponse.success) {
                localStorage.setItem('adminTokens', JSON.stringify(newTokens));
                setIsLoggedIn(true);
                setIsLoading(false);
                return;
              } else {
                localStorage.removeItem('adminLogged');
                localStorage.removeItem('adminTokens');
                router.push('/admin/login');
                setIsLoading(false);
                return;
              }
            } else {
              // リフレッシュ失敗 → ログアウト
              console.warn(
                'Admin token refresh failed:',
                refreshResponse.message,
              );
              localStorage.removeItem('adminLogged');
              localStorage.removeItem('adminTokens');
              router.push('/admin/login');
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to auto-login admin:', error);
          localStorage.removeItem('adminLogged');
          localStorage.removeItem('adminTokens');
          router.push('/admin/login');
          setIsLoading(false);
          return;
        }
      } else {
        // トークンが保存されていない場合、ログアウト
        localStorage.removeItem('adminLogged');
        router.push('/admin/login');
        setIsLoading(false);
      }
    };

    initializeAdminAuth();
  }, [pathname, router]);

  const isActive = (href: string) => {
    return pathname === href;
  };

  if (isLoading) {
    return null;
  }

  // ログインページと新規管理者作成ページはレイアウトを表示しない（ログイン状態に関わらず）
  if (pathname === '/admin/login' || pathname === '/admin/create-admin') {
    return children;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        isLargeScreen={isLargeScreen}
      />

      {/* Admin Sidebar */}
      <Drawer
        open={isLargeScreen ? true : sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={isLargeScreen ? 'permanent' : 'temporary'}
        ModalProps={{ keepMounted: isLargeScreen }}
        PaperProps={{
          sx: {
            width: 240,
            position: isLargeScreen ? 'fixed' : 'absolute',
            top: isLargeScreen ? 65 : 0,
            left: 0,
            height: isLargeScreen ? 'calc(100vh - 65px)' : '100vh',
            borderRight: '1px solid',
            borderRightColor: 'divider',
            boxShadow: isLargeScreen ? 'none' : 3,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Typography fontWeight={700} flex={1}>
            メニュー
          </Typography>
          {!isLargeScreen && (
            <IconButton onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive(item.href)}
              onClick={() => {
                if (!isLargeScreen) {
                  setSidebarOpen(false);
                }
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        flex={1}
        sx={{
          overflow: 'auto',
          marginLeft: isLargeScreen ? '240px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
          paddingTop: 2,
          paddingLeft: { xs: 2, md: 3 },
          paddingRight: { xs: 2, md: 3 },
          paddingBottom: 3,
          backgroundColor: 'grey.50',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
