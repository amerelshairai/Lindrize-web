/**
 * Writes ../arabic-pages.md: every piece of Arabic text on the built site, page by page, for the
 * owner's proofread. Nothing is changed. Run after `npm run build`:
 *   node scripts/export-arabic.mjs
 *
 * Includes headings, body text, buttons, links, form labels, hint text, messages the page shows
 * later (errors, confirmations, button states), screen-reader labels, and each page's title and
 * description. The parts shared by every page (menu, footer, booking window) are listed once.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { pages } from './lib.mjs';

const target = fileURLToPath(new URL('../../arabic-pages.md', import.meta.url));
const arabic = pages()
  .filter((p) => p.url.startsWith('/ar/') && !/http-equiv="refresh"/i.test(p.html))
  .sort((a, b) => (a.url === '/ar/' ? -1 : b.url === '/ar/' ? 1 : a.url.localeCompare(b.url)));

/** Runs inside the page. Walks the document in reading order and returns labelled lines. */
function collect(scope) {
  const INLINE = new Set(['A', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'SMALL', 'TIME', 'ABBR', 'BDI', 'BDO', 'BR', 'CODE', 'MARK', 'SUP', 'SUB', 'KBD', 'Q', 'S', 'U', 'DATA', 'WBR', 'IMG']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'svg', 'TEMPLATE', 'IFRAME']);
  const KIND = {
    H1: '# ', H2: '## ', H3: '### ', H4: '#### ', LI: '- ', BUTTON: '[Button] ', LABEL: '[Field label] ',
    LEGEND: '[Group label] ', OPTION: '[Choice] ', TH: '[Table heading] ', CAPTION: '[Table title] ',
    FIGCAPTION: '[Caption] ', SUMMARY: '[Summary] ', DT: '[Term] ', A: '[Link] ',
  };
  const ATTRS = { 'aria-label': 'Screen-reader label', placeholder: 'Hint inside the box', alt: 'Image text', title: 'Tooltip' };
  const lines = [];
  const clean = (t) => t.replace(/\s+/g, ' ').trim();
  /** Text of an element, with a space between neighbouring pieces (a name and a time, two buttons). */
  const textOf = (el) => {
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) out += node.textContent;
      // Inline pieces (a link, bold text) join the sentence as they are, so the export shows no
      // spaces the page does not have. Other pieces (a name and a time) get a space between them.
      else if (node.nodeType === 1 && !SKIP.has(node.tagName) && !node.closest('svg')) {
        const inner = textOf(node);
        const ltr = node.classList?.contains('ltr');
        out += INLINE.has(node.tagName) ? (ltr ? `\u200E${inner}` : inner) : ` ${inner} `;
      }
    }
    return out;
  };
  const hasBlockChild = (el) => [...el.querySelectorAll('*')].some((c) => !INLINE.has(c.tagName) && !SKIP.has(c.tagName) && !c.closest('svg'));
  const state = (el) => {
    if (el.closest('[hidden]')) return ' (shown only when needed)';
    if (el.closest('.no-js-only')) return ' (shown only when JavaScript is off)';
    if (el.closest('dialog')) return ' (inside a window that opens)';
    return '';
  };
  const attrs = (el) => {
    for (const [name, what] of Object.entries(ATTRS)) {
      const v = el.getAttribute(name);
      if (v && clean(v)) lines.push(`[${what}] ${clean(v)}`);
    }
    for (const a of el.attributes) {
      if (a.name === 'data-text' && el.tagName === 'INPUT') continue; // a copy of the choice's own label
      if (a.name.startsWith('data-') && /[؀-ۿ]/.test(a.value)) lines.push(`[Message the page shows] ${clean(a.value)}`);
    }
  };
  const walk = (el) => {
    if (SKIP.has(el.tagName) || el.closest('svg')) return;
    attrs(el);
    if (!INLINE.has(el.tagName) && !hasBlockChild(el)) {
      for (const child of el.querySelectorAll('*')) attrs(child);
      // A row of links or buttons: one line each.
      const parts = [...el.childNodes].filter((n) => n.nodeType === 1 || clean(n.textContent ?? ''));
      if (parts.length > 1 && parts.every((n) => n.nodeType === 1 && n.tagName === 'A')) {
        for (const a of parts) lines.push(`[Link] ${clean(textOf(a))}${state(a)}`);
        return;
      }
      const text = clean(textOf(el));
      if (text) lines.push(`${KIND[el.tagName] ?? ''}${text}${state(el)}`);
      return;
    }
    for (const node of el.childNodes) {
      if (node.nodeType === 3) {
        const text = clean(node.textContent ?? '');
        if (text) lines.push(`${text}${state(el)}`);
      } else if (node.nodeType === 1) {
        if (INLINE.has(node.tagName) && !hasBlockChild(node)) {
          attrs(node);
          for (const child of node.querySelectorAll('*')) attrs(child);
          const text = clean(textOf(node));
          if (text) lines.push(`${KIND[node.tagName] ?? ''}${text}${state(node)}`);
        } else walk(node);
      }
    }
  };
  for (const el of scope === 'main' ? document.querySelectorAll('main') : [...document.body.children].filter((c) => c.tagName !== 'MAIN')) walk(el);
  // Keep the first of repeated lines (for example a choice listed again as a message).
  const seen = new Set();
  return lines.filter((line) => {
    const key = line.replace(/^\[[^\]]+\] |^[-#]+ /, '').replace(/ \([^)]*\)$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false });
const page = await context.newPage();
const head = (html) => {
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '';
  const description = /<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(html)?.[1] ?? '';
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return [`**Search title:** ${decode(title)}`, `**Search description:** ${decode(description)}`];
};

const out = [
  '# Arabic text of every page',
  '',
  `Exported from the built site on ${new Date().toISOString().slice(0, 10)}. Nothing was changed.`,
  '',
  'How to send corrections: copy the line, write the corrected version under it, and keep the page address heading. Or mark changes any way you like and send the file back.',
  '',
  'Labels in square brackets say what a line is, for example **[Button]** or **[Message the page shows]** (text that appears after an action, such as an error). Lines starting with # are headings. English text inside Arabic pages (brand names, the English demo chats) is listed too, so you can see it in context.',
  '',
  `Pages: ${arabic.length}. The menu, footer and booking window are the same on every page, so they are listed once, first.`,
  '',
];

await page.setContent(readFileSync(fileURLToPath(new URL('../dist/ar/index.html', import.meta.url)), 'utf8'));
out.push('## Shared on every page (menu, footer, phone booking bar, booking window)', '', ...(await page.evaluate(collect, 'shared')), '');

for (const { url, html } of arabic) {
  await page.setContent(html);
  const lines = await page.evaluate(collect, 'main');
  out.push(`## ${url}`, '', ...head(html), '', ...lines, '');
}
await browser.close();
writeFileSync(target, out.join('\n').replace(/\n{3,}/g, '\n\n'));
console.log(`Wrote arabic-pages.md (${arabic.length} pages)`);
