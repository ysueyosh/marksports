import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentMethodType =
  | "credit_card"
  | "bank_transfer"
  | "apple_pay"
  | "google_pay";

export interface SavedPaymentMethod {
  id: string;
  type: PaymentMethodType;
  // クレジットカード用
  lastFourDigits?: string;
  cardType?: string; // "VISA", "MASTERCARD", etc
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  // 口座振込用
  bankName?: string;
  branchName?: string;
  accountType?: string; // "普通", "当座"
  accountNumber?: string;
  accountHolder?: string;
  // Apple Pay / Google Pay 用
  tokenId?: string;
  displayName?: string;
  createdAt: string;
}

interface PaymentMethodStore {
  paymentMethods: SavedPaymentMethod[];
  addPaymentMethod: (method: SavedPaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  getPaymentMethods: () => SavedPaymentMethod[];
  getPaymentMethodsByType: (type: PaymentMethodType) => SavedPaymentMethod[];
}

export const usePaymentMethod = create<PaymentMethodStore>()(
  persist(
    (set, get) => ({
      paymentMethods: [],

      addPaymentMethod: (method: SavedPaymentMethod) => {
        set((state) => ({
          paymentMethods: [...state.paymentMethods, method],
        }));
      },

      removePaymentMethod: (id: string) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.filter(
            (method) => method.id !== id
          ),
        }));
      },

      getPaymentMethods: () => get().paymentMethods,

      getPaymentMethodsByType: (type: PaymentMethodType) =>
        get().paymentMethods.filter((method) => method.type === type),
    }),
    {
      name: "payment-methods-storage",
    }
  )
);
