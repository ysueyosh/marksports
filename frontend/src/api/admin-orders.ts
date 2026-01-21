import { apiClient } from './client';

export interface AdminOrder {
  id: string;
  userId: string;
  orderNumber: string;
  orderDate: string;
  status: 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered';
  totalAmount: number;
  shippingAddress?: Record<string, any>;
}

export interface GetAllOrdersResponse {
  success: boolean;
  data?: AdminOrder[];
  message?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: 'unpaid' | 'awaiting_shipment' | 'in_transit' | 'delivered';
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
  };
  message?: string;
}

export async function getAllOrders(
  sortBy: 'status' | 'date' | 'amount' = 'status'
): Promise<GetAllOrdersResponse> {
  try {
    const response = await apiClient.get<GetAllOrdersResponse>(
      `/admin/orders?sortBy=${sortBy}`
    );
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
  data: UpdateOrderStatusRequest
): Promise<UpdateOrderStatusResponse> {
  try {
    const response = await apiClient.post<UpdateOrderStatusResponse>(
      '/admin/orders/status',
      data
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
