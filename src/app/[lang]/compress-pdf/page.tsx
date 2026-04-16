import type { Metadata } from "next";
import PdfCompressClient from "./PdfCompressClient";
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
    title: dict.metadata.compress_pdf.title,
    description: dict.metadata.compress_pdf.description,
    keywords: ["PDF圧縮", "PDF軽量化", "PDF画像最適化", "ブラウザ完結", "容量削減"],
    alternates: getAlternates("/compress-pdf"),
  };
}

export default async function CompressPdfPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <PdfCompressClient lang={lang} dict={dict} />;
}
