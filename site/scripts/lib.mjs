import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Every built HTML page, as { file, url, html }. */
export function pages() {
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.html')) {
        const rel = relative(DIST, full).split('\\').join('/');
        const url = '/' + rel.replace(/index\.html$/, '');
        found.push({ file: rel, url, html: readFileSync(full, 'utf8') });
      }
    }
  };
  walk(DIST);
  return found.sort((a, b) => a.url.localeCompare(b.url));
}

/** Pages that are only a redirect (for example /book) have no content to check. */
export const isRedirect = (html) => /<meta[^>]+http-equiv=["']?refresh/i.test(html);

export const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : undefined;
};

export const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

/** The text a visitor can read in the page body. */
export function visibleText(html, { skipAllowed = false } = {}) {
  let body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? '';
  body = body.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ');
  if (skipAllowed) body = body.replace(/<(\w+)\b[^>]*\sdata-allow-terms\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  return decode(body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function report(name, problems) {
  if (problems.length === 0) {
    console.log(`✓ ${name}`);
    return;
  }
  console.error(`✗ ${name}: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
}
