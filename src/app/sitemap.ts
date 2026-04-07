import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://media-converter-system.pages.dev'
  const languages = ['ja', 'en', 'es']
  const routes = ['', '/image', '/video', '/audio', '/pdf']

  const allRoutes = languages.flatMap(lang => 
    routes.map(route => ({
      url: `${baseUrl}/${lang}${route}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1 : 0.8,
    }))
  )

  return allRoutes
}
