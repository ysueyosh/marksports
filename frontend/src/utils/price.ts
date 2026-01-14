/**
 * 価格計算ユーティリティ
 * すべての価格を税込表示（消費税10%）で統一
 */

const TAX_RATE = 0.1;

/**
 * 税抜き価格から税込み価格を計算
 * @param price 税抜き価格
 * @returns 税込み価格
 */
export const calculateTaxIncludedPrice = (price: number): number => {
  return Math.floor(price * (1 + TAX_RATE));
};

/**
 * 税込み価格を表示用にフォーマット
 * @param price 税抜き価格
 * @returns フォーマットされた税込み価格（¥1,100など）
 */
export const formatPriceIncludedTax = (price: number): string => {
  const taxIncludedPrice = calculateTaxIncludedPrice(price);
  return `¥${taxIncludedPrice.toLocaleString("ja-JP")}`;
};

/**
 * 税込み価格を数値で取得（フォーマットなし）
 * @param price 税抜き価格
 * @returns 税込み価格（数値）
 */
export const getPriceWithTax = (price: number): number => {
  return calculateTaxIncludedPrice(price);
};
