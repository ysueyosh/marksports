import { apiClient } from './client';

export interface AdminOrder {
  id: string;
  userId: string;
  orderNumber: string;
  orderDate: string;
  status:
    | 'unpaid'
    | 'awaiting_shipment'
    | 'in_transit'
    | 'delivered'
    | 'cancelled_customer'
    | 'cancelled_internal';
  totalAmount: number;
  shippingAddress?: Record<string, any>;
  isCancelRequest?: boolean;
  refundAt?: string;
}

export interface GetAllOrdersResponse {
  success: boolean;
  data?: AdminOrder[];
  message?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status:
    | 'unpaid'
    | 'awaiting_shipment'
    | 'in_transit'
    | 'delivered'
    | 'cancelled_customer'
    | 'cancelled_internal';
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
  };
  message?: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  status:
    | 'unpaid'
    | 'awaiting_shipment'
    | 'in_transit'
    | 'delivered'
    | 'cancelled_customer'
    | 'cancelled_internal';
  totalAmount: number;
  tax: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  paymentMethod: any;
  paymentBrand?: string;
  last4?: string;
  shippingAddress?: any;
  billingAddress?: any;
  items: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    size?: string;
    color?: string;
    selectedOptionChoiceName?: string;
  }>;
  paymentAt?: string;
  deliveryAt?: string;
  cancelRequestSent?: boolean;
  statusLabel?: string;
  subtotal?: number;
  isCancelRequest?: boolean;
  cancelReason?: string;
  cancelRequestAt?: string;
  refundAt?: string;
}

export interface GetAdminOrderDetailResponse {
  success: boolean;
  message: string;
  data?: AdminOrderDetail;
}

export interface ManualRefundRequest {
  orderId: string;
}

export interface ManualRefundResponse {
  success: boolean;
  data?: {
    orderId: string;
    refundAt: string;
  };
  message?: string;
}

export async function getAllOrders(
  orderNumber?: string,
  status?: string,
): Promise<GetAllOrdersResponse> {
  try {
    const params = new URLSearchParams();
    if (orderNumber) params.append('orderNumber', orderNumber);
    if (status && status !== 'all') params.append('status', status);

    const query = params.toString();
    const url = query ? `/admin/orders?${query}` : '/admin/orders';
    const response = await apiClient.get<GetAllOrdersResponse>(url);
    return response;
  } catch (error) {
    console.error('Failed to get all orders:', error);
    return {
      success: false,
      message: 'Failed to fetch orders',
    };
  }
}

export async function updateOrderStatus(
  data: UpdateOrderStatusRequest,
): Promise<UpdateOrderStatusResponse> {
  try {
    const response = await apiClient.post<UpdateOrderStatusResponse>(
      '/admin/orders/status',
      data,
    );
    return response;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return {
      success: false,
      message: 'Failed to update order status',
    };
  }
}

export async function getAdminOrderDetail(
  orderId: string,
): Promise<GetAdminOrderDetailResponse> {
  try {
    const response = await apiClient.get<GetAdminOrderDetailResponse>(
      `/admin/orders/${orderId}`,
    );
    return response;
  } catch (error) {
    console.error('Failed to get admin order detail:', error);
    return {
      success: false,
      message: 'Failed to fetch order detail',
    };
  }
}

export async function manualRefund(
  data: ManualRefundRequest,
): Promise<ManualRefundResponse> {
  try {
    const response = await apiClient.post<ManualRefundResponse>(
      '/admin/orders/manual-refund',
      data,
    );
    return response;
  } catch (error) {
    console.error('Failed to process manual refund:', error);
    return {
      success: false,
      message: 'Failed to process manual refund',
    };
  }
}
