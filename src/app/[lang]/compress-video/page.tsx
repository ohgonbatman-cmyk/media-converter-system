import type { Metadata } from "next";
import VideoClient from "../video/VideoClient";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { getAlternates } from "@/lib/seo";

export const runtime = "edge";

export async function generateMetadata(
  props: {
    params: Promise<{ lang: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.compress_video.title,
    description: dict.metadata.compress_video.description,
    keywords: ["動画圧縮", "動画軽量化", "MP4サイズ削減", "WebM圧縮", "ブラウザ完結", "高速圧縮"],
    alternates: getAlternates("/compress-video"),
  };
}

export default async function CompressVideoPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <VideoClient lang={lang} dict={dict} mode="compressor" />;
}
