'use client';

import React from 'react';
import styles from './Overlay.module.css';

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
  zIndex?: 'sidebar' | 'notification' | 'modal' | 'custom';
  customZIndex?: number;
}

export default function Overlay({
  isOpen,
  onClick,
  zIndex = 'modal',
  customZIndex,
}: OverlayProps) {
  if (!isOpen) return null;

  const overlayClass = `${styles.overlay} ${styles[`overlay-${zIndex}`]}`;

  return (
    <div
      className={overlayClass}
      onClick={onClick}
      style={
        zIndex === 'custom' && customZIndex
          ? { zIndex: customZIndex }
          : undefined
      }
    />
  );
}
