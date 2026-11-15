/** The pages search engines and AI assistants should know about. Unfinished pages are left out. */
import { getEntry } from 'astro:content';
import { ROUTES, systemPath } from './i18n';
import { getSystems } from './content';
import { STUB_PAGES } from './stubs';

export async function indexablePages(): Promise<string[]> {
  const systems = await getSystems();
  const pages: string[] = [
    ROUTES.home,
    ROUTES.solutions,
    ...systems.map((s) => systemPath(s.id)),
    ROUTES.industries,
    ROUTES.pricing,
    ROUTES.design,
    ROUTES.faq,
    ROUTES.about,
    ROUTES.contact,
  ];
  for (const id of ['privacy', 'terms'] as const) {
    if ((await getEntry('legal', id))?.data.ready) pages.push(`/${id}/`);
  }
  return pages.filter((page) => !STUB_PAGES.includes(page));
}
