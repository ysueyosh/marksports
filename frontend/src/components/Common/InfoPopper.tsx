'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './InfoPopper.module.css';

interface InfoPopperProps {
  content: string;
}

export default function InfoPopper({ content }: InfoPopperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <span className={styles.popperContainer}>
      <button
        ref={buttonRef}
        className={styles.iconButton}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        type="button"
        aria-label="情報"
      >
        ⓘ
      </button>
      {isOpen && (
        <div ref={popperRef} className={styles.popover}>
          {content}
        </div>
      )}
    </span>
  );
}
