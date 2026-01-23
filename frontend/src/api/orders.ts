/**
 * Orders API
 */

import { apiClient } from './client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  tax: number;
  shippingCost: number;
  items?: OrderItem[];
  cancelRequestSent?: boolean;
}

export interface OrderItemData {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Address {
  lastName?: string;
  firstName?: string;
  postalCode?: string;
  prefecture?: string;
  address?: string;
  building?: string;
  phone?: string;
}

export interface PaymentMethod {
  cardType?: string;
  lastFourDigits?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod; // 修正: string から PaymentMethod に変更
  paymentBrand?: string;
  last4?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  items: OrderItemData[];
  paymentAt?: string;
  deliveryAt?: string;
  cancelRequestSent?: boolean;
  statusLabel?: string;
  subtotal?: number;
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

/**
 * Save order after payment completion
 */
export interface SaveOrderRequest {
  orderId?: string;
  orderNumber?: string;
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  couponDiscount?: number;
  shippingAddress?: Record<string, any>;
  billingAddress?: Record<string, any>;
  paymentMethod: string;
  paymentBrand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  squareTransactionId?: string;
  status?: string;
  items: Array<{
    productId: string;
    quantity: number;
    amount: number;
    totalAmount: number;
  }>;
}

export interface SaveOrderResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    orderNumber: string;
    itemCount: number;
  };
}

export async function saveOrder(
  request: SaveOrderRequest
): Promise<SaveOrderResponse> {
  try {
    const response = await apiClient.post<SaveOrderResponse>(
      '/orders',
      request
    );
    return response;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}
