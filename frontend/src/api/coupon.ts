/**
 * Coupon API
 */

import { apiRequest } from './client';

export interface ApplyCouponResponse {
  success: boolean;
  message: string;
  data?: {
    coupon_code: string;
    coupon_description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_amount: number;
  };
}

export async function applyCoupon(
  couponCode: string,
  subtotal: number
): Promise<ApplyCouponResponse> {
  return apiRequest<ApplyCouponResponse>('/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({
      coupon_code: couponCode,
      subtotal: subtotal,
    }),
  });
}
