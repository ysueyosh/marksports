'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface SidebarContextType {
  expandedCategory: string | null;
  setExpandedCategory: (categoryId: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ expandedCategory, setExpandedCategory }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
