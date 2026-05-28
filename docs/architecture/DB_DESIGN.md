# DynamoDB テーブル設計書

## 概要

AWS DynamoDB で管理するテーブル設計。e コマースプラットフォームの以下の機能を対象としています：

- ユーザー認証・プロファイル管理
- 商品カタログ管理
- 注文管理
- 支払い情報管理
- クーポン・割引管理
- 配送先住所管理
- 通知管理

---

## テーブル一覧

### 1. Users テーブル

**用途**: ユーザー情報の管理  
**パーティションキー**: `userId`  
**ソートキー**: なし

| 項目名           | 型     | 説明                                    | 例                                                  |
| ---------------- | ------ | --------------------------------------- | --------------------------------------------------- |
| userId           | String | ユーザー ID（PK）                       | `user_001`                                          |
| email            | String | メールアドレス                          | `user@example.com`                                  |
| passwordHash     | String | パスワードハッシュ値                    | `$2b$12$...`                                        |
| name             | String | ユーザー名                              | `山田太郎`                                          |
| phone            | String | 電話番号                                | `090-1234-5678`                                     |
| defaultAddressId | String | デフォルト配送先住所 ID                 | `addr_001`                                          |
| createdAt        | String | 作成日時（ISO 8601）                    | `2025-01-01T00:00:00Z`                              |
| updatedAt        | String | 更新日時（ISO 8601）                    | `2025-01-08T10:30:00Z`                              |
| status           | String | ステータス（active/inactive/suspended） | `active`                                            |
| profileImage     | String | プロフィール画像 URL                    | `https://d23pzr22xoegue.cloudfront.net/profile.jpg` |
| lastLoginAt      | String | 最終ログイン日時                        | `2025-01-08T10:30:00Z`                              |

---

### 2. UserAddresses テーブル

**用途**: ユーザーの配送先住所管理  
**パーティションキー**: `userId`  
**ソートキー**: `addressId`

| 項目名     | 型      | 説明                            | 例                     |
| ---------- | ------- | ------------------------------- | ---------------------- |
| userId     | String  | ユーザー ID（PK）               | `user_001`             |
| addressId  | String  | 住所 ID（SK）                   | `addr_001`             |
| firstName  | String  | 姓                              | `山田`                 |
| lastName   | String  | 名                              | `太郎`                 |
| phone      | String  | 電話番号                        | `090-1234-5678`        |
| postalCode | String  | 郵便番号                        | `100-0005`             |
| prefecture | String  | 都道府県                        | `東京都`               |
| address    | String  | 住所（市区町村以下）            | `千代田区丸の内1-1-1`  |
| building   | String  | ビル/マンション名（オプション） | `丸ビル 4階`           |
| isDefault  | Boolean | デフォルト配送先フラグ          | `true`                 |
| createdAt  | String  | 作成日時                        | `2025-01-01T00:00:00Z` |
| updatedAt  | String  | 更新日時                        | `2025-01-08T10:30:00Z` |

---

### 3. Products テーブル

**用途**: 商品情報管理  
**パーティションキー**: `productId`  
**ソートキー**: なし

| 項目名           | 型     | 説明                                       | 例                                          |
| ---------------- | ------ | ------------------------------------------ | ------------------------------------------- |
| productId        | String | 商品 ID（PK）                              | `prod_001`                                  |
| name             | String | 商品名                                     | `バレーボール 練習用`                       |
| price            | Number | 価格（円）                                 | `3980`                                      |
| description      | String | 商品説明                                   | `スポーツブランドA製の高品質...`            |
| categoryId       | String | サブカテゴリー ID                          | `volley-ball`                               |
| parentCategoryId | String | 親カテゴリー ID                            | `volley`                                    |
| categoryName     | String | カテゴリー名                               | `バレー`                                    |
| imageUrl         | String | 画像 URL                                   | `https://d23pzr22xoegue.cloudfront.net/...` |
| stock            | Number | 在庫数                                     | `100`                                       |
| status           | String | ステータス（active/inactive/discontinued） | `active`                                    |
| createdAt        | String | 作成日時                                   | `2025-01-01T00:00:00Z`                      |
| updatedAt        | String | 更新日時                                   | `2025-01-08T10:30:00Z`                      |

**GSI**: `categoryId-productId` (categoryId をパーティションキーとして検索を高速化)

---

### 4. Categories テーブル

**用途**: カテゴリー情報管理  
**パーティションキー**: `categoryId`  
**ソートキー**: なし

