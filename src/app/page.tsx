import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Media Converter | 完全ローカル処理の次世代メディア変換スイート",
  description: "画像、動画、音声、PDFを高精度に変換。プライバシーを第一に考え、すべての処理をブラウザ内で行います。サーバーへのアップロードは一切不要です。",
  keywords: ["メディア変換", "プライバシー重視", "ブラウザ完結", "動画圧縮", "画像変換", "PDF変換", "FFmpeg", "WebAssembly"],
};

export default function Home() {
  return <HomeClient />;
}
