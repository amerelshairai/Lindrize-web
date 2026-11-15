/**
 * Loads content and checks the rules a schema cannot: exactly 30 systems numbered 1 to 30,
 * and every cross-reference pointing at something that exists. A broken rule stops the build.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { tr, type Lang, type Text } from './i18n';

export type System = CollectionEntry<'systems'>;
export type Industry = CollectionEntry<'industries'>;
export const GROUP_ORDER = ['win-bookings', 'look-after', 'run-office'] as const;
export type Group = (typeof GROUP_ORDER)[number];
export const FAQ_GROUP_ORDER = ['product', 'limits', 'languages', 'price', 'setup', 'safety'] as const;
export const SYSTEM_COUNT = 30;

let systemsCache: System[] | undefined;

export async function getSystems(): Promise<System[]> {
  if (systemsCache) return systemsCache;
  const all = (await getCollection('systems')).sort((a, b) => a.data.number - b.data.number);
  const numbers = all.map((s) => s.data.number);
  for (let n = 1; n <= SYSTEM_COUNT; n++) {
    const count = numbers.filter((x) => x === n).length;
    if (count !== 1) throw new Error(`Expected exactly one system numbered ${n}, found ${count}`);
  }
  for (const system of all) {
    for (const n of system.data.related) {
      if (n === system.data.number) throw new Error(`${system.id}: a system cannot list itself as related`);
    }
    const ids = system.data.features.map((f) => f.id);
    if (new Set(ids).size !== ids.length) throw new Error(`${system.id}: two features share the same id`);
  }
  systemsCache = all;
  return all;
}

export async function getSystem(number: number): Promise<System> {
  const system = (await getSystems()).find((s) => s.data.number === number);
  if (!system) throw new Error(`There is no system numbered ${number}`);
  return system;
}

export async function getIndustries(): Promise<Industry[]> {
  const all = (await getCollection('industries')).sort((a, b) => a.data.order - b.data.order);
  for (const industry of all) for (const n of industry.data.systems) await getSystem(n);
  return all;
}

/** The fields each system fits, as industry ids. Travel agencies fit every system. */
export async function industriesOf(system: System): Promise<string[]> {
  const all = await getIndustries();
  return all.filter((i) => i.id === 'travel' || i.data.systems.includes(system.data.number)).map((i) => i.id);
}

/** A page's wording. Each page has one file in src/content/pages. */
export async function pageCopy<
  C extends 'solutionsPage' | 'systemPage' | 'industriesPage' | 'pricingPage' | 'faqPage' | 'aboutPage' | 'contactPage' | 'designPage',
>(collection: C, id: string): Promise<CollectionEntry<C>['data']> {
  const entry = await getEntry(collection, id);
  if (!entry) throw new Error(`src/content/pages/${id}.yaml is missing`);
  return (entry as CollectionEntry<C>).data;
}

export const fill = (text: Text, lang: Lang, values: Record<string, string | number>): string =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, String(value)), tr(text, lang));

/** Title and description for a system page: its own if set, otherwise built from name and summary. */
export function systemSeo(
  system: System,
  copy: CollectionEntry<'systemPage'>['data'],
  lang: Lang,
): { title: string; description: string } {
  if (system.data.seo) return { title: tr(system.data.seo.title, lang), description: tr(system.data.seo.description, lang) };
  const name = tr(system.data.name, lang);
  const long = `${name} ${tr(copy.titleSuffix, lang)} | Lindrize`;
  const title = long.length <= 65 ? long : `${name} | Lindrize`;
  const withSuffix = `${tr(system.data.summary, lang)} ${tr(copy.descriptionSuffix, lang)}`;
  const description = withSuffix.length <= 170 ? withSuffix : tr(system.data.summary, lang);
  return { title, description };
}
