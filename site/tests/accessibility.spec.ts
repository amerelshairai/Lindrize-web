import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { HOME, scrollThrough, watchForErrors } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

for (const { lang, url } of HOME) {
  for (const colorScheme of ['light', 'dark'] as const) {
    for (const motion of ['reduce', 'no-preference'] as const) {
      test(`axe: Home ${lang}, ${colorScheme} mode, motion ${motion}`, async ({ browser }) => {
        const context = await browser.newContext({ colorScheme, reducedMotion: motion });
        const page = await context.newPage();
        const errors = watchForErrors(page);
        await page.goto(url);
        // Let the hero chat finish, then bring every scroll-triggered part into its final state.
        await page.waitForTimeout(motion === 'reduce' ? 300 : 5500);
        await scrollThrough(page);
        const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.help}`);
        expect(summary, 'accessibility problems found by axe').toEqual([]);
        expect(errors, 'console errors').toEqual([]);
        await context.close();
      });
    }
  }
}

test('axe: Home on a phone with the menu open', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  await context.close();
});

test('axe: placeholder and not-found pages', async ({ page }) => {
  for (const url of ['/pricing/', '/ar/pricing/', '/404.html']) {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations.map((v) => `${url} ${v.id}: ${v.help}`)).toEqual([]);
  }
});

test('page structure: one main heading, headings in order, landmarks', async ({ page }) => {
  for (const { url, lang, dir } of HOME) {
    await page.goto(url);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    const levels = await page.locator('main h1, main h2, main h3, main h4').evaluateAll((nodes) =>
      nodes.map((node) => Number(node.tagName.slice(1))),
    );
    for (let i = 1; i < levels.length; i++) {
      expect((levels[i] ?? 0) - (levels[i - 1] ?? 0), `heading ${i + 1} skips a level`).toBeLessThanOrEqual(1);
    }
  }
});
