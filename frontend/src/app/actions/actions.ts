'use server';

import { randomUUID } from 'crypto';

export interface PaymentRequest {
  sourceId: string;
  amount: number;
  currency?: string;
  orderId?: string;
}

export interface PaymentResponse {
  id: string;
  status: string;
  receipt_number?: string;
  receipt_url?: string;
  [key: string]: any;
}

/**
 * Submit payment to backend API
 * Backend processes payment with Square API
 * This function makes a server-to-server call to the backend API
 */
export async function submitPayment(
  paymentRequest: PaymentRequest,
  authToken?: string
): Promise<PaymentResponse> {
  try {
    const { sourceId, amount, currency = 'JPY', orderId } = paymentRequest;

    console.log('=== submitPayment called ===');
    console.log('sourceId:', sourceId, '| Type:', typeof sourceId);
    console.log('amount:', amount);
    console.log('currency:', currency);
    console.log('orderId:', orderId);
    console.log('authToken provided:', !!authToken);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization token if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const apiUrl = `${
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    }/payments`;

    const requestBody = JSON.stringify({
      sourceId,
      amount: Math.round(amount),
      currency,
      orderId,
    });

    console.log('Request URL:', apiUrl);
    console.log('Request body:', requestBody);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: requestBody,
    });

    console.log('Response status:', response.status);

    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (!response.ok) {
      const errorData = responseData;
      throw new Error(
        errorData.message || errorData.error || 'Payment processing failed'
      );
    }

    if (!responseData.success) {
      throw new Error(responseData.message || 'Payment processing failed');
    }

    console.log('Payment successful:', responseData.data);
    return responseData.data;
  } catch (error) {
    console.error('=== Payment error ===', error);
    throw error;
  }
}