| 項目名           | 型     | 説明                               | 例                                      |
| ---------------- | ------ | ---------------------------------- | --------------------------------------- |
| categoryId       | String | カテゴリー ID（PK）                | `volley`                                |
| categoryName     | String | カテゴリー名                       | `バレー`                                |
| parentCategoryId | String | 親カテゴリー ID（null の場合は親） | `null`                                  |
| subcategories    | List   | サブカテゴリーリスト               | `[{id: "volley-ball", name: "ボール"}]` |
| displayOrder     | Number | 表示順序                           | `1`                                     |
| createdAt        | String | 作成日時                           | `2025-01-01T00:00:00Z`                  |

---

### 5. Orders テーブル

**用途**: 注文情報管理  
**パーティションキー**: `userId`  
**ソートキー**: `orderId`

| 項目名            | 型      | 説明                                                         | 例                     |
| ----------------- | ------- | ------------------------------------------------------------ | ---------------------- |
| userId            | String  | ユーザー ID（PK）                                            | `user_001`             |
| orderId           | String  | 注文 ID（SK）                                                | `order_001`            |
| orderNumber       | String  | 注文番号                                                     | `ORD-2024-0001`        |
| orderDate         | String  | 注文日時（ISO 8601）                                         | `2025-01-15T10:30:00Z` |
| status            | String  | ステータス（pending/processing/shipped/delivered/cancelled） | `pending`              |
| statusLabel       | String  | ステータスラベル                                             | `未入金`               |
| totalAmount       | Number  | 合計金額（税込）                                             | `25800`                |
| subtotal          | Number  | 小計                                                         | `24000`                |
| tax               | Number  | 消費税                                                       | `1800`                 |
| shippingCost      | Number  | 送料                                                         | `0`                    |
| discount          | Number  | 割引額                                                       | `0`                    |
| couponCode        | String  | 適用クーポンコード                                           | `SAVE10`               |
| couponDiscount    | Number  | クーポン割引額                                               | `500`                  |
| itemCount         | Number  | 商品点数                                                     | `3`                    |
| items             | List    | 注文商品リスト                                               | （下記参照）           |
| shippingAddress   | Map     | 配送先住所                                                   | （下記参照）           |
| billingAddress    | Map     | 請求先住所                                                   | （下記参照）           |
| paymentMethod     | Map     | 支払い方法                                                   | （下記参照）           |
| cancelRequestSent | Boolean | キャンセルリクエスト送信フラグ                               | `false`                |
| cancelReason      | String  | キャンセル理由                                               | `商品不要`             |
| deliveryDate      | String  | 配送予定日                                                   | `2025-01-18T15:00:00Z` |
| createdAt         | String  | 作成日時                                                     | `2025-01-15T10:30:00Z` |
| updatedAt         | String  | 更新日時                                                     | `2025-01-08T10:30:00Z` |

**items の構造**:

```json
{
  "id": "item_001",
  "productId": "prod_001",
  "productName": "スポーツシューズ",
  "quantity": 1,
  "unitPrice": 12000,
  "totalPrice": 12000,
  "image": "shoe.jpg"
}
```

**shippingAddress/billingAddress の構造**:

```json
{
  "firstName": "太郎",
  "lastName": "山田",
  "phone": "090-1234-5678",
  "postalCode": "100-0005",
  "prefecture": "東京都",
  "address": "千代田区丸の内1-1-1",
  "building": "丸ビル 4階"
}
```

**paymentMethod の構造**:

```json
{
  "type": "credit_card",
  "lastFourDigits": "4242",
  "cardType": "VISA"
}
```

**GSI**: `orderNumber` (orderNumber をパーティションキーとして注文番号から検索を高速化)

---

### 6. PaymentMethods テーブル

**用途**: ユーザーの保存済みクレジットカード情報管理  
**パーティションキー**: `userId`  
**ソートキー**: `cardId`

| 項目名         | 型      | 説明                   | 例                     |
| -------------- | ------- | ---------------------- | ---------------------- |
| userId         | String  | ユーザー ID（PK）      | `user_001`             |
| cardId         | String  | カード ID（SK）        | `card_001`             |
| cardType       | String  | カード種類             | `VISA`                 |
| lastFourDigits | String  | カード下 4 桁          | `4242`                 |
| cardholderName | String  | カード名義人           | `Taro Yamada`          |
| expiryMonth    | Number  | 有効期限月             | `12`                   |
| expiryYear     | Number  | 有効期限年             | `2025`                 |
| isDefault      | Boolean | デフォルトカードフラグ | `true`                 |
| sourceId       | String  | Square SourceId        | `cnon_...`             |
| createdAt      | String  | 作成日時               | `2025-01-01T00:00:00Z` |
| updatedAt      | String  | 更新日時               | `2025-01-08T10:30:00Z` |

