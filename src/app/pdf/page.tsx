import type { Metadata } from "next";
import PdfClient from "./PdfClient";

export const metadata: Metadata = {
  title: "PDF Word 変換 | レイアウト維持 & 高精度抽出 - Media Converter",
  description: "ブラウザ完結でPDFからWord (.docx) へ高精度変換。レイアウトを崩さず、テキストや画像も抽出可能。機密書類もサーバーに送信せず、安全に処理が完結するビジネス向けツール。",
  keywords: ["PDF Word 変換", "PDF 構造維持 変換", "PDF テキスト抽出", "PDF 画像抽出"],
};

export default function PdfPage() {
  return <PdfClient />;
}
