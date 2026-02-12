/**
 * 都道府県のマッピング定数
 * すべてのページで統一して使用
 */

export const PREFECTURE_OPTIONS = [
  { id: '北海道', label: '北海道' },
  { id: '青森県', label: '青森県' },
  { id: '岩手県', label: '岩手県' },
  { id: '宮城県', label: '宮城県' },
  { id: '秋田県', label: '秋田県' },
  { id: '山形県', label: '山形県' },
  { id: '福島県', label: '福島県' },
  { id: '茨城県', label: '茨城県' },
  { id: '栃木県', label: '栃木県' },
  { id: '群馬県', label: '群馬県' },
  { id: '埼玉県', label: '埼玉県' },
  { id: '千葉県', label: '千葉県' },
  { id: '東京都', label: '東京都' },
  { id: '神奈川県', label: '神奈川県' },
  { id: '新潟県', label: '新潟県' },
  { id: '富山県', label: '富山県' },
  { id: '石川県', label: '石川県' },
  { id: '福井県', label: '福井県' },
  { id: '山梨県', label: '山梨県' },
  { id: '長野県', label: '長野県' },
  { id: '岐阜県', label: '岐阜県' },
  { id: '静岡県', label: '静岡県' },
  { id: '愛知県', label: '愛知県' },
  { id: '三重県', label: '三重県' },
  { id: '滋賀県', label: '滋賀県' },
  { id: '京都府', label: '京都府' },
  { id: '大阪府', label: '大阪府' },
  { id: '兵庫県', label: '兵庫県' },
  { id: '奈良県', label: '奈良県' },
  { id: '和歌山県', label: '和歌山県' },
  { id: '鳥取県', label: '鳥取県' },
  { id: '島根県', label: '島根県' },
  { id: '岡山県', label: '岡山県' },
  { id: '広島県', label: '広島県' },
  { id: '山口県', label: '山口県' },
  { id: '徳島県', label: '徳島県' },
  { id: '香川県', label: '香川県' },
  { id: '愛媛県', label: '愛媛県' },
  { id: '高知県', label: '高知県' },
  { id: '福岡県', label: '福岡県' },
  { id: '佐賀県', label: '佐賀県' },
  { id: '長崎県', label: '長崎県' },
  { id: '熊本県', label: '熊本県' },
  { id: '大分県', label: '大分県' },
  { id: '宮崎県', label: '宮崎県' },
  { id: '鹿児島県', label: '鹿児島県' },
  { id: '沖縄県', label: '沖縄県' },
];

/**
 * 英語の都道府県名を日本語にマッピング
 * 古いデータとの互換性のため
 */
export const ENGLISH_TO_JAPANESE_PREFECTURE: { [key: string]: string } = {
  hokkaido: '北海道',
  aomori: '青森県',
  iwate: '岩手県',
  miyagi: '宮城県',
  akita: '秋田県',
  yamagata: '山形県',
  fukushima: '福島県',
  ibaraki: '茨城県',
  tochigi: '栃木県',
  gunma: '群馬県',
  saitama: '埼玉県',
  chiba: '千葉県',
  tokyo: '東京都',
  kanagawa: '神奈川県',
  niigata: '新潟県',
  toyama: '富山県',
  ishikawa: '石川県',
  fukui: '福井県',
  yamanashi: '山梨県',
  nagano: '長野県',
  gifu: '岐阜県',
  shizuoka: '静岡県',
  aichi: '愛知県',
  mie: '三重県',
  shiga: '滋賀県',
  kyoto: '京都府',
  osaka: '大阪府',
  hyogo: '兵庫県',
  nara: '奈良県',
  wakayama: '和歌山県',
  tottori: '鳥取県',
  shimane: '島根県',
  okayama: '岡山県',
  hiroshima: '広島県',
  yamaguchi: '山口県',
  tokushima: '徳島県',
  kagawa: '香川県',
  ehime: '愛媛県',
  kochi: '高知県',
  fukuoka: '福岡県',
  saga: '佐賀県',
  nagasaki: '長崎県',
  kumamoto: '熊本県',
  oita: '大分県',
  miyazaki: '宮崎県',
  kagoshima: '鹿児島県',
  okinawa: '沖縄県',
};

/**
 * 都道府県を日本語に変換する関数
 * 英語または日本語の入力に対応
 */
export const convertPrefectureToJapanese = (prefecture: string): string => {
  if (!prefecture) return '';

  // 既に日本語の場合はそのまま返す
  if (
    prefecture.includes('県') ||
    prefecture.includes('都') ||
    prefecture.includes('府')
  ) {
    return prefecture;
  }

  // 英語の場合はマッピングから変換
  const lowerPrefecture = prefecture.toLowerCase();
  return ENGLISH_TO_JAPANESE_PREFECTURE[lowerPrefecture] || prefecture;
};

/**
 * 日本語の都道府県名をIDに変換（旧マッピング互換）
 */
export const getEnglishPrefectureId = (japaneseLabel: string): string => {
  const option = PREFECTURE_OPTIONS.find((opt) => opt.label === japaneseLabel);
  return option ? option.id : japaneseLabel;
};
