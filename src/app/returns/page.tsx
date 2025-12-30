'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import styles from '@/app/policy.module.css';

export default function ReturnsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 戻る
        </button>
        <h1 className={styles.title}>返品・キャンセル条件</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>返品について</h2>
            <p>
              当サイトでは、お客様ご都合による返品および不良品の返品をお受けしております。以下の条件をご確認の上、ご対応ください。
            </p>
          </section>

          <section className={styles.section}>
            <h2>返品期限</h2>
            <p>
              商品到着後7日以内に返品のお申し出がない場合は、返品をお受けできません。返品のご希望がある場合は、お手数ですが速やかにご連絡ください。
            </p>
          </section>

          <section className={styles.section}>
            <h2>お客様都合による返品の条件</h2>
            <p>
              以下の条件をすべて満たしている場合に限り、返品をお受けいたします：
            </p>
            <ul>
              <li>商品が未使用かつ未開封の状態であること</li>
              <li>商品到着時のパッケージおよび付属品がすべて揃っていること</li>
              <li>返品理由を明記いただくこと</li>
              <li>返送料はお客様ご負担であること</li>
            </ul>
            <p>
              返品いただいた商品のご確認後、返金処理いたします。返金日は、返品商品の到着から10営業日程度となります。
            </p>
          </section>

          <section className={styles.section}>
            <h2>不良品・破損品の返品</h2>
            <p>
              商品の不良、破損、誤送などの当サイトの責によるご返品については、送料を当サイト負担とさせていただきます。恐れ入りますが、お急ぎのところ商品到着後速やかにご連絡をいただき、返品手続きをお願い申し上げます。
            </p>
            <p>
              不良品の場合、代替品の送付または全額返金のいずれかをお選びいただけます。
            </p>
          </section>

          <section className={styles.section}>
            <h2>返品の手続き</h2>
            <ol>
              <li>お問い合わせフォームより返品のご連絡をいただきます</li>
              <li>返品手続きのご案内メールをお送りいたします</li>
              <li>ご指定の住所へ商品をご返送ください</li>
              <li>返品商品のご確認後、返金処理いたします</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>注文のキャンセルについて</h2>
            <p>
              商品配送前であれば、注文のキャンセルをお受けいたします。配送済みの商品については、返品として対応させていただきます。
            </p>
            <p>
              キャンセルのお申し出は、お支払い確認後速やかにお願い申し上げます。キャンセル料金は発生いたしませんが、手数料をご負担いただく場合がございます。
            </p>
          </section>

          <section className={styles.section}>
            <h2>返金方法</h2>
            <p>
              お客様のお支払い方法に応じて、以下のとおり返金させていただきます：
            </p>
            <ul>
              <li>
                <strong>クレジットカード：</strong>
                カード会社への返金手続きとなります。返金日はカード会社によって異なります
              </li>
              <li>
                <strong>銀行振込：</strong>
                ご指定の銀行口座へ返金いたします。振込手数料はお客様ご負担とさせていただきます
              </li>
              <li>
                <strong>代金引換：</strong>
                返金チェックをお送りするか、ご指定の銀行口座へお振込みいたします
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>返品不可について</h2>
            <p>以下の商品は、返品をお受けできません：</p>
            <ul>
              <li>お客様の過失により破損・汚損した商品</li>
              <li>セール・アウトレット商品</li>
              <li>カスタマイズ商品（特注品など）</li>
              <li>商品到着後7日以上経過した商品</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>お問い合わせ</h2>
            <p>
              返品・キャンセルに関するご質問は、以下までお気軽にお問い合わせください。
            </p>
            <p>メール：info@sports-store.jp</p>
            <p>電話：0120-XXX-XXXX（月～金 9:00～18:00）</p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
