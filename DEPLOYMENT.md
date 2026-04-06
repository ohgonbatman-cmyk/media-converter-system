# Deployment Guide (Media Converter System)

このプロジェクトを Cloudflare Pages や GitHub で管理・デプロイする際の手順書です。他AIエージェントや開発者への共有用。

## 🌐 プロジェクト情報
- **GitHub**: `https://github.com/ohgonbatman-cmyk/media-converter-system`
- **主要なファイルパス**:
    - `public/_headers`: Cloudflare Pages 用のセキュリティヘッダー設定。
    - `next.config.ts`: FFmpeg.wasm 用の COOP/COEP 設定（開発・Vercel用）。
    - `src/hooks/useFFmpeg.ts`: FFmpeg コアのロード（jsDelivr 使用）。

## 🚀 Cloudflare Pages デプロイ手順

### 1. Build Settings
Cloudflare Pages の管理画面で以下のビルド設定を適用してください。

- **Framework preset**: `Next.js`
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `/.vercel/output/static`

### 2. Required Environment Variables
ビルドエラー（Next.js バージョン不整合）を回避するため、以下の環境変数は **必須** です。

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20` | 推奨バージョン |
| `NPM_FLAGS` | `--legacy-peer-deps` | 依存関係のコンフリクトを回避 |

---

## 🛠️ 強固なブランチ戦略とマージ手順 (Branching Strategy)

本プロジェクトでは、**「開発拠点の `develop`」** と **「本番環境の `main`」** を厳格に分離しています。

### 1. 開発とプレビュー (DEV)
- **すべての作業**は `develop` ブランチで行います。
- `develop` にプッシュすると、Cloudflare Pages が **「Preview URL」** を自動発行します。
- 公開前にこのプレビューURLで入念なテスト（画像・動画・音声の変換確認）を行ってください。

### ### 2. 本番への反映 (MAIN / PROD)
プレビューでのテストが完了し、本番へ反映する準備が整ったら、以下の手順でマージを行います。

```bash
# 1. develop を最新の状態にする
git checkout develop
git pull origin develop

# 2. main に切り替えて合流させる
git checkout main
git merge develop

# 3. 本番へ送り出す
git push origin main

# 4. 作業用ブランチ（develop）に戻る
git checkout develop
```

> [!IMPORTANT]
> `main` ブランチへプッシュすると、直ちに本番サイトが更新されます。必ず `develop` での動作確認を終えてから実行してください。

---

## 🛠️ 重要：技術的な修正の歴史
- **Next.js のダウングレード**: `next-on-pages` アダプターとの互換性のため、Next.js 16 から **15.5.2** へ意図的にダウングレードされています。これ以上のバージョンアップは、アダプターの更新を確認してから行ってください。
- **SharedArrayBuffer**: 本アプリはクライアントサイドでの動画処理のため `SharedArrayBuffer` を使用します。`_headers` ファイルを削除すると動作しなくなります。

---
**作成日**: 2026-04-06
**最終更新**: 2026-04-06
