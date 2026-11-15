import { LANGS, type Lang } from './i18n';

/**
 * Static paths for a page that exists in both languages.
 * English lives at the root and Arabic under /ar/, so the language part is empty for English.
 */
export const langPaths = () =>
  LANGS.map((lang) => ({ params: { lang: lang === 'en' ? undefined : lang }, props: { lang } }));

export interface LangProps {
  lang: Lang;
}
