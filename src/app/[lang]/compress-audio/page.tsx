import type { Metadata } from "next";
import AudioClient from "../audio/AudioClient";
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
    title: dict.metadata.compress_audio.title,
    description: dict.metadata.compress_audio.description,
    keywords: ["音声圧縮", "MP3軽量化", "音声ファイルサイズ削減", "ポッドキャスト圧縮", "ブラウザ完結"],
    alternates: getAlternates("/compress-audio"),
  };
}

export default async function CompressAudioPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <AudioClient lang={lang} dict={dict} mode="compressor" />;
}
