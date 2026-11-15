import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl, localPath, settings, systemPath, ROUTES } from '@/lib/i18n';
import { getSystems, pageCopy, GROUP_ORDER } from '@/lib/content';

/**
 * A short, factual summary of the business for AI assistants, built from the same content as the
 * pages so the two can never disagree.
 */
export const GET: APIRoute = async () => {
  const systems = await getSystems();
  const solutions = await pageCopy('solutionsPage', 'solutions');
  const about = await pageCopy('aboutPage', 'about');
  const faqs = (await getCollection('faqs')).filter((f) => f.data.home !== undefined).sort((a, b) => (a.data.home ?? 0) - (b.data.home ?? 0));
  const link = (label: string, page: string, note?: string): string =>
    `- [${label}](${absoluteUrl(page)})${note ? `: ${note}` : ''}`;

  const lines = [
    '# Lindrize',
    '',
    '> Lindrize builds AI sales assistants and office systems for travel agencies and tour operators in Jordan and the GCC. Its main product, the AI Travel Sales Assistant, answers customer messages on Instagram, WhatsApp and Messenger within seconds, in Jordanian Arabic or English, and sends staff a ready booking request. It never confirms a booking or takes a payment.',
    '',
    '## Facts',
    '',
    ...about.glance.map((row) => `- ${row.label.en}: ${row.value.en}`),
    `- Contact: WhatsApp ${settings.whatsappDisplay}, email ${settings.email}`,
    `- Book a 15-minute call: ${absoluteUrl('/book')}`,
    '- Demo: Darb Al-Yasmeen (@darb_alyasmeen on Instagram) is a fictional agency built for the demo. Its packages and prices are sample data, not real offers.',
    '- Pricing: tailored to each agency. A one-time setup fee and a monthly fee, a 10-day live trial and a 3-month minimum. No prices are published.',
    '',
    '## Main pages',
    '',
    link('Home', ROUTES.home, 'what the assistant does, with example conversations'),
    link('Solutions', ROUTES.solutions, 'all 30 systems, searchable'),
    link('Industries', ROUTES.industries, 'travel agencies, Hajj and Umrah offices, inbound operators, hotels, car rental, visa offices, study-abroad agencies, venues'),
    link('How pricing works', ROUTES.pricing),
    link('Design your agent', ROUTES.design, 'choose a system and extras, then book a call'),
    link('FAQ', ROUTES.faq),
    link('About', ROUTES.about),
    link('Contact', ROUTES.contact),
    '',
    '## Systems',
    '',
    ...GROUP_ORDER.flatMap((group) => [
      `### ${solutions.groups[group].name.en}`,
      '',
      ...systems.filter((s) => s.data.group === group).map((s) => link(s.data.name.en, systemPath(s.id), s.data.summary.en)),
      '',
    ]),
    '## Common questions',
    '',
    ...faqs.flatMap((f) => [`**${f.data.question.en}**`, f.data.answer.en, '']),
    '## Arabic',
    '',
    'Every page is also available in Arabic under /ar/.',
    '',
    link('الصفحة الرئيسية', localPath('ar', ROUTES.home)),
    link('الحلول', localPath('ar', ROUTES.solutions)),
    link('الأسئلة الشائعة', localPath('ar', ROUTES.faq)),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
