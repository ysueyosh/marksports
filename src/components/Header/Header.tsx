'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import LoginModal from '@/components/LoginModal/LoginModal';
import NotificationPopup from '@/components/NotificationPopup/NotificationPopup';
import SearchModal from '@/components/SearchModal/SearchModal';
import { DUMMY_NOTIFICATIONS } from '@/data/notifications';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notificationPopupOpen, setNotificationPopupOpen] = useState(false);
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { items } = useCart();

  const handleCartClick = () => {
    router.push('/cart');
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      router.push('/account');
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Menu Icon (Mobile) */}
        <button
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="メニュー"
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

        {/* Site Name */}
        <Link href="/" className={styles.siteName}>
          <h1>Mark Sports</h1>
        </Link>

        {/* Icons */}
        <div className={styles.icons}>
          {/* Search Icon */}
          <button
            className={styles.iconButton}
            aria-label="検索"
            onClick={() => setSearchModalOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Cart Icon */}
          <button
            className={styles.iconButton}
            aria-label="カート"
            onClick={handleCartClick}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {items.length > 0 && (
              <span className={styles.cartBadge}>{items.length}</span>
            )}
          </button>

          {/* Notification Icon */}
          <button
            className={styles.iconButton}
            aria-label="お知らせ"
            onClick={() => setNotificationPopupOpen(!notificationPopupOpen)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {DUMMY_NOTIFICATIONS.length > 0 && (
              <span className={styles.notificationBadge}>
                {DUMMY_NOTIFICATIONS.length}
              </span>
            )}
          </button>

          {/* Account Icon or Avatar */}
          <button
            className={styles.iconButton}
            aria-label="アカウント"
            onClick={handleAccountClick}
          >
            {isLoggedIn && user ? (
              <div className={styles.avatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <NotificationPopup
        isOpen={notificationPopupOpen}
        notifications={DUMMY_NOTIFICATIONS}
        onClose={() => setNotificationPopupOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </header>
  );
}
