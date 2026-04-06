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

## 🛠️ 重要：技術的な修正の歴史
- **Next.js のダウングレード**: `next-on-pages` アダプターとの互換性のため、Next.js 16 から **15.5.2** へ意図的にダウングレードされています。これ以上のバージョンアップは、アダプターの更新を確認してから行ってください。
- **SharedArrayBuffer**: 本アプリはクライアントサイドでの動画処理のため `SharedArrayBuffer` を使用します。`_headers` ファイルを削除すると動作しなくなります。

---
**作成日**: 2026-04-06
**最終更新**: 2026-04-06
