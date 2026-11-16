/**
 * Runs Google's Lighthouse test (mobile settings) against the built site and checks the targets
 * in SPEC 13: 95+ on all four scores, main content in under 2.5 s, layout shift under 0.1,
 * and about 300 KB per page without fonts.
 *
 * Usage: build first, then `npm run lighthouse`. Set CHROME_PATH if Chrome is not found.
 */
import { existsSync } from 'node:fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { startServer } from './serve.mjs';
import { pages, isRedirect } from './lib.mjs';

const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
// One of each kind of page, in both languages.
const DEFAULT_PAGES = ['/', '/ar/', '/solutions/', '/ar/solutions/ai-travel-sales-assistant/', '/pricing/', '/ar/faq/', '/design-your-agent/', '/ar/design-your-agent/'];
// `--all` tests every page the site builds (slow: used for the Phase 4 pass and before launch).
const args = process.argv.slice(2);
const PAGES = args.includes('--all')
  ? pages().filter((p) => !isRedirect(p.html) && !p.url.includes('404')).map((p) => p.url)
  : args.length > 0
    ? args
    : DEFAULT_PAGES;
const TARGET = { score: 95, lcp: 2500, cls: 0.1, bytes: 300 * 1024 };

const sandboxChrome = '/opt/pw-browsers/chromium';
const chromePath = process.env.CHROME_PATH ?? (existsSync(sandboxChrome) ? sandboxChrome : undefined);

const server = await startServer(PORT);
const stop = () => server.close();

const chrome = await chromeLauncher.launch({
  ...(chromePath ? { chromePath } : {}),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

/** One Lighthouse run of one page, reduced to the numbers we check. */
async function measure(path) {
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
  const sum = (items) => items.reduce((total, r) => total + (r.transferSize ?? 0), 0);
  const bytes = sum(requests.filter((r) => r.resourceType !== 'Font'));
  const fontBytes = sum(requests.filter((r) => r.resourceType === 'Font'));

  const problems = [];
  // A page deliberately hidden from search engines (Privacy and Terms until they are written)
  // cannot score on SEO, so that one score is not judged for it.
  const hidden = lhr.audits['is-crawlable']?.score === 0;
  for (const [name, value] of Object.entries(scores)) {
    if (name === 'seo' && hidden) continue;
    if (value < TARGET.score) problems.push(`${name} ${value} < ${TARGET.score}`);
  }
  if (lcp > TARGET.lcp) problems.push(`LCP ${(lcp / 1000).toFixed(2)} s > 2.5 s`);
  if (cls > TARGET.cls) problems.push(`CLS ${cls.toFixed(3)} > 0.1`);
  if (bytes > TARGET.bytes) problems.push(`page weight ${(bytes / 1024).toFixed(0)} KB > 300 KB`);

  const weak = Object.values(lhr.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual')
    .map((a) => `${a.id}: ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
  return { scores, lcp, cls, tbt, bytes, fontBytes, problems, weak };
}

let failed = false;
try {
  // The first page load in a fresh browser is slower than any real visit. Do one and discard it.
  await measure(PAGES[0] ?? '/');

  for (const path of PAGES) {
    // Timing varies from run to run on shared machines. If a run misses a target, measure twice
    // more and judge the middle result, which is how Lighthouse scores are normally compared.
    let run = await measure(path);
    let runs = 1;
    if (run.problems.length > 0) {
      const all = [run, await measure(path), await measure(path)].sort((a, b) => a.scores.performance - b.scores.performance);
      run = all[1] ?? run;
      runs = 3;
    }
    const { scores, lcp, cls, tbt, bytes, fontBytes, problems, weak } = run;
    console.log(
      `${problems.length ? '✗' : '✓'} ${path.padEnd(52)} performance ${scores.performance} · accessibility ${scores.accessibility} · ` +
        `best practices ${scores['best-practices']} · SEO ${scores.seo} · LCP ${(lcp / 1000).toFixed(2)} s · CLS ${cls.toFixed(3)} · ` +
        `TBT ${Math.round(tbt)} ms · ${(bytes / 1024).toFixed(0)} KB + ${(fontBytes / 1024).toFixed(0)} KB fonts` +
        (runs > 1 ? ` (middle of ${runs} runs)` : ''),
    );
    for (const p of problems) console.log(`    - ${p}`);
    if (problems.length) {
      failed = true;
      for (const w of weak) console.log(`      · ${w}`);
    }
  }
} finally {
  await chrome.kill();
  stop();
}
process.exit(failed ? 1 : 0);
