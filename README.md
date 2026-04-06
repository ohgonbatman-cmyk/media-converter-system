# Media Converter (Browser-Based)

プライバシー第一、ブラウザ上で完結する高精細マルチメディアコンバーター。

## 🌟 主な特徴
- **完全ローカル処理**: サーバーへのアップロードは一切なし。機密性の高いファイルも安全に変換可能。
- **マルチフォーマット対応**:
    - **画像**: PNG, JPG, WebP への変換とリサイズ。
    - **動画**: MP4, WebM, MOV への高速変換 (FFmpeg.wasm 搭載)。
    - **音声**: MP3, WAV, AAC, OGG への変換。
- **一括処理 (Batch Mode)**: 複数のファイルを一括変換、および JSZip による一括ダウンロードに対応。
- **プレミアム・ライトモード**: 白を基調とした、清潔感のあるフラットデザイン (Coffee Inc スタイル)。

## 🚀 デプロイについて
本プロジェクトは **Cloudflare Pages** へのデプロイを前提に最適化されています。

詳細なデプロップ手順や技術的制約については、[DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### 必須の環境変数 (Cloudflare)
- `NODE_VERSION`: `20`
- `NPM_FLAGS`: `--legacy-peer-deps`

## 🛠️ 技術スタック
- **Framework**: Next.js 15.5.2 (App Router)
- **Styling**: Tailwind CSS
- **Core**: FFmpeg.wasm (v0.12), JSZip
- **Icons**: Lucide-React

---
© 2026 Media Converter System Project. Finalized and Optimized.
