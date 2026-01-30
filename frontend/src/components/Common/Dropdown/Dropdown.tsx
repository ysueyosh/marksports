'use client';

import React, { useRef } from 'react';
import { Button, Popover, Box } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <Box className={containerClassName}>
      <Button
        ref={anchorRef}
        variant="outlined"
        onClick={onToggle}
        endIcon={<ArrowDropDownIcon />}
        sx={{ justifyContent: 'space-between', width: '100%' }}
      >
        {buttonText}
      </Button>
      <Popover
        open={isOpen}
        onClose={onClose}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 260 } }}
      >
        {children}
      </Popover>
    </Box>
  );
}
