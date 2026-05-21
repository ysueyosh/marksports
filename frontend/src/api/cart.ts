import { apiClient } from './client';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  addedAt: string;
  size?: string;
  color?: string;
  selectedOptionChoiceId?: string;
  selectedOptionChoiceName?: string;
  additionalPrice?: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  paymentMethodRestriction?: string | null;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: CartItem[] | CartItem | null;
}

/**
 * Validate user identifier
 */
const validateUserIdentifier = (
  userIdentifier: string | null | undefined,
): void => {
  if (
    !userIdentifier ||
    typeof userIdentifier !== 'string' ||
    userIdentifier.trim() === ''
  ) {
    throw new Error('ユーザー識別情報が無効です');
  }
};

/**
 * Get user's cart items
 */
export const apiGetCart = async (
  userIdentifier: string,
): Promise<CartItem[]> => {
  try {
    // Validate input
    validateUserIdentifier(userIdentifier);

    const response = await apiClient.get<CartResponse>('/cart', {
      headers: {
        'X-User-UUID': userIdentifier,
      },
    });

    // Validate response structure
    if (!response || typeof response.success !== 'boolean') {
      throw new Error('カート取得レスポンス形式が不正です');
    }

    if (!response.success) {
      throw new Error(response.message || 'カート取得に失敗しました');
    }

    // Validate data array
    if (!Array.isArray(response.data)) {
      console.warn(
        'Expected cart data to be array, got:',
        typeof response.data,
      );
      return [];
    }

    return response.data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'カート取得に失敗しました';
    console.error('Error fetching cart:', {
      error: errorMessage,
      userIdentifier,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Add item to cart
 */
export const apiAddToCart = async (
  userIdentifier: string,
  productId: string,
  quantity: number,
  size?: string,
  color?: string,
  selectedOptionChoiceId?: string,
  selectedOptionChoiceName?: string,
  additionalPrice?: number,
): Promise<CartItem> => {
  try {
    // Validate inputs
    validateUserIdentifier(userIdentifier);

    if (
      !productId ||
      typeof productId !== 'string' ||
      productId.trim() === ''
    ) {
      throw new Error('商品IDが無効です');
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 9999) {
      throw new Error('数量は1から9999の整数である必要があります');
    }

    const response = await apiClient.post<CartResponse>(
      '/cart',
      {
        productId,
        quantity,
        ...(size ? { size } : {}),
        ...(color ? { color } : {}),
        ...(selectedOptionChoiceId ? { selectedOptionChoiceId } : {}),
        ...(selectedOptionChoiceName ? { selectedOptionChoiceName } : {}),
        ...(additionalPrice ? { additionalPrice } : {}),
      },
      {
        headers: {
          'X-User-UUID': userIdentifier,
        },
      },
    );

    // Validate response structure
    if (!response || typeof response.success !== 'boolean') {
      throw new Error('カート追加レスポンス形式が不正です');
    }

    if (!response.success) {
      throw new Error(response.message || 'カートに追加できませんでした');
    }

    // Validate data structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('カート商品データが不正です');
    }

    return response.data as CartItem;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'カートへの追加に失敗しました';
    console.error('Error adding to cart:', {
      error: errorMessage,
      productId,
      quantity,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Update cart item quantity
 */
export const apiUpdateCartItem = async (
  userIdentifier: string,
  productId: string,
  quantity: number,
): Promise<CartItem> => {
  try {
    // Validate inputs
    validateUserIdentifier(userIdentifier);

    if (
      !productId ||
      typeof productId !== 'string' ||
      productId.trim() === ''
    ) {
      throw new Error('商品IDが無効です');
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 9999) {
      throw new Error('数量は1から9999の整数である必要があります');
    }

    const response = await apiClient.put<CartResponse>(
      `/cart/${encodeURIComponent(productId)}`,
      {
        quantity,
      },
      {
        headers: {
          'X-User-UUID': userIdentifier,
        },
      },
    );

    // Validate response structure
    if (!response || typeof response.success !== 'boolean') {
      throw new Error('カート更新レスポンス形式が不正です');
    }

    if (!response.success) {
      throw new Error(response.message || 'カート更新に失敗しました');
    }

    // Validate data structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('更新後のカート商品データが不正です');
    }

    return response.data as CartItem;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'カート更新に失敗しました';
    console.error('Error updating cart item:', {
      error: errorMessage,
      productId,
      quantity,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Delete item from cart
 */
export const apiDeleteFromCart = async (
  userIdentifier: string,
  productId: string,
): Promise<void> => {
  try {
    // Validate inputs
    validateUserIdentifier(userIdentifier);

    if (
      !productId ||
      typeof productId !== 'string' ||
      productId.trim() === ''
    ) {
      throw new Error('商品IDが無効です');
    }

    const response = await apiClient.delete<CartResponse>(
      `/cart/${encodeURIComponent(productId)}`,
      {
        headers: {
          'X-User-UUID': userIdentifier,
        },
      },
    );

    // Validate response structure
    if (!response || typeof response.success !== 'boolean') {
      throw new Error('カート削除レスポンス形式が不正です');
    }

    if (!response.success) {
      throw new Error(response.message || 'カートから削除できませんでした');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'カートから削除に失敗しました';
    console.error('Error deleting from cart:', {
      error: errorMessage,
      productId,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Clear all cart items (after successful payment)
 */
export const apiClearCart = async (userIdentifier: string): Promise<void> => {
  try {
    // Validate input
    validateUserIdentifier(userIdentifier);

    const response = await apiClient.post<CartResponse>(
      '/cart/clear',
      {},
      {
        headers: {
          'X-User-UUID': userIdentifier,
        },
      },
    );

    // Validate response structure
    if (!response || typeof response.success !== 'boolean') {
      throw new Error('カートクリアレスポンス形式が不正です');
    }

    if (!response.success) {
      throw new Error(response.message || 'カートのクリアに失敗しました');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'カートのクリアに失敗しました';
    console.error('Error clearing cart:', { error: errorMessage });
    throw new Error(errorMessage);
  }
};
