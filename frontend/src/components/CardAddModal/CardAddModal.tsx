'use client';

import React, { useState, useRef } from 'react';
import { addCard, SavedCard } from '@/api/payment';
import { useSnackbar } from '@/context/SnackbarContext';
import { CardFormComponent } from '@/components/CardFormComponent/CardFormComponent';
import { useAuth } from '@/context/AuthContext';

interface CardAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardAdded: (card: SavedCard) => void;
  squareCustomerId: string;
}

export function CardAddModal({
  isOpen,
  onClose,
  onCardAdded,
  squareCustomerId,
}: CardAddModalProps) {
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqInitialized, setSqInitialized] = useState(false);
  const { show: showSnackbar } = useSnackbar();
  const { isLoggedIn } = useAuth();

  const cardInstanceRef = useRef<any>(null);
  const paymentsInstanceRef = useRef<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (!cardholderName.trim()) {
        throw new Error('カード所有者名を入力してください');
      }

      if (!sqInitialized || !cardInstanceRef.current) {
        throw new Error('カードフォームが初期化されていません');
      }

      console.log('[CARD_ADD] Tokenizing card...');

      // Step 1: カード情報をトークン化
      const tokenResult = await cardInstanceRef.current.tokenize();

      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        const errorMsg =
          tokenResult.errors?.map((e: any) => e.message).join(', ') ||
          'Unknown error';
        throw new Error(`カード情報の暗号化に失敗: ${errorMsg}`);
      }

      const sourceId = tokenResult.token;
      console.log('[CARD_ADD] SourceId obtained');

      // Step 2: verifyBuyer を実行（SCA対応）
      console.log('[CARD_ADD] Verifying buyer for SCA...');
      let verificationToken: string | undefined;
      try {
        const verifyResult = await paymentsInstanceRef.current?.verifyBuyer(
          sourceId,
          {
            intent: 'STORE',
            amount: '0',
            currencyCode: 'JPY',
          },
        );

        if (verifyResult?.token) {
          verificationToken = verifyResult.token;
          console.log('[CARD_ADD] Verification token obtained');
        }
      } catch (verifyErr) {
        console.warn('[CARD_ADD] verifyBuyer error (non-critical):', verifyErr);
      }

      // Step 3: addCard API を呼び出し
      console.log('[CARD_ADD] Calling addCard API...');
      const response = await addCard({
        sourceId,
        cardholderName,
        squareCustomerId: squareCustomerId || undefined,
        ...(verificationToken && { verificationToken }),
      });

      if (response.success && response.data?.id) {
        console.log('[CARD_ADD] Card added successfully:', response.data.id);
        showSnackbar('カードが正常に登録されました', 'success');

        // Reset form
        setCardholderName('');
        setError(null);

        // Call onCardAdded with the complete card data
        onCardAdded(response.data as SavedCard);
        onClose();
      } else {
        throw new Error(response.message || 'カードの登録に失敗しました');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'エラーが発生しました';
      console.error('[CARD_ADD] Error:', errorMessage);
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={() => {
        if (!isProcessing) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
            }}
          >
            新しいカードを登録
          </h2>
          <button
            onClick={() => {
              if (!isProcessing) onClose();
            }}
            disabled={isProcessing}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <CardFormComponent
            cardholderName={cardholderName}
            onCardholderNameChange={setCardholderName}
            sqInitialized={sqInitialized}
            onSqInitialized={setSqInitialized}
            cardInstanceRef={cardInstanceRef}
            paymentsInstanceRef={paymentsInstanceRef}
            isLoggedIn={isLoggedIn}
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (!isProcessing) {
                  onClose();
                  setCardholderName('');
                  setError(null);
                }
              }}
              disabled={isProcessing}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isProcessing || !sqInitialized}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor:
                  isProcessing || !sqInitialized ? '#9ca3af' : '#2563eb',
                color: '#fff',
                borderRadius: '4px',
                cursor:
                  isProcessing || !sqInitialized ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isProcessing || !sqInitialized ? 0.6 : 1,
              }}
            >
              {isProcessing ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
