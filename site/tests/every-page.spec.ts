/**
 * Phase 4: the checks below run on every page the site builds, in both languages.
 * They cover the parts of WCAG 2.2 AA that a machine can test.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll, watchForErrors } from './helpers';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : name.endsWith('.html') ? [full] : [];
  });
const pages = walk(DIST)
  .filter((file) => !/http-equiv="refresh"/.test(readFileSync(file, 'utf8')))
  .map((file) => `/${relative(DIST, file).split('\\').join('/').replace(/index\.html$/, '')}`)
  .sort();

test('the site builds the pages we expect', () => {
  expect(pages.length).toBe(84);
});

// Pages are checked in groups so that one failure names its page without stopping the others.
const groups = new Map<string, string[]>();
for (const url of pages) {
  const key = url.includes('/solutions/') && url.split('/').length > (url.startsWith('/ar/') ? 4 : 3)
    ? `${url.startsWith('/ar/') ? 'Arabic' : 'English'} system pages`
    : `${url.startsWith('/ar/') ? 'Arabic' : 'English'} main pages`;
  groups.set(key, [...(groups.get(key) ?? []), url]);
}

for (const [name, urls] of groups) {
  test.describe(name, () => {
    test.describe.configure({ timeout: 240_000 });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`axe finds nothing in ${colorScheme} mode`, async ({ browser }) => {
        const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = watchForErrors(page);
        const problems: string[] = [];
        for (const url of urls) {
          await page.goto(url);
          const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
          for (const v of results.violations) problems.push(`${url}: ${v.id} (${v.impact}) × ${v.nodes.length} ${v.help}`);
        }
        expect(problems).toEqual([]);
        expect(errors, 'console errors, including anything the security policy blocked').toEqual([]);
        await context.close();
      });
    }

    test('reads without sideways scrolling at 320px (400% zoom)', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      for (const url of urls) {
        await page.goto(url);
        await expectNoSidewaysScroll(page);
        const clipped = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main p, main a, main button, main li, main dd, main dt, main label')]
            .filter((el) => el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
            .map((el) => `${el.tagName} "${el.textContent?.trim().slice(0, 30)}"`),
        );
        expect(clipped, `${url}: text cut off at 320px`).toEqual([]);
      }
      await context.close();
    });

    test('every control is at least 24 by 24 pixels (WCAG 2.2 target size)', async ({ browser }) => {
      const problems: string[] = [];
      for (const width of [360, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        for (const url of urls) {
          await page.goto(url);
          const small = await page.evaluate(() => {
            const out: string[] = [];
            for (const el of document.querySelectorAll<HTMLElement>('a[href], button, input, select, [role="tab"]')) {
              if (el.offsetParent === null || el.closest('[hidden]') || getComputedStyle(el).visibility === 'hidden') continue;
              // A link inside a sentence is exempt: its line of text is its target.
              if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, dd, span')) continue;
              // Inputs that fill their visible label are measured by that label.
              const box = (el.tagName === 'INPUT' && getComputedStyle(el).opacity === '0' ? (el.parentElement ?? el) : el).getBoundingClientRect();
              if (box.width === 0 && box.height === 0) continue;
              if (box.width < 24 || box.height < 24) out.push(`${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(box.width)}×${Math.round(box.height)}`);
            }
            return out;
          });
          for (const s of small) problems.push(`${url} at ${width}px: ${s}`);
        }
        await context.close();
      }
      expect(problems).toEqual([]);
    });

    test('text still fits when visitors widen letter, word and line spacing', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      for (const url of urls) {
        await page.goto(url);
        // The spacing a reader may set for themselves (WCAG 1.4.12).
        await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }' }).catch(() => undefined);
        await page.evaluate(() => {
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            el.style.setProperty('line-height', '1.5', 'important');
            el.style.setProperty('letter-spacing', '0.12em', 'important');
            el.style.setProperty('word-spacing', '0.16em', 'important');
          }
        });
        await expectNoSidewaysScroll(page);
        const clipped = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('main .btn, main h1, main h2, header .btn')]
            .filter((el) => el.offsetParent !== null && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && getComputedStyle(el).overflow !== 'visible')
            .map((el) => el.textContent?.trim().slice(0, 30)),
        );
        expect(clipped, `${url}: text cut off with wider spacing`).toEqual([]);
      }
      await context.close();
    });

    test('keyboard focus is never hidden behind the header', async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 600 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const problems: string[] = [];
      for (const url of urls.slice(0, 12)) {
        await page.goto(url);
        const stops = await page.locator('a[href]:visible, button:visible, input:visible, select:visible').count();
        for (let i = 0; i < Math.min(stops + 4, 90); i++) {
          await page.keyboard.press('Tab');
          const hidden = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            const head = document.querySelector('[data-site-head]');
            // The skip link is tested on its own in keyboard.spec.ts.
            if (!el || el === document.body || !head || head.contains(el) || el.classList.contains('skip')) return null;
            const box = (el.tagName === 'INPUT' && getComputedStyle(el).opacity === '0' ? (el.parentElement ?? el) : el).getBoundingClientRect();
            const headBottom = head.getBoundingClientRect().bottom;
            const covered = box.top < headBottom - 1 && box.bottom > 0;
            const off = box.bottom < 0 || box.top > window.innerHeight;
            return covered || off ? `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 30)}" top ${Math.round(box.top)}` : null;
          });
          if (hidden) problems.push(`${url}: ${hidden}`);
        }
      }
      expect(problems).toEqual([]);
      await context.close();
    });
  });
}
