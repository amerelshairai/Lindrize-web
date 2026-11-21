import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Every piece of visitor-facing text has an English and an Arabic version.
 * A missing or empty one stops the build and names the file and field.
 */
const text = z.object({
  en: z.string().trim().min(1, 'English text is missing'),
  ar: z.string().trim().min(1, 'Arabic text is missing'),
});

/**
 * An optional field. The editing screen may save an optional field that was left blank as an
 * empty value; that is treated the same as leaving it out.
 */
const blank = (v: unknown): boolean =>
  v === null || v === undefined || v === '' || (typeof v === 'object' && Object.values(v as object).every(blank));
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => (blank(v) ? undefined : v), schema.optional());

const yaml = (folder: string) => glob({ pattern: '*.yaml', base: `./src/content/${folder}` });
/** One page's wording, kept in src/content/pages/<name>.yaml. */
const page = (name: string) => glob({ pattern: `${name}.yaml`, base: './src/content/pages' });
const seo = z.object({ title: text, description: text });

const home = defineCollection({
  loader: page('home'),
  schema: z.object({
    seo,
    hero: z.object({ title: text, lead: text, tryLine: text }),
    story: z.object({
      title: text,
      steps: z.array(z.object({ when: text, title: text, body: text })).length(3),
      clock: z.array(text).length(3),
      chips: z.array(text).min(1),
      confirmed: text,
    }),
    tryIt: z.object({ title: text, body: text, tabsLabel: text, button: text, note: text }),
    statement: text,
    systems: z.object({ title: text, body: text, all: text, featured: z.array(z.number().int()).min(1) }),
    working: z.object({
      title: text,
      body: text,
      steps: z.array(z.object({ title: text, note: text, body: text })).length(4),
    }),
    feedback: z.object({ title: text }),
    faq: z.object({ title: text, all: text }),
    final: z.object({ title: text, body: text }),
  }),
});

const STATUS = ['live-demo', 'available', 'on-request'] as const;
const GROUPS = ['win-bookings', 'look-after', 'run-office'] as const;
const FAQ_GROUPS = ['product', 'limits', 'languages', 'price', 'setup', 'safety'] as const;
const each = <K extends string, T extends z.ZodTypeAny>(keys: readonly K[], shape: T) =>
  z.object(Object.fromEntries(keys.map((key) => [key, shape])) as Record<K, T>);

const solutionsPage = defineCollection({
  loader: page('solutions'),
  schema: z.object({
    seo,
    title: text,
    lead: text,
    searchLabel: text,
    searchPlaceholder: text,
    groupLabel: text,
    industryLabel: text,
    all: text,
    allIndustries: text,
    count: text,
    empty: text,
    legendTitle: text,
    legend: each(STATUS, text),
    groups: each(GROUPS, z.object({ name: text, intro: text })),
  }),
});

const systemPage = defineCollection({
  loader: page('system'),
  schema: z.object({
    breadcrumb: text,
    seeItWork: text,
    example: text,
    lanes: each(['customer', 'system', 'team'] as const, text),
    step: text,
    neverTitle: text,
    faqTitle: text,
    relatedTitle: text,
    setup: text,
    finalTitle: text,
    whatsapp: text,
    titleSuffix: text,
    descriptionSuffix: text,
    demoTitle: text,
  }),
});

const industriesPage = defineCollection({
  loader: page('industries'),
  schema: z.object({ seo, title: text, lead: text, bestFit: text, seeAll: text, seeEvery: text }),
});

const pricingPage = defineCollection({
  loader: page('pricing'),
  schema: z.object({
    seo,
    title: text,
    lead: text,
    partsTitle: text,
    parts: z.array(z.object({ title: text, body: text })).min(1),
    founding: z.object({
      title: text,
      body: text,
      tiers: z.array(z.object({ key: z.enum(['tier30', 'tier20', 'tier15']), percent: z.string(), label: text })).length(3),
      placesLeft: text,
      note: text,
    }),
    next: z.object({ title: text, body: text }),
  }),
});

