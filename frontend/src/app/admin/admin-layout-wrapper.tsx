'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/Header/AdminHeader';
import Overlay from '@/components/Common/Overlay';
import { verifyAdminToken, refreshAdminToken } from '@/api/admin';
import styles from './admin-layout.module.css';

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
                response.message
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
              parsedTokens.refreshToken
            );

            if (refreshResponse.success && refreshResponse.data) {
              // 新しいアクセストークンで更新
              const newTokens: AdminTokens = {
                accessToken: refreshResponse.data.accessToken,
                refreshToken: parsedTokens.refreshToken,
                expiresAt: Date.now() + refreshResponse.data.expiresIn * 1000,
              };

              // 新しいアクセストークンで検証
              const verifyResponse = await verifyAdminToken(
                newTokens.accessToken
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
                refreshResponse.message
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
    <div className={styles.layoutContainer}>
      <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div
        className={`${styles.mainContent} ${
          sidebarOpen ? styles.hasSidebarOpen : ''
        }`}
      >
        <Overlay
          isOpen={sidebarOpen}
          onClick={() => setSidebarOpen(false)}
          zIndex="sidebar"
        />
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}
        >
          <nav className={styles.nav}>
            <button
              className={styles.closeButton}
              onClick={() => setSidebarOpen(false)}
              aria-label="サイドバーを閉じる"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <span>閉じる</span>
            </button>
            <ul className={styles.navList}>
              <li>
                <Link
                  href="/admin/home"
                  className={`${styles.navLink} ${
                    isActive('/admin/home') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  ホーム
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className={`${styles.navLink} ${
                    isActive('/admin/products') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  商品管理
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/orders"
                  className={`${styles.navLink} ${
                    isActive('/admin/orders') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  注文管理
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/coupons"
                  className={`${styles.navLink} ${
                    isActive('/admin/coupons') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  クーポン管理
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className={`${styles.navLink} ${
                    isActive('/admin/users') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  ユーザー管理
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/notifications"
                  className={`${styles.navLink} ${
                    isActive('/admin/notifications') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  お知らせ配信
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/settings"
                  className={`${styles.navLink} ${
                    isActive('/admin/settings') ? styles.active : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  設定
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
