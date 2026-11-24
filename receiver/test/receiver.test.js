import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start, goodBody, catalog, config, ORIGIN } from './helpers.js';
import { validate } from '../src/validate.js';
import { summaryLines, visitorEmail, ownerEmail, telegramText } from '../src/compose.js';
import { createLimiter } from '../src/limits.js';
import { createCatalog, looksValid } from '../src/catalog.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('a good design is emailed to the owner and the visitor, with a Telegram alert', async () => {
  const app = await start();
  const response = await app.post(goodBody());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('cache-control'), 'no-store');

  const [toOwner, toVisitor] = app.sent.mails;
  assert.equal(toOwner.to, 'owner@example.test');
  assert.equal(toOwner.replyTo, 'owner@agency.com');
  assert.match(toOwner.text, /Their email: owner@agency\.com/);
  assert.match(toOwner.text, /System: Quote Follow-up/);
  assert.match(toOwner.text, /Extras: A second follow-up a few days later/);
  assert.equal(toVisitor.to, 'owner@agency.com');
  assert.equal(toVisitor.subject, 'Your Lindrize agent design');
  assert.match(toVisitor.text, /https:\/\/lindrize\.online\/book/);
  assert.equal(toOwner.html, undefined, 'emails are plain text only');

  assert.equal(app.sent.alerts.length, 1);
  assert.doesNotMatch(app.sent.alerts[0], /agency\.com/, 'the alert must not carry the visitor’s address');
  assert.deepEqual(app.sent.events, ['sent']);
  await app.stop();
});

test('an Arabic visitor gets an Arabic copy, and the owner still gets English', async () => {
  const app = await start();
  await app.post(goodBody({ lang: 'ar' }));
  const [toOwner, toVisitor] = app.sent.mails;
  assert.equal(toVisitor.subject, 'تصميم مساعدك من Lindrize');
  assert.match(toVisitor.text, /النظام: متابعة عروض الأسعار/);
  assert.match(toOwner.text, /System: Quote Follow-up/);
  await app.stop();
});

test('requests from another website are refused', async () => {
  const app = await start();
  assert.equal((await app.post(goodBody(), { headers: { origin: 'https://evil.example' } })).status, 403);
  const noOrigin = await fetch(`${app.url}/api/design`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(goodBody()) });
  assert.equal(noOrigin.status, 403);
  assert.equal(app.sent.mails.length, 0);
  await app.stop();
});

test('only POST with JSON is accepted, and only at the one address', async () => {
  const app = await start();
  assert.equal((await fetch(`${app.url}/api/design`, { headers: { origin: ORIGIN } })).status, 405);
  assert.equal((await app.post(goodBody(), { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await app.post(null, { raw: '{not json' })).status, 400);
  assert.equal((await fetch(`${app.url}/anything-else`)).status, 404);
  assert.equal((await fetch(`${app.url}/api/health`)).status, 200);
  await app.stop();
});

test('an oversized body is cut off', async () => {
  const app = await start();
  const response = await app.post(null, { raw: JSON.stringify({ ...goodBody(), token: 'x'.repeat(20_000) }) }).catch(() => ({ status: 413 }));
  assert.equal(response.status, 413);
  assert.equal(app.sent.mails.length, 0);
  await app.stop();
});

test('a filled trap field or an impossibly fast send is dropped silently', async () => {
  const app = await start();
  for (const body of [goodBody({ company: 'Acme' }), goodBody({ elapsed: 200 })]) {
    const response = await app.post(body);
    assert.equal(response.status, 200, 'the script is told it worked');
  }
  assert.equal(app.sent.mails.length, 0);
  assert.equal(app.sent.checks.length, 0);
  assert.deepEqual(app.sent.events, ['dropped-script', 'dropped-script']);
  await app.stop();
});

test('a failed human check sends nothing', async () => {
  const app = await start({ human: false });
  const response = await app.post(goodBody());
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'check');
  assert.equal(app.sent.mails.length, 0);
  await app.stop();
});

test('each visitor is limited per hour', async () => {
  const app = await start();
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await app.post(goodBody(), { headers: { 'x-real-ip': '203.0.113.9' } })).status);
  assert.deepEqual(statuses, [200, 200, 200, 429, 429]);
  assert.equal((await app.post(goodBody(), { headers: { 'x-real-ip': '203.0.113.10' } })).status, 200, 'another visitor is not affected');
  await app.stop();
});

test('if the mail server is down the visitor is told it failed', async () => {
  const app = await start({ mailFails: true });
  const response = await app.post(goodBody());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, error: 'send' });
  await app.stop();
});

test('a Telegram failure does not fail the send', async () => {
  const app = await start({ notifyFails: true });
  assert.equal((await app.post(goodBody())).status, 200);
  assert.equal(app.sent.mails.length, 2);
  assert.deepEqual(app.sent.events, ['telegram-failed', 'sent']);
  await app.stop();
});

test('validation: email addresses', () => {
  const bad = ['', 'plain', 'a@b', 'a b@c.com', 'a@b..com', 'a@-b.com', 'a@b.com\nBcc: x@y.com', 'a@b.com,c@d.com', '<a@b.com>', `${'a'.repeat(65)}@b.com`];
  for (const email of bad) assert.equal(validate(goodBody({ email }), catalog).ok, false, `should refuse ${JSON.stringify(email)}`);
  for (const email of ['amer@lindrize.online', 'first.last+tag@agency.co.jo']) assert.equal(validate(goodBody({ email }), catalog).ok, true, email);
});

