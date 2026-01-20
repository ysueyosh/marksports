# AWS 上のリソースに接続するガイド

## 📋 前提条件

- AWS CLI がインストールされている
- AWS 認証情報が設定されている
- Python 3.11 以上

## 🔧 セットアップ手順

### ステップ 1: AWS 認証情報を設定

```bash
# AWS CLI で認証情報を設定
aws configure

# 以下の情報を入力：
AWS Access Key ID: your_access_key
AWS Secret Access Key: your_secret_key
Default region name: ap-northeast-1
Default output format: json
```

認証情報は `~/.aws/credentials` に保存されます。

### ステップ 2: 環境変数を設定

`.env` ファイルを作成して、以下の環境変数を設定：

```env
# AWS Configuration
AWS_REGION=ap-northeast-1
AWS_PROFILE=default

# Database
DYNAMODB_TABLE=ecsite-backend-dev

# Authentication
JWT_SECRET=your_jwt_secret_here_change_this_in_production

# API Configuration
STAGE=dev
API_PORT=5000
```

### ステップ 3: 仮想環境とパッケージをインストール

```bash
# 仮想環境作成
python -m venv venv

# 仮想環境有効化
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# パッケージインストール
pip install -r requirements.txt
```

### ステップ 4: ローカルサーバーを起動

```bash
python local_app.py
```

サーバーが起動すると、以下のメッセージが表示されます：

```
================================================================================
🚀  ECSITE BACKEND - LOCAL DEVELOPMENT SERVER
================================================================================

📋 API ENDPOINTS:

  🔐 AUTH
    POST   /login
    POST   /register
    ...

  🛡️  ADMIN AUTH
    POST   /admin/login
    POST   /admin/refresh-token
    POST   /admin/verify-token

🌐 Server started at http://localhost:5000
================================================================================
```

## 🧪 テスト方法

### 管理者ログイン

```bash
curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

レスポンス例（成功時）:

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "adminId": "admin_001",
    "email": "admin@example.com",
    "name": "Admin Name",
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "expiresIn": 3600
  }
}
```

### トークン検証

```bash
curl -X POST http://localhost:5000/admin/verify-token \
  -H "Content-Type: application/json" \
  -d '{"access_token":"your_token_here"}'
```

### トークンリフレッシュ

```bash
curl -X POST http://localhost:5000/admin/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"your_refresh_token_here"}'
```

## 📊 DynamoDB テーブル情報

### Admin テーブル

- **テーブル名**: `ecsite-backend-dev-admin`
- **リージョン**: `ap-northeast-1`
- **ARN**: `arn:aws:dynamodb:ap-northeast-1:681816819085:table/Admin`

### テーブルスキーマ

| 属性             | 型     | キー        | 説明                         |
| ---------------- | ------ | ----------- | ---------------------------- |
| PK               | String | Primary Key | パーティションキー           |
| SK               | String | Sort Key    | ソートキー                   |
| adminId          | String | -           | 管理者 ID                    |
| email            | String | GSI         | メールアドレス               |
| passwordHash     | String | -           | パスワードハッシュ           |
| name             | String | -           | 名前                         |
| refleshTokenHash | String | -           | リフレッシュトークンハッシュ |
| createdAt        | String | -           | 作成日時                     |
| updatedAt        | String | -           | 更新日時                     |

## ⚠️ トラブルシューティング

### AWS 認証エラー

```
botocore.exceptions.NoCredentialsError: Unable to locate credentials
```

**解決方法**:

```bash
# 認証情報を再設定
aws configure

# または環境変数で設定
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### テーブルが見つからないエラー

```
botocore.errorfactory.ResourceNotFoundException
```

**解決方法**:

- AWS マネジメントコンソールで Admin テーブルが存在することを確認
- テーブル名が正しいか確認: `ecsite-backend-dev-admin`
- リージョンが `ap-northeast-1` か確認

### 認証情報の権限エラー

```
botocore.exceptions.ClientError: An error occurred (AccessDenied)
```

**解決方法**:

- AWS IAM で DynamoDB へのアクセス権限を確認
- 必要な権限: Query, Scan, GetItem, PutItem, UpdateItem, DeleteItem

## 🔐 セキュリティ上の注意

1. **AWS 認証情報**

   - `.aws/credentials` ファイルを git に commit しない
   - `AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` は絶対に公開しない

2. **JWT シークレット**

   - `.env` ファイルを git に commit しない
   - 本番環境では強力な秘密鍵を使用

3. **ローカル開発**
   - ローカル開発にはテスト用の AWS アカウントを使用することを推奨

## 📚 参考資料

- [AWS CLI ドキュメント](https://docs.aws.amazon.com/cli/)
- [boto3 ドキュメント](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [DynamoDB ドキュメント](https://docs.aws.amazon.com/dynamodb/)
