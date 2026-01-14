'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import styles from '@/app/policy.module.css';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className={styles.container}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 戻る
        </button>
        <h1 className={styles.title}>プライバシーポリシー</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>個人情報の取扱い</h2>
            <p>
              当サイト（Mark
              Sports）は、お客様がご提供いただく個人情報を大切に取り扱い、個人情報保護方針に従い、適切に管理してまいります。
            </p>
          </section>

          <section className={styles.section}>
            <h2>個人情報の定義</h2>
            <p>
              本プライバシーポリシーにおける「個人情報」とは、以下の情報を指します：
            </p>
            <ul>
              <li>氏名、住所、電話番号、メールアドレス</li>
              <li>生年月日、性別などの属性情報</li>
              <li>クレジットカード番号、銀行口座番号などの決済情報</li>
              <li>購買履歴、閲覧履歴などの行動情報</li>
              <li>IP アドレス、Cookie などのデバイス情報</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>個人情報の収集</h2>
            <p>当サイトは、以下の目的で個人情報を収集いたします：</p>
            <ul>
              <li>商品の配送およびご連絡のため</li>
              <li>決済処理のため</li>
              <li>サービスの向上および改善のため</li>
              <li>マーケティング調査および分析のため</li>
              <li>不正アクセス、詐欺その他の法令違反行為の防止のため</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>個人情報の使用</h2>
            <p>
              収集した個人情報は、本プライバシーポリシーに定められた目的以外には使用いたしません。ただし、法令に基づき開示を求められた場合はこの限りではありません。
            </p>
          </section>

          <section className={styles.section}>
            <h2>個人情報の第三者への提供</h2>
            <p>
              当サイトは、お客様の同意なしに個人情報を第三者へ提供することはありません。ただし、以下の場合は除きます：
            </p>
            <ul>
              <li>法令に基づき開示が必要な場合</li>
              <li>人の生命、身体、財産の保護のため必要な場合</li>
              <li>公務執行の妨害を防止する必要がある場合</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>セキュリティ</h2>
            <p>
              当サイトは、個人情報を厳重に保護するため、適切なセキュリティ対策を講じています。通信の暗号化、アクセス制限、定期的なセキュリティ監査を実施しております。
            </p>
          </section>

          <section className={styles.section}>
            <h2>お問い合わせ</h2>
            <p>
              本プライバシーポリシーに関するご質問やご不明な点がございましたら、以下までお気軽にお問い合わせください。
            </p>
            <p>メール：info@sports-store.jp</p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
