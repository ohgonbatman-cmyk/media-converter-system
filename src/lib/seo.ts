import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev";

export function getAlternates(path: string): Metadata["alternates"] {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutSlash = cleanPath === "/" ? "" : cleanPath;
  
  return {
    canonical: `${BASE_URL}/ja${pathWithoutSlash}`,
    languages: {
      "en": `${BASE_URL}/en${pathWithoutSlash}`,
      "ja": `${BASE_URL}/ja${pathWithoutSlash}`,
      "es": `${BASE_URL}/es${pathWithoutSlash}`,
      "x-default": `${BASE_URL}/en${pathWithoutSlash}`,
    },
  };
}

export function getBaseMetadata(path: string, dict: any): Metadata {
  const alternates = getAlternates(path);
  return {
    metadataBase: new URL(BASE_URL),
    alternates,
    openGraph: {
      type: "website",
      siteName: "Media Converter System",
      locale: dict.lang || "ja_JP",
      url: alternates.canonical as string,
      images: [
        {
          url: "/hero-bg.png",
          width: 1200,
          height: 630,
          alt: "Media Converter System",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata?.home?.title,
      description: dict.metadata?.home?.description,
      images: ["/hero-bg.png"],
    },
  };
}
