import AxeBuilder from '@axe-core/playwright';
import settings from '../src/data/settings.json' with { type: 'json' };
import { expect, test, type Page } from '@playwright/test';
import { estimate, roundNice } from '../src/lib/estimate';
import { expectNoSidewaysScroll, fakeCalendly, watchForErrors } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const URL = '/design-your-agent/';
test.use({ reducedMotion: 'reduce' });

/** Answer the steps up to the design, the way an Umrah office owner might. */
async function reachDesign(page: Page): Promise<void> {
  await page.getByLabel('Hajj and Umrah offices').check();
  await page.getByLabel('2 to 5', { exact: true }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Customers ask for a price, then disappear.').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('A second follow-up a few days later').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('20 to 50').check();
  await page.getByRole('button', { name: /^Next/ }).click();
}

test('the steps cannot be skipped, and say what is missing', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-progress]')).toHaveText('Step 1 of 5');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Choose one to continue.' })).toBeVisible();
  await expect(page.locator('[data-step="business"]')).toBeVisible();
  await page.getByLabel('Car rental').check();
  await page.getByLabel('Just me').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('[data-progress]')).toHaveText('Step 2 of 5');
  await expect(page.getByRole('heading', { name: 'Your biggest problem' })).toBeFocused();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByLabel('Car rental')).toBeChecked();
});

test('the problem suggests a system, and the visitor can choose another', async ({ page }) => {
  await page.goto(URL);
  await page.getByLabel('Travel agencies and tour operators').check();
  await page.getByLabel('6 to 15').check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Collecting passports and papers takes days.').check();
  await page.getByRole('button', { name: 'Next' }).click();
  const system = page.getByLabel('System', { exact: true });
  await expect(system).toHaveValue('9');
  await expect(page.locator('[data-system-info="9"]')).toBeVisible();
  await expect(page.locator('[data-board-for="9"]')).toBeVisible();
  await system.selectOption({ label: 'Visa Application Tracker' });
  await expect(page.locator('[data-board-for="23"]')).toBeVisible();
  await expect(page.locator('[data-board-for="9"]')).toBeHidden();
  await expect(system.locator('option')).toHaveCount(30);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('[data-features-for="23"]')).toBeVisible();
  await expect(page.locator('[data-features-for]:visible')).toHaveCount(1);
});

test('the design summary fills the booking and the WhatsApp message', async ({ page }) => {
  await fakeCalendly(page);
  await page.goto(URL);
  await reachDesign(page);
  await expect(page.getByRole('heading', { name: 'Your design' })).toBeFocused();
  await expect(page.locator('[data-progress]')).toHaveText('');
  const summary = page.locator('[data-summary]');
  await expect(summary).toContainText('Hajj and Umrah offices');
  await expect(summary).toContainText('Quote Follow-up');
  await expect(summary).toContainText('A second follow-up a few days later');
  await expect(summary.locator('[data-row="staff"]')).toBeHidden();

  const whatsapp = decodeURIComponent((await page.locator('[data-design-whatsapp]').getAttribute('href')) ?? '');
  expect(whatsapp).toContain('wa.me/962785536571?text=Lindrize: my agent design\nBusiness: Hajj and Umrah offices');
  expect(whatsapp).toContain('System: Quote Follow-up');

  await page.locator('[data-design-book]').click();
  const frame = page.getByRole('dialog').locator('iframe');
  const src = new globalThis.URL((await frame.getAttribute('src')) ?? '');
  expect(src.hostname).toBe('calendly.com');
  expect(src.searchParams.get('a1')).toContain('Biggest problem: Customers ask for a price, then disappear.');
});

test('answers stay on the device, come back after a reload, and can be cleared', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') requests.push(`${r.method()} ${r.url()}`);
  });
  await page.goto(URL);
  await reachDesign(page);
  expect(requests, 'nothing is sent while designing').toEqual([]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lz-design') ?? '{}'));
  expect(saved).toMatchObject({ type: 'umrah', size: 'small', problem: 'went-quiet', system: '2', features: ['second-follow-up'], messages: 'm2' });

  await page.reload();
  await expect(page.getByLabel('Hajj and Umrah offices')).toBeChecked();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('Customers ask for a price, then disappear.')).toBeChecked();

  await page.getByRole('button', { name: 'Clear my answers' }).click();
  await expect(page.getByText('Your answers were cleared from this device.')).toBeVisible();
  await expect(page.getByLabel('Hajj and Umrah offices')).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('lz-design'))).toBeNull();
});

test('the board plays one step a second, reacts to extras, and compares with no assistant', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(URL);
  const board = page.locator('[data-board-for="1"]');
  const mood = page.locator('[data-mood]');
  await expect(board.locator('.step.pending')).toHaveCount(0);
  await expect(mood).toHaveAttribute('data-kind', 'done');

  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(mood).toHaveAttribute('data-kind', 'waiting');
  await expect(mood).toHaveAttribute('data-kind', 'answered', { timeout: 4000 });
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await board.locator('.step.pending').count();
  expect(paused).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(await board.locator('.step.pending').count(), 'paused means paused').toBe(paused);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(mood).toHaveAttribute('data-kind', 'done', { timeout: 9000 });
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Without an assistant' }).click();
  await expect(page.locator('[data-board-for="without"]')).toBeVisible();
  await expect(mood).toHaveAttribute('data-kind', 'lost', { timeout: 7000 });
  await expect(mood).toContainText('Gone elsewhere');
  await context.close();
});

