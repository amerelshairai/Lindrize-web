import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/** Search and AI files are checked straight from the built site. */
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const SITE = 'https://www.lindrize.online';
const read = (path: string): string => readFileSync(join(DIST, path), 'utf8');
const fileFor = (url: string): string => {
  const path = url.replace(SITE, '');
  return join(DIST, path.endsWith('/') ? `${path}index.html` : path);
};
const htmlFiles = (dir = DIST): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? htmlFiles(full) : name.endsWith('.html') ? [full] : [];
  });
type Node = Record<string, unknown>;
const graph = (html: string): Node[] => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.flatMap((b) => (JSON.parse(b[1] ?? '{}') as { '@graph'?: Node[] })['@graph'] ?? []);
};
const ofType = (nodes: Node[], type: string): Node[] =>
  nodes.filter((n) => (Array.isArray(n['@type']) ? (n['@type'] as string[]).includes(type) : n['@type'] === type));

test('sitemap: valid, in both languages, and every address exists', () => {
  const xml = read('sitemap.xml');
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '');
  expect(locs.length).toBe(76); // 38 pages in 2 languages
  expect(new Set(locs).size).toBe(locs.length);
  for (const loc of locs) {
    expect(loc.startsWith(`${SITE}/`), loc).toBe(true);
    expect(existsSync(fileFor(loc)), `${loc} is in the sitemap but was not built`).toBe(true);
    expect(read(fileFor(loc).replace(DIST, '')), `${loc} must be indexable`).not.toContain('name="robots" content="noindex"');
  }
  expect(xml.match(/hreflang="x-default"/g)?.length).toBe(locs.length);
  for (const hidden of ['/privacy/', '/terms/', '/404/', '/404.html', '/book/']) {
    expect(locs.filter((loc) => loc.endsWith(hidden)), `${hidden} must stay out of the sitemap`).toEqual([]);
  }
});

test('robots.txt: everyone welcome, AI assistants named, receiver off limits', () => {
  const robots = read('robots.txt');
  expect(robots).toContain('User-agent: *\nAllow: /\nDisallow: /api/');
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(robots).toContain(`User-agent: ${bot}`);
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect(robots).not.toMatch(/^Disallow: \/$/m);
});

test('llms.txt: facts match the site, and every link works', () => {
  const llms = read('llms.txt');
  expect(llms.startsWith('# Lindrize\n')).toBe(true);
  expect(llms).toContain('It never confirms a booking and never takes a payment.');
  expect(llms).toContain('fictional agency');
  expect(llms).toContain('+962 78 553 6571');
  expect(llms).not.toContain('amerelshair.ai@');
  const links = [...llms.matchAll(/\]\((https:\/\/www\.lindrize\.online[^)]*)\)/g)].map((m) => m[1] ?? '');
  expect(links.length).toBeGreaterThanOrEqual(40);
  for (const link of links) expect(existsSync(fileFor(link)), `${link} in llms.txt does not exist`).toBe(true);
});

test('structured data: valid on every page, matches the page, and never claims ratings', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    if (/http-equiv="refresh"/.test(html)) continue;
    const nodes = graph(html);
    const noindex = html.includes('name="robots" content="noindex"');
    expect(nodes.length > 0, `${file}: structured data ${noindex ? 'should be absent' : 'is missing'}`).toBe(!noindex);
    if (noindex) continue;
    expect(JSON.stringify(nodes)).not.toMatch(/aggregateRating|"review"|ratingValue/i);

    const [org] = ofType(nodes, 'Organization');
    expect(org).toMatchObject({ name: 'Lindrize', telephone: '+962785536571', email: 'amer.ai@lindrize.online' });
    expect(org?.['address']).toMatchObject({ addressLocality: 'Amman', addressCountry: 'JO' });
    expect((org?.['founder'] as Node)['name']).toBe('Amer El-shair');
    expect(ofType(nodes, 'WebSite')).toHaveLength(1);

    const [page] = ofType(nodes, 'WebPage');
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    expect(page?.['url']).toBe(canonical);
    expect(String(page?.['name']).replace(/&/g, '&amp;')).toBe(title);

    // Every question and answer in the data must be visible on the page, word for word.
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    for (const faq of ofType(nodes, 'FAQPage')) {
      for (const q of faq['mainEntity'] as Array<{ name: string; acceptedAnswer: { text: string } }>) {
        expect(text.includes(`>${q.name}<`), `${file}: question not on page: ${q.name}`).toBe(true);
        expect(text.includes(`>${q.acceptedAnswer.text}<`), `${file}: answer not on page: ${q.name}`).toBe(true);
      }
    }
    for (const crumbs of ofType(nodes, 'BreadcrumbList')) {
      const items = crumbs['itemListElement'] as Array<{ position: number; item: string }>;
      items.forEach((item, i) => {
        expect(item.position).toBe(i + 1);
        expect(existsSync(fileFor(item.item)), `${file}: breadcrumb points to a missing page ${item.item}`).toBe(true);
      });
      expect(items.at(-1)?.item).toBe(canonical);
    }
  }
});

test('structured data: each kind of page carries the right labels', () => {
  const kinds = (path: string): string[] => graph(read(path)).flatMap((n) => n['@type'] as string | string[]);
  expect(kinds('index.html')).toEqual(expect.arrayContaining(['Organization', 'ProfessionalService', 'WebSite', 'WebPage', 'FAQPage']));
  expect(kinds('solutions/quote-follow-up/index.html')).toEqual(expect.arrayContaining(['Service', 'FAQPage', 'BreadcrumbList']));
  expect(kinds('ar/faq/index.html')).toEqual(expect.arrayContaining(['FAQPage', 'BreadcrumbList']));
  const service = ofType(graph(read('ar/solutions/quote-follow-up/index.html')), 'Service')[0];
  expect(service).toMatchObject({ name: 'متابعة عروض الأسعار', serviceType: 'Quote Follow-up', inLanguage: 'ar' });
});

test('every indexable page links its English and Arabic versions to each other', () => {
  for (const file of htmlFiles()) {
    const html = readFileSync(file, 'utf8');
    if (html.includes('content="noindex"') || /http-equiv="refresh"/.test(html)) continue;
    const alt = (code: string): string | undefined => new RegExp(`hreflang="${code}" href="([^"]+)"`).exec(html)?.[1];
    for (const code of ['en', 'ar']) {
      const target = alt(code) ?? '';
      expect(existsSync(fileFor(target)), `${file}: hreflang ${code} points to a missing page`).toBe(true);
      const back = readFileSync(fileFor(target), 'utf8');
      expect(back).toContain(`hreflang="en" href="${alt('en')}"`);
      expect(back).toContain(`hreflang="ar" href="${alt('ar')}"`);
    }
    expect(alt('x-default')).toBe(alt('en'));
  }
});
