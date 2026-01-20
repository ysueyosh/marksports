/**
 * Orders API
 */

import { apiClient } from './client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusLabel: string;
  totalAmount: number;
  itemCount: number;
  items: OrderItem[];
  cancelRequestSent?: boolean;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  statusLabel: string;
  deliveryDate?: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    postalCode: string;
    prefecture: string;
    address: string;
    building?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    postalCode: string;
    prefecture: string;
    address: string;
    building?: string;
  };
  paymentMethod: {
    type: string;
    lastFourDigits: string;
    cardType: string;
  };
  cancelRequestSent?: boolean;
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data?: {
    orders: Order[];
    total: number;
  };
}

export interface GetOrderDetailResponse {
  success: boolean;
  message: string;
  data?: OrderDetail;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data?: { orderId: string; status: string; cancelRequestSent: boolean };
}

/**
 * Get user's orders list
 */
export async function getOrders(): Promise<GetOrdersResponse> {
  const response = await apiClient.get<GetOrdersResponse>('/orders');

  return response;
}

/**
 * Get order detail by order ID
 * @param orderId - Order ID
 */
export async function getOrderDetail(
  orderId: string
): Promise<GetOrderDetailResponse> {
  const response = await apiClient.get<GetOrderDetailResponse>(
    `/orders/${orderId}`
  );

  return response;
}

/**
 * Cancel order
 * @param orderId - Order ID
 * @param reason - Cancellation reason
 */
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<CancelOrderResponse> {
  const response = await apiClient.post<CancelOrderResponse>(
    `/orders/${orderId}/cancel`,
    { reason }
  );

  return response;
}
