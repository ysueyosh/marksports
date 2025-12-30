'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import styles from '@/app/policy.module.css';

export default function SpecificTransactionPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 戻る
        </button>
        <h1 className={styles.title}>特定商取引法に基づく表記</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>販売者情報</h2>
            <table className={styles.table}>
              <tbody>
                <tr>
                  <td className={styles.label}>販売業者</td>
                  <td>Mark Sports</td>
                </tr>
                <tr>
                  <td className={styles.label}>代表者</td>
                  <td>〇〇 〇〇</td>
                </tr>
                <tr>
                  <td className={styles.label}>住所</td>
                  <td>〒000-0000 東京都渋谷区〇〇〇〇</td>
                </tr>
                <tr>
                  <td className={styles.label}>電話番号</td>
                  <td>0120-XXX-XXXX</td>
                </tr>
                <tr>
                  <td className={styles.label}>メール</td>
                  <td>info@sports-store.jp</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className={styles.section}>
            <h2>商品代金以外の必要料金</h2>
            <p>
              配送料金：商品金額が税抜き10,000円未満の場合、送料800円が必要です。10,000円以上の場合は送料無料です。
            </p>
            <p>消費税：商品代金に対して10%の消費税を申し受けます。</p>
          </section>

          <section className={styles.section}>
            <h2>支払い方法</h2>
            <p>
              クレジットカード、銀行振込、代金引換など複数の支払い方法をご用意しています。
            </p>
          </section>

          <section className={styles.section}>
            <h2>商品代金の支払い時期</h2>
            <p>
              クレジットカード、PayPal：注文確定時
              <br />
              銀行振込：注文確定後7日以内のご入金
              <br />
              代金引換：商品受け取り時
            </p>
          </section>

          <section className={styles.section}>
            <h2>商品の引き渡し時期</h2>
            <p>
              ご入金確認後、原則として5営業日以内に発送いたします。在庫がない場合はメールでご連絡いたします。
            </p>
          </section>

          <section className={styles.section}>
            <h2>返品・交換について</h2>
            <p>
              商品到着後7日以内であれば、返品をお受けいたします。商品に不備・不良があった場合は、送料当社負担で対応いたします。詳しくは「返品・キャンセル条件」をご参照ください。
            </p>
          </section>

          <section className={styles.section}>
            <h2>営業時間</h2>
            <p>月～金：9:00～18:00（土日祝日を除く）</p>
            <p>メール・オンラインストアは24時間受け付けております。</p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
