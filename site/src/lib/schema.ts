/**
 * Structured data (JSON-LD): invisible labels that tell Google and AI assistants what each page is.
 * Rules (SPEC 12): every value must match what is visible on the page, and there are never any
 * ratings or reviews until real ones exist.
 */
import { settings, absoluteUrl, localPath, tr, ROUTES, type Lang, type Text } from './i18n';

type Node = Record<string, unknown>;
const ORG_ID = `${settings.siteUrl}/#organization`;
const SITE_ID = `${settings.siteUrl}/#website`;
const COUNTRIES = ['Jordan', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
const areaServed = COUNTRIES.map((name) => ({ '@type': 'Country', name }));

export const organization = (): Node => ({
  '@type': ['Organization', 'ProfessionalService'],
  '@id': ORG_ID,
  name: settings.siteName,
  url: `${settings.siteUrl}/`,
  logo: absoluteUrl('/icon-512.png'),
  image: absoluteUrl('/og-image.png'),
  description: 'AI sales assistants for travel agencies',
  founder: { '@type': 'Person', name: settings.founder },
  address: { '@type': 'PostalAddress', addressLocality: 'Amman', addressCountry: 'JO' },
  areaServed,
  telephone: `+${settings.whatsappNumber}`,
  email: settings.email,
  knowsLanguage: ['en', 'ar'],
});

export const website = (): Node => ({
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${settings.siteUrl}/`,
  name: settings.siteName,
  inLanguage: ['en', 'ar'],
  publisher: { '@id': ORG_ID },
});

export const webPage = (lang: Lang, page: string, title: string, description: string): Node => ({
  '@type': 'WebPage',
  '@id': `${absoluteUrl(localPath(lang, page))}#page`,
  url: absoluteUrl(localPath(lang, page)),
  name: title,
  description,
  inLanguage: lang,
  isPartOf: { '@id': SITE_ID },
  about: { '@id': ORG_ID },
});

/** Where the page sits in the site: Home, then each step down to this page. */
export const breadcrumbs = (lang: Lang, trail: Array<{ name: string; page: string }>): Node => ({
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: settings.siteName, page: ROUTES.home }, ...trail].map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(localPath(lang, item.page)),
  })),
});

export const faqPage = (lang: Lang, items: Array<{ question: Text; answer: Text }>): Node => ({
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: tr(item.question, lang),
    acceptedAnswer: { '@type': 'Answer', text: tr(item.answer, lang) },
  })),
});

export const service = (lang: Lang, page: string, name: string, serviceType: string, description: string): Node => ({
  '@type': 'Service',
  '@id': `${absoluteUrl(localPath(lang, page))}#service`,
  name,
  serviceType,
  description,
  url: absoluteUrl(localPath(lang, page)),
  provider: { '@id': ORG_ID },
  areaServed,
  inLanguage: lang,
});

/** One JSON-LD block for the page. "<" is escaped so the text can never close the script tag. */
export const toJsonLd = (nodes: Node[]): string =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
