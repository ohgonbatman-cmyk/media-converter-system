import type { Metadata } from "next";
import AudioClient from "./AudioClient";

export const metadata: Metadata = {
  title: "WAV MP3 変換 | ビットレート指定 & ハイレゾ対応 - Media Converter",
  description: "音質にこだわる人のためのオーディオコンバーター。WAV, MP3, FLAC, AAC対応。320kbpsなどの高音質設定や、無劣化（Lossless）変換もブラウザのみで完結。一括変換でアルバムも一瞬。",
  keywords: ["WAV MP3 変換", "ビットレート指定", "ハイレゾ 変換", "音声 一括変換", "無劣化 変換"],
};

export default function AudioPage() {
  return <AudioClient />;
}
