'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
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
      <Box
        onClick={handleClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick
            ? {
                '& .MuiCard-root': {
                  boxShadow: 3,
                },
              }
            : {},
        }}
      >
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
          <CardContent sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1 }}>
            {name && (
              <Typography
                variant="subtitle1"
                fontWeight={700}
                gutterBottom
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {name}
              </Typography>
            )}
            {price != null && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {formatPriceIncludedTax(price)}
              </Typography>
            )}
          </CardContent>
        )}
        {onClick && (
          <Box px={{ xs: 1, sm: 2 }} pb={{ xs: 1, sm: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: 'inline', sm: 'none' } }}
              >
                詳細
              </Box>
              <Box
                component="span"
                sx={{ display: { xs: 'none', sm: 'inline' } }}
              >
                詳細を見る
              </Box>
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );

  // Link でラップされている場合と、そうでない場合の両方に対応
  if (onClick) {
    return content;
  }

  return <Link href={`/product/detail?id=${id}`}>{content}</Link>;
}
