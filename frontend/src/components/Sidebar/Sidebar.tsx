'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { categories } = useCategories();
  const { expandedCategory, setExpandedCategory } = useSidebar();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleCategoryNameClick = (
    categoryId: string,
    subcategories: any[],
  ) => {
    // 大カテゴリを展開状態にする
    setExpandedCategory(categoryId);

    // 大カテゴリのすべての小カテゴリで検索ページに遷移
    const categoriesParams = subcategories
      .map((sub) => sub.id)
      .join('&categories=');
    router.push(`/search?categories=${categoriesParams}`);

    // モバイル時はサイドバーを閉じる
    if (onClose && !isLargeScreen) {
      onClose();
    }
  };

  const handleChevronClick = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    toggleCategory(categoryId);
  };

  const isActive = (subcategoryId: string) => {
    const categories = searchParams.getAll('categories');
    return categories.includes(subcategoryId);
  };

  return (
    <Drawer
      open={isLargeScreen ? true : isOpen}
      onClose={onClose}
      variant={isLargeScreen ? 'permanent' : 'temporary'}
      ModalProps={{ keepMounted: isLargeScreen }}
      PaperProps={{
        sx: {
          width: 280,
          position: 'fixed',
          top: isLargeScreen ? 65 : 0,
          left: 0,
          height: isLargeScreen ? 'calc(100vh - 65px)' : '100vh',
          borderRight: '1px solid',
          borderRightColor: 'divider',
          boxShadow: isLargeScreen ? 'none' : 3,
        },
      }}
      sx={{
        '& .MuiDrawer-paper': {
          p: 2,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        {!isLargeScreen && (
          <IconButton onClick={onClose} aria-label="サイドバーを閉じる">
            <ChevronLeftIcon />
          </IconButton>
        )}
        <Typography variant="h6" fontWeight={700}>
          カテゴリー
        </Typography>
      </Box>

      <List dense>
        {categories.map((category) => (
          <Box key={category.id}>
            <ListItemButton
              onClick={() =>
                handleCategoryNameClick(category.id, category.subcategories)
              }
            >
              <ListItemText primary={category.name} />
              <IconButton
                size="small"
                onClick={(e) => handleChevronClick(e, category.id)}
                aria-label={`${category.name}を${
                  expandedCategory === category.id ? '縮小' : '展開'
                }`}
              >
                {expandedCategory === category.id ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </ListItemButton>

            <Collapse in={expandedCategory === category.id} timeout="auto">
              <List component="div" disablePadding>
                {category.subcategories.map((sub) => (
                  <ListItemButton
                    key={sub.id}
                    component={Link}
                    href={`/search?categories=${sub.id}`}
                    selected={isActive(sub.id)}
                    sx={{ pl: 4 }}
                    onClick={() => {
                      if (onClose) {
                        onClose();
                      }
                    }}
                  >
                    <ListItemText primary={sub.name} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Drawer>
  );
}
