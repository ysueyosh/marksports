'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar, { SnackbarType } from '@/components/Snackbar/Snackbar';

interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
}

interface SnackbarContextType {
  show: (message: string, type?: SnackbarType, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const show = (
    message: string,
    type: SnackbarType = 'info',
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSnackbar: SnackbarMessage = { id, message, type };

    setSnackbars((prev) => [...prev, newSnackbar]);

    // 自動削除
    setTimeout(() => {
      setSnackbars((prev) => prev.filter((s) => s.id !== id));
    }, duration);
  };

  const removeSnackbar = (id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <div>
        {snackbars.map((snackbar) => (
          <Snackbar
            key={snackbar.id}
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => removeSnackbar(snackbar.id)}
          />
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}
