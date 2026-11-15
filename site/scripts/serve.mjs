/**
 * A small static server for the built site (dist/), used by the browser tests and the speed test.
 * Like the real server it compresses text, caches fingerprinted files, and shows the 404 page.
 *
 * Usage: node scripts/serve.mjs [port]
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg)/;

export function startServer(port) {
  const server = createServer((req, res) => {
    let path;
    try {
      path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname));
    } catch {
      res.writeHead(400).end();
      return;
    }
    let file = join(DIST, path);
    // Never serve anything outside dist/.
    if (file !== DIST.slice(0, -1) && !file.startsWith(DIST.endsWith(sep) ? DIST : DIST + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!path.endsWith('/') && !path.endsWith(sep)) {
        res.writeHead(301, { location: `${path}/` }).end();
        return;
      }
      file = join(file, 'index.html');
    }
    let status = 200;
    if (!existsSync(file)) {
      status = 404;
      const arabic = path.startsWith('/ar/') || path.startsWith(`${sep}ar${sep}`);
      const arabic404 = join(DIST, 'ar', '404', 'index.html');
      file = arabic && existsSync(arabic404) ? arabic404 : join(DIST, '404.html');
    }
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    const body = readFileSync(file);
    const headers = {
      'content-type': type,
      'cache-control': path.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'x-content-type-options': 'nosniff',
    };
    if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
      res.writeHead(status, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' }).end(gzipSync(body));
    } else {
      res.writeHead(status, headers).end(body);
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!existsSync(DIST)) {
    console.error('dist/ is missing. Run "npm run build" first.');
    process.exit(1);
  }
  const port = Number(process.argv[2] ?? 4321);
  await startServer(port);
  console.log(`Serving dist/ at http://127.0.0.1:${port}`);
}
