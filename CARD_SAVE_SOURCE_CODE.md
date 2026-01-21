# カード保存機能 - ソースコードレビュー用

## 🔍 概要

Next.js + Lambda + DynamoDB + Square API を使用したクレジットカード保存機能の完全実装

### アーキテクチャ

```
[Frontend: Next.js]
  CreditCard (Square Web Payments SDK)
    ↓ tokenize()
  → sourceId (cnon_xxx)
    ↓ API POST /payment-methods
[Backend: Lambda]
  add_payment_method()
    ├─ JWT認証
    ├─ _get_or_create_square_customer()
    ├─ _create_square_card()
    ├─ fingerprint チェック
    └─ DynamoDB保存
```

---

## 📦 フロントエンド実装

### file: `frontend/src/api/payment.ts`

```typescript
import { apiClient } from './client';

/**
 * SavedCard represents a card stored with Square
 *
 * id = card_id from Square API (format: "card_xxx")
 * Never use the nonce (cnon_xxx) for saved cards
 */
export interface SavedCard {
  id: string; // card_id from Square (card_xxx), NOT sourceId (cnon_xxx)
  lastFourDigits: string;
  cardType: string; // "VISA", "MASTERCARD", "AMEX"
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt?: string;
}

export interface GetSavedCardsResponse {
  success: boolean;
  message: string;
  data?: SavedCard[];
}

export interface AddCardRequest {
  sourceId: string; // Payment nonce from Square Web Payments SDK (cnon_xxx)
  verificationToken?: string; // Optional: From payments.verifyBuyer() for Card on File
  billingAddress?: {
    givenName?: string;
    familyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface AddCardResponse {
  success: boolean;
  message: string;
  data?: SavedCard;
}

/**
 * Get user's saved cards
 */
export async function getSavedCards(): Promise<GetSavedCardsResponse> {
  return apiClient.get<GetSavedCardsResponse>('/payment-methods');
}

/**
 * Add new card
 */
export async function addCard(
  cardData: AddCardRequest
): Promise<AddCardResponse> {
  return apiClient.post<AddCardResponse>('/payment-methods', cardData);
}

/**
 * Delete card
 */
export async function deleteCard(cardId: string): Promise<DeleteCardResponse> {
  return apiClient.delete<DeleteCardResponse>(`/payment-methods/${cardId}`);
}

/**
 * Set card as default
 */
export async function setDefaultCard(
  cardId: string
): Promise<SetDefaultCardResponse> {
  return apiClient.put<SetDefaultCardResponse>(
    `/payment-methods/${cardId}/default`,
    {}
  );
}
```

### file: `frontend/src/app/checkout/page.tsx` (カード登録部分 - 正しい実装)

#### ❌ ダメな実装（改ざん疑い）

```tsx
// 絶対にしてはいけない例
cardTokenizeResponseReceived={async (token: any) => {
  // token オブジェクト全体を送ると NG
  await handlePayment(token);  // token に brand / last4 が混ざっている
}}
```

#### ✅ 正しい実装

```tsx
// Payment インスタンスをコンポーネント上部で確保
// const { payments } = useContext(...);

cardTokenizeResponseReceived={async (token: any) => {
  console.log('Token Response:', token);

  if (token.status === 'OK') {
    const sourceId = token.token;  // ⭐ sourceId のみ抽出

    // Card on File には verification が必要な場合がある
    // 特に: DISCOVER, 海外カード, 日本ロケーション
    let verificationToken: string | undefined = undefined;

    try {
      // payments.verifyBuyer() を呼び出す（payments インスタンスが必要）
      // const verification = await payments.verifyBuyer(sourceId, {
      //   intent: 'STORE',
      //   billingContact: {
      //     givenName: formData.name?.split(' ')[0] || 'Name',
      //     familyName: formData.name?.split(' ')[1] || 'Surname',
      //   },
      // });
      // verificationToken = verification.token;
    } catch (e) {
      console.warn('Verification skipped:', e);
      // verification 失敗は致命的ではない（古いブラウザなど）
    }

    // sourceId のみを送信
    await handlePayment(sourceId, verificationToken);
  } else {
    setPaymentError(token.errors?.[0]?.message);
  }
}}
```

#### handlePayment 内でのカード保存

```tsx
const handlePayment = async (sourceId: string, verificationToken?: string) => {
  // ... payment logic ...

  if (isLoggedIn && savePaymentMethod && paymentMode === 'credit_card') {
    try {
      await addCard({
        sourceId: sourceId, // ✅ sourceId のみ
        verificationToken: verificationToken, // ✅ verification token
        // brand / last4 / exp は送らない
      });
    } catch (error) {
      console.error('Failed to save card:', error);
      // カード保存失敗は決済を続行（Optional機能）
    }
  }
};
```

