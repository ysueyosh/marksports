"use server";

import { randomUUID } from "crypto";

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
 * テスト用の mock 支払い処理
 * 実装例：https://developer.squareup.com/blog/accept-payments-with-square-using-next-js-app-router/
 * 本番環境では Square Node.js SDK を使用して実装してください
 */
export async function submitPayment(
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> {
  try {
    const { sourceId, amount, currency = "JPY", orderId } = paymentRequest;

    console.log("Mock payment processing:", {
      sourceId,
      amount,
      currency,
      orderId,
    });

    // テスト用: 実際の API 呼び出しをシミュレート
    // 本番環境では以下のように Square SDK で実装
    /*
    const { paymentsApi } = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: "sandbox",
    });

    const { result } = await paymentsApi.createPayment({
      idempotencyKey: randomUUID(),
      sourceId,
      amountMoney: {
        currency,
        amount: Math.round(amount),
      },
      orderId,
    });

    return result;
    */

    // Mock レスポンス
    const mockPaymentId = `SQ_${randomUUID().toUpperCase()}`;

    return {
      id: mockPaymentId,
      status: "COMPLETED",
      receipt_number: `RCP_${Date.now()}`,
      receipt_url: `/receipt/${mockPaymentId}`,
      amount_money: {
        amount,
        currency,
      },
      order_id: orderId,
    };
  } catch (error) {
    console.error("Payment error:", error);
    throw error;
  }
}
