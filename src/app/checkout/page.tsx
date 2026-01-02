'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import CheckoutLayout from '@/components/Layout/CheckoutLayout';
import { processPayment, PaymentRequest } from '@/utils/square-payment';
import styles from './checkout.module.css';

declare global {
  interface Window {
    Square?: {
      web: {
        payments: (appId: string, locationId: string) => Promise<any>;
      };
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentsRef = useRef<any>(null);
  const webPaymentInstanceRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    address: '',
    building: '',
    shipping: 'normal',
  });

  // Squareスクリプトをロード
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://web.squarecdn.com/v1/square.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Squareの初期化
  useEffect(() => {
    if (currentStep === 2 && window.Square) {
      initializeSquare();
    }
  }, [currentStep]);

  const initializeSquare = async () => {
    try {
      const payments = await window.Square!.web.payments(
        'YOUR_SQUARE_APPLICATION_ID',
        'YOUR_SQUARE_LOCATION_ID'
      );
      paymentsRef.current = payments;

      const webPaymentInstance = await payments.webPaymentInstance();
      webPaymentInstanceRef.current = webPaymentInstance;

      await webPaymentInstance.attach('#sq-web-payments-container');
    } catch (error) {
      console.error('Failed to initialize Squarebridge:', error);
      setPaymentError('決済システムの初期化に失敗しました');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setPaymentError(null);
    }
  };

  const validateStep1 = (): boolean => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.postalCode ||
      !formData.prefecture ||
      !formData.address
    ) {
      setPaymentError('すべての必須項目を入力してください');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!webPaymentInstanceRef.current) {
      setPaymentError('決済システムが準備できていません');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Squareから支払いトークンを取得
      const result = await webPaymentInstanceRef.current.requestCardPayment({
        amount: 1370600, // 金額（セント単位）
        currencyCode: 'JPY',
        intent: 'CHARGE',
      });

      if (result.status === 'SUCCESS') {
        const token = result.details.card.token;

        // 決済リクエストを作成
        const paymentRequest: PaymentRequest = {
          amount: 137060,
          currency: 'JPY',
          sourceId: token,
          idempotencyKey: `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          customerDetails: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          shippingAddress: {
            postalCode: formData.postalCode,
            prefecture: formData.prefecture,
            address: formData.address,
            building: formData.building,
          },
          shippingMethod:
            formData.shipping === 'normal' ? 'standard' : 'express',
          orderItems: [
            {
              id: 1,
              name: 'バレーボール',
              quantity: 1,
              price: 3500,
            },
            {
              id: 2,
              name: 'バスケットボール',
              quantity: 1,
              price: 4200,
            },
            {
              id: 3,
              name: '卓球ラケット',
              quantity: 2,
              price: 2800,
            },
          ],
        };

        // モック決済処理
        const paymentResponse = await processPayment(paymentRequest);

        if (paymentResponse.success) {
          // 決済成功時は領収書ページへ遷移
          router.push(
            `/receipt/${paymentResponse.receiptNumber}?transactionId=${paymentResponse.transactionId}`
          );
        } else {
          setPaymentError(
            paymentResponse.error || '決済処理中にエラーが発生しました'
          );
        }
      } else if (result.status === 'CANCELLED') {
        setPaymentError('決済がキャンセルされました');
      } else {
        setPaymentError(
          result.errors?.[0]?.message || '決済処理中にエラーが発生しました'
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : '決済処理中にエラーが発生しました'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout>
      {/* Navigation Buttons */}
      <div className={styles.navigation}>
        <button className={styles.navButton} onClick={() => router.push('/')}>
          ← トップに戻る
        </button>
        <button
          className={styles.navButton}
          onClick={() => router.push('/cart')}
        >
          ← カートに戻る
        </button>
      </div>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>注文手続き</h1>
          <p>買い物を完成させましょう</p>
        </div>

        <div className={styles.steps}>
          <div
            className={`${styles.step} ${
              currentStep >= 1 ? styles.active : ''
            }`}
          >
            <span className={styles.stepNumber}>1</span>
            <span>配送情報</span>
          </div>
          <div
            className={`${styles.step} ${
              currentStep >= 2 ? styles.active : ''
            }`}
          >
            <span className={styles.stepNumber}>2</span>
            <span>支払い方法</span>
          </div>
          <div
            className={`${styles.step} ${
              currentStep >= 3 ? styles.active : ''
            }`}
          >
            <span className={styles.stepNumber}>3</span>
            <span>確認</span>
          </div>
        </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {paymentError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '20px',
                color: '#991b1b',
              }}
            >
              ⚠️ {paymentError}
            </div>
          )}

          {currentStep === 1 && (
            <>
              {/* Shipping Information */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>配送先情報</legend>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>姓名 *</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="山田"
                      className={styles.input}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>名前 *</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="太郎"
                      className={styles.input}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>メールアドレス *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>電話番号 *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="090-1234-5678"
                    className={styles.input}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>郵便番号 *</label>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="100-0005"
                    className={styles.input}
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>都道府県 *</label>
                  <select
                    name="prefecture"
                    className={styles.select}
                    value={formData.prefecture}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="tokyo">東京都</option>
                    <option value="osaka">大阪府</option>
                    <option value="kyoto">京都府</option>
                    <option value="fukuoka">福岡県</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>住所 *</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="丸の内1-1-1"
                    className={styles.input}
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>建物名（オプション）</label>
                  <input
                    type="text"
                    name="building"
                    placeholder="◇◇ビル 4階"
                    className={styles.input}
                    value={formData.building}
                    onChange={handleInputChange}
                  />
                </div>
              </fieldset>

              {/* Shipping Method */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>配送方法</legend>

                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="shipping"
                      value="normal"
                      checked={formData.shipping === 'normal'}
                      onChange={handleInputChange}
                    />
                    <span className={styles.radioCustom}></span>
                    <span>通常配送 - ¥500（1-2営業日）</span>
                  </label>
                </div>

                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="shipping"
                      value="express"
                      checked={formData.shipping === 'express'}
                      onChange={handleInputChange}
                    />
                    <span className={styles.radioCustom}></span>
                    <span>速達配送 - ¥1,000（当日配送可能）</span>
                  </label>
                </div>
              </fieldset>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Payment Information */}
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>支払い方法</legend>
                <div
                  id="sq-web-payments-container"
                  style={{ marginBottom: '20px' }}
                >
                  {/* Square Web Payments SDKがここにマウントされます */}
                </div>
              </fieldset>
            </>
          )}

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h2 className={styles.summaryTitle}>注文概要</h2>

            <div className={styles.summaryItem}>
              <span>小計</span>
              <span>¥11,960</span>
            </div>
            <div className={styles.summaryItem}>
              <span>送料</span>
              <span>¥{formData.shipping === 'normal' ? '500' : '1,000'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span>消費税</span>
              <span>¥{formData.shipping === 'normal' ? '1,246' : '1,296'}</span>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryTotal}>
              <span>合計</span>
              <span>
                ¥{formData.shipping === 'normal' ? '13,706' : '14,256'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            {currentStep === 1 && (
              <>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => router.push('/cart')}
                >
                  ← 戻る
                </button>
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNextStep}
                >
                  支払い方法へ進む →
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => setCurrentStep(1)}
                  disabled={isProcessing}
                >
                  ← 戻る
                </button>
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handlePayment}
                  disabled={isProcessing}
                  style={{
                    opacity: isProcessing ? 0.6 : 1,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? '処理中...' : '決済する'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </CheckoutLayout>
  );
}
