import { apiClient } from './client';

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  amount: number;
  status: string;
  paymentMethod: string;
}

export interface GetPendingOrdersResponse {
  success: boolean;
  message?: string;
  data?: {
    orders: DashboardOrder[];
    count: number;
  };
}

export interface GetPaymentConfirmationResponse {
  success: boolean;
  message?: string;
  data?: {
    orders: DashboardOrder[];
    count: number;
  };
}

/**
 * Get pending orders (awaiting_shipment status) - Top 5
 */
export async function getPendingOrders(): Promise<GetPendingOrdersResponse> {
  try {
    const response = await apiClient.get<GetPendingOrdersResponse>(
      '/admin/dashboard/pending-orders',
    );
    return response;
  } catch (error) {
    console.error('Failed to get pending orders:', error);
    return {
      success: false,
      message: 'Failed to fetch pending orders',
    };
  }
}

/**
 * Get payment confirmation orders (unpaid with bank_transfer) - Top 5
 */
export async function getPaymentConfirmation(): Promise<GetPaymentConfirmationResponse> {
  try {
    const response = await apiClient.get<GetPaymentConfirmationResponse>(
      '/admin/dashboard/payment-confirmation',
    );
    return response;
  } catch (error) {
    console.error('Failed to get payment confirmation orders:', error);
    return {
      success: false,
      message: 'Failed to fetch payment confirmation orders',
    };
  }
}
