import type { Metadata } from "next";
import dynamic from "next/dynamic";
const VideoClient = dynamic(() => import("./VideoClient"), { ssr: false });
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
    title: dict.metadata.video.title,
    description: dict.metadata.video.description,
    keywords: ["MP4 MOV 変換", "動画 MP3 抽出", "TikTok 動画サイズ 変換", "動画 一括変換"],
    alternates: getAlternates("/video"),
  };
}

export default async function VideoPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <VideoClient lang={lang} dict={dict} />;
}
