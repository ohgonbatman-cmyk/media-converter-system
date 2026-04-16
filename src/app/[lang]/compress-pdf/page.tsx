import type { Metadata } from "next";
import PdfCompressClient from "./PdfCompressClient";
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
    ...getBaseMetadata("/compress-pdf", dict),
    title: dict.metadata.compress_pdf.title,
    description: dict.metadata.compress_pdf.description,
    keywords: dict.metadata.compress_pdf.keywords,
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
  const schema = getToolSchema({
    name: dict.metadata.compress_pdf.title,
    description: dict.metadata.compress_pdf.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/compress-pdf`,
    applicationCategory: "BusinessApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <PdfCompressClient lang={lang} dict={dict} />
    </>
  );
}
