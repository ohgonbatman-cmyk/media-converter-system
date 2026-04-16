import type { Metadata } from "next";
import ImageClient from "./ImageClient";
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
    ...getBaseMetadata("/image", dict),
    title: dict.metadata.image.title,
    description: dict.metadata.image.description,
    keywords: dict.metadata.image.keywords,
  };
}

export default async function ImagePage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  const schema = getToolSchema({
    name: dict.metadata.image.title,
    description: dict.metadata.image.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/image`,
    applicationCategory: "MultimediaApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <ImageClient lang={lang} dict={dict} />
    </>
  );
}
