'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3>ポリシー</h3>
          <ul>
            <li>
              <Link href="/privacy">プライバシーポリシー</Link>
            </li>
            <li>
              <Link href="/terms">利用規約</Link>
            </li>
            <li>
              <Link href="/specific-transaction">特定商取引法に基づく表示</Link>
            </li>
            <li>
              <Link href="/returns">返品・キャンセル条件</Link>
            </li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3>会社情報</h3>
          <p>Mark Sports</p>
          <p>〒000-0000 東京都渋谷区</p>
          <p>電話：0120-XXX-XXXX</p>
          <p>メール：info@sports-store.jp</p>
          <p>営業時間：9:00～18:00（日祝除く）</p>
        </div>

        <div className={styles.column}>
          <h3>その他</h3>
          <Link href="/admin/login" className={styles.adminLink}>
            管理者ログイン
          </Link>
        </div>
      </div>

      <div className={styles.divider}>
        <p>&copy; {currentYear} Mark Sports. All rights reserved.</p>
      </div>
    </footer>
  );
}
