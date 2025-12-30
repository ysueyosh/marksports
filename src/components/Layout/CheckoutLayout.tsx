'use client';

import React from 'react';
import Header from '@/components/Header/Header';
import styles from './CheckoutLayout.module.css';

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className={`${styles.layoutNoSidebar} layout-no-sidebar`}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
