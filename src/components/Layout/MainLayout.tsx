'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer/Footer';
import Loading from '@/components/Loading/Loading';
import ImportantNotificationsBanner from '@/components/ImportantNotificationsBanner/ImportantNotificationsBanner';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // モバイルでは初期状態を閉じた状態に
  const [isLoading, setIsLoading] = useState(false);
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
    // ページ遷移開始時のローディング表示
    const handleStart = () => {
      setIsLoading(true);
    };

    const handleStop = () => {
      // 1秒後にローディング画面を非表示
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    };

    // pathname と searchParams が変わったらローディング表示
    handleStart();
    handleStop();

    // ページ遷移時にサイドバーを閉じる
    setSidebarOpen(false);
  }, [pathname, searchParams]);

  return (
    <div className={`${styles.layoutWithSidebar} layout-with-sidebar`}>
      {isLoading && <Loading />}
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
