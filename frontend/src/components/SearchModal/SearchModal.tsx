'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Stack,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCategories } from '@/api/categories';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (searchQuery) {
      params.append('q', searchQuery);
    }

    if (selectedCategories.length > 0) {
      params.append('categories', selectedCategories.join(','));
    }

    const url = `/search?${params.toString()}`;
    router.push(url);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setExpandedCategories(new Set());
    onClose();
  };

  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId),
      );
    }
  };

  const isParentCategorySelected = (category: any) => {
    return category.subcategories?.every((sub: any) =>
      selectedCategories.includes(sub.id),
    );
  };

  const isParentCategoryIndeterminate = (category: any) => {
    const selectedCount = category.subcategories?.filter((sub: any) =>
      selectedCategories.includes(sub.id),
    ).length;
    return (
      selectedCount && selectedCount > 0 && !isParentCategorySelected(category)
    );
  };

  const handleParentCategoryChange = (category: any, checked: boolean) => {
    const subcategoryIds =
      category.subcategories?.map((sub: any) => sub.id) || [];

    if (checked) {
      setSelectedCategories([
        ...new Set([...selectedCategories, ...subcategoryIds]),
      ]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((id) => !subcategoryIds.includes(id)),
      );
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
      <DialogTitle>商品を検索</DialogTitle>
      <Box component="form" onSubmit={handleSearch}>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <TextField
            label="キーワード検索"
            placeholder="商品名を入力..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              カテゴリ
            </Typography>
            <Stack spacing={1}>
              {categories.map((category) => (
                <Accordion
                  key={category.id}
                  expanded={expandedCategories.has(category.id)}
                  onChange={() => toggleCategoryExpand(category.id)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <FormControlLabel
                      onClick={(event) => event.stopPropagation()}
                      onFocus={(event) => event.stopPropagation()}
                      control={
                        <Checkbox
                          checked={isParentCategorySelected(category)}
                          indeterminate={isParentCategoryIndeterminate(
                            category,
                          )}
                          onChange={(e) =>
                            handleParentCategoryChange(
                              category,
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label={category.name}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {category.subcategories?.map((subcategory: any) => (
                        <FormControlLabel
                          key={subcategory.id}
                          control={
                            <Checkbox
                              checked={selectedCategories.includes(
                                subcategory.id,
                              )}
                              onChange={(e) =>
                                handleCategoryChange(
                                  subcategory.id,
                                  e.target.checked,
                                )
                              }
                            />
                          }
                          label={subcategory.name}
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal}>キャンセル</Button>
          <Button type="submit" variant="contained">
            検索
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
