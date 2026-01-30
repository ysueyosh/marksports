import { ReactNode, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from '@mui/material';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  buttons: ReactNode;
  shouldScrollToTop?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  buttons,
  shouldScrollToTop = false,
}: AdminModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollToTop && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [shouldScrollToTop]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        {title}
      </DialogTitle>
      <DialogContent
        ref={contentRef}
        sx={{
          overflowY: 'auto',
          py: 2,
        }}
      >
        {children}
      </DialogContent>
      <DialogActions
        sx={{
          padding: '12px 16px',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {buttons}
      </DialogActions>
    </Dialog>
  );
}
