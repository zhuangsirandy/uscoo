import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/zh', '/beta'],
      disallow: [
        '/account',
        '/admin',
        '/api/',
        '/join',
        '/lawyer',
        '/pre-review',
        '/prepare',
        '/review',
        '/share/',
      ],
    },
    sitemap: 'https://www.uscoo.ai/sitemap.xml',
    host: 'https://www.uscoo.ai',
  };
}
