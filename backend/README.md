# Ecsite Backend

AWS Lambda を使用した ecsite のバックエンド API です。Python で実装されています。

## 環境構築

### 前提条件

- Python 3.11 以上
- AWS CLI
- Serverless Framework

### インストール

```bash
pip install -r requirements.txt
```

または、仮想環境を使用する場合：

```bash
python -m venv venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

## 開発

### ローカル実行（開発サーバー）

```bash
python -m src.handlers.users
```

### Serverless Offline でのローカルテスト

```bash
serverless offline start
```

### コード品質チェック

```bash
# コード整形
black src/

# リント検査
flake8 src/

# 型チェック
mypy src/
```

## テスト

### テスト実行

```bash
pytest
```

### カバレッジレポート

```bash
pytest --cov=src
```

## デプロイ

### AWS へのデプロイ

```bash
serverless deploy
```

ステージを指定する場合：

```bash
serverless deploy --stage prod
```

### 特定の関数のみデプロイ

```bash
serverless deploy function -f createUser --stage dev
```

## ディレクトリ構造

```
backend/
├── src/
│   ├── handlers/        # Lambda ハンドラー
│   │   ├── users.py     # ユーザー関連
│   │   ├── products.py  # 商品関連
│   │   └── orders.py    # 注文関連
│   ├── models/          # データモデル（Pydantic）
│   │   ├── user.py
│   │   └── order.py
│   ├── utils/           # ユーティリティ
│   │   └── response.py
│   └── middleware/      # ミドルウェア
│       └── auth.py
├── tests/               # テストファイル
├── config/              # 設定ファイル
├── serverless.yml       # Serverless Framework 設定
├── requirements.txt     # Python 依存関係
├── .env.example         # 環境変数テンプレート
└── README.md
```

## API エンドポイント

### Users

- `POST /users` - ユーザー作成
- `GET /users/{id}` - ユーザー取得
- `PUT /users/{id}` - ユーザー更新
- `DELETE /users/{id}` - ユーザー削除

### Products

- `GET /products` - 商品一覧取得
- `GET /products/{id}` - 商品詳細取得

### Orders

- `POST /orders` - 注文作成
- `GET /orders/{id}` - 注文取得
- `GET /orders` - 注文一覧取得

## 使用技術

- **フレームワーク**: AWS Lambda
- **言語**: Python 3.11
- **ORM**: DynamoDB
- **バリデーション**: Pydantic
- **テスト**: pytest
- **デプロイ**: Serverless Framework

## ライセンス

MIT
