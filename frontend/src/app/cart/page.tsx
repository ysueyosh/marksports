'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { useCart, CartItem } from '@/context/CartContext';
import { useSnackbar } from '@/context/SnackbarContext';
import { formatPriceIncludedTax, getPriceWithTax } from '@/utils/price';
import { checkProductsExist } from '@/api/products';
import { applyCoupon } from '@/api/coupon';
import { estimateShipping } from '@/api/shipping';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  IconButton,
  TextField,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export default function CartPage() {
  const FREE_SHIPPING_THRESHOLD = 4000;
  const toBaseProductId = (itemId: string | number): string =>
    String(itemId).split('|')[0];
  const router = useRouter();
  const {
    items: cartItems,
    removeItem,
    updateQuantity,
    coupon,
    setCoupon,
    fetchCart,
  } = useCart();
  const { show: showSnackbar } = useSnackbar();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deletedProductsList, setDeletedProductsList] = useState<CartItem[]>(
    [],
  );
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [shipping, setShipping] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleRemoveItem = (id: string | number) => {
    removeItem(String(id));
  };

  const handleIncrease = (id: string | number, current: number, maxQuantity?: number | null) => {
    const max = maxQuantity ?? 9999;
    if (current >= max) return;
    updateQuantity(String(id), current + 1);
  };

  const handleDecrease = (id: string | number, current: number, minQuantity?: number | null) => {
    const min = minQuantity ?? 1;
    const next = Math.max(min, current - 1);
    updateQuantity(String(id), next);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);
    try {
      const baseProductIds = cartItems.map((item) => toBaseProductId(item.id));
      const response = await checkProductsExist(
        Array.from(new Set(baseProductIds)),
      );

      if (!response.success || !response.data?.results) {
        showSnackbar('商品確認に失敗しました', 'error');
        return;
      }

      const deletedProducts: CartItem[] = [];
      cartItems.forEach((item) => {
        const baseProductId = toBaseProductId(item.id);
        if (!response.data?.results[baseProductId]) {
          deletedProducts.push(item);
          removeItem(String(item.id));
        }
      });

      if (deletedProducts.length > 0) {
        setDeletedProductsList(deletedProducts);
        showSnackbar(
          `${deletedProducts.length}個の商品が削除されています`,
          'warning',
        );
        return;
      }

      router.push('/checkout');
    } catch (error) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('クーポンコードを入力してください');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      // バックエンドに送信する subtotal は税抜き金額
      const subtotalBeforeTax = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const response = await applyCoupon(couponCode.trim(), subtotalBeforeTax);
      if (response.success && response.data) {
        setCoupon({
          code: response.data.coupon_code,
          description: response.data.coupon_description,
          discount_type: response.data.discount_type,
          discount_value: response.data.discount_value,
          max_discount_amount: response.data.max_discount_amount,
          min_order_amount: response.data.min_order_amount,
        });
        setCouponCode('');
        showSnackbar('クーポンを適用しました', 'success');
      } else {
        setCouponError(response.message || 'クーポンコードが無効です');
      }
    } catch (error) {
      setCouponError('クーポン適用に失敗しました');
      console.error('Coupon error:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const subtotalExcludingTax = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotalWithTax = cartItems.reduce(
    (sum, item) => sum + getPriceWithTax(item.price) * item.quantity,
    0,
  );

  useEffect(() => {
    const estimateBaseShipping = async () => {
      if (cartItems.length === 0) {
        setShipping(0);
        return;
      }

      try {
        setIsCalculatingShipping(true);
        const response = await estimateShipping({
          items: cartItems.map((item) => ({
            productId: toBaseProductId(item.id),
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          shippingAddress: {},
        });

        if (response.success && response.data) {
          setShipping(response.data.shippingCost ?? 0);
        } else {
          setShipping(subtotalExcludingTax >= 4000 ? 0 : 500);
        }
      } catch (shippingError) {
        console.error('Shipping estimate error:', shippingError);
        setShipping(subtotalExcludingTax >= 4000 ? 0 : 500);
      } finally {
        setIsCalculatingShipping(false);
      }
    };

    estimateBaseShipping();
  }, [cartItems, subtotalExcludingTax]);

  const tax = subtotalWithTax - subtotalExcludingTax;
  const discountAmount = coupon
    ? coupon.discount_type === 'percentage'
      ? Math.floor((subtotalWithTax * coupon.discount_value) / 100)
      : coupon.discount_value
    : 0;
  const total = subtotalWithTax + shipping - discountAmount;

  return (
    <MainLayout>
      <Box>
        <Stack spacing={3}>
          <Typography variant="h4" fontWeight={700}>
            ショッピングカート
          </Typography>

          {subtotalWithTax >= FREE_SHIPPING_THRESHOLD ? (
            <Alert severity="success">
              4,000円以上のため基本送料無料です（地域別配送料は別途かかります）。
            </Alert>
          ) : (
            <Alert severity="info">
              あと¥
              {(FREE_SHIPPING_THRESHOLD - subtotalWithTax).toLocaleString()}
              で基本送料無料です（地域別配送料は別途かかります）。
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3,
            }}
          >
            <Box>
              {deletedProductsList.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography fontWeight={700} mb={1}>
                    ⚠️ 商品が削除されています
                  </Typography>
                  <List dense>
                    {deletedProductsList.map((product) => (
                      <ListItem key={product.id} disableGutters>
                        <ListItemText
                          primary={product.name}
                          secondary={`¥${getPriceWithTax(product.price).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {cartItems.length === 0 ? (
                <Paper sx={{ p: 3 }}>
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Typography color="text.secondary">
                      カートに商品がありません
                    </Typography>
                    <Button variant="contained" component={Link} href="/">
                      ショッピングを続ける
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {cartItems.map((item: CartItem) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack
                        direction={{ xs: 'row', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'center', sm: 'center' }}
                        sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
                      >
                        <Box
                          component={Link}
                          href={`/product/detail?id=${item.id}`}
                          sx={{
                            width: { xs: 96, sm: 120 },
                            height: { xs: 96, sm: 120 },
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              height="100%"
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                No Image
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box
                          flex={1}
                          sx={{
                            minWidth: 0,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          <Typography
                            component={Link}
                            href={`/product/detail?id=${item.id}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                            fontWeight={700}
                          >
                            {item.name}
                          </Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            {formatPriceIncludedTax(item.price)}
                          </Typography>
                          {(item.size || item.color || item.selectedOptionChoiceName || item.paymentMethodRestriction) && (
                            <Stack
                              direction="row"
                              spacing={0.75}
                              useFlexGap
                              flexWrap="wrap"
                              sx={{ mt: 0.75 }}
                            >
                              {item.size && (
                                <Chip
                                  label={`サイズ: ${item.size}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {item.color && (
                                <Chip
                                  label={`カラー: ${item.color}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {item.selectedOptionChoiceName && (
                                <Chip
                                  label={item.selectedOptionChoiceName}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                              {item.paymentMethodRestriction && (
                                <Chip
                                  label={`支払制限: ${
                                    item.paymentMethodRestriction === 'bank_transfer' ? '口座振替のみ' :
                                    item.paymentMethodRestriction === 'credit_card' ? 'クレジットカードのみ' :
                                    item.paymentMethodRestriction === 'apple_pay' ? 'Apple Payのみ' :
                                    item.paymentMethodRestriction === 'google_pay' ? 'Google Payのみ' :
                                    item.paymentMethodRestriction
                                  }`}
                                  size="small"
                                  color="warning"
                                />
                              )}
                            </Stack>
                          )}
                        </Box>

                        <Stack
                          direction="column"
                          spacing={1}
                          alignItems="center"
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                              p: 0.5,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDecrease(item.id, item.quantity, item.minQuantity)
                              }
                              disabled={item.quantity <= (item.minQuantity ?? 1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography
                              sx={{ minWidth: '2ch', textAlign: 'center' }}
                            >
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleIncrease(item.id, item.quantity, item.maxQuantity)
                              }
                              disabled={item.maxQuantity != null && item.quantity >= item.maxQuantity}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            削除
                          </Button>
                        </Stack>
                      </Stack>

                      <Divider sx={{ my: 1 }} />

                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">
                          小計 ({item.quantity}個)
                        </Typography>
                        <Typography fontWeight={700}>
                          ¥
                          {(
                            getPriceWithTax(item.price) * item.quantity
                          ).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 3, height: 'fit-content' }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  注文概要
                </Typography>

                <Divider />

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">小計</Typography>
                    <Typography>¥{subtotalWithTax.toLocaleString()}</Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    textAlign="right"
                  >
                    （内消費税 ¥{tax.toLocaleString()}）
                  </Typography>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">
                      送料（基本送料）
                    </Typography>
                    <Typography>
                      {isCalculatingShipping
                        ? '計算中...'
                        : `¥${shipping.toLocaleString()}`}
                    </Typography>
                  </Stack>
                  {coupon && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">
                        クーポン割引
                      </Typography>
                      <Typography color="error" fontWeight={700}>
                        -¥{discountAmount.toLocaleString()}
                      </Typography>
                    </Stack>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={700}>合計</Typography>
                    <Typography fontWeight={700} fontSize="1.25rem">
                      ¥{total.toLocaleString()}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      クーポンコード
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="コードを入力"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                      }}
                      disabled={coupon !== null}
                    />
                  </Box>

                  {!coupon && (
                    <Button
                      variant="outlined"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      {isApplyingCoupon ? '確認中...' : '適用する'}
                    </Button>
                  )}

                  {couponError && (
                    <Alert severity="error" sx={{ fontSize: '0.875rem' }}>
                      {couponError}
                    </Alert>
                  )}

                  {coupon && (
                    <Alert severity="success">
                      <Stack spacing={1}>
                        <Typography>{coupon.description}</Typography>
                        <Button
                          size="small"
                          onClick={() => {
                            setCoupon(null);
                            setCouponCode('');
                            setCouponError('');
                          }}
                        >
                          クーポンを削除
                        </Button>
                      </Stack>
                    </Alert>
                  )}
                </Stack>

                <Stack spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0 || isCheckingOut}
                  >
                    {isCheckingOut ? '確認中...' : 'レジへ進む'}
                  </Button>
                  <Button variant="outlined" onClick={() => router.push('/')}>
                    買い物を続ける
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </MainLayout>
  );
}
