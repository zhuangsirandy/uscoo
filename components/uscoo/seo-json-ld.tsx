const data = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'USCOO',
    url: 'https://www.uscoo.ai',
    email: 'coo@uscoo.ai',
    description:
      'An O-1A application preparation system for founders and entrepreneurs.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'USCOO',
    url: 'https://www.uscoo.ai',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: ['en', 'zh-CN'],
    audience: {
      '@type': 'Audience',
      audienceType: 'Founders and entrepreneurs exploring O-1A preparation',
    },
    description:
      'USCOO helps founders assess achievements, map evidence to USCIS O-1A criteria, prepare a U.S. petitioner, assemble documents, and coordinate self-filing or counsel collaboration.',
  },
];

export default function SeoJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
