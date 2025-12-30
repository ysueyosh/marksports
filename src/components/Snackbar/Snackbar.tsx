'use client';

import { useEffect } from 'react';
import styles from './Snackbar.module.css';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarProps {
  message: string;
  type?: SnackbarType;
  onClose: () => void;
  duration?: number;
}

export default function Snackbar({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`${styles.snackbar} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
