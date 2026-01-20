'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { create } from 'zustand';
import { useSnackbar } from '@/context/SnackbarContext';
import { verifyToken, refreshToken } from '@/api/token';

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
  phone?: string;
  address?: string;
  shippingAddress?: ShippingAddress;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number; // Timestamp when token expires
}

interface AuthStore {
  isLoggedIn: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => void;
  loginWithUserData: (userData: any) => void;
  logout: () => void;
  restoreFromLocalStorage: () => void;
  getAccessToken: () => string | null;
  setUserWithTokens: (user: any, tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  isLoggedIn: false,
  user: null,
  tokens: null,
  login: (email, password) => {
    if (email && password) {
      const userData: User = {
        id: '1',
        name: 'ユーザー太郎',
        email: email,
        // ダミーの配送先情報
        shippingAddress: {
          firstName: '太郎',
          lastName: '山田',
          phone: '090-1234-5678',
          postalCode: '100-0005',
          prefecture: 'tokyo',
          address: '丸の内1-1-1',
          building: 'マークスポーツビル 4階',
        },
      };
      set({
        isLoggedIn: true,
        user: userData,
      });
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
      }
    }
  },
  loginWithUserData: (userData: any) => {
    // バックエンドから取得したユーザー情報を保存
    const user: User = {
      id: userData.id || '',
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone,
      address: userData.address,
    };

    // トークン情報を保存
    const tokens: AuthTokens = {
      accessToken: userData.accessToken || '',
      refreshToken: userData.refreshToken || '',
      expiresIn: userData.expiresIn || 3600,
      expiresAt: Date.now() + (userData.expiresIn || 3600) * 1000,
    };

    set({
      isLoggedIn: true,
      user: user,
      tokens: tokens,
    });

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('isLoggedIn', 'true');
    }
  },
  logout: () => {
    set({ isLoggedIn: false, user: null, tokens: null });
    // ローカルストレージから削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authTokens');
      localStorage.removeItem('isLoggedIn');
    }
  },
  restoreFromLocalStorage: () => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('authUser');
      const savedTokens = localStorage.getItem('authTokens');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (savedUser && isLoggedIn === 'true') {
        try {
          const userData = JSON.parse(savedUser);
          let tokens = null;
          if (savedTokens) {
            tokens = JSON.parse(savedTokens);
          }
          set({
            isLoggedIn: true,
            user: userData,
            tokens: tokens,
          });
        } catch (error) {
          console.error('Failed to restore auth from localStorage:', error);
          localStorage.removeItem('authUser');
          localStorage.removeItem('authTokens');
          localStorage.removeItem('isLoggedIn');
        }
      }
    }
  },
  getAccessToken: () => {
    const { tokens } = get();
    if (tokens && tokens.accessToken) {
      // トークンが有効期限切れか確認
      if (tokens.expiresAt > Date.now()) {
        return tokens.accessToken;
      }
    }
    return null;
  },
  setUserWithTokens: (user: any, tokens: AuthTokens) => {
    const userData: User = {
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      phone: user.phone,
      address: user.address,
    };

    set({
      isLoggedIn: true,
      user: userData,
      tokens: tokens,
    });

    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('isLoggedIn', 'true');
    }
  },
}));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const restoreFromLocalStorage = useAuthStore(
    (state) => state.restoreFromLocalStorage
  );
  const { tokens, setUserWithTokens, logout } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // 初回アクセス時: localStorage からトークンを復元
      restoreFromLocalStorage();

      // すぐに hydrated を true にして UI を表示（ページ遷移なし）
      setIsHydrated(true);

      // 非同期でトークン検証を実行（バックグラウンド）
      // ローカルストレージにトークン値があればログイン処理を実行
      if (typeof window !== 'undefined') {
        const savedTokens = localStorage.getItem('authTokens');

        if (savedTokens) {
          try {
            const parsedTokens = JSON.parse(savedTokens);

            // アクセストークンが有効か確認
            if (parsedTokens.expiresAt > Date.now()) {
              // トークンがまだ有効 → /verify-token で自動ログイン
              const response = await verifyToken(parsedTokens.accessToken);

              if (response.success && response.data) {
                // ユーザー情報を取得してログイン状態を復元
                const userData = {
                  id: response.data.id,
                  name: response.data.name,
                  email: response.data.email,
                  phone: response.data.phone,
                  address: response.data.address,
                };
                setUserWithTokens(userData, parsedTokens);
              } else {
                // トークン検証失敗 → ログアウト
                console.warn('Token verification failed:', response.message);
                logout();
              }
            } else {
              // アクセストークン期限切れ → リフレッシュトークンで更新
              const refreshResponse = await refreshToken(
                parsedTokens.refreshToken
              );

              if (refreshResponse.success && refreshResponse.data) {
                // 新しいアクセストークンで更新
                const newTokens: AuthTokens = {
                  ...parsedTokens,
                  accessToken: refreshResponse.data.accessToken,
                  expiresIn: refreshResponse.data.expiresIn,
                  expiresAt: Date.now() + refreshResponse.data.expiresIn * 1000,
                };

                // 新しいアクセストークンで /verify-token を実行
                const verifyResponse = await verifyToken(newTokens.accessToken);

                if (verifyResponse.success && verifyResponse.data) {
                  // ユーザー情報を取得してログイン状態を復元
                  const userData = {
                    id: verifyResponse.data.id,
                    name: verifyResponse.data.name,
                    email: verifyResponse.data.email,
                    phone: verifyResponse.data.phone,
                    address: verifyResponse.data.address,
                  };
                  setUserWithTokens(userData, newTokens);
                } else {
                  logout();
                }
              } else {
                // リフレッシュ失敗 → ログアウト
                console.warn('Token refresh failed:', refreshResponse.message);
                logout();
              }
            }
          } catch (error) {
            console.error('Failed to auto-login:', error);
            logout();
          }
        }
      }
    };

    initializeAuth();
  }, []);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

export function useAuth() {
  const snackbar = useSnackbar();
  const {
    isLoggedIn,
    user,
    tokens,
    login,
    loginWithUserData,
    logout,
    getAccessToken,
    setUserWithTokens,
  } = useAuthStore();

  const loginWithSnackbar = (email: string, password: string) => {
    login(email, password);
    snackbar.show('ログインしました', 'success');
  };

  const loginWithUserDataAndSnackbar = (userData: any) => {
    loginWithUserData(userData);
    snackbar.show('ログインしました', 'success');
  };

  const logoutWithSnackbar = () => {
    logout();
    snackbar.show('ログアウトしました', 'info');
  };

  return {
    isLoggedIn,
    user,
    tokens,
    login: loginWithSnackbar,
    loginWithUserData: loginWithUserDataAndSnackbar,
    logout: logoutWithSnackbar,
    getAccessToken,
    setUserWithTokens,
  };
}
