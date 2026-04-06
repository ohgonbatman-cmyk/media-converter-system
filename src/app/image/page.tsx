import type { Metadata } from "next";
import ImageClient from "./ImageClient";

export const metadata: Metadata = {
  title: "HEIC JPG 変換 | WebP 変換 & 一括リサイズ - Media Converter",
  description: "ブラウザ完結で安全な画像変換ツール。HEICからJPGへの変換、WebP対応、一括リサイズも可能。写真はサーバーに送信されず、あなたのデバイス内だけで処理されます。",
  keywords: ["HEIC JPG 変換", "WebP 変換", "画像 一括リサイズ", "プライバシー", "ローカル変換"],
};

export default function ImagePage() {
  return <ImageClient />;
}
