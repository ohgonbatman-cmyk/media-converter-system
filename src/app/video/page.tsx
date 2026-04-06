import type { Metadata } from "next";
import VideoClient from "./VideoClient";

export const metadata: Metadata = {
  title: "MP4 MOV 変換 | 動画からMP3抽出 & TikTok最適化 - Media Converter",
  description: "ブラウザ上で動画ファイルを高速変換。MP4, WebM, MOV対応。YouTubeやTikTokに最適なプリセット設定、動画からの音声抜き出し（MP3）も。機密動画も安心のローカル処理。",
  keywords: ["MP4 MOV 変換", "動画 MP3 抽出", "TikTok 動画サイズ 変換", "動画 一括変換"],
};

export default function VideoPage() {
  return <VideoClient />;
}
