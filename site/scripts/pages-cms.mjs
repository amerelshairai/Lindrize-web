/**
 * Writes ../.pages.yml, the description of the editing screen (Pages CMS).
 *   node scripts/pages-cms.mjs          rewrites the file
 *   node scripts/pages-cms.mjs --check  fails if the file is out of date (part of `npm run check`)
 *
 * The form fields are read from the content files themselves, so every field of every file is
 * listed. That matters: the editing screen saves only the fields it knows about.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = fileURLToPath(new URL('../../.pages.yml', import.meta.url));
const read = (path) => parse(readFileSync(root + path, 'utf8'));
const folder = (name) => readdirSync(`${root}src/content/${name}`).filter((f) => f.endsWith('.yaml')).sort();

/** Fields with a fixed set of answers, by field name. */
const CHOICES = {
  status: ['live-demo', 'available', 'on-request'],
  who: ['customer', 'system', 'team'],
  from: ['customer', 'assistant'],
  lang: ['en', 'ar'],
  key: ['tier30', 'tier20', 'tier15'],
};
const GROUP_CHOICES = {
  systems: ['win-bookings', 'look-after', 'run-office'],
  faqs: ['product', 'limits', 'languages', 'price', 'setup', 'safety'],
};
/** Short help shown under a field. */
const HELP = {
  id: 'Lowercase letters, digits and hyphens. Do not change an existing one.',
  ready: 'Switch on only when every section has its text in both languages.',
  consent: 'Must be on: only real clients who agreed to be quoted.',
  videoId: 'The part of the YouTube link after "v=". Leave empty to hide the video.',
  turnstileSiteKey: 'The public "site key" from Cloudflare Turnstile. Leave empty to hide the email form.',
  umamiWebsiteId: 'The "Website ID" from Umami. Leave empty to switch counting off.',
  home: 'Position among the questions on Home (1 to 6). Leave empty to keep it off Home.',
  related: 'Numbers of up to three systems that work well with this one.',
  routineShare: 'A number from 0 to 1. Leave all three empty to hide the estimate.',
};
/** Optional fields that no file uses yet, so they could not be discovered. */
const TEXT = (long) => ({ en: long ? 'x'.repeat(200) : 'x', ar: long ? 'x'.repeat(200) : 'x' });
const EXTRA = {
  systems: { seo: { title: TEXT(false), description: TEXT(true) } },
  'legal.sections': { body: TEXT(true) },
};

/** Fields that always get a tall text box, whatever their current length. */
const LONG = new Set(['body', 'answer', 'lead', 'intro', 'summary', 'does', 'never', 'description', 'quote', 'note', 'text', 'also', 'statement', 'howBody', 'notice']);

const label = (key) =>
  ({ en: 'English', ar: 'Arabic', seo: 'Search result', faqs: 'Questions', ui: 'Interface words' })[key] ??
  key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase()).replace(/ (.)/g, (m) => m.toLowerCase());

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => isPlain(v) && Object.keys(v).sort().join() === 'ar,en';

/** Merges several examples of the same thing into one that has every field seen. */
function union(samples) {
  const real = samples.filter((s) => s !== null && s !== undefined);
  if (real.length === 0) return null;
  if (real.every(isPlain)) {
    const out = {};
    for (const key of new Set(real.flatMap(Object.keys))) out[key] = union(real.map((s) => s[key]));
    return out;
  }
  if (real.every(Array.isArray)) return [union(real.flat())];
  if (real.every((s) => typeof s === 'string')) return real.reduce((a, b) => (b.length > a.length ? b : a));
  return real[0];
}

