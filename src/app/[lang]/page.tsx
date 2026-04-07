import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
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
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    keywords: ["メディア変換", "プライバシー重視", "ブラウザ完結", "動画圧縮", "画像変換", "PDF変換", "FFmpeg", "WebAssembly"],
    alternates: getAlternates("/"),
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
