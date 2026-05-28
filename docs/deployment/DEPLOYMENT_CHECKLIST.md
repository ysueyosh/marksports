# AWS Lambda デプロイ前チェックリスト

## 🔴 現状足りてないところ

### 1. Python パッケージ初期化（最優先）✋

- [x] `src/__init__.py` 作成
- [x] `src/handlers/__init__.py` 作成
- [x] `src/utils/__init__.py` 作成
- [x] `src/models/__init__.py` 作成

**理由**: Lambda にデプロイする際、Python パッケージとして認識されないとハンドラーのインポートが失敗します。

### 2. Lambda 依存関係の検証 ⚠️

- [x] requirements.txt の本番環境対応検証
- [x] python-dotenv を Lambda では不使用に設定（Lambda は環境変数が組み込まれているため不要）
- [x] requests, boto3, PyJWT などの必須ライブラリが記述されているか確認

### 3. IAM ロール・ポリシー設定 🔐

- [ ] CloudWatch Logs への書き込み権限自動追加確認
- [ ] DynamoDB すべてテーブルへの権限（複数リソース定義）
- [ ] SES メール送信権限の確認
- [ ] SSM Parameter Store 読み取り権限の確認

### 4. ネットワーク・VPC設定

- [ ] Lambda が DynamoDB にアクセス可能か（同一リージョン ap-northeast-1）
- [ ] Lambda が SES にアクセス可能か
- [ ] Lambda が外部API（Square）にアクセス可能か（インターネットアクセス可能）

### 5. CloudWatch ロギング 📊

- [ ] CloudWatch Logs グループの自動作成確認
- [ ] ログ保持期間の設定検討（コスト削減のため）

### 6. API ゲートウェイ設定

- [ ] CORS ヘッダー設定確認（フロントエンドからのアクセス許可）
- [ ] レート制限の設定（API 悪用防止）
- [ ] API キーの設定（必要に応じて）

---

## ✅ 実施済み項目

### 1. serverless.yml の修正

- [x] `getOrders` API (GET /orders) - ユーザー注文一覧取得
- [x] `getOrderDetail` API (GET /orders/{id}) - ユーザー注文詳細取得
- [x] `cancelOrder` API (POST /orders/{id}/cancel) - キャンセル申請
- [x] 環境変数を serverless.yml に追加
  - USERS_TABLE_NAME
  - ADMIN_TABLE_NAME
  - COMMERCE_TABLE_NAME
  - SQUARE_ACCESS_TOKEN (SSM Parameter Store)
  - SQUARE_ENVIRONMENT
  - ORDER_FROM_EMAIL (SSM Parameter Store)
  - FRONTEND_URL
- [x] IAM パーミッション追加
  - DynamoDB: GSI_MAIL へのアクセス
  - SES: メール送信権限
  - SSM: Parameter Store 読み取り権限

### 2. コード品質確認

- [x] Lambda 互換形式：全ハンドラーが (event, context) の正しい形式
- [x] 共通処理：auth.py, jwt.py, dynamodb.py で共通化
- [x] 環境変数：os.environ.get() で適切に取得

---

## 🚀 AWS Lambda デプロイ手順（ステップバイステップ）

### ステップ 1: 前提条件の確認

```bash
# 1. AWS CLI がインストールされているか確認
aws --version
# 出力例: aws-cli/2.13.0 Python/3.11.0 Windows/10.0.19045

# 2. Serverless Framework がインストールされているか確認
serverless --version
# 出力例: Framework Core: 3.37.0

# インストールされていない場合
npm install -g serverless

# 3. AWS クレデンシャルが設定されているか確認
aws sts get-caller-identity
# 出力例:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-user"
# }
```

### ステップ 2: Python パッケージの初期化（必須）

```bash
cd c:\ecsite\backend

# PowerShell で実行する場合
New-Item -ItemType File -Path src/__init__.py -Force
New-Item -ItemType File -Path src/handlers/__init__.py -Force
New-Item -ItemType File -Path src/utils/__init__.py -Force
New-Item -ItemType File -Path src/models/__init__.py -Force

# 各ファイルが作成されたか確認
Get-ChildItem -Path src -Name "__init__.py" -Recurse
```

### ステップ 3: AWS SSM Parameter Store に環境変数を設定

```bash
# 開発環境用の環境変数設定
aws ssm put-parameter \
  --name /ecsite/dev/square/access-token \
  --value "YOUR_DEV_SQUARE_ACCESS_TOKEN_HERE" \
  --type SecureString \
  --region ap-northeast-1

aws ssm put-parameter \
  --name /ecsite/dev/email/from-address \
  --value "dev-noreply@example.com" \
  --type String \
  --region ap-northeast-1

# 本番環境用の環境変数設定
aws ssm put-parameter \
  --name /ecsite/prod/square/access-token \
  --value "YOUR_PROD_SQUARE_ACCESS_TOKEN_HERE" \
  --type SecureString \
  --region ap-northeast-1

aws ssm put-parameter \
  --name /ecsite/prod/email/from-address \
  --value "noreply@example.com" \
  --type String \
  --region ap-northeast-1

# 設定されたか確認
aws ssm get-parameter \
  --name /ecsite/prod/email/from-address \
  --region ap-northeast-1
```

### ステップ 4: SES（メール送信）の設定

