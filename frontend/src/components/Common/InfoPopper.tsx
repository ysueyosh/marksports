'use client';

import { useRef, useState, useEffect } from 'react';

import { IconButton, Popover, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface InfoPopperProps {
  content: string;
}

export default function InfoPopper({ content }: InfoPopperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);

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
    <>
      <IconButton
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        size="small"
        aria-label="情報"
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <Popover
        open={isOpen}
        anchorEl={buttonRef.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, maxWidth: 280 } }}
      >
        <Typography variant="body2">{content}</Typography>
      </Popover>
    </>
  );
}
