'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer/Footer';
import ImportantNotificationsBanner from '@/components/ImportantNotificationsBanner/ImportantNotificationsBanner';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 画面サイズを判定
  useEffect(() => {
    const checkMobileSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobileSize();
    window.addEventListener('resize', checkMobileSize);
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);

  useEffect(() => {
    // ページ遷移時にサイドバーを閉じる
    setSidebarOpen(false);
  }, [pathname, searchParams]);

  return (
    <div className={`${styles.layoutWithSidebar} layout-with-sidebar`}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className={styles.content}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main
          className={`${styles.main} ${
            !sidebarOpen ? styles.sidebarClosed : ''
          }`}
        >
          <div className={styles.bannerContainer}>
            <ImportantNotificationsBanner />
          </div>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
