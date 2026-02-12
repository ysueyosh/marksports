import { apiClient } from './client';

/**
 * SavedCard represents a card stored with Square
 *
 * id = card_id from Square API (format: "card_xxx")
 * Never use the nonce (cnon_xxx) for saved cards
 */
export interface SavedCard {
  id: string; // card_id from Square (card_xxx), NOT sourceId (cnon_xxx)
  cardholderName?: string; // ⭐ Cardholder name
  lastFourDigits: string;
  cardType: string; // "VISA", "MASTERCARD", "AMEX"
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt?: string;
}

export interface GetSavedCardsResponse {
  success: boolean;
  message: string;
  data?: SavedCard[];
}

export interface AddCardRequest {
  sourceId: string; // Payment nonce from Square Web Payments SDK (cnon_xxx)
  cardholderName: string; // ⭐ Cardholder name for card storage
  squareCustomerId?: string; // ⭐ Square Customer ID (optional if already in DB)
  verificationToken?: string; // ⭐ From verifyBuyer() for SCA
  billingAddress?: {
    givenName?: string;
    familyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface AddCardResponse {
  success: boolean;
  message: string;
  data?: SavedCard;
}

export interface DeleteCardResponse {
  success: boolean;
  message: string;
}

export interface SetDefaultCardResponse {
  success: boolean;
  message: string;
  data?: SavedCard;
}

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

interface SubmitPaymentApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: PaymentResponse;
}

/**
 * Get user's saved cards
 */
export async function getSavedCards(): Promise<GetSavedCardsResponse> {
  return apiClient.get<GetSavedCardsResponse>('/payment-methods');
}

/**
 * Add new card
 */
export async function addCard(
  cardData: AddCardRequest,
): Promise<AddCardResponse> {
  // ⭐ 診断: cardData の内容をログ出力
  console.log('[DIAGNOSTIC] addCard called with:', cardData);
  console.log('[DIAGNOSTIC] sourceId:', cardData.sourceId);
  console.log('[DIAGNOSTIC] sourceId type:', typeof cardData.sourceId);
  console.log('[DIAGNOSTIC] sourceId length:', cardData.sourceId?.length);
  console.log('[DIAGNOSTIC] Full cardData keys:', Object.keys(cardData));

  // ⭐ 重要: sourceId、cardholderName、verificationToken のみをサーバーに送信
  // brand, last4, expMonth, expYear は一切送らない
  const cleanData: AddCardRequest = {
    sourceId: cardData.sourceId,
    cardholderName: cardData.cardholderName,
    verificationToken: cardData.verificationToken,
    billingAddress: cardData.billingAddress,
  };

  console.log('[DIAGNOSTIC] Cleaned cardData for sending:', cleanData);
  console.log('[DIAGNOSTIC] Cleaned keys:', Object.keys(cleanData));

  return apiClient.post<AddCardResponse>('/payment-methods', cleanData);
}

/**
 * Delete card
 */
export async function deleteCard(cardId: string): Promise<DeleteCardResponse> {
  return apiClient.delete<DeleteCardResponse>(`/payment-methods/${cardId}`);
}

/**
 * Set card as default
 */
export async function setDefaultCard(
  cardId: string,
): Promise<SetDefaultCardResponse> {
  return apiClient.put<SetDefaultCardResponse>(
    `/payment-methods/${cardId}/default`,
    {},
  );
}

/**
 * Submit payment to backend API (client-side)
 */
export async function submitPayment(
  paymentRequest: PaymentRequest,
  authToken?: string,
): Promise<PaymentResponse> {
  const { sourceId, amount, currency = 'JPY', orderId } = paymentRequest;

  const options: RequestInit = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : {};

  const response = await apiClient.post<SubmitPaymentApiResponse>(
    '/payments',
    {
      sourceId,
      amount: Math.round(amount),
      currency,
      orderId,
    },
    options,
  );

  if (!response.success || !response.data) {
    throw new Error(
      response.message || response.error || 'Payment processing failed',
    );
  }

  return response.data;
}
