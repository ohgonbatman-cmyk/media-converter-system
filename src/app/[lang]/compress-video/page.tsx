import type { Metadata } from "next";
import VideoClient from "../video/VideoClient";
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
    ...getBaseMetadata("/compress-video", dict),
    title: dict.metadata.compress_video.title,
    description: dict.metadata.compress_video.description,
    keywords: dict.metadata.compress_video.keywords,
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
  const schema = getToolSchema({
    name: dict.metadata.compress_video.title,
    description: dict.metadata.compress_video.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/compress-video`,
    applicationCategory: "MultimediaApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <VideoClient lang={lang} dict={dict} mode="compressor" />
    </>
  );
}