test('validation: the design accepts only choices the website offers', () => {
  const withDesign = (design) => validate(goodBody({ design: { ...goodBody().design, ...design } }), catalog);
  assert.equal(withDesign({}).ok, true);
  assert.equal(withDesign({ system: '99' }).ok, false);
  assert.equal(withDesign({ system: '__proto__' }).ok, false);
  assert.equal(withDesign({ type: 'toString' }).ok, false);
  assert.equal(withDesign({ features: ['voice-notes'] }).ok, false, 'a feature of another system');
  assert.equal(withDesign({ features: ['second-follow-up', 'second-follow-up'] }).ok, false);
  assert.equal(withDesign({ features: 'second-follow-up' }).ok, false);
  assert.equal(withDesign({ problem: undefined }).ok, false, 'problem is required');
  assert.equal(withDesign({ note: 'free text' }).ok, false, 'unknown fields are refused');
  assert.equal(withDesign({ messages: '<script>' }).ok, false);
  assert.equal(validate(goodBody({ extra: 1 }), catalog).ok, false);
  assert.equal(validate(goodBody({ lang: 'fr' }), catalog).ok, false);
  assert.equal(validate(goodBody({ token: '' }), catalog).ok, false);
  assert.equal(validate([], catalog).ok, false);
  assert.equal(validate(null, catalog).ok, false);
});

test('messages are built only from the catalog', () => {
  const checked = validate(goodBody(), catalog);
  assert.deepEqual(summaryLines(checked.design, catalog, 'en'), [
    'Business: Hajj and Umrah offices',
    'Team size: 2 to 5',
    'Biggest problem: Customers ask for a price, then disappear.',
    'System: Quote Follow-up',
    'Extras: A second follow-up a few days later',
    'Messages a day: 20 to 50',
  ]);
  const none = validate(goodBody({ design: { ...goodBody().design, features: [] } }), catalog);
  assert.ok(summaryLines(none.design, catalog, 'en').includes('Extras: None'));
  for (const message of [visitorEmail(checked, catalog, config), ownerEmail(checked, catalog, config)]) {
    assert.equal(typeof message.text, 'string');
    assert.equal(message.html, undefined);
    assert.equal(message.attachments, undefined);
  }
  assert.doesNotMatch(telegramText(checked.design, catalog), /@/);
});

test('every system and feature in the catalog has wording in both languages', () => {
  assert.equal(Object.keys(catalog.systems).length, 30);
  for (const system of Object.values(catalog.systems)) {
    assert.ok(system.name.en && system.name.ar);
    for (const feature of Object.values(system.features)) assert.ok(feature.en && feature.ar);
  }
});

test('the limiter forgets after an hour and has a daily ceiling', () => {
  let time = 0;
  const limiter = createLimiter({ perVisitorPerHour: 2, totalPerDay: 3 }, () => time);
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), false);
  time += 61 * 60 * 1000;
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('b'), false, 'daily ceiling reached');
  time += 24 * 60 * 60 * 1000;
  assert.equal(limiter.allow('b'), true);
});

test('a second site address can be allowed while the site is being tested', async () => {
  const app = await start({ settings: { allowedOrigins: [ORIGIN, 'https://new.lindrize.online'] } });
  assert.equal((await app.post(goodBody(), { headers: { origin: 'https://new.lindrize.online' } })).status, 200);
  assert.equal((await app.post(goodBody(), { headers: { origin: 'https://evil.example' } })).status, 403);
  await app.stop();
});

test('the list of choices follows the published site, and a broken file is ignored', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-'));
  const path = join(dir, 'design-catalog.json');
  let clock = 0;
  const events = [];
  const current = createCatalog({ bundled: catalog, path, log: (e) => events.push(e), now: () => clock });

  // No published file yet: the copy shipped with the receiver is used.
  assert.equal(current(), catalog);

  const edited = structuredClone(catalog);
  edited.systems['2'].features['brand-new-extra'] = { en: 'Brand new extra', ar: 'إضافة جديدة' };
  writeFileSync(path, JSON.stringify(edited));
  assert.equal(current(), catalog, 'not re-read more often than every 30 seconds');
  clock += 31_000;
  assert.ok(current().systems['2'].features['brand-new-extra']);

  const app = await start({ choices: current });
  const body = goodBody();
  body.design.features = ['brand-new-extra'];
  assert.equal((await app.post(body)).status, 200);
  await app.stop();

  writeFileSync(path, '{"types":{}}  ');
  clock += 31_000;
  assert.ok(current().systems['2'].features['brand-new-extra'], 'the last good list stays in use');
  assert.ok(events.includes('catalog-unreadable'));
  assert.equal(looksValid(catalog), true);
  assert.equal(looksValid({ types: {} }), false);
  rmSync(dir, { recursive: true });
});

test('the allowed-address setting tolerates typing slips, and refusals are logged', async () => {
  const { loadConfig } = await import('../src/config.js');
  const env = {
    ALLOWED_ORIGIN: ' https://lindrize.online/ , "https://new.lindrize.online" ',
    TURNSTILE_SECRET: 'x', SMTP_HOST: 'x', SMTP_USER: 'x', SMTP_PASS: 'x', MAIL_FROM: 'x', OWNER_EMAIL: 'x',
  };
  assert.deepEqual(loadConfig(env).allowedOrigins, ['https://lindrize.online', 'https://new.lindrize.online']);

  const app = await start();
  assert.equal((await app.post(goodBody(), { headers: { origin: 'https://evil.example' } })).status, 403);
  assert.ok(app.sent.events.includes('refused-origin https://evil.example'));
  await app.stop();
});
