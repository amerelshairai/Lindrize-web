import { expect, test } from '@playwright/test';
import { fakeCalendly } from './helpers';

test.use({ reducedMotion: 'reduce' });

test('skip link is the first stop and jumps to the content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('every control on Home can be reached with Tab and shows where the focus is', async ({ page }) => {
  await page.goto('/');
  const expected = await page
    .locator('a[href]:visible, button:visible')
    .evaluateAll((nodes) => nodes.filter((n) => (n as HTMLElement).tabIndex >= 0).length);
  const seen = new Set<string>();
  let invisible = 0;
  for (let i = 0; i < expected + 15; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const moved = style.top !== 'auto' && el.classList.contains('skip');
      const box = el.getBoundingClientRect();
      return { key: `${el.tagName}|${el.textContent?.trim().slice(0, 40)}|${Math.round(box.top + scrollY)}|${Math.round(box.left)}`, visible: ring || moved };
    });
    if (!info) continue;
    if (!info.visible) invisible++;
    seen.add(info.key);
  }
  expect(invisible, 'controls that take focus without a visible outline').toBe(0);
  // Tabs in a group share one Tab stop (arrow keys move inside), so allow a small difference.
  expect(seen.size).toBeGreaterThanOrEqual(expected - 2);
});

test('sample questions work as tabs with the arrow keys', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await tabs.first().focus();
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Sharm Honeymoon Sea-View Suite');
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Payment is never taken in this chat');
  await page.keyboard.press('ArrowDown');
  await expect(tabs.first()).toBeFocused();
});

test('booking dialog opens from the keyboard, closes with Escape and returns focus', async ({ page }) => {
  await fakeCalendly(page);
  await page.goto('/');
  const button = page.locator('main').getByRole('link', { name: 'Book a 15-minute call' }).first();
  await button.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Book a 15-minute call' });
  await expect(dialog).toBeVisible();
  const frame = dialog.locator('iframe');
  await expect(frame).toHaveAttribute('src', /^https:\/\/calendly\.com\/amerelshair-ai-lindrize\/15-minute-call-with-lindrize\?/);
  await expect(frame).toHaveAttribute('title', 'Calendly booking calendar');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(dialog.locator('iframe')).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('phone menu opens and closes from the keyboard', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav).toBeHidden();
  const toggle = page.getByRole('button', { name: 'Menu' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
  await context.close();
});
