'use client';

import { useState } from 'react';
import {
  Stack,
  Typography,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from '@/context/CartContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { checkProductExists } from '@/api/products';

interface Props {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  size,
  color,
  disabled: externalDisabled,
}: Props) {
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  const { show: showSnackbar } = useSnackbar();

  const increase = () => setQty((q) => q + 1);
  const decrease = () => setQty((q) => Math.max(1, q - 1));

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      // 商品が存在するか確認
      const response = await checkProductExists(id);
      if (!response.success || !response.data?.exists) {
        showSnackbar('商品が見つかりません', 'error');
        return;
      }

      // API経由でカートに商品を追加
      await addItem(String(id), qty, size, color);
      setQty(1); // Reset quantity
    } catch (err) {
      console.error('Failed to add to cart:', err);
      showSnackbar('カートに追加できませんでした', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="subtitle2" color="text.secondary">
        数量
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={decrease} disabled={isLoading}>
          <RemoveIcon />
        </IconButton>
        <TextField
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          size="small"
          inputProps={{ min: 1 }}
          sx={{ width: 80 }}
          disabled={isLoading}
        />
        <IconButton onClick={increase} disabled={isLoading}>
          <AddIcon />
        </IconButton>
      </Stack>

      <Button
        variant="contained"
        onClick={handleAddToCart}
        disabled={isLoading || externalDisabled}
      >
        {isLoading ? 'チェック中...' : 'カートに追加'}
      </Button>
    </Stack>
  );
}
