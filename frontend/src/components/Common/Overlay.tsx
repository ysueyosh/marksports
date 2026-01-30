'use client';

import React from 'react';
import { Backdrop } from '@mui/material';

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

  const resolvedZIndex =
    zIndex === 'custom'
      ? customZIndex
      : zIndex === 'notification'
        ? 1999
        : zIndex === 'sidebar'
          ? 1200
          : 1300;

  return (
    <Backdrop
      open
      onClick={onClick}
      sx={{ zIndex: resolvedZIndex, bgcolor: 'rgba(0,0,0,0.3)' }}
    />
  );
}
