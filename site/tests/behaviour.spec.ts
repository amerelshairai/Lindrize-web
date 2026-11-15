import { expect, test } from '@playwright/test';
import { HOME, expectNoSidewaysScroll, fakeCalendly, scrollThrough, watchForErrors } from './helpers';

test('light and dark mode follow the device and remember the visitor\'s choice', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await background()).toBe('rgb(42, 40, 38)');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  expect(await background()).toBe('rgb(255, 255, 255)');
  await page.reload();
  expect(await background()).toBe('rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  await context.close();
});

test('teal is used on main buttons only', async ({ page }) => {
  await page.goto('/');
  const teal = 'rgb(76, 217, 207)';
  const offenders = await page.evaluate((color) => {
    const bad: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const style = getComputedStyle(el);
      const usesTeal = [style.backgroundColor, style.color, style.borderTopColor].includes(color);
      const allowed = el.closest('.btn-main, .logo, .load-bar') !== null;
      if (usesTeal && !allowed) bad.push(`${el.tagName}.${el.className}`);
    }
    return bad;
  }, teal);
  expect(offenders).toEqual([]);
});

test('language switch goes to the same page in the other language', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read this page in Arabic' }).click();
  await expect(page).toHaveURL(/\/ar\/$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('link', { name: 'Read this page in English' }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4321\/$/);
});

test('the hero chat plays once in under 6 seconds and can be replayed', async ({ page }) => {
  await page.goto('/');
  const phone = page.locator('#hero-chat [data-autoplay]');
  await expect(phone).toHaveAttribute('data-state', 'done', { timeout: 6000 });
  for (const message of await phone.locator('.m').all()) await expect(message).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(phone).toHaveAttribute('data-state', 'playing');
  await expect(phone).toHaveAttribute('data-state', 'done', { timeout: 6000 });
});

test('every example chat is labelled as a demo with a fictional agency', async ({ page }) => {
  for (const { url, lang } of HOME) {
    await page.goto(url);
    const label = lang === 'en' ? 'Live demo with Darb Al-Yasmeen, a fictional agency' : 'عرض حي مع «درب الياسمين»، مكتب سياحي تجريبي غير حقيقي';
    const phones = page.locator('[data-chat]');
    const count = await phones.count();
    expect(count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < count; i++) await expect(phones.nth(i).locator('figcaption')).toHaveText(label);
  }
});

test('the scroll story changes the example step by step', async ({ page }) => {
  await page.goto('/');
  const story = page.locator('[data-story]');
  await expect(story).toHaveAttribute('data-live', '');
  const request = story.locator('.request');
  await page.locator('[data-step="1"]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(page.locator('[data-step="1"]')).toHaveClass(/active/);
  await expect(request).toHaveCSS('opacity', '0');
  await expect(story.locator('.m:visible')).toHaveCount(1);
  await page.locator('[data-step="3"]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(page.locator('[data-step="3"]')).toHaveClass(/active/);
  await expect(request).toHaveCSS('opacity', '1');
  await expect(request).toContainText('1,410 JOD');
  await expect(story.locator('.m:visible')).toHaveCount(6);
});

test('with "reduce motion" on, everything is shown finished and nothing animates', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/motion/);
  for (const message of await page.locator('#hero-chat .m').all()) await expect(message).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: 'Replay' })).toBeHidden();
  await expect(page.locator('[data-story]')).not.toHaveAttribute('data-live', '');
  await expect(page.locator('[data-story] .request')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-statement]')).not.toHaveAttribute('data-armed', '');
  const hidden = await page.locator('[data-reveal]').evaluateAll((nodes) => nodes.filter((n) => getComputedStyle(n).opacity !== '1').length);
  expect(hidden).toBe(0);
  await context.close();
});

test('with scripts turned off, all content is still there', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  for (const message of await page.locator('#hero-chat .m').all()) await expect(message).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-panel]:visible')).toHaveCount(3);
  await expect(page.locator('[data-story] .request')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book a 15-minute call' }).first()).toHaveAttribute('href', /^https:\/\/calendly\.com\//);
  const hidden = await page.locator('[data-reveal]').evaluateAll((nodes) => nodes.filter((n) => getComputedStyle(n).opacity !== '1').length);
  expect(hidden).toBe(0);
  await context.close();
  const phone = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const small = await phone.newPage();
  await small.goto('/');
  await expect(small.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await phone.close();
});

test('phone booking bar appears after the first button scrolls away and hides at the footer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await fakeCalendly(page);
  await page.goto('/');
  const bar = page.locator('[data-sticky-bar]');
  await expect(bar).toBeHidden();
  await page.locator('#systems').scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await bar.getByRole('link', { name: 'Book a 15-min call' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(bar).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(bar).toBeVisible();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();
  await context.close();
});

test('WhatsApp links open a chat with a message already typed', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.final').getByRole('link', { name: 'Message us on WhatsApp' });
  await expect(link).toHaveAttribute('href', "https://wa.me/962785536571?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20Lindrize.");
});

test('hidden until filled: no video block and no feedback section yet', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#demo-video')).toHaveCount(0);
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expect(page.getByText('What clients say')).toHaveCount(0);
});

for (const { lang, url } of HOME) {
  for (const width of [360, 390, 768, 1024, 1280, 1920]) {
    test(`layout: Home ${lang} at ${width}px wide has no sideways scroll and no errors`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      const errors = watchForErrors(page);
      await page.goto(url);
      await page.waitForTimeout(400);
      await expectNoSidewaysScroll(page);
      await scrollThrough(page);
      await expectNoSidewaysScroll(page);
      expect(errors).toEqual([]);
      // Saved for the right-to-left review (PLAN.md section 12).
      await page.screenshot({ path: testInfo.outputPath(`home-${lang}-${width}.png`), fullPage: true });
      await context.close();
    });
  }
}
