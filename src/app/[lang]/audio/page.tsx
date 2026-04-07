import type { Metadata } from "next";
import AudioClient from "./AudioClient";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { getAlternates } from "@/lib/seo";


export async function generateMetadata(
  props: {
    params: Promise<{ lang: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.metadata.audio.title,
    description: dict.metadata.audio.description,
    keywords: ["WAV MP3 変換", "ビットレート指定", "ハイレゾ 変換", "音声 一括変換", "無劣化 変換"],
    alternates: getAlternates("/audio"),
  };
}

export default async function AudioPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <AudioClient lang={lang} dict={dict} />;
}