test('the email option shows once the human check is set up, and works', async ({ page }) => {
  // Stand-ins for Cloudflare's check and for the receiver, which run on the real server.
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'window.turnstile = { render: (el, o) => { el.textContent = "check"; setTimeout(() => o.callback("test-token"), 50); } };',
    }),
  );
  let received: Record<string, unknown> | undefined;
  await page.route('**/api/design', async (route) => {
    received = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto(URL);
  await reachDesign(page);
  const form = page.locator('[data-email-form]');
  if (settings.turnstileSiteKey === '') {
    // Without a site key the option stays hidden; give it one to test the rest.
    await expect(form).toBeHidden();
    await form.evaluate((el) => el.setAttribute('data-sitekey', '1x00000000000000000000AA'));
  } else {
    await expect(form).toHaveAttribute('data-sitekey', settings.turnstileSiteKey);
  }
  await expect(form).toBeVisible();
  await expect(form.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy/');

  const email = page.getByLabel('Your email');
  await email.fill('not-an-email');
  await page.getByRole('button', { name: 'Send' }).click();
  const error = form.getByRole('alert');
  await expect(error).toHaveText('Please enter an email like name@agency.com.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  expect(received).toBeUndefined();

  await email.fill('owner@agency.com');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(form.getByRole('status')).toHaveText('Sent. Check your inbox for your design.');
  expect(received).toMatchObject({
    email: 'owner@agency.com',
    lang: 'en',
    company: '',
    token: 'test-token',
    design: { type: 'umrah', system: '2', features: ['second-follow-up'] },
  });
  expect(Object.keys(received ?? {}).sort()).toEqual(['company', 'design', 'elapsed', 'email', 'lang', 'token']);
});

test('if sending fails, the visitor is told what to do instead', async ({ page }) => {
  await page.goto(URL);
  await reachDesign(page);
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.turnstile = { render: (el, o) => o.callback("t") };' }),
  );
  await page.route('**/api/design', (route) => route.fulfill({ status: 429, contentType: 'application/json', body: '{"ok":false}' }));
  const form = page.locator('[data-email-form]');
  await form.evaluate((el) => el.setAttribute('data-sitekey', 'x'));
  await page.getByLabel('Your email').fill('owner@agency.com');
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(form.getByRole('alert')).toHaveText('Too many tries. Please wait a while, or send it to us on WhatsApp.');
});

test('no estimate is shown while the owner has not set the assumptions', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('[data-step="estimate"]')).toHaveCount(0);
  await expect(page.locator('select[name="currency"]')).toHaveCount(0);
  await expect(page.locator('[data-builder]')).not.toHaveAttribute('data-assumptions', /.+/);
});

test('the estimate maths: a range from the visitor’s answers, capped by the hours people work', () => {
  const a = { routineShare: 0.5, minutesPerReply: 3, workHoursPerMonth: 160 };
  const result = estimate({ messagesPerDay: { low: 20, high: 50 }, staff: { low: 2, high: 3 }, salaryUsd: { low: 500, high: 800 } }, a);
  expect(result.hoursPerWeek.low).toBeCloseTo(3.5, 5); // 20 × 7 × 0.5 × 3 ÷ 60
  expect(result.hoursPerWeek.high).toBeCloseTo(8.75, 5);
  expect(result.costPerMonthUsd?.low).toBeCloseTo(3.5 * (52 / 12) * (500 / 160), 5);
  expect(result.costPerMonthUsd?.high).toBeGreaterThan(result.costPerMonthUsd?.low ?? 0);
  const capped = estimate({ messagesPerDay: { low: 5000, high: 5000 }, staff: { low: 1, high: 1 } }, a);
  expect(capped.hoursPerWeek.high).toBeCloseTo(160 / (52 / 12), 5);
  expect(capped.costPerMonthUsd).toBeUndefined();
  expect([roundNice(354.5), roundNice(8.75), roundNice(1234), roundNice(0.4), roundNice(0)]).toEqual([350, 8.8, 1200, 1, 0]);
});

for (const url of [URL, `/ar${URL}`]) {
  test(`axe and layout: ${url}`, async ({ browser }) => {
    for (const [colorScheme, width] of [['light', 1280], ['dark', 1280], ['light', 360]] as const) {
      const context = await browser.newContext({ colorScheme, viewport: { width, height: 800 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = watchForErrors(page);
      await page.goto(url);
      const check = async (label: string) => {
        const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(results.violations.map((v) => `${label} ${colorScheme} ${width}: ${v.id} × ${v.nodes.length} ${v.help}`)).toEqual([]);
        await expectNoSidewaysScroll(page);
      };
      await check('step 1');
      if (url === URL) {
        await reachDesign(page);
        await page.locator('[data-email-form]').evaluate((el) => el.setAttribute('data-sitekey', 'x'));
        await check('design');
      }
      expect(errors).toEqual([]);
      await context.close();
    }
  });
}

test('Arabic: the builder works right to left', async ({ page }) => {
  await page.goto(`/ar${URL}`);
  await expect(page.locator('[data-progress]')).toHaveText('الخطوة 1 من 5');
  await page.getByLabel('مكاتب الحج والعمرة').check();
  await page.getByLabel('من 2 إلى 5').check();
  await page.getByRole('button', { name: 'التالي' }).click();
  await page.getByLabel('يسأل العملاء عن السعر ثم يختفون.').check();
  await page.getByRole('button', { name: 'التالي' }).click();
  await expect(page.getByLabel('النظام', { exact: true })).toHaveValue('2');
  await expect(page.locator('[data-board-for="2"] .step').first()).toContainText('عميل يحصل على سعر رحلة إلى دبي');
});

test('with scripts off, the page offers a call instead', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(URL);
  await expect(page.getByText('This tool needs JavaScript.')).toBeVisible();
  await expect(page.locator('.builder').getByRole('link', { name: 'Book a 15-minute call' })).toBeVisible();
  await expect(page.locator('[data-builder-form]')).toBeHidden();
  await context.close();
});
