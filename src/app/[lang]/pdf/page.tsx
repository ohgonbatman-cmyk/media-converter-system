import type { Metadata } from "next";
import dynamic from "next/dynamic";
const PdfClient = dynamic(() => import("./PdfClient"), { ssr: false });
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
    title: dict.metadata.pdf.title,
    description: dict.metadata.pdf.description,
    keywords: ["PDF Word 変換", "PDF 構造維持 変換", "PDF テキスト抽出", "PDF 画像抽出"],
    alternates: getAlternates("/pdf"),
  };
}

export default async function PdfPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  return <PdfClient lang={lang} dict={dict} />;
}
