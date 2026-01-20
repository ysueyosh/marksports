import { apiClient } from './client';

export interface SavedCard {
  id: string;
  lastFourDigits: string;
  cardType: string; // "VISA", "MASTERCARD", "AMEX"
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault: boolean;
  createdAt: string;
}

export interface GetSavedCardsResponse {
  success: boolean;
  message: string;
  data?: SavedCard[];
}

export interface AddCardRequest {
  sourceId: string; // Square Payment Form token
  cardholderName: string;
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
  cardData: AddCardRequest
): Promise<AddCardResponse> {
  return apiClient.post<AddCardResponse>('/payment-methods', cardData);
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
  cardId: string
): Promise<SetDefaultCardResponse> {
  return apiClient.put<SetDefaultCardResponse>(
    `/payment-methods/${cardId}/default`,
    {}
  );
}