```bash
# メールアドレスを SES で検証
aws ses verify-email-identity \
  --email-address noreply@example.com \
  --region ap-northeast-1

# 検証済みメールアドレス一覧を確認
aws ses list-verified-email-addresses --region ap-northeast-1

# テスト送信でメール送信可能か確認
aws ses send-email \
  --from noreply@example.com \
  --to your-test-email@example.com \
  --subject "AWS Lambda Test Email" \
  --text "This is a test email from Lambda." \
  --region ap-northeast-1
```

### ステップ 5: Serverless Framework で Lambda にデプロイ

```bash
cd c:\ecsite\backend

# 開発環境へのデプロイ
serverless deploy --stage dev --region ap-northeast-1

# 本番環境へのデプロイ
serverless deploy --stage prod --region ap-northeast-1

# デプロイ実行中の出力例:
# Deploying ecsite-backend to stage prod (ap-northeast-1)
#
# ✔ Service deployed to stack ecsite-backend-prod
#
# endpoints:
#   POST - https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/login
#   GET - https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/orders
#   GET - https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/orders/{id}
#   ...
```

### ステップ 6: デプロイ後の動作確認

```bash
# CloudFormation スタック確認
aws cloudformation describe-stacks \
  --stack-name ecsite-backend-prod \
  --region ap-northeast-1

# Lambda 関数一覧確認
aws lambda list-functions \
  --region ap-northeast-1 \
  | grep ecsite-backend-prod

# API Gateway エンドポイント確認
aws apigateway get-rest-apis --region ap-northeast-1

# CloudWatch ログ確認
aws logs tail /aws/lambda/ecsite-backend-prod-login --follow --region ap-northeast-1
```

### ステップ 7: フロントエンド側の API エンドポイント更新

デプロイ完了後、フロントエンドで API エンドポイントを更新：

```bash
# frontend/.env.local ファイルを作成または更新
NEXT_PUBLIC_API_URL=https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
```

### ステップ 8: 個別関数のデプロイ（更新が必要な場合）

```bash
# 特定の関数のみをデプロイ（すべて再デプロイではなく部分更新）
serverless deploy function -f getOrders --stage prod --region ap-northeast-1
serverless deploy function -f getOrderDetail --stage prod --region ap-northeast-1
serverless deploy function -f cancelOrder --stage prod --region ap-northeast-1
```

### ステップ 9: ロールバック手順（トラブル時）

```bash
# CloudFormation で前のバージョンに戻す
aws cloudformation update-stack \
  --stack-name ecsite-backend-prod \
  --use-previous-template \
  --region ap-northeast-1

# または完全に削除（すべてのリソースが削除される）
serverless remove --stage prod --region ap-northeast-1
```

---

## 🔧 トラブルシューティング

### Lambda から DynamoDB にアクセスできない

```bash
# IAM ロールのポリシー確認
aws iam list-role-policies \
  --role-name ecsite-backend-prod-ap-northeast-1-lambdaRole

# ロールのインライン・ポリシー確認
aws iam get-role-policy \
  --role-name ecsite-backend-prod-ap-northeast-1-lambdaRole \
  --policy-name lambda-policy
```

### SES メール送信エラー

```bash
# SES が Sandbox 状態でないか確認
aws ses get-account-sending-enabled --region ap-northeast-1

# 検証済みメールアドレス一覧確認
aws ses list-verified-email-addresses --region ap-northeast-1

# 送信制限確認
aws ses get-send-quota --region ap-northeast-1
```

### Lambda 実行時間がタイムアウトする

serverless.yml に以下を追加して実行時間を延長：

```yaml
provider:
  timeout: 30 # デフォルト 6 秒から 30 秒に変更
  memorySize: 512 # メモリサイズを増加（CPU 性能向上）
```

### Lambda Cold Start を最適化

```yaml
# 特定の関数で Provisioned Concurrency を設定
functions:
  getOrders:
    handler: src.handlers.order.get_orders
    reservedConcurrency: 2 # 常に 2 インスタンスを保持
```

---

## 📝 ローカルテスト（デプロイ前）

```bash
# 方法 1: Serverless Framework でローカルシミュレート
serverless invoke local --function getOrders --stage dev

# 方法 2: Flask でローカルテスト（推奨）
cd c:\ecsite\backend
python local_app.py
# ブラウザで http://localhost:5000 にアクセス
```

---

## 📋 デプロイ前最終チェックリスト

デプロイする前に必ず確認：

- [ ] Python **init**.py ファイルが src/ 以下に作成されている
- [ ] AWS CLI がインストール且つ設定されている
- [ ] AWS クレデンシャルが正しく設定されている
- [ ] SSM Parameter Store に環境変数が設定されている
- [ ] SES でメールアドレスが検証されている
- [ ] serverless.yml の構文がエラーなし（serverless validate）
- [ ] ローカルテストで動作確認済み（python local_app.py）
- [ ] フロントエンドの API エンドポイント設定確認済み
- [ ] requirements.txt に必要なライブラリがすべて記述されている

---

## 📊 DynamoDB テーブル確認

serverless.yml でテーブル作成が自動化されます：

```bash
# DynamoDB テーブル一覧確認
aws dynamodb list-tables --region ap-northeast-1

# 期待されるテーブル：
# - ecsite-backend-dev-users
# - ecsite-backend-dev-admin
# - ecsite-backend-dev-commerce
# - ecsite-backend-prod-users
# - ecsite-backend-prod-admin
# - ecsite-backend-prod-commerce

# テーブル詳細確認
aws dynamodb describe-table \
  --table-name ecsite-backend-prod-users \
  --region ap-northeast-1
```
