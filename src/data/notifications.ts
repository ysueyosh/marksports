export interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  method: 'email' | 'site';
  read: boolean;
  tag?: 'important' | 'sale';
}

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '新商品入荷：ランニングシューズ',
    content: '最新のランニングシューズが入荷しました。今週限定で10%割引です。',
    date: '2025年12月27日',
    method: 'site',
    read: false,
    tag: 'sale',
  },
  {
    id: '2',
    title: 'セール開始：冬のスポーツウェア',
    content: '冬のスポーツウェアセールが開始しました。全商品最大30%割引。',
    date: '2025年12月26日',
    method: 'site',
    read: false,
    tag: 'sale',
  },
  {
    id: '3',
    title: 'お客様のご注文ありがとうございます',
    content:
      'ご注文いただいた商品は発送準備中です。追跡番号は別途メールでお送りします。',
    date: '2025年12月25日',
    method: 'email',
    read: true,
  },
  {
    id: '4',
    title: 'バレーボール教室開催',
    content:
      '新年1月から初心者向けバレーボール教室を開催します。詳しくはこちらをご覧ください。',
    date: '2025年12月24日',
    method: 'site',
    read: true,
  },
  {
    id: '5',
    title: 'ポイント還元キャンペーン',
    content:
      '12月1日～31日の期間中、全商品の購入でポイント2倍キャンペーン実施中。',
    date: '2025年12月23日',
    method: 'site',
    read: true,
  },
  {
    id: '6',
    title: '配送状況のご報告',
    content:
      'ご注文いただいた商品が本日配送されました。配送予定日時をご確認ください。',
    date: '2025年12月22日',
    method: 'email',
    read: true,
  },
  {
    id: '7',
    title: '新しい支払い方法に対応',
    content: 'PayPayでのお支払いに対応しました。よろしくお願いいたします。',
    date: '2025年12月21日',
    method: 'site',
    read: true,
  },
  {
    id: '8',
    title: 'メンテナンスのお知らせ',
    content: '12月28日午前2時～4時にサーバーメンテナンスを実施いたします。',
    date: '2025年12月20日',
    method: 'site',
    read: true,
    tag: 'important',
  },
  {
    id: '9',
    title: '年末年始の営業について',
    content: '12月30日～1月3日は営業をお休みさせていただきます。',
    date: '2025年12月19日',
    method: 'site',
    read: true,
  },
  {
    id: '10',
    title: '新アプリリリース',
    content:
      'Mark Sportsアプリをリリースしました。App Store、Google Playから無料でダウンロードできます。',
    date: '2025年12月18日',
    method: 'site',
    read: true,
  },
  {
    id: '11',
    title: 'お誕生日キャンペーン',
    content: 'お誕生日月は全商品10%割引クーポンをプレゼント。',
    date: '2025年12月17日',
    method: 'email',
    read: true,
  },
  {
    id: '12',
    title: 'フリマサービス開始',
    content:
      'Mark Sportsの新機能。不要なスポーツ用品をフリマで売買できるようになりました。',
    date: '2025年12月16日',
    method: 'site',
    read: true,
  },
];
