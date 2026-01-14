'use client';

import React, { ReactNode } from 'react';
import { create } from 'zustand';
import { useSnackbar } from '@/context/SnackbarContext';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
}

interface CartStore {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()((set) => ({
  items: [],
  coupon: null,
  addItem: (item, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((p) => p.id === item.id);
      if (existing) {
        return {
          items: state.items.map((p) =>
            p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p
          ),
        };
      }
      const newItem: CartItem = { ...item, quantity };
      return { items: [...state.items, newItem] };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((p) => p.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((p) =>
          p.id === id ? { ...p, quantity: Math.max(1, quantity) } : p
        )
        .filter((p) => p.quantity > 0),
    })),
  setCoupon: (coupon) => set({ coupon }),
  clear: () => set({ items: [], coupon: null }),
}));

export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useCart() {
  const snackbar = useSnackbar();
  const {
    items,
    coupon,
    addItem,
    removeItem,
    updateQuantity,
    setCoupon,
    clear,
  } = useCartStore();

  const addItemWithSnackbar = (
    item: Omit<CartItem, 'quantity'>,
    quantity = 1
  ) => {
    addItem(item, quantity);
    snackbar.show(`「${item.name}」をカートに追加しました`, 'success');
  };

  const removeItemWithSnackbar = (id: number | string) => {
    removeItem(id);
    snackbar.show('商品をカートから削除しました', 'info');
  };

  const updateQuantityWithSnackbar = (
    id: number | string,
    quantity: number
  ) => {
    updateQuantity(id, quantity);
    snackbar.show('数量を更新しました', 'info');
  };

  const clearWithSnackbar = () => {
    clear();
    snackbar.show('カートを空にしました', 'info');
  };

  return {
    items,
    coupon,
    addItem: addItemWithSnackbar,
    removeItem: removeItemWithSnackbar,
    updateQuantity: updateQuantityWithSnackbar,
    setCoupon,
    clear: clearWithSnackbar,
  };
}

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}
