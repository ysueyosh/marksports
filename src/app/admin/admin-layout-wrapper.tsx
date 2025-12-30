'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/Header/AdminHeader';
import Overlay from '@/components/Common/Overlay';
import styles from './admin-layout.module.css';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ログインページは常に表示（リダイレクト処理なし）
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  const isActive = (href: string) => {
    return pathname === href;
  };

  if (isLoading) {
    return null;
  }

  // ログインページはレイアウトを表示しない（ログイン状態に関わらず）
  if (pathname === '/admin/login') {
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
