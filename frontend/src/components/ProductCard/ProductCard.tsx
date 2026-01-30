'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { formatPriceIncludedTax } from '@/utils/price';

interface ProductCardProps {
  id: number | string;
  name?: string;
  price?: number;
  showDetails?: boolean;
  onClick?: () => void;
  image?: string;
}

export default function ProductCard({
  id,
  name,
  price,
  showDetails = true,
  onClick,
  image,
}: ProductCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const content = (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <Box sx={{ position: 'relative', width: '100%', pt: '75%' }}>
          {image ? (
            <Image
              src={image}
              alt={name || '商品画像'}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'grey.500',
              }}
            >
              画像なし
            </Box>
          )}
        </Box>
        {showDetails && (
          <CardContent>
            {name && (
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {name}
              </Typography>
            )}
            {price != null && (
              <Typography variant="body2" color="text.secondary">
                {formatPriceIncludedTax(price)}
              </Typography>
            )}
          </CardContent>
        )}
        {onClick && (
          <Box px={2} pb={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              詳細を見る
            </Button>
          </Box>
        )}
      </CardActionArea>
    </Card>
  );

  // Link でラップされている場合と、そうでない場合の両方に対応
  if (onClick) {
    return content;
  }

  return <Link href={`/product/detail?id=${id}`}>{content}</Link>;
}
