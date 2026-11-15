import type { APIRoute } from 'astro';
import { getIndustries, getSystems, pageCopy } from '@/lib/content';

/**
 * Every choice "Design your agent" can send, with its wording in both languages.
 * The email receiver keeps a copy and accepts only ids found here, so a design can never
 * carry free text. Nothing in this file is private.
 */
export const GET: APIRoute = async () => {
  const c = await pageCopy('designPage', 'design');
  const table = <T extends { id: string }>(items: T[], value: (item: T) => unknown) =>
    Object.fromEntries(items.map((item) => [item.id, value(item)]));
  const catalog = {
    types: table(await getIndustries(), (i) => i.data.name),
    sizes: table(c.business.sizes, (s) => s.label),
    problems: table(c.problem.options, (o) => o.label),
    systems: Object.fromEntries(
      (await getSystems()).map((s) => [String(s.data.number), { name: s.data.name, features: table(s.data.features, (f) => f.name) }]),
    ),
    messages: table(c.ranges.messages.options, (o) => o.label),
    staff: table(c.ranges.staff.options, (o) => o.label),
    afterHours: table(c.ranges.afterHours.options, (o) => o.label),
    salary: table(c.ranges.salary.options, () => true),
    currencies: Object.fromEntries(c.currencies.map((cur) => [cur.code, true])),
    labels: c.book.labels,
  };
  return new Response(`${JSON.stringify(catalog, null, 2)}\n`, { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
