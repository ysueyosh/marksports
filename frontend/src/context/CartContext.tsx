'use client';

import React, { ReactNode, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { useSnackbar } from '@/context/SnackbarContext';
import { useAuth, useAuthStore } from '@/context/AuthContext';
import {
  apiGetCart,
  apiAddToCart,
  apiUpdateCartItem,
  apiDeleteFromCart,
  apiClearCart,
  CartItem as APICartItem,
} from '@/api/cart';
import { v4 as uuidv4 } from 'uuid';

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
  /** 商品備考（お客様の入力内容） */
  itemNote?: string;
  /** 商品備考欄の設定: null=なし / optional=任意 / required=必須 */
  itemNoteSetting?: 'optional' | 'required' | null;
  itemNoteLabel?: string | null;
  itemNoteMaxLength?: number | null;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  userIdentifier: string | null;
  isLoading: boolean;
  setUserIdentifier: (identifier: string) => void;
  setItems: (items: CartItem[]) => void;
  addItem: (
    productId: string,
    quantity: number,
    size?: string,
    color?: string,
    selectedOptionChoiceId?: string,
    selectedOptionChoiceName?: string,
    additionalPrice?: number,
    itemNote?: string,
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItemNote: (
    itemId: string,
    quantity: number,
    itemNote: string,
  ) => Promise<void>;
  fetchCart: () => Promise<void>;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clear: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const paymentRestrictionLabel = (method: string): string => {
  const labels: Record<string, string> = {
    bank_transfer: '口座振込',
    credit_card: 'クレジットカード',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
  };
  return labels[method] || method;
};

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  coupon: null,
  userIdentifier: null,
  isLoading: false,

  setUserIdentifier: (identifier) => set({ userIdentifier: identifier }),

  setItems: (items) => set({ items }),

  setLoading: (loading) => set({ isLoading: loading }),

  addItem: async (productId, quantity, size, color, selectedOptionChoiceId, selectedOptionChoiceName, additionalPrice, itemNote) => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      await apiAddToCart(userIdentifier, productId, quantity, size, color, selectedOptionChoiceId, selectedOptionChoiceName, additionalPrice, itemNote);
      // Refresh cart
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId) => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      await apiDeleteFromCart(userIdentifier, productId);
      // Refresh cart
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId, quantity) => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      await apiUpdateCartItem(userIdentifier, productId, quantity);
      // Refresh cart
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  updateItemNote: async (itemId, quantity, itemNote) => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      await apiUpdateCartItem(userIdentifier, itemId, quantity, itemNote);
      // 備考が変わると行のIDも変わるため再取得する
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCart: async () => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      const items = await apiGetCart(userIdentifier);
      set({ items: Array.isArray(items) ? items : [] });
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Silently fail on fetch errors
    } finally {
      set({ isLoading: false });
    }
  },

  setCoupon: (coupon) => set({ coupon }),

  clear: async () => {
    const { userIdentifier } = get();
    if (!userIdentifier) return;

    try {
      set({ isLoading: true });
      await apiClearCart(userIdentifier);
      set({ items: [], coupon: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export function CartProvider({ children }: { children: ReactNode }) {
  const { setUserIdentifier, userIdentifier, fetchCart } = useCartStore();
  const { isLoggedIn, user } = useAuth();
  const { restoreFromLocalStorage } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize authentication on mount
  useEffect(() => {
    restoreFromLocalStorage();
  }, [restoreFromLocalStorage]);

  // Initialize cart user identifier after auth state is resolved
  useEffect(() => {
    // If logged in, use userId
    if (isLoggedIn && user?.id) {
      setUserIdentifier(user.id);
      setIsInitialized(true);
      return;
    }

    // If not logged in, use userUuid
    if (!isLoggedIn) {
      const storedUUID = localStorage.getItem('userUuid');
      const newUUID = storedUUID || uuidv4();

      if (!storedUUID) {
        localStorage.setItem('userUuid', newUUID);
      }

      setUserIdentifier(newUUID);
      setIsInitialized(true);
    }
  }, [isLoggedIn, user?.id, setUserIdentifier]);

  // Fetch cart whenever userIdentifier changes
  useEffect(() => {
    if (userIdentifier && isInitialized) {
      fetchCart();
    }
  }, [userIdentifier, fetchCart, isInitialized]);

  return <>{children}</>;
}

export function useCart() {
  const snackbar = useSnackbar();
  const {
    items,
    coupon,
    addItem: storeAddItem,
    removeItem: storeRemoveItem,
    updateQuantity: storeUpdateQuantity,
    updateItemNote: storeUpdateItemNote,
    setCoupon,
    clear: storeClear,
    fetchCart,
    isLoading,
    userIdentifier,
    setUserIdentifier,
  } = useCartStore();

  const addItem = useCallback(
    async (
      productId: string,
      quantity: number = 1,
      size?: string,
      color?: string,
      selectedOptionChoiceId?: string,
      selectedOptionChoiceName?: string,
      additionalPrice?: number,
      paymentMethodRestriction?: string | null,
      itemNote?: string,
    ) => {
      // 決済方法競合チェック: カート内に異なる制限の商品があればブロック
      if (paymentMethodRestriction) {
        const conflictingItem = items.find(
          (item) =>
            item.paymentMethodRestriction &&
            item.paymentMethodRestriction !== paymentMethodRestriction,
        );
        if (conflictingItem) {
          snackbar.show(
            `この商品（${paymentRestrictionLabel(paymentMethodRestriction)}のみ）はカート内の商品（${paymentRestrictionLabel(conflictingItem.paymentMethodRestriction!)}のみ）と決済方法が競合するため追加できません`,
            'error',
          );
          return;
        }
      }

      try {
        await storeAddItem(productId, quantity, size, color, selectedOptionChoiceId, selectedOptionChoiceName, additionalPrice, itemNote);
        snackbar.show('カートに追加しました', 'success');
      } catch (error) {
        snackbar.show('カートへの追加に失敗しました', 'error');
      }
    },
    [storeAddItem, snackbar, items],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      try {
        await storeRemoveItem(productId);
        snackbar.show('商品を削除しました', 'info');
      } catch (error) {
        snackbar.show('削除に失敗しました', 'error');
      }
    },
    [storeRemoveItem, snackbar],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      try {
        await storeUpdateQuantity(productId, quantity);
        snackbar.show('数量を更新しました', 'info');
      } catch (error) {
        snackbar.show('更新に失敗しました', 'error');
      }
    },
    [storeUpdateQuantity, snackbar],
  );

  const updateItemNote = useCallback(
    async (itemId: string, quantity: number, itemNote: string) => {
      try {
        await storeUpdateItemNote(itemId, quantity, itemNote);
        snackbar.show('商品備考を更新しました', 'info');
        return true;
      } catch (error) {
        snackbar.show(
          error instanceof Error && error.message
            ? error.message
            : '商品備考の更新に失敗しました',
          'error',
        );
        return false;
      }
    },
    [storeUpdateItemNote, snackbar],
  );

  const clear = useCallback(async () => {
    try {
      await storeClear();
      snackbar.show('カートをクリアしました', 'info');
    } catch (error) {
      snackbar.show('クリアに失敗しました', 'error');
    }
  }, [storeClear, snackbar]);

  return {
    items,
    coupon,
    addItem,
    removeItem,
    updateQuantity,
    updateItemNote,
    setCoupon,
    clear,
    fetchCart,
    isLoading,
    userIdentifier,
    setUserIdentifier,
  };
}