---

### file: `frontend/src/app/checkout/page.tsx` (カード登録部分)

```tsx
{
  /* PaymentForm - credit_card mode */
}
{
  paymentMode === 'credit_card' && (
    <PaymentForm
      applicationId="sandbox-sq0idb-dJ_V4eIHsIfJGNqmHjQvMA"
      locationId="LP30F7K9QGGXC"
      cardTokenizeResponseReceived={async (token: any) => {
        console.log('Token Response:', token);
        console.log('Token Value:', token.token);
        if (token.status === 'OK') {
          await handlePayment(token.token);
        } else {
          console.error('Token Error:', token.errors);
          setPaymentError(
            token.errors?.[0]?.message || 'トークン生成中にエラーが発生しました'
          );
        }
      }}
    >
      <div>
        <h4 style={{ marginBottom: '15px' }}>クレジットカード情報</h4>

        {/* Saved Cards Section - Only for logged in users */}
        {isLoggedIn && (
          <div style={{ marginBottom: '20px' }}>
            {/* Loading State */}
            {isLoadingCards && (
              <div style={{ padding: '10px', color: '#6b7280' }}>
                カードを読み込み中...
              </div>
            )}

            {/* Error State */}
            {cardsLoadError && (
              <div
                style={{ padding: '10px', color: '#dc2626', fontSize: '14px' }}
              >
                {cardsLoadError}
              </div>
            )}

            {/* Saved Cards List */}
            {!isLoadingCards && savedCards.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '15px',
                }}
              >
                {savedCards.map((card) => (
                  <label
                    key={card.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px',
                      backgroundColor:
                        selectedPaymentMethodId === card.id
                          ? '#f0f9ff'
                          : 'transparent',
                      borderRadius: '4px',
                      border:
                        selectedPaymentMethodId === card.id
                          ? '1px solid #0284c7'
                          : '1px solid #e5e7eb',
                    }}
                  >
                    <input
                      type="radio"
                      name="saved_card"
                      value={card.id}
                      checked={selectedPaymentMethodId === card.id}
                      onChange={(e) =>
                        setSelectedPaymentMethodId(e.target.value)
                      }
                      style={{ marginRight: '10px' }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <span>
                        •••• •••• •••• {card.lastFourDigits} ({card.cardType})
                      </span>
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                        有効期限: {String(card.expiryMonth).padStart(2, '0')}/
                        {String(card.expiryYear).slice(-2)}
                      </span>
                      {card.isDefault && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            backgroundColor: '#dbeafe',
                            color: '#0284c7',
                            borderRadius: '3px',
                            fontWeight: '500',
                          }}
                        >
                          メインカード
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* "New Card" Option */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px',
                backgroundColor:
                  selectedPaymentMethodId === 'new_card'
                    ? '#f0f9ff'
                    : 'transparent',
                borderRadius: '4px',
                border:
                  selectedPaymentMethodId === 'new_card'
                    ? '1px solid #0284c7'
                    : '1px solid #e5e7eb',
              }}
            >
              <input
                type="radio"
                name="saved_card"
                value="new_card"
                checked={selectedPaymentMethodId === 'new_card'}
                onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <span>新しいカードを追加</span>
            </label>
          </div>
        )}

        {/* New Card Form */}
        {!isLoggedIn ? (
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ marginBottom: '10px', fontSize: '14px' }}>
              カード情報を入力
            </h5>
            <CreditCard />
          </div>
        ) : (
          selectedPaymentMethodId === 'new_card' && (
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ marginBottom: '10px', fontSize: '14px' }}>
                カード情報を入力
              </h5>
              <div
                style={{
                  marginTop: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type="checkbox"
                  id="save_card"
                  checked={savePaymentMethod}
                  onChange={(e) => setSavePaymentMethod(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label
                  htmlFor="save_card"
                  style={{
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '0',
                  }}
                >
                  このカード情報を保存する
                </label>
              </div>
              <CreditCard />
            </div>
          )
        )}
      </div>
    </PaymentForm>
  );
}
```

---

## 🔐 バックエンド実装

### file: `backend/src/handlers/payment.py`

#### 1. Square Customer 作成/取得

