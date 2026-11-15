import { expect, type Page } from '@playwright/test';

export const HOME = [
  { lang: 'en', url: '/', dir: 'ltr' },
  { lang: 'ar', url: '/ar/', dir: 'rtl' },
] as const;

/**
 * Fails the test if the page logs an error. Content-security-policy violations are reported as
 * console errors, so this also proves nothing is blocked by (or slips past) the policy.
 */
export function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Calendly cannot be reached from the test machine, so its page is replaced by a blank one. */
export async function fakeCalendly(page: Page): Promise<void> {
  await page.route('https://calendly.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Calendar</title><p>Calendar</p>' }),
  );
}

/** Scroll through the whole page so every scroll-triggered part has appeared. */
export async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
}

export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'the page must not scroll sideways').toBeLessThanOrEqual(0);
}