---

### 7. Payments テーブル

**用途**: 支払い履歴管理  
**パーティションキー**: `orderId`  
**ソートキー**: `paymentId`

| 項目名              | 型     | 説明                                                  | 例                                    |
| ------------------- | ------ | ----------------------------------------------------- | ------------------------------------- |
| orderId             | String | 注文 ID（PK）                                         | `order_001`                           |
| paymentId           | String | 支払い ID（SK）                                       | `pay_001`                             |
| userId              | String | ユーザー ID                                           | `user_001`                            |
| amount              | Number | 支払い金額                                            | `25800`                               |
| currency            | String | 通貨                                                  | `JPY`                                 |
| status              | String | 支払いステータス（pending/completed/failed/refunded） | `completed`                           |
| paymentMethod       | String | 支払い方法                                            | `credit_card`                         |
| cardId              | String | カード ID                                             | `card_001`                            |
| squareTransactionId | String | Square トランザクション ID                            | `txn_abc123def456`                    |
| receiptNumber       | String | レシート番号                                          | `RCP_202501081030001`                 |
| receiptUrl          | String | レシート URL                                          | `https://example.com/receipt/RCP_...` |
| processingFee       | Number | 処理手数料                                            | `280`                                 |
| refundAmount        | Number | 返金額                                                | `0`                                   |
| refundDateTime      | String | 返金日時                                              | `null`                                |
| paymentDateTime     | String | 支払い日時                                            | `2025-01-15T10:30:00Z`                |
| createdAt           | String | 作成日時                                              | `2025-01-15T10:30:00Z`                |
| updatedAt           | String | 更新日時                                              | `2025-01-08T10:30:00Z`                |

**GSI**: `userId-paymentDateTime` (ユーザーの支払い履歴を時系列で取得)

---

### 8. Coupons テーブル

**用途**: クーポン情報管理  
**パーティションキー**: `couponCode`  
**ソートキー**: なし

| 項目名            | 型      | 説明                                | 例                     |
| ----------------- | ------- | ----------------------------------- | ---------------------- |
| couponCode        | String  | クーポンコード（PK）                | `SAVE10`               |
| discountType      | String  | 割引タイプ（percentage/fixed）      | `percentage`           |
| discountValue     | Number  | 割引値                              | `10`                   |
| maxDiscountAmount | Number  | 最大割引額（パーセンテージの場合）  | `500`                  |
| minOrderAmount    | Number  | 最小注文金額（固定割引の場合）      | `1000`                 |
| description       | String  | クーポン説明                        | `10%割引（最大500円）` |
| startDate         | String  | 有効開始日時                        | `2025-01-01T00:00:00Z` |
| endDate           | String  | 有効終了日時                        | `2025-12-31T23:59:59Z` |
| usageLimit        | Number  | 使用回数制限（null の場合は無制限） | `100`                  |
| usageCount        | Number  | 使用回数                            | `50`                   |
| isActive          | Boolean | 有効フラグ                          | `true`                 |
| createdAt         | String  | 作成日時                            | `2025-01-01T00:00:00Z` |
| updatedAt         | String  | 更新日時                            | `2025-01-08T10:30:00Z` |

---

### 9. Notifications テーブル

**用途**: ユーザーへの通知管理  
**パーティションキー**: `userId`  
**ソートキー**: `notificationId`

| 項目名           | 型      | 説明                                       | 例                                          |
| ---------------- | ------- | ------------------------------------------ | ------------------------------------------- |
| userId           | String  | ユーザー ID（PK）                          | `user_001`                                  |
| notificationId   | String  | 通知 ID（SK）                              | `notif_001`                                 |
| title            | String  | タイトル                                   | `新商品入荷：ランニングシューズ`            |
| content          | String  | コンテンツ                                 | `最新のランニングシューズが入荷しました...` |
| notificationType | String  | 通知タイプ（order/promotion/system/alert） | `promotion`                                 |
| tag              | String  | タグ（sale/important/info 等）             | `sale`                                      |
| deliveryMethod   | String  | 配信方法（site/email/push）                | `site`                                      |
| isRead           | Boolean | 既読フラグ                                 | `false`                                     |
| readAt           | String  | 既読日時                                   | `null`                                      |
| relatedOrderId   | String  | 関連注文 ID（オプション）                  | `null`                                      |
| createdAt        | String  | 作成日時                                   | `2025-01-08T10:30:00Z`                      |
| expiresAt        | String  | 有効期限                                   | `2025-02-08T10:30:00Z`                      |

