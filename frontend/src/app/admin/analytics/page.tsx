'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import sharedStyles from '../admin-shared.module.css';
import pageStyles from './analytics.module.css';

const styles = { ...sharedStyles, ...pageStyles };

interface AnalyticsData {
  date: string;
  siteAccess: number;
  productAccess: string;
  accessCount: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [analyticsData] = useState<AnalyticsData[]>([
    {
      date: '2024-04-01',
      siteAccess: 234,
      productAccess: 'バレーボール',
      accessCount: 45,
    },
    {
      date: '2024-04-02',
      siteAccess: 287,
      productAccess: 'バスケットボール',
      accessCount: 52,
    },
    {
      date: '2024-04-03',
      siteAccess: 198,
      productAccess: '卓球ラケット',
      accessCount: 38,
    },
    {
      date: '2024-04-04',
      siteAccess: 342,
      productAccess: 'バレーボール',
      accessCount: 61,
    },
    {
      date: '2024-04-05',
      siteAccess: 289,
      productAccess: 'ボール（卓球）',
      accessCount: 44,
    },
  ]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const adminLogged = localStorage.getItem('adminLogged');
    if (!adminLogged) {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  if (!isLoggedIn) {
    return null;
  }

  const totalAccess = analyticsData.reduce(
    (sum, data) => sum + data.siteAccess,
    0
  );
  const avgAccess = Math.round(totalAccess / analyticsData.length);
  const topProduct = analyticsData.reduce((prev, current) =>
    prev.accessCount > current.accessCount ? prev : current
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>分析機能</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={styles.rangeSelect}
        >
          <option value="week">過去7日間</option>
          <option value="month">過去30日間</option>
          <option value="year">過去1年間</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>総アクセス数</h3>
          <p className={styles.statNumber}>{totalAccess.toLocaleString()}</p>
          <p className={styles.statSubtext}>全期間</p>
        </div>
        <div className={styles.statCard}>
          <h3>平均日次アクセス</h3>
          <p className={styles.statNumber}>{avgAccess}</p>
          <p className={styles.statSubtext}>1日あたり</p>
        </div>
        <div className={styles.statCard}>
          <h3>最も人気な商品</h3>
          <p className={styles.statNumber}>{topProduct.productAccess}</p>
          <p className={styles.statSubtext}>
            {topProduct.accessCount}回のアクセス
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>分析期間</h3>
          <p className={styles.statNumber}>{analyticsData.length}</p>
          <p className={styles.statSubtext}>日間のデータ</p>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2 className={styles.chartTitle}>サイトアクセス推移</h2>
        <div className={styles.chart}>
          {analyticsData.map((data, index) => {
            const maxAccess = Math.max(
              ...analyticsData.map((d) => d.siteAccess)
            );
            const height = (data.siteAccess / maxAccess) * 100;
            return (
              <div key={index} className={styles.chartBar}>
                <div
                  className={styles.bar}
                  style={{ height: `${height}%` }}
                  title={`${data.date}: ${data.siteAccess}アクセス`}
                />
                <label>{data.date.split('-')[2]}</label>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h2 className={styles.chartTitle}>商品別アクセス数</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>日付</th>
              <th>サイトアクセス数</th>
              <th>人気商品</th>
              <th>商品アクセス数</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.map((data) => (
              <tr key={data.date}>
                <td>{data.date}</td>
                <td>{data.siteAccess}</td>
                <td>{data.productAccess}</td>
                <td>{data.accessCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
