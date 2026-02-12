'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNotificationContext } from '@/context/NotificationContext';
import LoginModal from '@/components/LoginModal/LoginModal';
import SearchModal from '@/components/SearchModal/SearchModal';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface HeaderProps {
  onMenuClick?: () => void;
  isLargeScreen?: boolean;
}

export default function Header({
  onMenuClick,
  isLargeScreen = false,
}: HeaderProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { items } = useCart();
  const { unreadCount } = useNotificationContext();

  // 延べ商品数を計算（すべての商品の合計数量）
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartClick = () => {
    router.push('/cart');
  };

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      router.push('/account');
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1 } }}>
        {!isLargeScreen && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            aria-label="メニュー"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box component={Link} href="/" sx={{ flexGrow: 1, color: 'inherit' }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            Mark Sports
          </Typography>
        </Box>

        <IconButton
          color="inherit"
          aria-label="検索"
          onClick={() => setSearchModalOpen(true)}
        >
          <SearchIcon />
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="カート"
          onClick={handleCartClick}
        >
          <Badge badgeContent={totalQuantity} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="お知らせ"
          onClick={handleNotificationClick}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="アカウント"
          onClick={handleAccountClick}
        >
          {isLoggedIn && user ? (
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <AccountCircleIcon />
          )}
        </IconButton>
      </Toolbar>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </AppBar>
  );
}