**GSI**: `userId-createdAt` (ユーザーの通知を時系列で取得)

---

### 10. Sessions テーブル

**用途**: ユーザーセッション情報管理  
**パーティションキー**: `sessionToken`  
**ソートキー**: なし

| 項目名       | 型     | 説明                     | 例                        |
| ------------ | ------ | ------------------------ | ------------------------- |
| sessionToken | String | セッショントークン（PK） | `sess_abc123def456`       |
| userId       | String | ユーザー ID              | `user_001`                |
| accessToken  | String | アクセストークン（JWT）  | `eyJhbGciOiJIUzI1NiIs...` |
| refreshToken | String | リフレッシュトークン     | `refresh_xyz789abc123`    |
| expiresAt    | String | セッション有効期限       | `2025-01-09T10:30:00Z`    |
| ipAddress    | String | IP アドレス              | `192.168.1.1`             |
| userAgent    | String | ユーザーエージェント     | `Mozilla/5.0...`          |
| createdAt    | String | 作成日時                 | `2025-01-08T10:30:00Z`    |

**GSI**: `userId-createdAt` (ユーザーのセッション履歴を取得)  
**TTL**: `expiresAt` (自動削除設定)

---

## インデックス設計

### グローバルセカンダリインデックス（GSI）一覧

| テーブル      | GSI 名                 | PK          | SK              | 用途                             |
| ------------- | ---------------------- | ----------- | --------------- | -------------------------------- |
| Products      | categoryId-productId   | categoryId  | productId       | カテゴリーから商品一覧を取得     |
| Orders        | orderNumber            | orderNumber | (なし)          | 注文番号から注文を検索           |
| Payments      | userId-paymentDateTime | userId      | paymentDateTime | ユーザーの支払い履歴を時系列取得 |
| Notifications | userId-createdAt       | userId      | createdAt       | ユーザーの通知を時系列取得       |
| Sessions      | userId-createdAt       | userId      | createdAt       | ユーザーのセッション履歴を取得   |

---

## データ容量見積

| テーブル       | 平均レコードサイズ | 年間新規レコード数 | 予想容量    |
| -------------- | ------------------ | ------------------ | ----------- |
| Users          | 1 KB               | 10,000             | 10 MB       |
| UserAddresses  | 0.5 KB             | 50,000             | 25 MB       |
| Products       | 2 KB               | 1,000              | 2 MB        |
| Categories     | 1 KB               | 100                | 0.1 MB      |
| Orders         | 5 KB               | 100,000            | 500 MB      |
| PaymentMethods | 0.8 KB             | 50,000             | 40 MB       |
| Payments       | 1.5 KB             | 100,000            | 150 MB      |
| Coupons        | 0.5 KB             | 200                | 0.1 MB      |
| Notifications  | 1 KB               | 1,000,000          | 1,000 MB    |
| Sessions       | 0.3 KB             | 500,000            | 150 MB      |
| **合計**       | -                  | -                  | **~1.9 GB** |

---

## パーティショニング戦略

### ホットパーティションの回避

- **Orders**: `userId` + `orderId` で分散（ユーザーごとにデータを分割）
- **Notifications**: `userId` + `notificationId` で分散（ユーザーごとにデータを分割）

### スケーラビリティ確保

- 大規模データ（Orders, Notifications）は年月をソートキーに含めた設計も検討
  - 例：`orderId` = `YYYY-MM#order_001`

---

## セキュリティ考慮

1. **機密情報の暗号化**:

   - `passwordHash`: DynamoDB 暗号化有効
   - `sourceId`: AWS Secrets Manager で管理
   - `cardholderName`: カラム暗号化検討

2. **アクセス制御**:

   - IAM ポリシーで最小権限原則
   - ユーザーは自分のデータのみアクセス可能

3. **監査ログ**:
   - CloudTrail で API 呼び出しを記録
   - DynamoDB Streams で変更を追跡

---

## バックアップ・リカバリー

1. **ポイントインタイム復旧（PITR）**: 有効化
2. **On-Demand バックアップ**: 重要なテーブルは定期的にバックアップ
3. **復旧時間目標（RTO）**: 1 時間以内
4. **復旧ポイント目標（RPO）**: 15 分以内

---

## 今後の拡張

- 在庫管理システムの統合
- 返品・交換管理テーブルの追加
- ユーザーレビュー・評価テーブルの追加
- ウィッシュリスト管理テーブルの追加
- 配送追跡情報テーブルの追加
