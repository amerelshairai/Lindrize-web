/**
 * Link check on the built site. Every internal link must point to a page or file that exists,
 * and every "#place" must exist on its target page. External links are listed, not fetched;
 * they are checked against the live web in Phase 4.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pages, isRedirect, attr, decode, report, DIST } from './lib.mjs';

const all = pages();
const byUrl = new Map(all.map((p) => [p.url, p]));
const broken = new Set();
const external = new Set();
let checked = 0;

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const page of all) {
  if (isRedirect(page.html)) continue;
  const tags = page.html.match(/<(a|link|script|img|source|iframe|use)\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    for (const name of ['href', 'src']) {
      const raw = attr(tag, name);
      if (raw === undefined || raw === '') continue;
      const value = decode(raw);
      if (/^(mailto:|tel:|data:|blob:)/i.test(value)) continue;
      if (/^https?:\/\//i.test(value)) {
        if (!value.startsWith('https://www.lindrize.online')) external.add(value);
        continue;
      }
      checked++;
      const target = new URL(value, `https://site.local${page.url}`);
      const path = decodeURIComponent(target.pathname);
      const hash = decodeURIComponent(target.hash.slice(1));
      const targetPage = byUrl.get(path);
      if (targetPage) {
        if (hash && !ids(targetPage.html).has(hash)) broken.add(`${page.url}: "${value}" points to a missing place #${hash}`);
        continue;
      }
      if (existsSync(join(DIST, path)) && !path.endsWith('/')) continue;
      if (byUrl.has(`${path}/`)) broken.add(`${page.url}: "${value}" is missing its final "/" (it would redirect)`);
      else broken.add(`${page.url}: "${value}" points to nothing`);
    }
  }
}

report(`Internal links (${checked} checked on ${all.length} pages)`, [...broken]);
console.log(`• ${external.size} external link(s), checked against the live web in Phase 4:`);
for (const url of [...external].sort()) console.log(`    ${url}`);
