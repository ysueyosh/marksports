'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import { addCard } from '@/api/payment';
import { CardFormComponent } from '@/components/CardFormComponent/CardFormComponent';
import styles from './add.module.css';

export default function AddPaymentPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [cardholderName, setCardholderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sqInitialized, setSqInitialized] = useState(false);

  // Square Web Payments SDK の参照
  const cardInstanceRef = useRef<any>(null);
  const paymentsInstanceRef = useRef<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardholderName.trim()) {
      showSnackbar('カード所有者名を入力してください', 'error');
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
        sourceId.substring(0, 50) + '...',
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
          },
        );

        if (verifyResult?.token) {
          verificationToken = verifyResult.token;
          console.log(
            '[DIAGNOSTIC] Verification token obtained:',
            verificationToken
              ? verificationToken.substring(0, 30) + '...'
              : 'undefined',
          );
        } else {
          console.warn('[DIAGNOSTIC] No verification token from verifyBuyer');
        }
      } catch (verifyErr) {
        console.warn(
          '[DIAGNOSTIC] verifyBuyer error (non-critical):',
          verifyErr,
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
        ...(verificationToken && { verificationToken }), // ⭐ オプション：SCA用認証トークン
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
          'error',
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
          <CardFormComponent
            cardholderName={cardholderName}
            onCardholderNameChange={setCardholderName}
            sqInitialized={sqInitialized}
            onSqInitialized={setSqInitialized}
            cardInstanceRef={cardInstanceRef}
            paymentsInstanceRef={paymentsInstanceRef}
            isLoggedIn={isLoggedIn}
          />

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
