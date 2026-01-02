"use client";

import { useRouter } from "next/navigation";
import MainLayout from "@/components/Layout/MainLayout";
import ProductCard from "@/components/ProductCard/ProductCard";
import Link from "next/link";
import styles from "./page.module.css";

// ダミー商品データ（タグ付き）
const DUMMY_PRODUCTS = [
  {
    id: 1,
    name: "バレーボール 練習用",
    price: 3980,
    image: "/dummy/volley-ball.jpg",
    description: "スポーツブランドA製の高品質バレーボール。",
    tag: "バレー",
  },
  {
    id: 2,
    name: "バレーシューズ",
    price: 7980,
    image: "/dummy/volley-shoes.jpg",
    description: "ジャンプ力を高める設計のシューズ。",
    tag: "バレー",
  },
  {
    id: 3,
    name: "バスケットボール 公式サイズ",
    price: 6480,
    image: "/dummy/basket-ball.jpg",
    description: "屋内外対応の高品質バスケットボール。",
    tag: "バスケット",
  },
  {
    id: 4,
    name: "バスケットシューズ ハイカット",
    price: 9800,
    image: "/dummy/basket-shoes.jpg",
    description: "グリップ力抜群のハイカットシューズ。",
    tag: "バスケット",
  },
  {
    id: 5,
    name: "卓球ラケット",
    price: 4500,
    image: "/dummy/ping-racket.jpg",
    description: "初心者から上級者まで使えるラケット。",
    tag: "卓球",
  },
  {
    id: 6,
    name: "卓球台",
    price: 29800,
    image: "/dummy/ping-table.jpg",
    description: "家庭用折りたたみ卓球台。",
    tag: "卓球",
  },
  {
    id: 7,
    name: "卓球ボール 3個入り",
    price: 800,
    image: "/dummy/ping-balls.jpg",
    description: "練習用卓球ボール。",
    tag: "卓球",
  },
  {
    id: 8,
    name: "バレーボール用ユニフォーム",
    price: 5500,
    image: "/dummy/volley-wear.jpg",
    description: "吸汗速乾素材のユニフォーム。",
    tag: "バレー",
  },
  {
    id: 9,
    name: "バスケット用ウェア",
    price: 4980,
    image: "/dummy/basket-wear.jpg",
    description: "スポーティーなバスケット用ウェア。",
    tag: "バスケット",
  },
];

// カテゴリ一覧
const CATEGORIES = ["バレー", "バスケット", "卓球"];

export default function Home() {
  const router = useRouter();

  const handleProductClick = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  const getProductsByCategory = (category: string) => {
    return DUMMY_PRODUCTS.filter((p) => p.tag === category).slice(0, 5);
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Mark Sports</h1>
        <p className={styles.subtitle}>お好みのスポーツ用品をお探しください</p>

        {/* おすすめ商品セクション */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>おすすめ商品</h2>
          <div className={styles.productGrid}>
            {DUMMY_PRODUCTS.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                onClick={() => handleProductClick(product.id)}
              />
            ))}
          </div>
        </section>

        {/* カテゴリごとの商品セクション */}
        {CATEGORIES.map((category) => (
          <section key={category} className={styles.section}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.sectionTitle}>{category}</h2>
              <Link
                href={`/search?tag=${encodeURIComponent(category)}`}
                className={styles.categoryLink}
              >
                すべて見る →
              </Link>
            </div>
            <div className={styles.productGrid}>
              {getProductsByCategory(category).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </MainLayout>
  );
}
