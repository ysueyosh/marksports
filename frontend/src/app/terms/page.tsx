'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import styles from '@/app/policy.module.css';

export default function TermsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 戻る
        </button>
        <h1 className={styles.title}>利用規約</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>第1条 総則</h2>
            <p>
              本利用規約（以下「本規約」）は、Mark
              Sports（以下「当サイト」）が提供するオンラインショッピングサービスの利用条件を定めるものです。当サイトをご利用いただくすべてのお客様は、本規約に同意いただいたものとみなします。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第2条 会員登録</h2>
            <p>
              当サイトのサービスをご利用いただくには、会員登録が必要です。登録情報は正確かつ最新の情報をご提供ください。虚偽の情報を提供された場合、当サイトは利用を中止させていただく場合があります。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第3条 ご注文から配送まで</h2>
            <p>
              ご注文いただいた商品は、お支払い確認後に発送いたします。配送料金および配送期間は、選択された配送方法によって異なります。天災その他予期できない事由により、配送が遅延する場合がございます。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第4条 商品の在庫</h2>
            <p>
              当サイトに掲載されている商品の在庫は、リアルタイムで更新されます。ご注文のタイミングによっては在庫がない場合がございます。その場合はメールでご連絡いたします。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第5条 返品・交換</h2>
            <p>
              商品到着後7日以内であれば、返品をお受けいたします。返品には、以下の条件があります：
            </p>
            <ul>
              <li>未使用かつ未開封の状態であること</li>
              <li>商品到着時のパッケージ状態が保持されていること</li>
              <li>返品理由が明記されていること</li>
            </ul>
            <p>
              商品に不備・不良があった場合は、当該条件に限らず返品をお受けいたします。詳しくは「返品・キャンセル条件」をご参照ください。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第6条 禁止事項</h2>
            <p>ご利用者様は以下の行為を行ってはいけません：</p>
            <ul>
              <li>不正な方法でのサービス利用</li>
              <li>他者の個人情報を利用した登録</li>
              <li>著作権その他の知的財産権の侵害</li>
              <li>詐欺行為、虚偽の情報提供</li>
              <li>その他法令に違反する行為</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>第7条 免責事項</h2>
            <p>
              当サイトは、提供するサービスの内容、正確性、安全性について、明示的・暗示的を問わず保証しません。お客様がサービスを利用されたことにより生じた損害について、当サイトは一切の責任を負いません。
            </p>
          </section>

          <section className={styles.section}>
            <h2>第8条 規約の変更</h2>
            <p>
              当サイトは、事前の通知なく本規約の内容を変更することができます。変更後のご利用は、新規約に同意いただいたものとみなします。
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
