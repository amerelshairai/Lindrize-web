import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll, scrollThrough, watchForErrors } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** One of each kind of page built in Phase 2. */
const PAGES = [
  '/solutions/',
  '/solutions/ai-travel-sales-assistant/',
  '/solutions/supplier-booking-requests/',
  '/industries/',
  '/pricing/',
  '/faq/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/ownership/',
];
const both = (path: string) => [path, `/ar${path}`];

for (const url of PAGES.flatMap(both)) {
  test(`axe: ${url}`, async ({ browser }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = watchForErrors(page);
      await page.goto(url);
      const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(results.violations.map((v) => `${colorScheme} ${v.id} (${v.impact}): ${v.nodes.length} × ${v.help}`)).toEqual([]);
      expect(errors).toEqual([]);
      await context.close();
    }
  });

  test(`layout: ${url} on a phone and a laptop`, async ({ browser }, testInfo) => {
    for (const width of [360, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      await page.goto(url);
      await scrollThrough(page);
      await expectNoSidewaysScroll(page);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.screenshot({ path: testInfo.outputPath(`${url.replace(/\W+/g, '-')}${width}.png`), fullPage: true });
      await context.close();
    }
  });
}

test.describe('Solutions', () => {
  test.use({ reducedMotion: 'reduce' });

  test('lists all 30 systems, each linking to its own page', async ({ page }) => {
    await page.goto('/solutions/');
    const rows = page.locator('[data-system]');
    await expect(rows).toHaveCount(30);
    await expect(page.locator('[data-count]')).toHaveText('30 systems shown');
    const links = await rows.locator('a').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
    expect(new Set(links).size).toBe(30);
    for (const href of links) expect(href).toMatch(/^\/solutions\/[a-z0-9-]+\/$/);
  });

  test('search narrows the list and says how many are shown', async ({ page }) => {
    await page.goto('/solutions/');
    await page.getByLabel('Search systems').fill('follow-up');
    await expect(page.locator('[data-system]:visible')).toHaveCount(1);
    await expect(page.locator('[data-system]:visible')).toContainText('Quote Follow-up');
    await expect(page.locator('[data-count]')).toHaveText('1 systems shown');
    await page.getByLabel('Search systems').fill('zzzz');
    await expect(page.locator('[data-system]:visible')).toHaveCount(0);
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('[data-group-section]:visible')).toHaveCount(0);
  });

  test('the group choice works with the arrow keys', async ({ page }) => {
    await page.goto('/solutions/');
    await page.getByRole('radio', { name: 'All' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Win more bookings' })).toBeChecked();
    await expect(page.locator('[data-system]:visible')).toHaveCount(8);
    await page.getByRole('radio', { name: 'Run your office' }).check();
    await expect(page.locator('[data-system]:visible')).toHaveCount(15);
  });

  test('a link from Industries opens the list already filtered', async ({ page }) => {
    await page.goto('/industries/');
    await page.locator('#umrah').getByRole('link', { name: 'See these systems' }).click();
    await expect(page).toHaveURL(/\/solutions\/\?industry=umrah$/);
    await expect(page.getByLabel('Your field')).toHaveValue('umrah');
    await expect(page.locator('[data-system]:visible')).toHaveCount(6);
  });

  test('Arabic search finds Arabic names', async ({ page }) => {
    await page.goto('/ar/solutions/');
    await page.getByLabel('ابحث في الأنظمة').fill('متابعة عروض');
    await expect(page.locator('[data-system]:visible')).toHaveCount(1);
  });

  test('with scripts off, the full list is shown without the filter controls', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/solutions/');
    await expect(page.locator('[data-system]:visible')).toHaveCount(30);
    await expect(page.locator('[data-filters]')).toBeHidden();
    await context.close();
  });
});

