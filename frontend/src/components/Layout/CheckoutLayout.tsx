'use client';

import React from 'react';
import { Box, Container } from '@mui/material';

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <Box minHeight="100vh" py={3} bgcolor="background.default">
      <Container maxWidth="md">{children}</Container>
    </Box>
  );
}
