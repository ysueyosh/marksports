'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer/Footer';
import ImportantNotificationsBanner from '@/components/ImportantNotificationsBanner/ImportantNotificationsBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    // ページ遷移時にサイドバーを閉じる（モバイル時のみ）
    if (!isLargeScreen) {
      setSidebarOpen(false);
    }
  }, [pathname, searchParams, isLargeScreen]);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isLargeScreen={isLargeScreen}
      />

      {/* Sidebar - always rendered */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <Box
        component="main"
        flex={1}
        sx={{
          overflow: 'auto',
          marginLeft: isLargeScreen ? '280px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
          paddingTop: '10px',
          paddingLeft: { xs: '12px', md: '20px' },
          paddingRight: { xs: '12px', md: '20px' },
          paddingBottom: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Box mb={2}>
            <ImportantNotificationsBanner />
          </Box>
          {children}
        </Container>
      </Box>

      <Box
        sx={{
          marginLeft: isLargeScreen ? '280px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
}
