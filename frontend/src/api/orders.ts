/**
 * Orders API
 */

import { apiClient } from './client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  totalAmount?: number;
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
  isCancelRequest?: boolean;
  refundAt?: string;
}

export interface OrderItemData {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  size?: string;
  color?: string;
  selectedOptionChoiceName?: string;
}

export interface Address {
  name?: string;
  lastName?: string;
  firstName?: string;
  familyName?: string;
  givenName?: string;
  postalCode?: string;
  zip?: string;
  prefecture?: string;
  administrativeDistrictLevel1?: string;
  address?: string;
  addressLine1?: string;
  building?: string;
  addressLine2?: string;
  option?: string;
  phone?: string;
  email?: string;
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
  shippingBaseFee?: number;
  shippingRegionFee?: number;
  shippingRegionKey?: string;
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
  isCancelRequest?: boolean;
  cancelReason?: string;
  cancelRequestAt?: string;
  refundAt?: string;
  orderNote?: string;
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
  orderId: string,
): Promise<GetOrderDetailResponse> {
  const response = await apiClient.get<GetOrderDetailResponse>(
    `/orders/${orderId}`,
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
  reason: string,
): Promise<CancelOrderResponse> {
  const response = await apiClient.post<CancelOrderResponse>(
    `/orders/${orderId}/cancel`,
    { reason },
  );

  return response;
}

/**
 * Revoke cancel request
 * @param orderId - Order ID
 */
export async function revokeCancelRequest(
  orderId: string,
): Promise<CancelOrderResponse> {
  const response = await apiClient.post<CancelOrderResponse>(
    `/orders/${orderId}/cancel/revoke`,
    {},
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
  taxRate?: number;
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
  userEmail?: string;
  userName?: string;
  orderNote?: string;
  items: Array<{
    productId: string;
    productName?: string;
    quantity: number;
    amount: number;
    totalAmount: number;
    size?: string;
    color?: string;
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
  request: SaveOrderRequest,
): Promise<SaveOrderResponse> {
  try {
    const response = await apiClient.post<SaveOrderResponse>(
      '/orders',
      request,
    );
    return response;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
}
