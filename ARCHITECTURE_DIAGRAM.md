# EC Site アーキテクチャ構成図

このドキュメントは、現在の `ecsite` の構成を「誰でもわかる」ように図式化したものです。

## 1. ひと目でわかる全体像

```mermaid
graph TD
  User["利用者<br/>サイトを利用"] --> Browser["ブラウザ<br/>サイトを見る"]

  Domain["お名前.com<br/>ドメイン取得"] --> NS["Cloudflare Nameservers<br/>DNSの委任先"]
  NS --> DNS["Cloudflare DNS<br/>行き先を案内"]
  Browser --> DNS

  DNS --> Pages["Cloudflare Pages<br/>フロントサイトを配信"]
  Pages --> Front["Next.js<br/>画面を表示"]

  Front --> APIGW["API Gateway<br/>リクエスト受付"]
  APIGW --> Lambda["Lambda<br/>注文・会員処理"]

  Lambda --> DB["DynamoDB<br/>データ保存"]
  Lambda --> Square["Square<br/>クレカ決済"]
  Lambda --> SES["Amazon SES<br/>メール送信"]

  Lambda --> ImgS3["S3<br/>商品画像を保存"]
  ImgS3 --> ImgCF["CloudFront<br/>画像を高速配信"]
  ImgCF --> Browser

  SSM["SSM Parameter Store<br/>秘密情報を安全管理"] --> Lambda
  Lambda --> CW["CloudWatch Logs<br/>ログ記録"]

  FrontAlt["代替フロント配信<br/>S3 + CloudFront"] -.必要時のみ.-> Front

  classDef user fill:#E8F0FE,stroke:#2B6CB0,color:#1A365D,stroke-width:1px;
  classDef cloudflare fill:#FFF5D6,stroke:#B7791F,color:#744210,stroke-width:1px;
  classDef aws fill:#E6FFFA,stroke:#2C7A7B,color:#234E52,stroke-width:1px;
  classDef app fill:#F3E8FF,stroke:#6B46C1,color:#44337A,stroke-width:1px;
  classDef external fill:#FFE5E5,stroke:#C53030,color:#742A2A,stroke-width:1px;
  classDef alt fill:#EDF2F7,stroke:#4A5568,color:#2D3748,stroke-width:1px;

  class User,Browser user;
  class Domain external;
  class NS,DNS,Pages cloudflare;
  class Front app;
  class APIGW,Lambda,DB,SES,ImgS3,ImgCF,SSM,CW aws;
  class Square external;
  class FrontAlt alt;
```

色分けの凡例

- 青系: 利用者側 (利用者・ブラウザ)
- 黄系: Cloudflare系 (Nameservers / DNS / Pages)
- 水色系: AWS系 (API Gateway / Lambda / DynamoDB / SES / S3 / CloudFront / SSM / CloudWatch)
- 紫系: アプリ層 (Next.js)
- 赤系: 外部サービス (お名前.com / Square)
- グレー系: 代替構成 (S3 + CloudFront 経路)

## 2. 役割をやさしく説明

- フロントエンド: 画面を表示する部分。ユーザーの操作を受け取る。
- API Gateway + Lambda: 注文やログインなど「処理の本体」。
- DynamoDB: 会員情報、商品、注文などのデータ保管庫。
- Square: クレジットカード決済を担当。
- SES: 登録確認メールや通知メールを送る。
- S3 + CloudFront(画像): 商品画像を保存して高速配信する。
- SSM Parameter Store: APIキーなどの機密値を安全に管理する。

## 3. 注文時の流れ(例)

```mermaid
sequenceDiagram
  participant User as 利用者
  participant FE as フロント(Next.js)
  participant API as API Gateway
  participant L as Lambda
  participant SQ as Square
  participant DB as DynamoDB
  participant Mail as SES

  User->>FE: 商品を選択して購入
  FE->>API: 注文APIを呼び出し
  API->>L: リクエスト転送
  L->>SQ: 決済実行
  SQ-->>L: 決済結果
  L->>DB: 注文データ保存
  L->>Mail: 注文確認メール送信
  L-->>API: 成功レスポンス
  API-->>FE: 結果を返却
  FE-->>User: 購入完了画面を表示
```

## 4. デプロイ先の補足

このリポジトリには、フロント配信として以下の運用パターンが存在します。

- AWSパターン: `S3 + CloudFront` ( `frontend/infra/cloudformation.yaml` )
- Cloudflareパターン: `Cloudflare Pages` ( `CLOUDFLARE_DEPLOYMENT_GUIDE.md` )

どちらのパターンでも、バックエンドは `API Gateway + Lambda` を利用する構成です。

現在の運用では、フロントサイトは `Cloudflare Pages` でホストしています。

ドメイン運用は以下の構成です。

- ドメイン取得元(レジストラ): `お名前.com`
- ネームサーバー(NS): `Cloudflare` のネームサーバーへ移管済み

## 5. ドメインとDNSの構成(現在)

```mermaid
graph LR
  R["お名前.com (ドメイン取得元)"] --> NS["Cloudflare Nameservers"]
  NS --> DNS["Cloudflare DNS"]
  DNS --> PAGES["Cloudflare Pages (フロントホスティング)"]
  DNS --> API["API Gateway (バックエンド)"]
```
