import type { Metadata } from "next";
import PdfClient from "./PdfClient";
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
    ...getBaseMetadata("/pdf", dict),
    title: dict.metadata.pdf.title,
    description: dict.metadata.pdf.description,
    keywords: dict.metadata.pdf.keywords,
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
  const schema = getToolSchema({
    name: dict.metadata.pdf.title,
    description: dict.metadata.pdf.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev"}/${lang}/pdf`,
    applicationCategory: "BusinessApplication"
  });

  return (
    <>
      <JsonLd data={schema} />
      <PdfClient lang={lang} dict={dict} />
    </>
  );
}
