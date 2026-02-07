import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://branddealos.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/callback',
        '/pipeline',
        '/deals/',
        '/invoices/',
        '/money',
        '/calendar',
        '/inbox',
        '/brands',
        '/contacts',
        '/settings',
        '/onboarding',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
