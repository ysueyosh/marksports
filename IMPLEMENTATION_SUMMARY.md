# Square API Integration - Implementation Complete ✅

## 実装内容サマリー

### 1. ✅ **User Profile に squareCustomerId フィールドを追加**

#### DynamoDB Schema (Users Table)

```
PK: USER#{user_id}
SK: PROFILE#{user_id}

属性:
  squareCustomerId: string  // ⭐ 新規追加 (null で初期化)
  name: string
  email: string
  phone: string
  sex: string
  status: string
  createdAt: string
  updatedAt: string
```

#### 修正ファイル:

- [backend/src/handlers/register.py](../../backend/src/handlers/register.py#L103)
  ```python
  'squareCustomerId': None,  # Will be populated when user adds first card
  ```

---

### 2. ✅ **CreateCustomer & CreateCard API を実装**

#### \_get_or_create_square_customer() 関数

```python
# ロジック:
1. DynamoDB PROFILE から squareCustomerId を検索
2. 存在しない場合:
   - Square CreateCustomer API を呼び出し
   - squareCustomerId をユーザープロフィールに保存
3. 存在する場合:
   - キャッシュから返す (重複作成を防止)
```

#### \_create_square_card() 関数

```python
# ロジック:
1. Square CreateCard API を呼び出し
2. Parameters:
   - source_id: cnon_xxx (nonce from Web SDK)
   - customer_id: CUSTOMER_xxx (Square Customer ID)
   - billing_address: optional
3. Square が card_id を返す
4. card_id を PaymentMethod として保存
```

#### 修正ファイル:

- [backend/src/handlers/payment.py](../../backend/src/handlers/payment.py#L31-L133)
  - `_get_or_create_square_customer()`: Lines 31-100
  - `_create_square_card()`: Lines 103-133

---

### 3. ✅ **保存カード決済時に customer_id を指定**

#### create_payment() 関数の修正

```python
# 保存カード (card_id) で支払う場合:
if source_id.startswith('card_'):
    # DynamoDB PROFILE から squareCustomerId を取得
    square_customer_id = profile_response.get("Item", {}).get("squareCustomerId")

    # payment_body に追加
    payment_body["customer_id"] = square_customer_id

# Square API に送信:
{
  "idempotency_key": "uuid",
  "amount_money": {"amount": 10000, "currency": "JPY"},
  "source_id": "card_xxx",
  "customer_id": "CUSTOMER_xxx"  // ⭐ 必須
}
```

#### 修正ファイル:

- [backend/src/handlers/payment.py](../../backend/src/handlers/payment.py#L750-L772)

---

### 4. ✅ **add_payment_method() を完全実装**

#### フロー改善

**Before (問題点):**

```python
payment_method_id = source_id  # ❌ nonce (cnon_xxx) を保存 - これはNG
```

**After (改善後):**

```python
# Step 1: Square Customer を確保
square_customer_id = _get_or_create_square_customer(user_id, table)

# Step 2: Square API で Card を作成
card_data = _create_square_card(source_id, square_customer_id, billing_address)

# Step 3: card_id を保存 (cnon_xxx ではなく card_xxx)
payment_method_id = card_data['id']  # ✅ card_id を保存
```

#### 修正ファイル:

- [backend/src/handlers/payment.py](../../backend/src/handlers/payment.py#L201-L275)

---

### 5. ✅ **DynamoDB SK フォーマットを統一**

#### 修正点:

register.py では `PROFILE#{user_id}` を使用しているが、payment.py では `PROFILE` を使用していた矛盾を解決

```python
# Before (不正):
"SK": "PROFILE"

# After (統一):
"SK": f"PROFILE#{user_id}"
```

#### 修正ファイル:

- [backend/src/handlers/payment.py](../../backend/src/handlers/payment.py)
  - Line 43, 87, 767 の 3 箇所を修正

---

### 6. ✅ **Frontend API の明確化**

#### SavedCard インターフェース

```typescript
// id フィールドについて明記
export interface SavedCard {
  id: string; // card_id from Square (card_xxx), NOT sourceId (cnon_xxx)
  lastFourDigits: string;
  cardType: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}
```

#### AddCardRequest の改善

```typescript
// 不要な brand, last4, exp* フィールドを削除
export interface AddCardRequest {
  sourceId: string;  // cnon_xxx from Web SDK
  billingAddress?: { ... };
  // ❌ 削除: brand, last4, expMonth, expYear
}
```

#### 修正ファイル:

- [frontend/src/api/payment.ts](../../frontend/src/api/payment.ts#L5-L34)

---

## 🔍 Key Differences: nonce vs card_id

| 項目                 | nonce (cnon\_)      | card*id (card*)         |
| -------------------- | ------------------- | ----------------------- |
| 生成元               | Web Payments SDK    | Square API (CreateCard) |
| 有効期限             | **一度きり** (数分) | **永続**                |
| 用途                 | 初回保存時のみ      | その後の全ての支払い    |
| 決済時の customer_id | 不要                | **必須**                |
| DynamoDB に保存      | ❌ NG               | ✅ OK                   |
| PCI 準拠             | ✅ (PAN 含まず)     | ✅ (PAN 含まず)         |

---

## 📊 カード登録 → 決済フロー

### 新規カード登録

```
[Web Browser]
    ↓ (CreditCard component tokenizes)
squareWebPayments SDK
    ↓ nonce: cnon_xxx
[Frontend /payment-methods POST]
    ↓ sourceId: cnon_xxx
[Backend add_payment_method]
    ├─ _get_or_create_square_customer(user_id)
    │   ├─ Check DynamoDB PROFILE.squareCustomerId
    │   ├─ If not exists: CreateCustomer API
    │   └─ Save CUSTOMER_xxx to PROFILE
    ├─ _create_square_card(cnon_xxx, CUSTOMER_xxx)
    │   └─ CreateCard API → card_xxx
    └─ Save PaymentMethod with card_id to DynamoDB
        └─ PK=USER#{user_id}, SK=PAYMENT_METHOD#{card_xxx}
[Response]
    └─ { id: "card_xxx", lastFourDigits: "1111", ... }
```

### 保存カードで決済

```
[Web Browser]
    ↓ sourceId: card_xxx (saved card)
[Frontend /payments POST]
    ↓ Authorization: Bearer JWT_TOKEN
[Backend create_payment]
    ├─ JWT → user_id
    ├─ DynamoDB PROFILE → squareCustomerId (CUSTOMER_xxx)
    ├─ Payments API: { source_id: card_xxx, customer_id: CUSTOMER_xxx }
[Square API]
    └─ Process payment with card_xxx linked to CUSTOMER_xxx
[Response]
    └─ { id: "payment_xxx", status: "COMPLETED", ... }
```

---

## 🚨 重要なポイント

### 1. sourceId vs card_id

```python
# ❌ WRONG - nonce を永続化
payment_method_id = source_id  # cnon_xxx

# ✅ CORRECT - card_id を永続化
payment_method_id = card_data['id']  # card_xxx
```

### 2. 保存カード決済に customer_id は必須

```python
# ❌ WRONG - customer_id を省略
{
  "source_id": "card_xxx"
}

# ✅ CORRECT - customer_id を指定
{
  "source_id": "card_xxx",
  "customer_id": "CUSTOMER_xxx"
}
```

### 3. DynamoDB イテム形式の統一

```python
# register.py の形式に合わせる
"SK": f"PROFILE#{user_id}"  # 必ず user_id を含める
```

---

## ✅ テストチェックリスト

- [ ] **ユーザー登録**
  - [ ] User PROFILE に squareCustomerId=None が保存される
- [ ] **カード登録（1 枚目）**
  - [ ] \_get_or_create_square_customer() が CreateCustomer API を呼ぶ
  - [ ] CUSTOMER_xxx が User PROFILE に保存される
  - [ ] \_create_square_card() が CreateCard API を呼ぶ
  - [ ] card_xxx がデータベースに保存される
  - [ ] API レスポンスで id=card_xxx が返される
- [ ] **カード登録（2 枚目以上）**
  - [ ] \_get_or_create_square_customer() がキャッシュから CUSTOMER_xxx を返す
  - [ ] CreateCustomer API が呼ばれない（ログで確認）
  - [ ] 新しい card_id がデータベースに保存される
- [ ] **保存カードで決済**
  - [ ] sourceId=card_xxx を送信
  - [ ] create_payment() が DynamoDB から customer_id を取得
  - [ ] Square Payments API に { source_id: card_xxx, customer_id: CUSTOMER_xxx } を送信
  - [ ] 決済が成功して payment_id が返される
- [ ] **エラーハンドリング**
  - [ ] CreateCustomer API が 4xx エラーを返す場合の処理
  - [ ] CreateCard API が 4xx エラーを返す場合の処理
  - [ ] Payments API が 4xx/5xx エラーを返す場合の処理

---

## 📝 ログ出力の確認

```bash
# createCard 成功時
Square CreateCard response status: 201
Square CreateCard response: {"card": {"id": "card_xxx", ...}}
Created Square card: card_xxx

# 保存カード決済時
Added customer_id to payment: CUSTOMER_xxx
Calling Square Payments API with: {..., "customer_id": "CUSTOMER_xxx"}
Square API response status: 200
Payment successful: payment_xxx
```

---

## 🔗 修正ファイル一覧

1. [backend/src/handlers/payment.py](../../backend/src/handlers/payment.py)

   - `_get_or_create_square_customer()` 追加
   - `_create_square_card()` 追加
   - `add_payment_method()` 完全実装
   - `create_payment()` customer_id サポート
   - DynamoDB SK フォーマット統一

2. [backend/src/handlers/register.py](../../backend/src/handlers/register.py)

   - User profile に squareCustomerId フィールド追加

3. [frontend/src/api/payment.ts](../../frontend/src/api/payment.ts)
   - SavedCard インターフェース明確化
   - AddCardRequest 簡潔化

---

## 🎯 本番への道

✅ **完了**

- Square Customer の自動作成・管理
- CreateCard API の実装
- 保存カード決済時の customer_id 指定
- DynamoDB スキーマの統一

🟡 **改善推奨** (MVP 後)

- Transactional default card switching
- Detailed Square error code mapping
- Card metadata enrichment
- PCI compliance audit
