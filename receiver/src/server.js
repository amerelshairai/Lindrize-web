import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { loadConfig } from './config.js';
import { createOutside } from './outside.js';
import { createApp } from './app.js';

const config = loadConfig();
const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url), 'utf8'));
// Logs record what happened, never who: no email addresses and no visitor addresses.
const log = (event) => console.log(`${new Date().toISOString()} ${event}`);

const server = createServer(createApp({ config, catalog, outside: createOutside(config), log }));
server.requestTimeout = 10_000;
server.headersTimeout = 5_000;
server.keepAliveTimeout = 5_000;
server.maxRequestsPerSocket = 20;
server.listen(config.port, () => log(`listening on ${config.port}`));

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
