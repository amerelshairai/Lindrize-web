/**
 * Content and honesty checks on the built site (PLAN.md section 12).
 * Run after `astro build`. Add `--launch` for the extra checks that must pass before going live.
 */
import { pages, isRedirect, attr, visibleText, decode, report } from './lib.mjs';

const launch = process.argv.includes('--launch');
const all = pages().filter((p) => !isRedirect(p.html));

// SPEC 9: words visitors never see. They are allowed only in page titles, descriptions and
// FAQ questions (elements marked data-allow-terms), where owners search for them.
const NEVER_SAY = [
  'ai agent', 'chatbot', 'chat bot', 'bot', 'n8n', 'workflow', 'automation', 'pipeline',
  'integration', 'api', 'webhook', 'crm', 'llm', 'model', 'prompt',
];
const NEVER_SAY_AR = ['شات بوت', 'تشات بوت', 'روبوت', 'بوت', 'أتمتة', 'الأتمتة'];
const PLACEHOLDERS = [/\b(todo|tbd|fixme|lorem ipsum|placeholder)\b/i, /\[your[^\]]*\]/i, /\bxxx+\b/i, /\{[a-z_]+\}/i];
// Private address that must never be published (SPEC 12).
const PRIVATE = ['amerelshair.ai@'];

const structure = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
const wording = [];
const honesty = [];
const stubs = [];

for (const page of all) {
  const { url, html } = page;
  const htmlTag = /<html[^>]*>/i.exec(html)?.[0] ?? '';
  const lang = attr(htmlTag, 'lang');
  const dir = attr(htmlTag, 'dir');
  const expectedLang = url.startsWith('/ar/') ? 'ar' : 'en';
  if (lang !== expectedLang) structure.push(`${url}: <html lang> is "${lang}", expected "${expectedLang}"`);
  if (dir !== (expectedLang === 'ar' ? 'rtl' : 'ltr')) structure.push(`${url}: <html dir> is "${dir}"`);

  const h1 = html.match(/<h1\b/gi)?.length ?? 0;
  if (h1 !== 1) structure.push(`${url}: has ${h1} main headings (h1), expected exactly 1`);

  const title = decode(/<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').trim();
  const descTag = /<meta[^>]+name="description"[^>]*>/i.exec(html)?.[0] ?? '';
  const description = decode(attr(descTag, 'content') ?? '').trim();
  if (!title) structure.push(`${url}: missing <title>`);
  if (!description) structure.push(`${url}: missing meta description`);

  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  if (!noindex) {
    // Every page that search engines may list needs its own title and description (SPEC 11).
    for (const [seen, value, what] of [[seenTitles, title, 'title'], [seenDescriptions, description, 'description']]) {
      if (seen.has(value)) structure.push(`${url}: has the same ${what} as ${seen.get(value)}`);
      else seen.set(value, url);
    }
    if (title.length > 65) structure.push(`${url}: title is ${title.length} characters (keep to 65 or fewer)`);
    if (description.length > 170) structure.push(`${url}: description is ${description.length} characters (keep to 170 or fewer)`);
    if (!/<link[^>]+rel="canonical"/i.test(html)) structure.push(`${url}: missing canonical link`);
    for (const code of ['en', 'ar', 'x-default']) {
      if (!new RegExp(`<link[^>]+hreflang="${code}"`, 'i').test(html)) structure.push(`${url}: missing hreflang "${code}"`);
    }
  }
  if (!/<meta[^>]+http-equiv="content-security-policy"/i.test(html)) structure.push(`${url}: missing content security policy`);
  if (/\sstyle="/i.test(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ''))) {
    structure.push(`${url}: has an inline style attribute, which the security policy blocks`);
  }
  if (/\son[a-z]+="/i.test(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ''))) {
    structure.push(`${url}: has an inline event handler, which the security policy blocks`);
  }

  const text = visibleText(html, { skipAllowed: true });
  const lower = text.toLowerCase();
  for (const term of NEVER_SAY) {
    if (new RegExp(`(^|[^a-z0-9])${term}(s|es)?([^a-z0-9]|$)`, 'i').test(lower)) wording.push(`${url}: uses "${term}"`);
  }
  for (const term of NEVER_SAY_AR) {
    if (text.includes(term)) wording.push(`${url}: uses "${term}"`);
  }

  const everything = visibleText(html) + ' ' + title + ' ' + description;
  for (const pattern of PLACEHOLDERS) {
    const hit = pattern.exec(everything);
    if (hit) honesty.push(`${url}: looks like unfinished text: "${hit[0]}"`);
  }
  for (const secret of PRIVATE) {
    if (html.includes(secret)) honesty.push(`${url}: contains the private address ${secret}…`);
  }
  // Structured data must never claim ratings or reviews before real ones exist (SPEC 12).
  if (/"(aggregateRating|review)"\s*:/i.test(html)) honesty.push(`${url}: structured data contains ratings or reviews`);

  if (/\sdata-stub\b/.test(html)) stubs.push(`${url} is still a "being written" page`);
  if (/\sdata-launch-block\b/.test(html)) stubs.push(`${url} is waiting for its text from the owner`);
}

report(`Page structure (${all.length} pages)`, structure);
report('Plain wording ("never say" list)', wording);
report('Honesty (no unfinished text, no private data, no ratings)', honesty);

if (launch) {
  report('Launch gate: every page is written', stubs);
} else if (stubs.length > 0) {
  console.log(`• ${stubs.length} page(s) are not finished yet (run with --launch to list them). This blocks launch, not previews.`);
}