test.describe('System pages', () => {
  test.use({ reducedMotion: 'reduce' });

  test('all 30 follow the same order in both languages', async ({ page }) => {
    await page.goto('/solutions/');
    const links = await page.locator('[data-system] a').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href') ?? ''));
    for (const href of links.flatMap((l) => [l, `/ar${l}`])) {
      await page.goto(href);
      await expect(page.locator('h1'), href).toHaveCount(1);
      await expect(page.locator('.board .step').first(), href).toBeVisible();
      await expect(page.locator('.never p'), href).not.toBeEmpty();
      await expect(page.locator('.faq .item'), href).toHaveCount(3);
      await expect(page.locator('main .table li'), href).not.toHaveCount(0);
      const headings = await page.locator('main h2').allTextContents();
      expect(headings.length, href).toBeGreaterThanOrEqual(5);
    }
  });

  test('the board is labelled as an example', async ({ page }) => {
    await page.goto('/solutions/quote-follow-up/');
    await expect(page.locator('.board figcaption')).toHaveText('Example. Not a real client.');
    await page.goto('/ar/solutions/quote-follow-up/');
    await expect(page.locator('.board figcaption')).toHaveText('مثال توضيحي، وليس عميلاً حقيقياً.');
  });

  test('WhatsApp opens with the system named in the message', async ({ page }) => {
    await page.goto('/solutions/payment-reminders/');
    const href = await page.locator('.page-head').getByRole('link', { name: 'Message us on WhatsApp' }).getAttribute('href');
    expect(decodeURIComponent(href ?? '')).toContain("Hi, I'm interested in Payment Reminders.");
  });

  test('only the Sales Assistant page carries the live demo chats', async ({ page }) => {
    await page.goto('/solutions/ai-travel-sales-assistant/');
    await expect(page.getByRole('tab')).toHaveCount(4);
    await expect(page.locator('[data-chat] figcaption').first()).toHaveText('Live demo with Darb Al-Yasmeen, a fictional agency');
    await page.goto('/solutions/quote-follow-up/');
    await expect(page.locator('[data-chat]')).toHaveCount(0);
  });

  test('Arabic system pages show the English name once, under the heading', async ({ page }) => {
    await page.goto('/ar/solutions/quote-follow-up/');
    await expect(page.locator('h1')).toHaveText('متابعة عروض الأسعار');
    await expect(page.locator('.english-name')).toHaveText('Quote Follow-up');
  });
});

test('Pricing shows how payment works and no amounts', async ({ page }) => {
  for (const url of ['/pricing/', '/ar/pricing/']) {
    await page.goto(url);
    const text = await page.locator('main').innerText();
    expect(text, 'no currency amounts on the pricing page').not.toMatch(/JOD|USD|\$|دينار|دولار|ريال|درهم/);
    await expect(page.locator('.tiers li')).toHaveCount(3);
    await expect(page.locator('.tiers .left'), 'places left stay hidden until they are set').toHaveCount(0);
  }
});

test('FAQ answers are always visible, in six groups', async ({ page }) => {
  await page.goto('/faq/');
  await expect(page.locator('main section.sec')).toHaveCount(6);
  const items = page.locator('.faq .item');
  expect(await items.count()).toBeGreaterThanOrEqual(20);
  await expect(page.locator('details')).toHaveCount(0);
  for (const answer of await items.locator('p').all()) await expect(answer).toBeVisible();
});

test('the three legal pages show their full text and date, and are linked in the footer', async ({ page }) => {
  for (const [url, sections] of [['/privacy/', 11], ['/terms/', 10], ['/ownership/', 8], ['/ar/privacy/', 11], ['/ar/terms/', 10], ['/ar/ownership/', 8]] as const) {
    await page.goto(url);
    await expect(page.locator('main section[data-allow-terms]')).toHaveCount(sections);
    await expect(page.locator('main time[datetime]')).toHaveCount(1);
    await expect(page.locator('[data-launch-block]')).toHaveCount(0);
    // Bold markers are turned into bold text, never shown as stars.
    expect(await page.locator('main').innerText()).not.toContain('**');
  }
  await page.goto('/ownership/');
  await expect(page.locator('main li').first()).toBeVisible();
  const footer = page.locator('footer');
  for (const name of ['Privacy Policy', 'Terms', 'Ownership and buy-out']) await expect(footer.getByRole('link', { name })).toBeVisible();
});

test('Contact has the three ways to get in touch and no form', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('main').getByRole('link', { name: 'Book a 15-minute call' })).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: '+962 78 553 6571' })).toHaveAttribute('href', /^https:\/\/wa\.me\/962785536571/);
  await expect(page.locator('main').getByRole('link', { name: 'amer.ai@lindrize.online' })).toHaveAttribute('href', 'mailto:amer.ai@lindrize.online');
});

test('the menu marks the page you are on', async ({ page }) => {
  await page.goto('/solutions/quote-follow-up/');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Solutions' })).toHaveAttribute('aria-current', 'page');
  await page.goto('/pricing/');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page');
});
