# Frontend Infrastructure Deployment Guide

## 概要

Frontend (Next.js) を AWS S3 + CloudFront で管理するための IaC スクリプトです。

**構成：**

- S3 バケット（バージョニング、CORS設定）
- CloudFront ディストリビューション（キャッシング、OAC）
- Origin Access Control（セキュアなアクセス）
- エラーページ設定（SPA ルーティング対応）
- Stage 固有の設定（dev/stage/prod）

---

## デプロイ方法

### 1. インフラストラクチャのデプロイ（初回のみ）

#### PowerShell の場合

```powershell
# Stage 環境（カスタムドメイン＋SSL証明書）
.\infra\deploy-infra.ps1 -Environment stage -DomainName stage.mark-sports.com -CertificateArn "arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID"

# Prod 環境
.\infra\deploy-infra.ps1 -Environment prod -DomainName mark-sports.com -CertificateArn "arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID"

# Dev 環境（CloudFront デフォルトドメイン使用）
.\infra\deploy-infra.ps1 -Environment dev
```

#### Bash の場合（Linux/Mac）

```bash
# Stage 環境
./infra/deploy-infra.sh stage stage.mark-sports.com "arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID"

# Prod 環境
./infra/deploy-infra.sh prod mark-sports.com "arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID"
```

**出力例：**

```
S3BucketName: ecsite-frontend-stage
CloudFrontDistributionId: E1234ABCD
CustomDomainName: stage.mark-sports.com
```

---

### 2. Frontend のビルド＆デプロイ

#### PowerShell の場合

```powershell
# Stage 環境にデプロイ
.\infra\deploy-frontend.ps1 -Environment stage

# Prod 環境にデプロイ
.\infra\deploy-frontend.ps1 -Environment prod
```

**実行内容：**

1. Next.js ビルド（`npm run build`）
2. CloudFormation から S3 バケット名を取得
3. `.next/static` と `public` をS3 にアップロード
4. HTML ファイルをアップロード
5. CloudFront キャッシュを無効化（`Invalidation`）

---

## キャッシング戦略

| パス              | TTL              | 用途                            |
| ----------------- | ---------------- | ------------------------------- |
| `/_next/static/*` | 30日             | Next.js 静的アセット（JS、CSS） |
| `/public/*`       | 30日             | 公開アセット                    |
| `/index.html`     | なし（no-cache） | HTML ページ                     |
| その他HTML        | 1時間            | HTML ページ                     |

---

## SPA ルーティング対応

CloudFront は以下のエラーに対して `/index.html` を返すように設定されています：

- **403 Forbidden** → `/index.html`
- **404 Not Found** → `/index.html`

これにより、`/products/123` など URL 直叩きでも React Router がハンドルできます。

---

## Next.js 設定確認

`next.config.ts` に CloudFront ドメインが設定されていることを確認してください：

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd23pzr22xoegue.cloudfront.net', // dev
      },
      {
        protocol: 'https',
        hostname: 'd1rxenf9seg5xc.cloudfront.net', // stage
      },
      {
        protocol: 'https',
        hostname: 'd1234abcd.cloudfront.net', // prod（未設定）
      },
    ],
  },
};
```

---

## CloudFront 証明書（ACM）の取得方法

### AWS Management Console

1. AWS Certificate Manager に移動
2. **「認証を要求」** をクリック
3. ドメイン名を入力（例: `stage.mark-sports.com`）
4. DNS 検証を選択
5. Route 53 で DNS レコードを作成
6. 証明書 ARN をコピー

### CLI の場合

```bash
# 証明書をリクエスト
aws acm request-certificate \
  --domain-name stage.mark-sports.com \
  --validation-method DNS \
  --region ap-northeast-1

# DNS レコードを確認
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:ap-northeast-1:ACCOUNT_ID:certificate/CERT_ID \
  --region ap-northeast-1
```

---

## トラブルシューティング

### CloudFront に表示されない

1. S3 にファイルがアップロードされているか確認：

   ```bash
   aws s3 ls s3://ecsite-frontend-stage/ --recursive
   ```

2. CloudFront キャッシュをクリア：
   ```bash
   aws cloudfront create-invalidation --distribution-id E1234ABCD --paths "/*"
   ```

### Route 53 DNSレコード設定

カスタムドメインを使用する場合、Route 53 に以下を追加：

```
Name: stage.mark-sports.com
Type: A (Alias)
Value: <CloudFront Domain Name>
```

---

## Stage-Specific 設定

各 stage で異なるリソースが作成されます：

| Resource             | Dev                   | Stage                   | Prod                   |
| -------------------- | --------------------- | ----------------------- | ---------------------- |
| S3 Bucket            | `ecsite-frontend-dev` | `ecsite-frontend-stage` | `ecsite-frontend-prod` |
| CloudFormation Stack | `ecsite-frontend-dev` | `ecsite-frontend-stage` | `ecsite-frontend-prod` |
| Domain               | CloudFront Default    | `stage.mark-sports.com` | `mark-sports.com`      |
| Certificate          | N/A                   | ACM (stage)             | ACM (prod)             |

---

## スタック削除

```powershell
# Stage スタックを削除
aws cloudformation delete-stack --stack-name ecsite-frontend-stage --region ap-northeast-1

#削除状況確認
aws cloudformation describe-stacks --stack-name ecsite-frontend-stage --region ap-northeast-1
```

**⚠️ 注意:** S3 バケットが空でない場合、スタック削除に失敗します。先にバケットを空にしてください。

```powershell
aws s3 rm s3://ecsite-frontend-stage --recursive --region ap-northeast-1
```

---

## 参考

- [AWS CloudFront ドキュメント](https://docs.aws.amazon.com/cloudfront/)
- [Next.js 静的エクスポート](https://nextjs.org/docs/app/building-your-application/deploying)
- [AWS Certificate Manager](https://docs.aws.amazon.com/acm/)
