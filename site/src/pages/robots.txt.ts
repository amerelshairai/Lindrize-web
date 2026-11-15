import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/lib/i18n';

/**
 * Everyone may read the whole site, including AI assistants (the owner's decision, SPEC 12).
 * Only the form receiver's address is off limits.
 */
const AI_READERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
];

export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    '# AI assistants are welcome to read and quote this site.',
    ...AI_READERS.map((name) => `User-agent: ${name}`),
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
