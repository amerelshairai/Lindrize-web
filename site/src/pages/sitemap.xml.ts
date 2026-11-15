import type { APIRoute } from 'astro';
import { absoluteUrl, localPath, LANGS } from '@/lib/i18n';
import { indexablePages } from '@/lib/sitemap';

/** Every finished page in both languages, each linked to its other-language version. */
export const GET: APIRoute = async () => {
  const pages = await indexablePages();
  const entries = pages.flatMap((page) =>
    LANGS.map((lang) => {
      const alternates = [
        ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absoluteUrl(localPath(l, page))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(localPath('en', page))}"/>`,
      ].join('\n');
      return `  <url>\n    <loc>${absoluteUrl(localPath(lang, page))}</loc>\n${alternates}\n  </url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
