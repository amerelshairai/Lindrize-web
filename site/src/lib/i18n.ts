import uiJson from '@/data/ui.json';
import settingsJson from '@/data/settings.json';

export type Lang = 'en' | 'ar';
export type Text = { en: string; ar: string };

export const LANGS: readonly Lang[] = ['en', 'ar'];
export const ui = uiJson;
export const settings = settingsJson;

export const dirOf = (lang: Lang): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr');
export const otherLang = (lang: Lang): Lang => (lang === 'ar' ? 'en' : 'ar');

/** Pick the text for the page's language. */
export const tr = (text: Text, lang: Lang): string => text[lang];

/** Site path for a page in a language. `page` always starts and ends with "/". */
export const localPath = (lang: Lang, page: string): string => (lang === 'en' ? page : `/ar${page}`);

export const absoluteUrl = (path: string): string => new URL(path, settings.siteUrl).href;

/** WhatsApp link that opens a chat with a message already typed. */
export const whatsappUrl = (message: string): string =>
  `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;

/**
 * Split a sentence around a `{token}` so a component can put a link or handle in its place
 * without ever treating content as HTML.
 */
export const splitAt = (sentence: string, token: string): [string, string] => {
  const marker = `{${token}}`;
  const i = sentence.indexOf(marker);
  if (i === -1) throw new Error(`Missing ${marker} in: "${sentence}"`);
  return [sentence.slice(0, i), sentence.slice(i + marker.length)];
};

/** Pages that exist in the menu and footer. Each is built for both languages. */
export const ROUTES = {
  home: '/',
  solutions: '/solutions/',
  industries: '/industries/',
  pricing: '/pricing/',
  design: '/design-your-agent/',
  faq: '/faq/',
  about: '/about/',
  contact: '/contact/',
  privacy: '/privacy/',
  terms: '/terms/',
  ownership: '/ownership/',
} as const;

export const systemPath = (slug: string): string => `/solutions/${slug}/`;
