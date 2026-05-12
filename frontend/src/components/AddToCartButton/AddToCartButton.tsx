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
  selectedOptionChoiceId?: string;
  selectedOptionChoiceName?: string;
  additionalPrice?: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  disabled?: boolean;
}

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  size,
  color,
  selectedOptionChoiceId,
  selectedOptionChoiceName,
  additionalPrice,
  minQuantity,
  maxQuantity,
  disabled: externalDisabled,
}: Props) {
  const min = minQuantity ?? 1;
  const max = maxQuantity ?? 9999;
  const [qty, setQty] = useState(min);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  const { show: showSnackbar } = useSnackbar();

  const increase = () => setQty((q) => Math.min(max, q + 1));
  const decrease = () => setQty((q) => Math.max(min, q - 1));

  const handleQtyChange = (val: number) => {
    const clamped = Math.min(max, Math.max(min, val || min));
    setQty(clamped);
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await checkProductExists(id);
      if (!response.success || !response.data?.exists) {
        showSnackbar('商品が見つかりません', 'error');
        return;
      }

      await addItem(String(id), qty, size, color, selectedOptionChoiceId, selectedOptionChoiceName, additionalPrice);
      setQty(min);
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
        数量{minQuantity != null || maxQuantity != null ? `（${min}〜${max === 9999 ? '無制限' : max}）` : ''}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={decrease} disabled={isLoading || qty <= min}>
          <RemoveIcon />
        </IconButton>
        <TextField
          type="number"
          value={qty}
          onChange={(e) => handleQtyChange(Number(e.target.value) || min)}
          size="small"
          inputProps={{ min, max }}
          sx={{ width: 80 }}
          disabled={isLoading}
        />
        <IconButton onClick={increase} disabled={isLoading || qty >= max}>
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
