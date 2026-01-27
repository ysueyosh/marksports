'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { create } from 'zustand';
import { useSnackbar } from '@/context/SnackbarContext';
import { verifyToken, refreshToken } from '@/api/token';

// Token expiration constants
const ACCESS_TOKEN_EXPIRE_MINUTES = 60;

interface ShippingAddress {
  name: string;
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
        name: email,
        email: email,
      };
      set({
        isLoggedIn: true,
        user: userData,
      });
      // トークンなしでログイン（authTokens のみ保存）
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
      }
    }
  },
  loginWithUserData: (userData: any, guestIdentifier?: string) => {
    // ユーザー情報を保存
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

    // ローカルストレージには authTokens のみ保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('isLoggedIn', 'true');
    }
  },
  logout: () => {
    set({ isLoggedIn: false, user: null, tokens: null });
    // ローカルストレージから削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authTokens');
      localStorage.removeItem('isLoggedIn');
    }
  },
  restoreFromLocalStorage: () => {
    if (typeof window !== 'undefined') {
      const savedTokens = localStorage.getItem('authTokens');
      // authTokens のみを復元（authUser は復元しない）
      if (savedTokens) {
        try {
          const tokens = JSON.parse(savedTokens);
          // トークンのみをストアに保存（ユーザー情報はバックエンドから取得）
          set({
            tokens: tokens,
          });
        } catch (error) {
          console.error(
            'Failed to restore authTokens from localStorage:',
            error,
          );
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

    // ローカルストレージには authTokens のみ保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('isLoggedIn', 'true');
    }
  },
}));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const restoreFromLocalStorage = useAuthStore(
    (state) => state.restoreFromLocalStorage,
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
              const response = await verifyToken(
                parsedTokens.accessToken,
                parsedTokens.refreshToken,
              );

              if (response.success && response.data) {
                // ユーザー情報を取得してログイン状態を復元
                // setUserWithTokens で自動ログイン後の処理を統一
                const updatedTokens: AuthTokens = {
                  ...parsedTokens,
                  accessToken:
                    response.data.accessToken || parsedTokens.accessToken,
                  refreshToken:
                    response.data.refreshToken || parsedTokens.refreshToken,
                  expiresIn:
                    response.data.expiresIn || ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                  expiresAt:
                    Date.now() +
                    (response.data.expiresIn ||
                      ACCESS_TOKEN_EXPIRE_MINUTES * 60) *
                      1000,
                };

                const userData = {
                  id: response.data.id,
                  email: response.data.email,
                  name: response.data.name || '',
                  phone: response.data.phone,
                  address: response.data.address,
                };
                setUserWithTokens(userData, updatedTokens);
              } else {
                // トークン検証失敗 → ログアウト
                console.warn('Token verification failed:', response.message);
                logout();
              }
            } else {
              // アクセストークン期限切れ → リフレッシュトークンで更新
              const refreshResponse = await refreshToken(
                parsedTokens.refreshToken,
              );

              if (refreshResponse.success && refreshResponse.data) {
                // 新しいアクセストークンで更新
                const newTokens: AuthTokens = {
                  ...parsedTokens,
                  accessToken: refreshResponse.data.accessToken,
                  refreshToken:
                    refreshResponse.data.refreshToken ||
                    parsedTokens.refreshToken,
                  expiresIn: refreshResponse.data.expiresIn,
                  expiresAt: Date.now() + refreshResponse.data.expiresIn * 1000,
                };

                // 新しいアクセストークンで /verify-token を実行
                const verifyResponse = await verifyToken(
                  newTokens.accessToken,
                  newTokens.refreshToken,
                );

                if (verifyResponse.success && verifyResponse.data) {
                  // ユーザー情報を取得してログイン状態を復元
                  // setUserWithTokens で自動ログイン後の処理を統一
                  const userData = {
                    id: verifyResponse.data.id,
                    email: verifyResponse.data.email,
                    name: verifyResponse.data.name || '',
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
