import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.uscoo.ai';
  return [
    {
      url: `${base}/`,
      lastModified: new Date('2026-09-09T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: { en: `${base}/`, zh: `${base}/zh` } },
    },
    {
      url: `${base}/zh`,
      lastModified: new Date('2026-09-09T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { en: `${base}/`, zh: `${base}/zh` } },
    },
    {
      url: `${base}/beta`,
      lastModified: new Date('2026-09-09T00:00:00Z'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date('2026-09-09T00:00:00Z'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
