# S3 画像アップロード実装ガイド

## 概要

新規商品登録時に画像を AWS S3 にアップロードする機能を実装しました。
**バックエンド経由で S3 にアップロード** する方式です。

## 必要な AWS 設定

### 1. S3 バケット作成

```bash
# S3 バケット名
S3_BUCKET_NAME=ecsite-images  # または marksports-images など

# リージョン
ap-northeast-1 (東京)
```

### 2. バケットポリシーの設定

CloudFront 経由での画像配信を想定する場合、以下のポリシーを設定してください：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::marksports-images/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceArn": "arn:aws:cloudfront::681816819085:distribution/E36J1VXI9LALRE"
        }
      }
    }
  ]
}
```

**ポイント：**

- バケット側にはアップロード権限を設定しない
- バックエンドの IAM ユーザーが S3 アクセス権を持つ

### 3. CORS 設定

S3 バケットの CORS 設定（バックエンドからのアクセスのため、特に設定不要ですが、必要に応じて）：

```json
[
  {
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. IAM ユーザー設定

バックエンドが S3 にアクセスするための IAM ユーザーを作成し、以下の権限を付与：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::marksports-images/products/*"
    }
  ]
}
```

## 環境変数設定

### Backend (.env)

```env
AWS_ACCESS_KEY_ID=<IAMユーザーのアクセスキーID>
AWS_SECRET_ACCESS_KEY=<IAMユーザーのシークレットアクセスキー>
S3_BUCKET_NAME=marksports-images
AWS_REGION=ap-northeast-1
```

### Frontend (.env.local)

```env
# 特に設定不要 - アップロードはバックエンド経由
```

## S3 フォルダ構造

```
s3://marksports-images/
└── products/
    ├── {productId-1}/
    │   ├── main (メイン画像)
    │   ├── 0 (サブ画像)
    │   ├── 1 (サブ画像)
    │   └── ...
    ├── {productId-2}/
    │   ├── main
    │   ├── 0
    │   └── ...
    └── ...
```

## API エンドポイント

### 画像アップロード

**URL**: `POST /admin/images/upload`

**認証**: JWT Token (Authorization header)

**リクエスト**:

```
multipart/form-data
- file: 画像ファイル
- productId: 商品ID
- imageName: 画像名 (main, 0, 1, 2, ...)
```

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "s3Url": "https://marksports-images.s3.ap-northeast-1.amazonaws.com/products/prod_001/main"
  }
}
```

## 実装フロー

### 新規商品作成の場合

1. **ユーザーが画像を選択**

   - フォームで画像ファイルを選択
   - 一時的に Base64 で保存

2. **商品情報を先に登録**

   - 商品基本情報を DB に保存 (imageUrls は空配列)
   - `productId` を取得

3. **Base64 画像をアップロード**

   - Base64 画像を Blob に変換
   - `/admin/images/upload` エンドポイントにマルチパート送信（JWT 認証付き）
   - バックエンドが S3 に直接アップロード
   - S3 URL を取得

4. **商品情報を更新**
   - 取得した S3 URL で商品の `imageUrls` を更新

### 既存商品編集の場合

1. **ユーザーが新しい画像を選択**

   - フォームで新しい画像ファイルを選択

2. **画像をアップロード**

   - `/admin/images/upload` にマルチパート送信（JWT 認証付き）
   - バックエンドが S3 に直接アップロード
   - S3 URL を取得

3. **商品情報を更新**
   - 新しい S3 URL で更新

## 実装ファイル

### Backend

- `src/utils/s3.py` - S3 ユーティリティ（`upload_image_to_s3()` 関数）
- `src/handlers/admin_image.py` - 画像アップロードエンドポイント
- `local_app.py` - Flask ルート `/admin/images/upload`

### Frontend

- `src/api/admin-images.ts` - S3 API クライアント（`uploadImage()` メソッド）
- `src/app/admin/products/page.tsx` - 画像アップロード処理

## セキュリティ考慮事項

1. **JWT 認証**

   - `/admin/images/upload` エンドポイントは JWT トークンで認証
   - 管理者のみがアップロード可能

2. **ファイルタイプの検証**

   - Frontend で画像ファイルのみを許可
   - Backend で `image/jpeg` に制限

3. **S3 バケットセキュリティ**

   - パブリックアクセスをすべてブロック
   - CloudFront 経由での配信のみ許可
   - バックエンド IAM ユーザーのみが PutObject 可能

4. **ファイルサイズの制限**
   - Backend で最大ファイルサイズをチェック（実装予定）
   - S3 バケットライフサイクル設定で古いファイルを削除

## トラブルシューティング

### 403 Forbidden エラー

- AWS 認証情報（アクセスキー）を確認
- IAM ユーザーに S3 権限があるか確認
- バケット名とリージョンが正しいか確認

### アップロード時の 401 エラー

- JWT トークンが有効か確認
- トークンが期限切れでないか確認
- `Authorization: Bearer <token>` 形式が正しいか確認

### 画像がアップロードされない

- ネットワークタブで POST リクエストのレスポンスを確認
- バックエンドのログで詳細を確認
- S3 バケットのログを有効にして詳細を確認

## 今後の拡張

1. **画像の自動リサイズ**

   - CloudFront + Lambda@Edge で動的リサイズ

2. **キャッシング**

   - CloudFront で CDN キャッシング

3. **バージョニング**

   - S3 バージョニングで履歴管理

4. **バックアップ**
   - クロスリージョンレプリケーション
