# Square API Integration Implementation Status

## ✅ 実装完了した内容

### 1. カード保存フロー（add_payment_method）

```
Web Browser
  ↓ (nonce: cnon_xxx)
Backend add_payment_method
  ↓
_get_or_create_square_customer()
  ├─ DynamoDB PROFILE から squareCustomerId を検索
  ├─ 存在しない場合: Square CreateCustomer API を呼び出し
  └─ squareCustomerId を PROFILE に保存
  ↓
_create_square_card()
  ├─ Square CreateCard API を呼び出し
  ├─ source_id = cnon_xxx, customer_id = squareCustomerId
  └─ Square が card_id を返す
  ↓
PaymentMethod として card_id を保存
  └─ DynamoDB: PK=USER#{user_id}, SK=PAYMENT_METHOD#{card_id}
```

### 2. 保存カード決済フロー（create_payment）

```
Web Browser
  ↓ (source_id: card_xxx)
Backend create_payment
  ├─ JWT から user_id を抽出
  ├─ source_id が card_ で始まる場合:
  │   ├─ DynamoDB PROFILE から squareCustomerId を取得
  │   └─ payment_body に "customer_id": squareCustomerId を追加
  ├─ Square Payments API を呼び出し
  └─ source_id + customer_id で決済
  ↓
Payment Result を返す
```

### 3. DynamoDB スキーマ

```
PK: USER#{user_id}
SK: PROFILE

Attributes:
  - name: string
  - email: string
  - squareCustomerId: string  ⭐ 新規追加
  - phone: string
  - ...

PK: USER#{user_id}
SK: PAYMENT_METHOD#{card_id}

Attributes:
  - paymentMethodId: string (card_id from Square, NOT cnon_)
  - brand: string
  - last4: string
  - expMonth: number
  - expYear: number
  - isMain: boolean
  - status: string
```

## 🔍 重要なポイント

### ① sourceId vs card_id

```
❌ WRONG:
payment_method_id = cnon_xxx  // nonce は一度きり

✅ CORRECT:
payment_method_id = card_xxx  // Square が発行した card_id
```

### ② customer_id の重要性

```
❌ WRONG:
payment_body = {
  "source_id": "card_xxx"
}

✅ CORRECT:
payment_body = {
  "source_id": "card_xxx",
  "customer_id": "CUSTOMER_xxx"  // 必須
}
```

### ③ 新規 vs 既存カード

```
新規カード（nonce）:
{
  "source_id": "cnon_xxx"
  // customer_id 不要
}

既存カード（card_id）:
{
  "source_id": "card_xxx",
  "customer_id": "CUSTOMER_xxx"  // 必須
}
```

## 📋 実装チェックリスト

### add_payment_method（backend/src/handlers/payment.py）

- [x] \_get_or_create_square_customer() 実装
  - [x] DynamoDB PROFILE から squareCustomerId を検索
  - [x] CreateCustomer API 呼び出し
  - [x] squareCustomerId を PROFILE に保存
- [x] \_create_square_card() 実装
  - [x] CreateCard API 呼び出し
  - [x] source_id + customer_id を指定
  - [x] card_id を返す
- [x] payment_method_id を card_id に変更
- [x] エラーログ追加

### create_payment（backend/src/handlers/payment.py）

- [x] source*id が card* で始まる場合、customer_id を取得
- [x] DynamoDB PROFILE から squareCustomerId を取得
- [x] payment_body に customer_id を追加
- [x] エラーログ追加

### Frontend API（frontend/src/api/payment.ts）

- [x] SavedCard.id が card_id であることを明確化
- [x] AddCardRequest から不要な brand, last4, exp\* を削除

## 🧪 テスト方法

### 1. カード登録フロー

```bash
POST /payment-methods
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "sourceId": "cnon_xxx",  // Web SDK から取得
  "billingAddress": { ... }
}

# 応答:
{
  "success": true,
  "data": {
    "id": "card_xxx",  // ⭐ card_id
    "lastFourDigits": "1111",
    "cardType": "VISA",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "isDefault": true
  }
}
```

### 2. カード決済フロー

```bash
POST /payments
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

{
  "sourceId": "card_xxx",  // 保存済みカード
  "amount": 10000,
  "currency": "JPY"
}

# 応答:
{
  "success": true,
  "data": {
    "id": "payment_id",
    "status": "COMPLETED",
    "amount_money": {
      "amount": 10000,
      "currency": "JPY"
    }
  }
}
```

## ⚠️ 注意事項

### Security

- ✅ JWT 認証必須
- ✅ user_id スコープで own cards のみ操作可能
- ✅ card_id（PAN 不含）を DynamoDB に保存しても PCI 準拠

### Idempotency

- ✅ CreateCustomer, CreateCard で idempotency_key を使用
- ✅ payment_body にも idempotency_key を含める

### Error Handling

- ⚠️ Square API エラーレスポンスをパースして詳細返却
- ⚠️ 4xx エラーと 5xx エラーを区別
- ⚠️ タイムアウト（30s）を設定

## 🚀 本番での更なる改善（Future）

### 優先度: 高

1. Transactional default card switching
2. Detailed Square error code mapping
3. Card verification flow
4. PCI compliance audit

### 優先度: 中

1. Card metadata enrichment（bin チェックなど）
2. Tokenization method optimization
3. Subscription support
4. 3D Secure integration
