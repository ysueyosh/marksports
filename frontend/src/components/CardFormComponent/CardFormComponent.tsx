'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CardFormComponentProps {
  cardholderName: string;
  onCardholderNameChange: (value: string) => void;
  sqInitialized: boolean;
  onSqInitialized: (initialized: boolean) => void;
  cardInstanceRef: React.MutableRefObject<any>;
  paymentsInstanceRef: React.MutableRefObject<any>;
  isLoggedIn: boolean;
}

export function CardFormComponent({
  cardholderName,
  onCardholderNameChange,
  sqInitialized,
  onSqInitialized,
  cardInstanceRef,
  paymentsInstanceRef,
  isLoggedIn,
}: CardFormComponentProps) {
  const [error, setError] = useState<string | null>(null);

  // Square SDK の初期化
  useEffect(() => {
    const initializeSquare = async () => {
      try {
        if (!window.Square) {
          console.error('[CARD_FORM] Square SDK not loaded');
          setError('Square SDK が読み込まれていません');
          return;
        }

        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

        if (!applicationId || !locationId) {
          console.error('[CARD_FORM] Square not configured');
          setError('Square が設定されていません');
          return;
        }

        console.log('[CARD_FORM] Initializing Square...');

        // Payments インスタンスを作成
        const payments = await window.Square.payments(
          applicationId,
          locationId,
        );
        paymentsInstanceRef.current = payments;

        // Card オブジェクトを作成
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

        console.log('[CARD_FORM] Attaching card to DOM...');

        // DOM に Card をアタッチ
        const cardContainer = document.getElementById('card-container');
        if (cardContainer) {
          await card.attach('#card-container');
          console.log('[CARD_FORM] Card attached to DOM');
          onSqInitialized(true);
        } else {
          console.error('[CARD_FORM] card-container element not found');
          setError('フォーム要素が見つかりません');
        }
      } catch (err) {
        console.error('[CARD_FORM] Initialization error:', err);
        setError('カードフォームの初期化に失敗しました');
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
          console.error('[CARD_FORM] Error destroying card:', err);
        }
      }
    };
  }, [isLoggedIn, onSqInitialized, cardInstanceRef, paymentsInstanceRef]);

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="cardholderName"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          カード所有者名
          <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
        </label>
        <input
          id="cardholderName"
          type="text"
          value={cardholderName}
          onChange={(e) => onCardholderNameChange(e.target.value)}
          placeholder="例：TARO YAMADA"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          カード情報
          <span style={{ color: '#e74c3c', marginLeft: '4px' }}>*</span>
        </label>
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
        {error && (
          <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '8px' }}>
            {error}
          </p>
        )}
      </div>
    </>
  );
}