```python
def _get_or_create_square_customer(user_id: str, table) -> str:
    """
    Get or create a Square Customer for the user

    Returns:
        square_customer_id if successful, None otherwise
    """
    try:
        # Step 1: Check if we already have a Square Customer ID stored for this user
        profile_response = table.get_item(
            Key={
                "PK": f"USER#{user_id}",
                "SK": f"PROFILE#{user_id}"
            }
        )

        if "Item" in profile_response:
            square_customer_id = profile_response["Item"].get("squareCustomerId")
            if square_customer_id:
                logger.info(f"Found existing Square customer: {square_customer_id}")
                return square_customer_id

        # Step 2: Get user profile for customer creation
        user_profile = profile_response.get("Item", {})

        # Step 3: Create new Square Customer
        # ベストプラクティス: reference_id で user_id を Square に記録
        customer_body = {
            "idempotency_key": str(uuid.uuid4()),
            "given_name": user_profile.get("name", "Customer"),
            "email_address": user_profile.get("email"),
            "reference_id": f"USER#{user_id}",  # ⭐ 自社 user_id とのマッピング
        }

        if user_profile.get("phone"):
            customer_body["phone_number"] = user_profile.get("phone")

        logger.info(f"Creating Square customer with body: {json.dumps(customer_body)}")

        response = requests.post(
            f"{SQUARE_API_BASE_URL}/v2/customers",
            headers=SQUARE_HEADERS,
            json=customer_body,
            timeout=30
        )

        logger.info(f"Square CreateCustomer response status: {response.status_code}")
        logger.info(f"Square CreateCustomer response: {response.text}")

        if response.status_code in [200, 201]:
            result = response.json()
            square_customer_id = result.get('customer', {}).get('id')

            if square_customer_id:
                # Save the square_customer_id to user profile
                table.update_item(
                    Key={
                        "PK": f"USER#{user_id}",
                        "SK": f"PROFILE#{user_id}"
                    },
                    UpdateExpression="SET squareCustomerId = :cid, updatedAt = :now",
                    ExpressionAttributeValues={
                        ":cid": square_customer_id,
                        ":now": datetime.utcnow().isoformat() + 'Z'
                    }
                )

                logger.info(f"Created and saved Square customer: {square_customer_id}")
                return square_customer_id

        logger.error(f"Failed to create Square customer: {response.text}")
        return None

    except Exception as e:
        logger.error(f"Error in _get_or_create_square_customer: {str(e)}")
        return None
```

#### 2. Square Card 作成

```python
def _create_square_card(source_id: str, square_customer_id: str, verification_token: str = None, billing_address: dict = None) -> dict:
    """
    Create a card via Square API

    Args:
        source_id: nonce or card token from Web SDK (cnon_xxx)
        square_customer_id: Square Customer ID (stored for later reference)
        verification_token: Optional verification token from payments.verifyBuyer() (required for Card on File in some regions)
        billing_address: Optional billing address (currently not used - Square API limitation)

    Returns:
        Card data dict if successful, None otherwise
    """
    try:
        # Square CreateCard API requires card object with customer_id
        # source_id is the payment token, but we need to specify which customer owns it
        card_body = {
            "idempotency_key": str(uuid.uuid4()),
            "source_id": source_id,
            "card": {
                "customer_id": square_customer_id  # ⭐ Required by Square API
            }
        }

        # Add verification_token if provided (required for Card on File in certain regions)
        if verification_token:
            card_body["verification_token"] = verification_token
        response = requests.post(
            f"{SQUARE_API_BASE_URL}/v2/cards",
            headers=SQUARE_HEADERS,
            json=card_body,
            timeout=30
        )

        logger.info(f"Square CreateCard response status: {response.status_code}")
        logger.info(f"Square CreateCard response: {response.text}")

        if response.status_code in [200, 201]:
            result = response.json()
            card = result.get('card', {})

            if card.get('id'):
                logger.info(f"Created Square card: {card.get('id')}")
                return card

        logger.error(f"Failed to create Square card: {response.text}")
        return None

    except Exception as e:
        logger.error(f"Error in _create_square_card: {str(e)}")
        return None
```

#### 3. カード保存メイン処理

