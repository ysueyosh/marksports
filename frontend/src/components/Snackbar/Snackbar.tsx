'use client';

import { Snackbar as MuiSnackbar, Alert } from '@mui/material';

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
  return (
    <MuiSnackbar
      open
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
}
