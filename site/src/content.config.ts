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

const yaml = (folder: string) => glob({ pattern: '*.yaml', base: `./src/content/${folder}` });

const pages = defineCollection({
  loader: yaml('pages'),
  schema: z.object({
    seo: z.object({ title: text, description: text }),
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

const chats = defineCollection({
  loader: yaml('chats'),
  schema: z.object({
    order: z.number().int(),
    /** The language the customer writes in. Chats are shown in their original language on every page. */
    lang: z.enum(['en', 'ar']),
    /** Package id in content/demo/packages.csv that the answer is built from. */
    package: z.string().optional(),
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
    request: z
      .object({ customer: text, package: text, travellers: text, departure: text, total: text })
      .optional(),
  }),
});

const faqs = defineCollection({
  loader: yaml('faqs'),
  schema: z.object({
    group: z.enum(['product', 'price', 'setup', 'safety', 'languages', 'limits']),
    /** Position among the questions shown on Home (1 to 6). Leave out to keep it off Home. */
    home: z.number().int().min(1).max(6).optional(),
    question: text,
    answer: text,
  }),
});

const systems = defineCollection({
  loader: yaml('systems'),
  schema: z.object({
    number: z.number().int().min(1).max(30),
    group: z.enum(['win-bookings', 'look-after', 'run-office']),
    status: z.enum(['live-demo', 'available', 'on-request']),
    name: text,
    summary: text,
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

export const collections = { pages, chats, faqs, systems, feedback };
