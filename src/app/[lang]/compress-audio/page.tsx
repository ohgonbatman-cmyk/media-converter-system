import type { Metadata } from "next";
import AudioClient from "../audio/AudioClient";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { getBaseMetadata } from "@/lib/seo";
import { JsonLd, getToolSchema } from "@/components/JsonLd";

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
    ...getBaseMetadata("/compress-audio", dict),
    title: dict.metadata.compress_audio.title,
    description: dict.metadata.compress_audio.description,
    keywords: dict.metadata.compress_audio.keywords,
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
  const schema = getToolSchema({
    name: dict.metadata.compress_audio.title,
    description: dict.metadata.compress_audio.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/compress-audio`,
    applicationCategory: "MultimediaApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <AudioClient lang={lang} dict={dict} mode="compressor" />
    </>
  );
}