function field(name, sample, scope) {
  const base = { name, label: label(name) };
  if (HELP[name]) base.description = HELP[name];
  if (Array.isArray(sample)) {
    const inner = field(name, union(sample), scope);
    return { ...inner, list: true };
  }
  if (isPlain(sample)) {
    const extra = EXTRA[`${scope}.${name}`] ?? {};
    const merged = { ...sample, ...extra };
    return { ...base, type: 'object', fields: Object.keys(merged).map((key) => field(key, merged[key], `${scope}.${name}`)) };
  }
  const choices = name === 'group' ? GROUP_CHOICES[scope.split('.')[0]] : CHOICES[name];
  if (choices) return { ...base, type: 'select', options: { values: choices } };
  if (typeof sample === 'boolean') return { ...base, type: 'boolean' };
  if (typeof sample === 'number' || sample === null) return { ...base, type: 'number' };
  const long = LONG.has(name) || LONG.has(scope.split('.').pop()) || sample.length > 90 || sample.includes('\n');
  return { ...base, type: long ? 'text' : 'string' };
}

const fields = (sample, scope) => {
  const merged = { ...sample, ...(EXTRA[scope] ?? {}) };
  return Object.keys(merged).map((key) => field(key, merged[key], scope));
};

const PAGES = [
  ['home', 'Home'], ['solutions', 'Solutions'], ['system', 'System page (shared words)'], ['industries', 'Industries'],
  ['pricing', 'Pricing'], ['design', 'Design your agent'], ['faq', 'FAQ page (headings)'], ['about', 'About'],
  ['contact', 'Contact'], ['privacy', 'Privacy Policy'], ['terms', 'Terms'],
];
const COLLECTIONS = [
  ['systems', 'Systems (30)', { primary: 'number', sort: 'number' }],
  ['faqs', 'FAQ questions', { primary: 'order', sort: 'order' }],
  ['industries', 'Industries (list)', { primary: 'order', sort: 'order' }],
  ['chats', 'Demo chats', { primary: 'order', sort: 'order' }],
  ['feedback', 'Client feedback', { primary: 'name', sort: 'order' }],
];
/** Feedback starts empty, so its form is written out here. Keep in step with content.config.ts. */
const FEEDBACK = { order: 1, quote: TEXT(true), name: 'x', role: TEXT(false), agency: 'x', consent: true };

const content = [
  {
    name: 'settings',
    label: 'Settings (links, keys, places left)',
    type: 'file',
    path: 'site/src/data/settings.json',
    format: 'json',
    fields: fields(JSON.parse(readFileSync(`${root}src/data/settings.json`, 'utf8')), 'settings'),
  },
  ...PAGES.map(([file, name]) => ({
    name: `page-${file}`,
    label: `Page: ${name}`,
    type: 'file',
    path: `site/src/content/pages/${file}.yaml`,
    format: 'yaml',
    fields: fields(read(`src/content/pages/${file}.yaml`), ['privacy', 'terms'].includes(file) ? 'legal' : file),
  })),
  ...COLLECTIONS.map(([dir, name, view]) => {
    const samples = folder(dir).map((f) => read(`src/content/${dir}/${f}`));
    return {
      name: dir,
      label: name,
      type: 'collection',
      path: `site/src/content/${dir}`,
      format: 'yaml',
      filename: '{primary}.yaml',
      view: { primary: view.primary, sort: [view.sort], default: { sort: view.sort, order: 'asc' } },
      fields: fields(samples.length ? union(samples) : FEEDBACK, dir),
    };
  }),
  {
    name: 'ui',
    label: 'Interface words (buttons, menus)',
    type: 'file',
    path: 'site/src/data/ui.json',
    format: 'json',
    fields: fields(JSON.parse(readFileSync(`${root}src/data/ui.json`, 'utf8')), 'ui'),
  },
];

const header = `# The editing screen (Pages CMS, https://app.pagescms.org). See HOW-TO-EDIT.md.
# This file is generated: change content files or site/scripts/pages-cms.mjs, then run
# "npm run cms" in site/. Editing it by hand will be undone by the next run.
`;
const fresh = header + stringify({ content }, { lineWidth: 0 });

if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== fresh) {
    console.error('✗ .pages.yml is out of date. Run "npm run cms" in site/ and commit the result.');
    process.exit(1);
  }
  console.log('✓ The editing screen lists every field of every content file');
} else {
  writeFileSync(target, fresh);
  console.log('Updated .pages.yml');
}
