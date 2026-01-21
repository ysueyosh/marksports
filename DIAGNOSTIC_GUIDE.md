# INVALID_CARD_DATA エラー - 診断チェックリスト

## 🔍 考えられる原因

### 1️⃣ テストカード番号が無効

Square Sandbox では特定のテストカード番号のみが有効です。

### ✅ 有効な Square Sandbox テストカード

| カード種別       | カード番号       | CVC          | 有効期限        |
| ---------------- | ---------------- | ------------ | --------------- |
| Visa             | 4532015112830366 | any 3 digits | any future date |
| Mastercard       | 5105105105105100 | any 3 digits | any future date |
| American Express | 378282246310005  | any 3 digits | any future date |
| Discover         | 6011111111111117 | any 3 digits | any future date |

### ❌ テスト時に注意

- **名前**: 任意
- **郵便番号**: 任意
- **CVC**: 任意の 3-4 桁（本物でなくて OK）
- **有効期限**: 未来の日付

---

## 🔧 今実行中の診断ログ

### フロント側

```typescript
// payment.ts の addCard 関数内で以下がログ出力される:
console.log('[DIAGNOSTIC] addCard called with:', cardData);
console.log('[DIAGNOSTIC] sourceId:', cardData.sourceId);
console.log('[DIAGNOSTIC] sourceId type:', typeof cardData.sourceId);
console.log('[DIAGNOSTIC] sourceId length:', cardData.sourceId?.length);
```

**確認すべき内容:**

- `sourceId` は `string` か？
- `sourceId` は "cnon" で始まるか？
- `sourceId` の長さは合理的か（通常 50-70 文字）？

### バックエンド側

```python
# payment.py の _create_square_card 関数内で以下がログ出力される:
logger.info(f"[DIAGNOSTIC] source_id received: {source_id}")
logger.info(f"[DIAGNOSTIC] source_id type: {type(source_id)}")
logger.info(f"[DIAGNOSTIC] source_id length: {len(str(source_id))}")
logger.info(f"[DIAGNOSTIC] source_id starts with 'cnon': {str(source_id).startswith('cnon')}")
```

**確認すべき内容:**

- `source_id` は `<class 'str'>` か？
- `source_id` は "cnon" で始まるか？
- `source_id` の長さは 50-70 文字か？

---

## 🧪 次のステップ

### Step 1: テストカード番号を確認

1. **Discover** テストカードを使ってみて
   - Card Number: `6011111111111117`
   - CVC: `123`
   - Expiry: `12/25` (今後の有効期限)
   - Name: `Test User`

### Step 2: ブラウザコンソールを確認

F12 で Developer Console を開いて、以下のログが見えるか確認：

```
[DIAGNOSTIC] addCard called with: {sourceId: "cnon:...", ...}
[DIAGNOSTIC] sourceId: cnon:...
[DIAGNOSTIC] sourceId type: string
[DIAGNOSTIC] sourceId length: 67
```

### Step 3: ネットワークタブを確認

1. DevTools の Network タブを開く
2. Payment Form でカード情報を入力
3. "Save Card" をクリック
4. POST `/payment-methods` を確認
5. **Request Payload** を確認（sourceId が正しい形式か？）

### Step 4: バックエンドログを確認

Backend のコンソールに以下が表示されるか？

```
[DIAGNOSTIC] source_id received: cnon:...
[DIAGNOSTIC] source_id type: <class 'str'>
[DIAGNOSTIC] source_id length: 67
[DIAGNOSTIC] source_id starts with 'cnon': True
```

---

## 🚨 もし診断ログで分かったこと

### ケース 1: sourceId が `""`（空文字列）

```
[DIAGNOSTIC] sourceId length: 0
```

**原因**: Token 生成に失敗している  
**対策**: CreditCard component の tokenize() エラーハンドリングを確認

### ケース 2: sourceId が `"undefined"` 文字列

```
[DIAGNOSTIC] sourceId: undefined
```

**原因**: `token.token` が undefined  
**対策**: `cardTokenizeResponseReceived` で `token` 構造を確認

### ケース 3: sourceId が時刻ベースの ID

```
[DIAGNOSTIC] sourceId: 1768977360547
[DIAGNOSTIC] sourceId starts with 'cnon': False
```

**原因**: フロントで Square Nonce ではなく、独自 ID を生成している  
**対策**: `cardTokenizeResponseReceived` の実装を見直し（CreditCard の tokenize() 結果を正しく使っているか？）

### ケース 4: sourceId は正しいが Square が拒否

```
Failed to create Square card: {"errors":[{"code":"INVALID_CARD_DATA","field":"source_id"}]}
```

**原因**: テストカード番号が Sandbox に未登録  
**対策**: 上記の有効なテストカード番号を使用

---

## 📋 チェックリスト

- [ ] テストカード番号が Sandbox リストに含まれているか？
- [ ] ブラウザコンソールの [DIAGNOSTIC] ログで sourceId が表示されるか？
- [ ] sourceId は "cnon:" で始まるか？
- [ ] Network タブで Request Payload に sourceId が含まれるか？
- [ ] バックエンド [DIAGNOSTIC] ログで sourceId が "cnon" で始まるか？

---

## 💬 報告すべきログ

問題が解決しない場合、以下のログを提供してください：

1. **ブラウザコンソール** (F12 → Console):

   ```
   [DIAGNOSTIC] addCard called with: ...
   [DIAGNOSTIC] sourceId: ...
   ```

2. **Network タブ** (F12 → Network):

   - POST `/payment-methods` の Request Payload

3. **バックエンド ログ**:

   ```
   [DIAGNOSTIC] source_id received: ...
   [DIAGNOSTIC] source_id type: ...
   [DIAGNOSTIC] source_id length: ...
   ```

4. **Square Error Response**:
   ```
   Failed to create Square card: {...}
   ```
