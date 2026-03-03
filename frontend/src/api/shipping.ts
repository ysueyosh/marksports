import { apiClient } from './client';

export interface ShippingEstimateRequest {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
  shippingAddress?: {
    prefecture?: string;
    administrativeDistrictLevel1?: string;
  };
}

export interface ShippingEstimateResponse {
  success: boolean;
  message: string;
  data?: {
    shippingCost: number;
    breakdown: {
      baseFee: number;
      regionFee: number;
      subtotal: number;
      freeShippingThreshold: number;
      isBaseFeeFree: boolean;
      baseFeeApplied: number;
      lines?: Array<{
        label: string;
        amount: number;
        description?: string;
      }>;
    };
    regionKey?:
      | 'hokkaido'
      | 'tohoku'
      | 'chubuKanto'
      | 'chugokuKansai'
      | 'kyushu'
      | 'okinawa';
  };
}

export interface ShippingPolicyResponse {
  success: boolean;
  message: string;
  data?: {
    baseFee: number;
    freeShippingThreshold: number;
    regionSurcharges: Array<{
      regionKey:
        | 'hokkaido'
        | 'tohoku'
        | 'chubuKanto'
        | 'chugokuKansai'
        | 'kyushu'
        | 'okinawa';
      regionLabel: string;
      fee: number;
    }>;
  };
}

export const estimateShipping = async (
  request: ShippingEstimateRequest,
): Promise<ShippingEstimateResponse> => {
  const response = await apiClient.post<ShippingEstimateResponse>(
    '/shipping/estimate',
    request,
  );
  return response as ShippingEstimateResponse;
};

export const getShippingPolicy = async (): Promise<ShippingPolicyResponse> => {
  const response =
    await apiClient.get<ShippingPolicyResponse>('/shipping/policy');
  return response as ShippingPolicyResponse;
};
