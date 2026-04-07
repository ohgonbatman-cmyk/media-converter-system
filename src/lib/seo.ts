import type { Metadata } from "next";

const BASE_URL = "https://media-converter-system.pages.dev";

export function getAlternates(path: string): Metadata["alternates"] {
  // path should start with '/' and not include the lang prefix
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return {
    canonical: `${BASE_URL}/ja${cleanPath === "/" ? "" : cleanPath}`,
    languages: {
      "en": `${BASE_URL}/en${cleanPath === "/" ? "" : cleanPath}`,
      "ja": `${BASE_URL}/ja${cleanPath === "/" ? "" : cleanPath}`,
      "es": `${BASE_URL}/es${cleanPath === "/" ? "" : cleanPath}`,
      "x-default": `${BASE_URL}/en${cleanPath === "/" ? "" : cleanPath}`,
    },
  };
}
