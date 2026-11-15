/**
 * Runs Google's Lighthouse test (mobile settings) against the built site and checks the targets
 * in SPEC 13: 95+ on all four scores, main content in under 2.5 s, layout shift under 0.1,
 * and about 300 KB per page without fonts.
 *
 * Usage: build first, then `npm run lighthouse`. Set CHROME_PATH if Chrome is not found.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['/', '/ar/'];
const TARGET = { score: 95, lcp: 2500, cls: 0.1, bytes: 300 * 1024 };

const sandboxChrome = '/opt/pw-browsers/chromium';
const chromePath = process.env.CHROME_PATH ?? (existsSync(sandboxChrome) ? sandboxChrome : undefined);

// A small static server for the built site. Like the real server, it compresses text files
// and caches fingerprinted files, so the numbers are close to what visitors will get.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', BASE).pathname));
  let file = join(DIST, path);
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] }).end(readFileSync(join(DIST, '404.html')));
    return;
  }
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const body = readFileSync(file);
  const text = /^(text|application\/(json|manifest|xml)|image\/svg)/.test(type);
  const headers = {
    'content-type': type,
    'cache-control': path.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  if (text && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
    res.writeHead(200, { ...headers, 'content-encoding': 'gzip' }).end(gzipSync(body));
  } else {
    res.writeHead(200, headers).end(body);
  }
});
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const stop = () => server.close();

const chrome = await chromeLauncher.launch({
  ...(chromePath ? { chromePath } : {}),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

let failed = false;
try {
  for (const path of PAGES) {
    const result = await lighthouse(BASE + path, { port: chrome.port, output: 'json', logLevel: 'error' });
    const lhr = result?.lhr;
    if (!lhr) throw new Error(`No Lighthouse result for ${path}`);
    const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
    const scores = {
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best-practices': score('best-practices'),
      seo: score('seo'),
    };
    const lcp = lhr.audits['largest-contentful-paint']?.numericValue ?? Infinity;
    const cls = lhr.audits['cumulative-layout-shift']?.numericValue ?? Infinity;
    const tbt = lhr.audits['total-blocking-time']?.numericValue ?? 0;
    const requests = lhr.audits['network-requests']?.details?.items ?? [];
    const bytes = requests.filter((r) => r.resourceType !== 'Font').reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
    const fontBytes = requests.filter((r) => r.resourceType === 'Font').reduce((sum, r) => sum + (r.transferSize ?? 0), 0);

    const problems = [];
    for (const [name, value] of Object.entries(scores)) if (value < TARGET.score) problems.push(`${name} ${value} < ${TARGET.score}`);
    if (lcp > TARGET.lcp) problems.push(`LCP ${(lcp / 1000).toFixed(2)} s > 2.5 s`);
    if (cls > TARGET.cls) problems.push(`CLS ${cls.toFixed(3)} > 0.1`);
    if (bytes > TARGET.bytes) problems.push(`page weight ${(bytes / 1024).toFixed(0)} KB > 300 KB`);

    console.log(
      `${problems.length ? '✗' : '✓'} ${path.padEnd(8)} performance ${scores.performance} · accessibility ${scores.accessibility} · ` +
        `best practices ${scores['best-practices']} · SEO ${scores.seo} · LCP ${(lcp / 1000).toFixed(2)} s · CLS ${cls.toFixed(3)} · ` +
        `TBT ${Math.round(tbt)} ms · ${(bytes / 1024).toFixed(0)} KB + ${(fontBytes / 1024).toFixed(0)} KB fonts`,
    );
    for (const p of problems) console.log(`    - ${p}`);
    if (problems.length) {
      failed = true;
      for (const audit of Object.values(lhr.audits)) {
        if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'informative' && audit.scoreDisplayMode !== 'manual') {
          console.log(`      · ${audit.id}: ${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}`);
        }
      }
    }
  }
} finally {
  await chrome.kill();
  stop();
}
process.exit(failed ? 1 : 0);
