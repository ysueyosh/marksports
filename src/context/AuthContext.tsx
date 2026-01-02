"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { create } from "zustand";
import { useSnackbar } from "@/context/SnackbarContext";

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  address: string;
  building?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
  shippingAddress?: ShippingAddress;
}

interface AuthStore {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  restoreFromLocalStorage: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  isLoggedIn: false,
  user: null,
  login: (email, password) => {
    if (email && password) {
      const userData: User = {
        id: "1",
        name: "ユーザー太郎",
        email: email,
        // ダミーの配送先情報
        shippingAddress: {
          firstName: "太郎",
          lastName: "山田",
          phone: "090-1234-5678",
          postalCode: "100-0005",
          prefecture: "tokyo",
          address: "丸の内1-1-1",
          building: "マークスポーツビル 4階",
        },
      };
      set({
        isLoggedIn: true,
        user: userData,
      });
      // ローカルストレージに保存
      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(userData));
        localStorage.setItem("isLoggedIn", "true");
      }
    }
  },
  logout: () => {
    set({ isLoggedIn: false, user: null });
    // ローカルストレージから削除
    if (typeof window !== "undefined") {
      localStorage.removeItem("authUser");
      localStorage.removeItem("isLoggedIn");
    }
  },
  restoreFromLocalStorage: () => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("authUser");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (savedUser && isLoggedIn === "true") {
        try {
          const userData = JSON.parse(savedUser);
          set({
            isLoggedIn: true,
            user: userData,
          });
        } catch (error) {
          console.error("Failed to restore auth from localStorage:", error);
          localStorage.removeItem("authUser");
          localStorage.removeItem("isLoggedIn");
        }
      }
    }
  },
}));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const restoreFromLocalStorage = useAuthStore(
    (state) => state.restoreFromLocalStorage
  );

  useEffect(() => {
    restoreFromLocalStorage();
    setIsHydrated(true);
  }, [restoreFromLocalStorage]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

export function useAuth() {
  const snackbar = useSnackbar();
  const { isLoggedIn, user, login, logout } = useAuthStore();

  const loginWithSnackbar = (email: string, password: string) => {
    login(email, password);
    snackbar.show("ログインしました", "success");
  };

  const logoutWithSnackbar = () => {
    logout();
    snackbar.show("ログアウトしました", "info");
  };

  return {
    isLoggedIn,
    user,
    login: loginWithSnackbar,
    logout: logoutWithSnackbar,
  };
}
