/**
 * Square Payment Mock API
 * このファイルはモック実装です。本番環境ではLambdaで実装します。
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  sourceId: string;
  idempotencyKey: string;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    postalCode: string;
    prefecture: string;
    address: string;
    building?: string;
  };
  shippingMethod: string;
  orderItems: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  receiptNumber?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 決済処理を行う（モック版）
 * 本番環境ではこのAPIを呼び出して、LambdaでSquare SDKを使用して処理します
 */
export async function processPayment(
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> {
  try {
    // TODO: 本番環境ではここでLambda APIを呼び出します
    // const response = await fetch('/api/payment', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(paymentRequest),
    // });

    // モック実装：1秒後に成功を返す
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95%の確率で成功

        if (success) {
          resolve({
            success: true,
            transactionId: `SQ_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            receiptNumber: `REC_${Date.now().toString().slice(-8)}`,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            timestamp: new Date().toISOString(),
          });
        } else {
          resolve({
            success: false,
            error: 'カード処理エラーが発生しました',
            errorCode: 'CARD_ERROR',
          });
        }
      }, 1000);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'SYSTEM_ERROR',
    };
  }
}

/**
 * 決済キャンセル（モック版）
 */
export async function cancelPayment(
  transactionId: string
): Promise<PaymentResponse> {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: transactionId,
          timestamp: new Date().toISOString(),
        });
      }, 500);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'CANCEL_ERROR',
    };
  }
}

/**
 * 取引詳細を取得（モック版）
 */
export async function getTransactionDetails(
  transactionId: string
): Promise<PaymentResponse> {
  try {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: transactionId,
          timestamp: new Date().toISOString(),
        });
      }, 300);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'FETCH_ERROR',
    };
  }
}

/**
 * Squareクライアント情報を取得（モック版）
 * 実際にはサーバーから安全に取得します
 */
export async function getSquareClientInfo(): Promise<{
  applicationId: string;
  locationId: string;
}> {
  // モック実装
  return {
    applicationId: 'YOUR_SQUARE_APPLICATION_ID',
    locationId: 'YOUR_SQUARE_LOCATION_ID',
  };
}
