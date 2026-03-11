/**
 * Admin coupon management API client
 */

import { apiClient } from './client';

export interface CouponCreateRequest {
  couponCode: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CouponUpdateRequest {
  couponCode?: string;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface Coupon {
  PK: string;
  SK: string;
  couponId: string;
  couponCode: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCouponResponse {
  success: boolean;
  message: string;
  data?:
    | Coupon
    | {
        coupons: Coupon[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
}

export const adminCouponAPI = {
  /**
   * Create a new coupon
   */
  async createCoupon(
    request: CouponCreateRequest,
  ): Promise<AdminCouponResponse> {
    return apiClient.post<AdminCouponResponse>('/admin/coupons', request);
  },

  /**
   * Get all coupons with pagination
   */
  async getAllCoupons(
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminCouponResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiClient.get<AdminCouponResponse>(
      `/admin/coupons?${params.toString()}`,
    );
  },

  /**
   * Update a coupon
   */
  async updateCoupon(
    couponId: string,
    request: CouponUpdateRequest,
  ): Promise<AdminCouponResponse> {
    return apiClient.put<AdminCouponResponse>(
      `/admin/coupons/${couponId}`,
      request,
    );
  },

  /**
   * Delete a coupon
   */
  async deleteCoupon(couponId: string): Promise<AdminCouponResponse> {
    return apiClient.delete<AdminCouponResponse>(`/admin/coupons/${couponId}`);
  },
};
