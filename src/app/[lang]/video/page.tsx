import type { Metadata } from "next";
import VideoClient from "./VideoClient";
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
    ...getBaseMetadata("/video", dict),
    title: dict.metadata.video.title,
    description: dict.metadata.video.description,
    keywords: dict.metadata.video.keywords,
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
  const schema = getToolSchema({
    name: dict.metadata.video.title,
    description: dict.metadata.video.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/video`,
    applicationCategory: "MultimediaApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <VideoClient lang={lang} dict={dict} />
    </>
  );
}
