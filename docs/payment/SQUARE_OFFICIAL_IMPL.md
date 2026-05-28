# Square Card on File 実装 - 決定版

## 🎯 実装フロー（公式 API 準拠）

```
Frontend
  ↓
CreditCard.tokenize()
  ↓
sourceId (cnon_xxx)
  ↓
POST /payment-methods { sourceId, verificationToken }
  ↓
Backend
  ↓
1. JWT認証 → user_id取得
2. _get_or_create_square_customer(user_id)
   → CUSTOMER_xxx を返す
3. _create_square_card(sourceId, CUSTOMER_xxx, verificationToken)
   ↓
   POST https://connect.squareupsandbox.com/v2/cards
   {
     "idempotency_key": "uuid",
     "source_id": "cnon_xxx",
     "verification_token": "optional",
     "card": {
       "customer_id": "CUSTOMER_xxx"
     }
   }
   ↓
   Square Response: { "card": { "id": "card_xxx", "fingerprint": "..." } }
4. DynamoDB に card_id + fingerprint を保存
  ↓
Response: 201 Created
```

---

## 📋 Square CreateCard API 仕様（公式）

### Request Body

```json
{
  "idempotency_key": "string (required)",
  "source_id": "string (required - cnon_xxx)",
  "verification_token": "string (optional)",
  "card": {
    "customer_id": "string (optional but required for Card on File)",
    "reference_id": "string (optional)",
    "billing_address": { ... } (optional)
  }
}
```

### Response

```json
{
  "card": {
    "id": "card_xxx",
    "card_brand": "VISA",
    "last_4": "1111",
    "exp_month": 12,
    "exp_year": 2025,
    "fingerprint": "abc123def456"
  }
}
```

---

## ✅ 実装済み

### 1. フロント: sourceId のみを送信

```typescript
// frontend/src/api/payment.ts
export async function addCard(cardData: AddCardRequest) {
  console.log('[DIAGNOSTIC] sourceId:', cardData.sourceId);
  return apiClient.post<AddCardResponse>('/payment-methods', cardData);
}
```

### 2. バック: 公式仕様に準拠

```python
# backend/src/handlers/payment.py

card_body = {
    "idempotency_key": str(uuid.uuid4()),
    "source_id": source_id,  # ⭐ Required
}

if square_customer_id:
    card_body["card"] = {
        "customer_id": square_customer_id  # ⭐ Card on File
    }

if verification_token:
    card_body["verification_token"] = verification_token

response = requests.post(
    f"{SQUARE_API_BASE_URL}/v2/cards",
    headers=SQUARE_HEADERS,
    json=card_body,
    timeout=30
)
```

---

## 🧪 テスト用 Sandbox カード（必ず使用）

| カード   | 番号             | CVC  | 有効期限 |
| -------- | ---------------- | ---- | -------- |
| Visa     | 4532015112830366 | 任意 | 未来     |
| Discover | 6011111111111117 | 任意 | 未来     |

**例**:

- Card: `4532015112830366`
- CVC: `123`
- Exp: `12/25`
- Name: `Test User`

---

## 🔍 診断用ログ

### ブラウザコンソール (F12 → Console)

```
[DIAGNOSTIC] sourceId: cnon:card-nonce-ok-sandbox-...
[DIAGNOSTIC] sourceId type: string
[DIAGNOSTIC] sourceId length: 67
```

### バックエンド (Terminal)

```
[DIAGNOSTIC] source_id received: cnon:card-nonce-ok-sandbox-...
[DIAGNOSTIC] source_id type: <class 'str'>
[DIAGNOSTIC] source_id starts with 'cnon': True
```

### Network タブ (F12 → Network)

```
POST /payment-methods
{
  "sourceId": "cnon:card-nonce-ok-sandbox-..."
}
```

---

## 🚀 実行手順

1. **フロント ビルド**

   ```bash
   cd frontend
   npm run build
   npm run dev
   ```

2. **バック 起動**

   ```bash
   cd backend
   python local_app.py
   ```

3. **ブラウザで実行**

   - http://localhost:3000
   - Checkout → Step 3 Payment
   - 上記のテストカード番号を入力
   - "このカード情報を保存する" をチェック
   - "支払う" をクリック

4. **ログ確認**
   - ブラウザ: F12 → Console で [DIAGNOSTIC] ログ
   - Terminal: バックエンド ログで [DIAGNOSTIC] ログ
   - Network: POST `/payment-methods` request payload

---

## ✨ 実装チェックリスト

- [x] sourceId を抽出して送信（token.token のみ）
- [x] verificationToken を optional で送信
- [x] バックエンドで card オブジェクトに customer_id を指定
- [x] Sandbox テストカードを使用
- [x] 診断ログで sourceId 形式を確認
- [x] DynamoDB に card_id を永続化
- [x] fingerprint で重複チェック

---

## 🎬 次のステップ

**エラーが出たら:**

1. ブラウザコンソールで [DIAGNOSTIC] sourceId を確認
2. Network タブで request payload を確認
3. バックエンド [DIAGNOSTIC] ログで source_id を確認
4. sourceId が "cnon:" で始まらない → Sandbox SDK の tokenize() エラー
5. sourceId が正しい → テストカード番号が無効な可能性
