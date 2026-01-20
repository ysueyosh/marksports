/**
 * Coupon API
 */

import { apiClient } from './client';

export interface ApplyCouponResponse {
  success: boolean;
  message: string;
  data?: {
    coupon_code: string;
    coupon_description: string;
    discount_type: 'percentage' | 'amount';
    discount_value: number;
    discount_amount: number;
    max_discount_amount?: number;
    min_order_amount?: number;
  };
}

export async function applyCoupon(
  couponCode: string,
  subtotal: number
): Promise<ApplyCouponResponse> {
  return apiClient.post<ApplyCouponResponse>('/apply-coupon', {
    coupon_code: couponCode,
    subtotal: subtotal,
  });
}
