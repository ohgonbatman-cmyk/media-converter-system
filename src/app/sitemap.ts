import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://media-converter-system.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = ['ja', 'en', 'es'];
  const routes = [
    '',
    '/image',
    '/compress-image',
    '/video',
    '/compress-video',
    '/audio',
    '/compress-audio',
    '/pdf',
    '/compress-pdf'
  ];

  const allRoutes = languages.flatMap(lang => 
    routes.map(route => {
      const isHome = route === '';
      return {
        url: `${BASE_URL}/${lang}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: isHome ? 1.0 : 0.8,
      };
    })
  );

  return allRoutes;
}
