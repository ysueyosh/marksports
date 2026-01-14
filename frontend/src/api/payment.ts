import { apiRequest } from './client';

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
  return apiRequest<GetSavedCardsResponse>('/payment-methods', {
    method: 'GET',
  });
}

/**
 * Add new card
 */
export async function addCard(
  cardData: AddCardRequest
): Promise<AddCardResponse> {
  return apiRequest<AddCardResponse>('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(cardData),
  });
}

/**
 * Delete card
 */
export async function deleteCard(cardId: string): Promise<DeleteCardResponse> {
  return apiRequest<DeleteCardResponse>(`/payment-methods/${cardId}`, {
    method: 'DELETE',
  });
}

/**
 * Set card as default
 */
export async function setDefaultCard(
  cardId: string
): Promise<SetDefaultCardResponse> {
  return apiRequest<SetDefaultCardResponse>(
    `/payment-methods/${cardId}/default`,
    {
      method: 'PUT',
    }
  );
}