const faqPage = defineCollection({
  loader: page('faq'),
  schema: z.object({ seo, title: text, lead: text, groups: each(FAQ_GROUPS, text) }),
});

const aboutPage = defineCollection({
  loader: page('about'),
  schema: z.object({
    seo,
    title: text,
    lead: text,
    glanceTitle: text,
    glance: z.array(z.object({ label: text, value: text })).min(1),
    differentTitle: text,
    different: z.array(z.object({ title: text, body: text })).min(1),
    founderTitle: text,
    founderRole: text,
    founderLanguages: optional(text),
  }),
});

const contactPage = defineCollection({
  loader: page('contact'),
  schema: z.object({
    seo,
    title: text,
    lead: text,
    call: z.object({ title: text, body: text }),
    whatsapp: z.object({ title: text, body: text }),
    email: z.object({ title: text, body: text }),
    location: z.object({ title: text }),
  }),
});

const option = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: text });
const bounded = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), low: z.number().min(0), high: z.number().min(0) });
const story = z.array(z.object({ who: z.enum(['customer', 'system', 'team']), text })).min(4).max(7);

/** "Design your agent": its wording, its choices and the owner's estimate assumptions. */
const designPage = defineCollection({
  loader: page('design'),
  schema: z.object({
    seo,
    title: text,
    lead: text,
    noScript: text,
    progress: text,
    back: text,
    next: text,
    skip: text,
    chooseOne: text,
    clear: text,
    cleared: text,
    business: z.object({ title: text, typeLabel: text, sizeLabel: text, sizes: z.array(option).min(2) }),
    problem: z.object({
      title: text,
      label: text,
      options: z.array(option.extend({ system: z.number().int().min(1).max(30) })).min(3),
    }),
    system: z.object({ title: text, suggested: text, label: text, page: text }),
    features: z.object({ title: text, label: text }),
    ranges: z.object({
      title: text,
      lead: text,
      messages: z.object({ label: text, options: z.array(bounded.extend({ label: text })).min(2) }),
      staff: z.object({ label: text, options: z.array(bounded.extend({ label: text })).min(2) }),
      afterHours: z.object({ label: text, options: z.array(bounded.extend({ label: text })).min(2) }),
      currencyLabel: text,
      salary: z.object({ label: text, options: z.array(bounded).min(2) }),
      booking: z.object({ label: text, options: z.array(bounded).min(2) }),
    }),
    currencies: z.array(z.object({ code: z.string().length(3), rate: z.number().positive() })).min(1),
    assumptions: z.object({
      routineShare: z.number().gt(0).max(1).nullable(),
      minutesPerReply: z.number().positive().nullable(),
      workHoursPerMonth: z.number().positive().nullable(),
    }),
    estimate: z.object({ title: text, hours: text, cost: text, warning: text, how: text, howBody: text }),
    book: z.object({
      title: text,
      lead: text,
      summaryTitle: text,
      labels: each(['type', 'size', 'problem', 'system', 'features', 'messages', 'staff', 'afterHours', 'none'] as const, text),
      whatsapp: text,
      illustration: text,
    }),
    email: z.object({
      title: text,
      label: text,
      send: text,
      privacy: text,
      trap: text,
      sending: text,
      sent: text,
      errors: each(['email', 'check', 'tooMany', 'failed'] as const, text),
    }),
    board: z.object({
      title: text,
      play: text,
      pause: text,
      replay: text,
      extras: text,
      with: text,
      without: text,
      compare: text,
      moods: each(['waiting', 'answered', 'done', 'lost'] as const, z.object({ title: text, body: text })),
      withoutStory: story,
    }),
  }),
});

