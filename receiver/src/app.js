/**
 * The request handler. One address accepts designs: POST /api/design.
 * Order of checks: method and address, origin, size, format, content, rate limit, human check.
 * Nothing is stored. Errors never reveal details.
 */
import { validate } from './validate.js';
import { ownerEmail, visitorEmail, telegramText } from './compose.js';
import { createLimiter } from './limits.js';

const MAX_BODY_BYTES = 8 * 1024;

const reply = (res, status, body) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function createApp({ config, catalog: catalogSource, outside, log = () => {}, now }) {
  const limiter = createLimiter(config.limits, now);
  // The catalog can be a fixed object or a function that returns the newest published one.
  const currentCatalog = typeof catalogSource === 'function' ? catalogSource : () => catalogSource;
  const origins = new Set(config.allowedOrigins ?? [config.allowedOrigin]);

  return async function handle(req, res) {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (path === '/api/health' && req.method === 'GET') return reply(res, 200, { ok: true });
    if (path !== '/api/design') return reply(res, 404, { ok: false, error: 'not_found' });
    if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'method' });
    // Browsers always send the page's origin with this kind of request. Anything else is refused.
    if (!origins.has(req.headers.origin)) return reply(res, 403, { ok: false, error: 'origin' });
    if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
      return reply(res, 415, { ok: false, error: 'format' });
    }

    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch (error) {
      return reply(res, error instanceof Error && error.message === 'too_large' ? 413 : 400, { ok: false, error: 'body' });
    }

    const catalog = currentCatalog();
    const checked = validate(body, catalog);
    if (!checked.ok) return reply(res, 400, { ok: false, error: checked.reason });
    if (checked.silent) {
      log('dropped-script');
      return reply(res, 200, { ok: true });
    }

    // The web server in front passes the visitor's address in this header.
    const visitor = String(req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? 'unknown');
    if (!limiter.allow(visitor)) {
      log('rate-limited');
      return reply(res, 429, { ok: false, error: 'too_many' });
    }

    try {
      if (!(await outside.verifyHuman(body.token, visitor))) {
        log('failed-human-check');
        return reply(res, 403, { ok: false, error: 'check' });
      }
      // The owner's copy must succeed. The visitor's copy and the alert are best effort.
      await outside.sendMail(ownerEmail(checked, catalog, config));
      const extras = await Promise.allSettled([
        outside.sendMail(visitorEmail(checked, catalog, config)),
        outside.notify(telegramText(checked.design, catalog)),
      ]);
      if (extras[0].status === 'rejected') log('visitor-copy-failed');
      if (extras[1].status === 'rejected') log('telegram-failed');
      log('sent');
      return reply(res, 200, { ok: true });
    } catch {
      log('send-failed');
      return reply(res, 502, { ok: false, error: 'send' });
    }
  };
}
