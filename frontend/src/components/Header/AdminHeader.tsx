'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminLogged');
    localStorage.removeItem('adminEmail');
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <button
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label="メニューを開く"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/admin/home')}
            className={styles.logo}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            MS Admin
          </button>
        </div>
        <div className={styles.headerActions}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.siteLink}
          >
            サイトへ
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.externalIcon}
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11-6 7 7" />
            </svg>
          </Link>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className={styles.logoutText}>ログアウト</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.logoutIcon}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 8 20 12 16 16" />
              <line x1="9" y1="12" x2="20" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
