import type { Metadata } from "next";
import ImageClient from "../image/ImageClient";
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
    title: dict.metadata.compress_image.title,
    description: dict.metadata.compress_image.description,
    keywords: ["画像圧縮", "ファイルサイズ削減", "PNG圧縮", "JPG軽量化", "WebP最適化", "ブラウザ完結"],
    alternates: getAlternates("/compress-image"),
  };
}

export default async function CompressImagePage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <ImageClient lang={lang} dict={dict} mode="compressor" />;
}
