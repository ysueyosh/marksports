'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';

interface AdminHeaderProps {
  onMenuClick: () => void;
  isLargeScreen: boolean;
}

export default function AdminHeader({
  onMenuClick,
  isLargeScreen,
}: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminLogged');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminTokens');
    router.push('/admin/login');
  };

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          aria-label="メニューを開く"
          sx={{ display: isLargeScreen ? 'none' : 'inline-flex' }}
        >
          <MenuIcon />
        </IconButton>
        <Button
          color="inherit"
          onClick={() => router.push('/admin/home')}
          sx={{ textTransform: 'none' }}
        >
          <Typography variant="h6" fontWeight={700}>
            MS Admin
          </Typography>
        </Button>
        <Box flex={1} />
        <IconButton
          color="inherit"
          component={Link}
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="サイトへ"
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <OpenInNewIcon />
        </IconButton>
        <Button
          color="inherit"
          component={Link}
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon />}
          variant="outlined"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          サイトへ
        </Button>
        <IconButton
          color="inherit"
          onClick={handleLogout}
          aria-label="ログアウト"
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <LogoutIcon />
        </IconButton>
        <Button
          color="inherit"
          onClick={handleLogout}
          endIcon={<LogoutIcon />}
          variant="outlined"
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          ログアウト
        </Button>
      </Toolbar>
    </AppBar>
  );
}
