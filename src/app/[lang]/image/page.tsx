import type { Metadata } from "next";
import ImageClient from "./ImageClient";
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
    title: dict.metadata.image.title,
    description: dict.metadata.image.description,
    keywords: ["HEIC JPG 変換", "WebP 変換", "画像 一括リサイズ", "プライバシー", "ローカル変換"],
    alternates: getAlternates("/image"),
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
  return <ImageClient lang={lang} dict={dict} />;
}
