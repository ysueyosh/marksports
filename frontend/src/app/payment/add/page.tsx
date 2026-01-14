'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSnackbar } from '@/context/SnackbarContext';
import MainLayout from '@/components/Layout/MainLayout';
import Dropdown from '@/components/Common/Dropdown/Dropdown';
import Link from 'next/link';
import { addCard } from '@/api/payment';
import styles from './add.module.css';

export default function AddPaymentPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { show: showSnackbar } = useSnackbar();
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!cardholderName.trim()) {
      errors.cardholderName = 'カード所有者名を入力してください';
    }

    if (!cardNumber.replace(/\s/g, '')) {
      errors.cardNumber = 'カード番号を入力してください';
    } else if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = '有効なカード番号を入力してください';
    }

    if (!expiryMonth) {
      errors.expiryMonth = '有効期限（月）を選択してください';
    }

    if (!expiryYear) {
      errors.expiryYear = '有効期限（年）を選択してください';
    }

    if (!cvv) {
      errors.cvv = 'セキュリティコードを入力してください';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = '有効なセキュリティコードを入力してください';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 19);
    // Format with spaces every 4 digits
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // TODO: In production, tokenize card with Square Payment Form
      // For now, use mock sourceId
      const sourceId = `nonce_${Date.now()}`;

      const response = await addCard({
        sourceId,
        cardholderName,
      });

      if (response.success) {
        showSnackbar('カードを追加しました', 'success');
        setTimeout(() => {
          router.push('/payment');
        }, 1500);
      } else {
        showSnackbar('カードの追加に失敗しました', 'error');
      }
    } catch (err) {
      showSnackbar('エラーが発生しました', 'error');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

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

          <div className={styles.formGroup}>
            <label htmlFor="cardNumber" className={styles.label}>
              カード番号
            </label>
            <input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className={`${styles.input} ${
                fieldErrors.cardNumber ? styles.inputError : ''
              }`}
            />
            {fieldErrors.cardNumber && (
              <span className={styles.fieldError}>
                {fieldErrors.cardNumber}
              </span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>有効期限（月）</label>
              <Dropdown
                isOpen={isMonthDropdownOpen}
                onToggle={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                onClose={() => setIsMonthDropdownOpen(false)}
                buttonText={
                  expiryMonth
                    ? String(expiryMonth).padStart(2, '0')
                    : '選択してください'
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <div
                    key={month}
                    className={styles.dropdownOption}
                    onClick={() => {
                      setExpiryMonth(String(month));
                      setIsMonthDropdownOpen(false);
                    }}
                  >
                    <span>{String(month).padStart(2, '0')}</span>
                  </div>
                ))}
              </Dropdown>
              {fieldErrors.expiryMonth && (
                <span className={styles.fieldError}>
                  {fieldErrors.expiryMonth}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>有効期限（年）</label>
              <Dropdown
                isOpen={isYearDropdownOpen}
                onToggle={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                onClose={() => setIsYearDropdownOpen(false)}
                buttonText={expiryYear || '選択してください'}
              >
                {years.map((year) => (
                  <div
                    key={year}
                    className={styles.dropdownOption}
                    onClick={() => {
                      setExpiryYear(String(year));
                      setIsYearDropdownOpen(false);
                    }}
                  >
                    <span>{year}</span>
                  </div>
                ))}
              </Dropdown>
              {fieldErrors.expiryYear && (
                <span className={styles.fieldError}>
                  {fieldErrors.expiryYear}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="cvv" className={styles.label}>
                セキュリティコード
              </label>
              <input
                id="cvv"
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                className={`${styles.input} ${
                  fieldErrors.cvv ? styles.inputError : ''
                }`}
              />
              {fieldErrors.cvv && (
                <span className={styles.fieldError}>{fieldErrors.cvv}</span>
              )}
            </div>
          </div>

          <div className={styles.notice}>
            <p>
              ℹ️ お支払い情報は Square Payment Form
              により安全に暗号化されて送信されます。
            </p>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'カードを追加中...' : 'カードを追加'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}
