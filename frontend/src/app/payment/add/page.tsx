'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { addCard } from '@/api/payment';
import styles from './add.module.css';

// Square Web Payments SDK の型定義
declare global {
  interface Window {
    Square: any;
  }
}

export default function AddPaymentPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [cardholderName, setCardholderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sqInitialized, setSqInitialized] = useState(false);

  // Square Web Payments SDK の参照
  const cardInstanceRef = useRef<any>(null);
  const paymentsInstanceRef = useRef<any>(null); // ⭐ verifyBuyer用

  // Square Web Payments SDK を初期化
  useEffect(() => {
    if (!isLoggedIn) return;

    const initializeSquare = async () => {
      try {
        if (!window.Square) {
          console.error('Square SDK not loaded');
          showSnackbar('Square SDK が読み込まれていません', 'error');
          return;
        }

        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

        if (!applicationId || !locationId || applicationId.includes('YOUR_')) {
          console.warn('Square not configured. Using demo mode.');
          showSnackbar(
            'Square が設定されていません。Dashboard から ApplicationID と LocationID を設定してください。',
            'error'
          );
          return;
        }

        console.log('[DIAGNOSTIC] Initializing Square...');
        // Payments インスタンスを作成
        const payments = await window.Square.payments(
          applicationId,
          locationId
        );
        paymentsInstanceRef.current = payments; // ⭐ verifyBuyer用に保存

        // Card オブジェクトを作成
        // ⭐ 日本向けの設定：postalCode を無効化
        const card = await payments.card({
          style: {
            input: {
              fontFamily: '"Helvetica Neue", sans-serif',
              fontSize: '16px',
              color: '#333',
            },
          },
        });
        cardInstanceRef.current = card;

        console.log('[DIAGNOSTIC] Card object created, attaching to DOM...');

        // DOM に Card をアタッチ
        const cardContainer = document.getElementById('card-container');
        if (cardContainer) {
          await card.attach('#card-container');
          console.log('[DIAGNOSTIC] Card attached to DOM');
          setSqInitialized(true);
        } else {
          console.error('card-container element not found');
        }
      } catch (err) {
        console.error('Failed to initialize Square:', err);
        showSnackbar('Square の初期化に失敗しました', 'error');
      }
    };

    // DOM が準備できるまで待機
    const timer = setTimeout(() => {
      initializeSquare();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (cardInstanceRef.current) {
        try {
          cardInstanceRef.current.destroy();
        } catch (err) {
          console.error('Error destroying card:', err);
        }
      }
    };
  }, [isLoggedIn]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!cardholderName.trim()) {
      errors.cardholderName = 'カード所有者名を入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!sqInitialized || !cardInstanceRef.current) {
      showSnackbar('Square が初期化されていません', 'error');
      return;
    }

    try {
      setIsLoading(true);

      console.log('[DIAGNOSTIC] Tokenizing card...');
      // Step 1: カード情報をトークン化
      const tokenResult = await cardInstanceRef.current.tokenize();

      console.log('[DIAGNOSTIC] Tokenization result:', {
        status: tokenResult.status,
        token: tokenResult.token?.substring(0, 30) + '...',
        errors: tokenResult.errors,
      });

      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        const errorMsg =
          tokenResult.errors?.map((e: any) => e.message).join(', ') ||
          'Unknown error';
        showSnackbar(`カード情報の暗号化に失敗しました: ${errorMsg}`, 'error');
        console.error('Tokenization failed:', tokenResult);
        return;
      }

      const sourceId = tokenResult.token;
      console.log(
        '[DIAGNOSTIC] sourceId (nonce):',
        sourceId.substring(0, 50) + '...'
      );
      console.log('[DIAGNOSTIC] nonce length:', sourceId.length);

      // Step 1.5: ⭐ verifyBuyer を実行（SCA対応）
      console.log('[DIAGNOSTIC] Verifying buyer for SCA...');
      let verificationToken: string | undefined;
      try {
        // ⭐ 必須：verifyBuyer()でSCAに対応
        const verifyResult = await paymentsInstanceRef.current?.verifyBuyer(
          sourceId,
          {
            intent: 'STORE', // Card on File の目的
            amount: '0',
            currencyCode: 'JPY',
          }
        );

        if (verifyResult?.token) {
          verificationToken = verifyResult.token;
          console.log(
            '[DIAGNOSTIC] Verification token obtained:',
            verificationToken.substring(0, 30) + '...'
          );
        } else {
          console.warn('[DIAGNOSTIC] No verification token from verifyBuyer');
        }
      } catch (verifyErr) {
        console.warn(
          '[DIAGNOSTIC] verifyBuyer error (non-critical):',
          verifyErr
        );
        // verifyBuyer エラーは非致命的 - 続行
      }

      // Step 2: Billing address を構築
      const billingAddress = {
        givenName: cardholderName.split(' ')[0] || cardholderName,
        familyName: cardholderName.split(' ')[1] || '',
      };

      console.log('[DIAGNOSTIC] Sending addCard request...');
      // Step 3: サーバーにカード追加リクエストを送信
      const response = await addCard({
        sourceId,
        cardholderName, // ⭐ 必須：カード所有者名
        verificationToken, // ⭐ オプション：SCA用認証トークン
        billingAddress,
      });

      console.log('[DIAGNOSTIC] addCard response:', response);

      if (response.success) {
        showSnackbar('カードを追加しました', 'success');
        setTimeout(() => {
          router.push('/payment');
        }, 1500);
      } else {
        showSnackbar(
          `カードの追加に失敗しました: ${response.message}`,
          'error'
        );
        console.error('addCard failed:', response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showSnackbar(`エラーが発生しました: ${errorMsg}`, 'error');
      console.error('Error in handleSubmit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <h1>カード追加</h1>
            <p>ログインしていません</p>
            <Link href="/" className={styles.backButton}>
              ホームへ戻る
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">ホーム</Link>
          <span>/</span>
          <Link href="/account">アカウント</Link>
          <span>/</span>
          <Link href="/payment">お支払方法管理</Link>
          <span>/</span>
          <span>カード追加</span>
        </div>

        <div className={styles.header}>
          <h1>カードを追加</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="cardholderName" className={styles.label}>
              カード所有者名
            </label>
            <input
              id="cardholderName"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="例：TARO YAMADA"
              className={`${styles.input} ${
                fieldErrors.cardholderName ? styles.inputError : ''
              }`}
            />
            {fieldErrors.cardholderName && (
              <span className={styles.fieldError}>
                {fieldErrors.cardholderName}
              </span>
            )}
          </div>

          {/* Square Web Payments SDK の Card コンテナ */}
          <div className={styles.formGroup}>
            <label className={styles.label}>カード情報</label>
            <div
              id="card-container"
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '12px',
                minHeight: '100px',
                backgroundColor: '#f9f9f9',
              }}
            />
            {!sqInitialized && (
              <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                カード入力フォームを読み込み中...
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <button
              type="submit"
              disabled={isLoading || !sqInitialized}
              className={styles.submitButton}
              style={{
                opacity: isLoading || !sqInitialized ? 0.6 : 1,
                cursor: isLoading || !sqInitialized ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? '処理中...' : 'カードを追加'}
            </button>
          </div>

          <div className={styles.formGroup}>
            <Link href="/payment" className={styles.backButton}>
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