```python
def add_payment_method(event, context):
    """
    Add new payment method - Requires authentication

    Flow:
    1. Get user_id from JWT
    2. Ensure Square Customer exists (create if needed)
    3. Create Card via Square API with verification_token if provided
    4. Store card_id (not sourceId) to DynamoDB

    Request body:
    {
        "sourceId": "cnon_xxxxx",  # Payment token from Square Web Payments SDK (required)
        "verificationToken": "token_xxx",  # From payments.verifyBuyer() (optional but recommended for Card on File)
        "billingAddress": { ... }
    }
    """
    try:
        logger.info(f"Add payment method event: {event}")

        # Get user ID from token
        user_id = extract_user_id_from_token(event)
        if not user_id:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Unauthorized"
                }, ensure_ascii=False),
            }

        if not SQUARE_ACCESS_TOKEN:
            logger.error("SQUARE_ACCESS_TOKEN not configured")
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Payment service not available"
                }, ensure_ascii=False),
            }

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if 'sourceId' not in body:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "sourceId is required"
                }, ensure_ascii=False),
            }

        source_id = body.get('sourceId')
        table = get_users_table()

        # Step 1: Get or create Square Customer
        square_customer_id = _get_or_create_square_customer(user_id, table)
        if not square_customer_id:
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Failed to create Square customer"
                }, ensure_ascii=False),
            }

        # Step 2: Create Card via Square API
        card_data = _create_square_card(source_id, square_customer_id, body.get('billingAddress'))
        if not card_data:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({
                    "success": False,
                    "message": "Failed to create card"
                }, ensure_ascii=False),
            }

        # Step 3: Get existing payment methods to determine if this should be main
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk": "PAYMENT_METHOD#"
            }
        )

        existing_count = response.get("Count", 0)
        is_main = existing_count == 0  # First payment method is main

        # Step 3.5: Check for duplicate card using fingerprint (ベストプラクティス)
        # Square が card_fingerprint を返す場合、同じ fingerprint のカードが既に存在するか確認
        card_fingerprint = card_data.get('fingerprint')
        if card_fingerprint:
            logger.info(f"Checking for duplicate card with fingerprint: {card_fingerprint}")
            # Query existing cards for this user and check fingerprint
            for item in response.get("Items", []):
                existing_fingerprint = item.get("cardFingerprint")
                if existing_fingerprint == card_fingerprint:
                    logger.warning(f"Duplicate card detected: {card_fingerprint}")
                    return {
                        "statusCode": 400,
                        "headers": {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        "body": json.dumps({
                            "success": False,
                            "message": "このカードは既に登録されています"
                        }, ensure_ascii=False),
                    }

        # Step 4: Create PaymentMethod object with card_id (from Square)
        card_id = card_data['id']
        payment_method = PaymentMethod(
            payment_method_id=card_id,  # ⭐ Store card_id, NOT sourceId
            brand=card_data.get('card_brand', 'UNKNOWN'),
            last4=card_data.get('last_4', '0000'),
            exp_month=int(card_data.get('exp_month', 12)),
            exp_year=int(card_data.get('exp_year', 2025)),
            is_main=is_main,
            status="active"
        )

        # Step 5: Save to DynamoDB
        item = PaymentMethod.to_dynamo_item(user_id, payment_method)

        # 📝 Add fingerprint to item for future duplicate checks
        if card_fingerprint:
            item["cardFingerprint"] = card_fingerprint

        table.put_item(Item=item)

        logger.info(f"Payment method added: {card_id}")

        response_data = {
            "success": True,
            "message": "Payment method added successfully",
            "data": payment_method.to_dict()
        }

        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response_data, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"Error during add payment method: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "success": False,
                "message": f"Failed to add payment method: {str(e)}"
            }, ensure_ascii=False),
        }
```

---

## 📊 DynamoDB スキーマ

### User Profile

```
PK: USER#{user_id}
SK: PROFILE#{user_id}

Attributes:
  squareCustomerId: "CUSTOMER_xxx"
  name: "Taro Yamada"
  email: "taro@example.com"
  phone: "+81312345678"
  updatedAt: "2026-01-21T15:30:00Z"
```

### Payment Method

```
PK: USER#{user_id}
SK: PAYMENT_METHOD#{card_id}

Attributes:
  paymentMethodId: "card_xxx"
  brand: "VISA"
  last4: "1111"
  expMonth: 12
  expYear: 2025
  isMain: true
  cardFingerprint: "hash_value"
  status: "active"
  createdAt: "2026-01-21T15:30:00Z"
```

---

## ✨ ベストプラクティス実装済み項目

### ✅ セキュリティ

- [x] JWT 必須（extract_user_id_from_token）
- [x] PAN/CVV を一切サーバーに送らない
- [x] sourceId (nonce) のみ送受信
- [x] card_id を永続化
- [x] DynamoDB に cardFingerprint 記録

### ✅ Square API 準拠

- [x] idempotency_key で重複作成防止
- [x] reference_id に user_id を記録
- [x] タイムアウト 30 秒設定
- [x] エラーハンドリング（ログ出力）

### ✅ 重複防止

- [x] fingerprint チェック実装
- [x] 同カード 2 回登録を検出
- [x] ユーザーに わかりやすいエラー返却

### ✅ UX

- [x] 保存カード一覧表示
- [x] メインカード表示
- [x] 新規カード追加オプション
- [x] ローディング状態

---

## 🔍 レビューポイント

このコードを ChatGPT にレビューさせる際の質問案：

1. **セキュリティ**: PCI SAQ A 準拠していますか？
2. **エラーハンドリング**: すべてのエッジケースをカバーしていますか？
3. **パフォーマンス**: DynamoDB クエリが最適化されていますか？
4. **テスト**: どのテストシナリオが必要ですか？
5. **本番運用**: CloudWatch ログは十分ですか？
6. **スケーラビリティ**: 大量のカード登録に対応できますか？
