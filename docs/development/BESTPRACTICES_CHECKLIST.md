# Square Integration - Next.js + Lambda ベストプラクティス実装完了

## ✅ 実装済み項目（チェックリスト）

### フロントエンド（Next.js）

- [x] tokenize のみ（カード詳細は触らない）
- [x] sourceId（nonce: cnon_xxx）だけ送信
- [x] NEXT*PUBLIC*\* に App ID / Location ID のみ
- [x] Access Token はフロントに出さない
- [x] cardTokenizeResponseReceived で token 受け取り
- [x] エラーメッセージを即ユーザーに表示

### バックエンド（Lambda）

#### Square Customer 管理

- [x] 1 user = 1 Square Customer
- [x] squareCustomerId を DynamoDB に永続化
- [x] **reference_id に user_id を設定** ⭐（最新追加）
- [x] CreateCustomer で email, phone 送信
- [x] idempotency_key で重複作成防止
- [x] updatedAt を記録

#### カード保存（CreateCard）

- [x] source_id のみ送受信（nonce 使い捨て）
- [x] card_id を DynamoDB に永続化（NOT nonce）
- [x] card_brand, last4, expMonth/Year を保存
- [x] **fingerprint で重複カード防止** ⭐（最新追加）
- [x] DynamoDB に cardFingerprint を記録

#### 保存カード決済

- [x] source_id = card_xxx
- [x] customer_id = CUSTOMER_xxx を付与
- [x] 金額・通貨はサーバーで確定

#### セキュリティ

- [x] JWT 必須
- [x] user_id スコープでカード制御
- [x] PCI SAQ A に準拠（カード情報非保持）
- [x] TLS/HTTPS
- [x] タイムアウト: Lambda 15 秒、Square 30 秒

---

## 🔧 最新実装：reference_id + fingerprint

### CreateCustomer with reference_id

```python
customer_body = {
    "idempotency_key": str(uuid.uuid4()),
    "given_name": "Taro",
    "email_address": "taro@example.com",
    "reference_id": "USER#user123",  # ⭐ 自社ユーザーIDのマッピング
    "phone_number": "+81312345678"
}
```

**利点:**

- Square API リファレンス確認で自社ユーザーと紐づけ可能
- 監査時の追跡が容易
- Square 上での誤削除時のリカバリが簡単

### Fingerprint で重複防止

```python
# Step 3.5: Check for duplicate card
card_fingerprint = card_data.get('fingerprint')
if card_fingerprint:
    # 既存カードと比較
    for item in existing_cards:
        if item.get("cardFingerprint") == card_fingerprint:
            return error("このカードは既に登録されています")

# Save
item["cardFingerprint"] = card_fingerprint
```

**利点:**

- 同じクレジットカードの複数登録を防止
- ユーザー操作ミス回避
- 本番での「あれ、2 回登録されている？」を防止

---

## 📋 本番デプロイ前チェックリスト

### セキュリティ確認

- [ ] Access Token は環境変数管理（.env、Secrets Manager）
- [ ] NEXT*PUBLIC*\* には秘密鍵なし
- [ ] Lambda IAM: DynamoDB 読み書き, CloudWatch ログのみ
- [ ] API Gateway: CORS 適切に設定
- [ ] JWT expiration: 1 時間程度
- [ ] Refresh token は HttpOnly Cookie

### 本番テスト

- [ ] Test card で新規登録 → card_id 取得確認
- [ ] 同カード 2 回登録 → fingerprint チェック動作確認
- [ ] reference_id で Square Dashboard から自社ユーザー特定可能確認
- [ ] 保存カードで決済 → customer_id 付与確認
- [ ] エラーログが CloudWatch に出力
- [ ] タイムアウト（Lambda 15 秒以内に完了）

###運用準備

- [ ] CloudWatch Alarms: Lambda エラー率 > 1%
- [ ] CloudWatch Alarms: Square API レスポンス時間 > 5 秒
- [ ] Square Dashboard: 本番 API Key に切り替え
- [ ] ログ保持期間: 30 日
- [ ] 定期的な card metadata 更新（expired card cleanup）

### PCI 準拠確認

- [ ] **PAN (Pan Number) を一切保存しない** ✅
- [ ] **CVV を一切保存しない** ✅
- [ ] **有効期限（フロント）を一切サーバーに送らない** ✅
- [ ] **TLS/HTTPS 必須** ✅
- [ ] card_id（fingerprint なし）のみ保存 ✅
- [ ] Square iframe 使用 ✅

---

## 🚀 本番環境別の注意点

### 東京リージョン（ap-northeast-1）

```python
SQUARE_API_BASE_URL = "https://connect.squareupsandbox.com"  # sandbox
SQUARE_API_BASE_URL = "https://connect.squareup.com"         # production
```

### Lambda タイムアウト

```yaml
# serverless.yml
functions:
  addPaymentMethod:
    timeout: 15 # 15秒
  createPayment:
    timeout: 15
```

### CloudWatch Logs

```python
logger.info(f"Card saved: {card_id}, fingerprint: {card_fingerprint}")
logger.error(f"CreateCard failed: {response.status_code} - {response.text}")
```

---

## 🔐 本番で避けるべき事故パターン

| パターン             | 対策                                |
| -------------------- | ----------------------------------- |
| nonce を保存         | ❌ 一度きり、使い捨て               |
| customer_id 無し決済 | ❌ card_xxx 決済は customer_id 必須 |
| 同カード多重登録     | ✅ fingerprint チェック実装済み     |
| PAN 保存             | ✅ PCI 違反、Square 使用で回避      |
| Access Token 漏洩    | ✅ env/Secrets 管理                 |
| タイムアウト         | ✅ Lambda 15 秒、Square 30 秒       |

---

## 📊 データ構造（DynamoDB）

### User Profile

```
PK: USER#{user_id}
SK: PROFILE#{user_id}
Attributes:
  squareCustomerId: "CUSTOMER_xxx"
  reference_id: "USER#{user_id}"  // Square側の記録
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
  cardFingerprint: "fingerprint_hash"  // 重複防止用
  status: "active"
  createdAt: "2026-01-21T15:30:00Z"
```

---

## ✨ 次のステップ（MVP 後）

### 優先度: 高

- [ ] Card metadata enrichment (BIN lookup)
- [ ] Subscription support
- [ ] 3D Secure integration
- [ ] Failed payment retry logic

### 優先度: 中

- [ ] Webhook: card/customer 削除通知
- [ ] Tokenization method optimization
- [ ] Card expiration notification
- [ ] PCI audit trail

---

## 📚 参照リンク

- Square API Docs: https://developer.squareup.com/docs/payments-api
- Next.js Best Practices: https://nextjs.org/docs
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- PCI DSS: https://www.pcisecuritystandards.org/
