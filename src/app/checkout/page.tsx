'use client';

import { useRouter } from 'next/navigation';
import CheckoutLayout from '@/components/Layout/CheckoutLayout';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
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
          <div className={`${styles.step} ${styles.active}`}>
            <span className={styles.stepNumber}>1</span>
            <span>配送情報</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <span>支払い方法</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span>確認</span>
          </div>
        </div>

        <form className={styles.form}>
          {/* Shipping Information */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>配送先情報</legend>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>姓名 *</label>
                <input
                  type="text"
                  placeholder="山田"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>名前 *</label>
                <input
                  type="text"
                  placeholder="太郎"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>メールアドレス *</label>
              <input
                type="email"
                placeholder="example@email.com"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>電話番号 *</label>
              <input
                type="tel"
                placeholder="090-1234-5678"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>郵便番号 *</label>
              <input
                type="text"
                placeholder="100-0005"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>都道府県 *</label>
              <select className={styles.select} required>
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
                placeholder="丸の内1-1-1"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>建物名（オプション）</label>
              <input
                type="text"
                placeholder="◇◇ビル 4階"
                className={styles.input}
              />
            </div>
          </fieldset>

          {/* Shipping Method */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>配送方法</legend>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="shipping" defaultChecked />
                <span className={styles.radioCustom}></span>
                <span>通常配送 - ¥500（1-2営業日）</span>
              </label>
            </div>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="shipping" />
                <span className={styles.radioCustom}></span>
                <span>速達配送 - ¥1,000（当日配送可能）</span>
              </label>
            </div>
          </fieldset>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h2 className={styles.summaryTitle}>注文概要</h2>

            <div className={styles.summaryItem}>
              <span>小計</span>
              <span>¥11,960</span>
            </div>
            <div className={styles.summaryItem}>
              <span>送料</span>
              <span>¥500</span>
            </div>
            <div className={styles.summaryItem}>
              <span>消費税</span>
              <span>¥1,246</span>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={styles.summaryTotal}>
              <span>合計</span>
              <span>¥13,706</span>
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.backButton}>
              ← 戻る
            </button>
            <button type="submit" className={styles.nextButton}>
              支払い方法へ進む →
            </button>
          </div>
        </form>
      </div>
    </CheckoutLayout>
  );
}
