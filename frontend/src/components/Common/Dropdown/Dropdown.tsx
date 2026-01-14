'use client';

import React, { useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

interface DropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  buttonText: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export default function Dropdown({
  isOpen,
  onToggle,
  onClose,
  buttonText,
  children,
  containerClassName,
}: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={containerClassName || styles.dropdownContainer}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={styles.dropdownButton}
        onClick={onToggle}
      >
        <span className={styles.dropdownButtonText}>{buttonText}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && <div className={styles.dropdownMenu}>{children}</div>}
    </div>
  );
}
