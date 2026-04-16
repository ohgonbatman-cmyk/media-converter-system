import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { getBaseMetadata } from "@/lib/seo";

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
    ...getBaseMetadata("/", dict),
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    keywords: dict.metadata.home.keywords,
  };
}

export default async function Home(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang as Locale);
  
  return <HomeClient lang={lang} dict={dict} />;
}
