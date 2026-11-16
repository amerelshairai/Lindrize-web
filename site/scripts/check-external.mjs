/**
 * Checks the site's outside links against the live web (PLAN Phase 4).
 * Run by hand, or before launch: `npm run check:external`. It is not part of the automatic checks,
 * because another company's site being slow should not block publishing.
 *
 * WhatsApp links differ only in their pre-typed message, so one per language is tested.
 * Instagram and WhatsApp often refuse automated visitors (a 4xx answer) even when the link works
 * for people, so those are reported as "check by hand", not as broken.
 */
import { pages, isRedirect, attr, decode } from './lib.mjs';

const HAND = ['instagram.com', 'ig.me', 'wa.me'];
const found = new Map();
for (const page of pages()) {
  if (isRedirect(page.html)) continue;
  for (const tag of page.html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = decode(attr(tag, 'href') ?? '');
    if (!/^https?:\/\//.test(href) || href.startsWith('https://www.lindrize.online')) continue;
    const url = new URL(href);
    const key = url.host === 'wa.me' ? `${url.origin}${url.pathname}` : href;
    if (!found.has(key)) found.set(key, { href, on: page.url });
  }
}

let broken = 0;
for (const [key, { href, on }] of [...found].sort()) {
  let outcome;
  try {
    const response = await fetch(href, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (link check)' } });
    const byHand = HAND.some((host) => new URL(href).host.endsWith(host));
    if (response.ok) outcome = `✓ ${response.status}`;
    else if (byHand) outcome = `• ${response.status} (refuses automated visitors: open it by hand)`;
    else {
      outcome = `✗ ${response.status}`;
      broken++;
    }
  } catch (error) {
    outcome = `• could not be reached from this machine (${error instanceof Error ? (error.cause?.code ?? error.name) : 'error'})`;
  }
  console.log(`${outcome}  ${key}  (first seen on ${on})`);
}
console.log(`${found.size} outside link(s) checked.`);
process.exit(broken ? 1 : 0);