/**
 * Privacy Policy, Terms and the Ownership and Buy-out Policy.
 * While `ready` is false the page shows its headings and a notice and is hidden from search engines.
 * While `approved` is false (the owner has not accepted the text) the site cannot go live.
 * Bodies are plain text: a blank line starts a new paragraph, lines starting "- " make a list,
 * and **two stars** around words make them bold.
 */
const legal = defineCollection({
  loader: glob({ pattern: '{privacy,terms,ownership}.yaml', base: './src/content/pages' }),
  schema: z
    .object({
      ready: z.boolean(),
      approved: z.boolean(),
      updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use the form 2026-11-17'),
      seo,
      intro: optional(text),
      title: text,
      notice: text,
      sections: z.array(z.object({ title: text, body: optional(text) })).min(1),
    })
    .refine((d) => !d.ready || d.sections.every((s) => s.body), {
      message: 'ready is true, but some sections have no text yet',
    }),
});

const chats = defineCollection({
  loader: yaml('chats'),
  schema: z.object({
    order: z.number().int(),
    /** The language the customer writes in. Chats are shown in their original language on every page. */
    lang: z.enum(['en', 'ar']),
    /** Package id in content/demo/packages.csv that the answer is built from. */
    package: optional(z.string()),
    title: text,
    messages: z
      .array(
        z.object({
          from: z.enum(['customer', 'assistant']),
          time: z.string(),
          text: z.string().trim().min(1),
        }),
      )
      .min(2),
    request: optional(z.object({ customer: text, package: text, travellers: text, departure: text, total: text })),
  }),
});

const faqs = defineCollection({
  loader: yaml('faqs'),
  schema: z.object({
    group: z.enum(FAQ_GROUPS),
    /** Position inside its group on the FAQ page. */
    order: z.number().int().min(1),
    /** Position among the questions shown on Home (1 to 6). Leave out to keep it off Home. */
    home: optional(z.number().int().min(1).max(6)),
    question: text,
    answer: text,
  }),
});

const systems = defineCollection({
  loader: yaml('systems'),
  schema: z.object({
    number: z.number().int().min(1).max(30),
    group: z.enum(GROUPS),
    status: z.enum(STATUS),
    name: text,
    summary: text,
    /** What it does, in one or two sentences. */
    does: text,
    /** What it never does. Every system page states this plainly. */
    never: text,
    /** The steps on the system's board, always presented as an example. */
    story: z
      .array(z.object({ who: z.enum(['customer', 'system', 'team']), text }))
      .min(4)
      .max(7),
    /** Extra features offered for this system in "Design your agent". */
    features: z
      .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, digits and hyphens'), name: text }))
      .min(2),
    faqs: z.array(z.object({ question: text, answer: text })).length(3),
    /** Numbers of up to three systems that work well with this one. */
    related: z.array(z.number().int().min(1).max(30)).min(1).max(3),
    /** Leave out to build the title and description from the name and summary. */
    seo: optional(seo),
  }),
});

const industries = defineCollection({
  loader: yaml('industries'),
  schema: z.object({
    order: z.number().int(),
    name: text,
    intro: text,
    /** System numbers that fit this field best, in the order shown. */
    systems: z.array(z.number().int().min(1).max(30)).min(1),
    also: optional(text),
  }),
});

/**
 * Client feedback. The section stays hidden until at least one entry exists.
 * `consent` must be true: only real clients who agreed to be quoted, ever.
 */
const feedback = defineCollection({
  loader: yaml('feedback'),
  schema: z.object({
    order: z.number().int().default(0),
    quote: text,
    name: z.string().trim().min(1),
    role: text,
    agency: z.string().trim().min(1),
    consent: z.literal(true, {
      message: 'Feedback can only be published with the client\'s permission (consent: true).',
    }),
  }),
});

export const collections = {
  home,
  solutionsPage,
  systemPage,
  industriesPage,
  pricingPage,
  faqPage,
  aboutPage,
  contactPage,
  designPage,
  legal,
  chats,
  faqs,
  systems,
  industries,
  feedback,
};
