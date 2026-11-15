import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createApp } from '../src/app.js';

export const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url), 'utf8'));
export const ORIGIN = 'https://www.lindrize.online';

export const config = {
  allowedOrigin: ORIGIN,
  mailFrom: 'Lindrize <site@example.test>',
  ownerEmail: 'owner@example.test',
  bookingUrl: 'https://www.lindrize.online/book',
  limits: { perVisitorPerHour: 3, totalPerDay: 50 },
};

export const goodBody = (overrides = {}) => ({
  email: 'owner@agency.com',
  lang: 'en',
  design: { type: 'umrah', size: 'small', problem: 'went-quiet', system: '2', features: ['second-follow-up'], messages: 'm2' },
  company: '',
  elapsed: 45_000,
  token: 'test-token',
  ...overrides,
});

/** Starts the receiver with the three outside services replaced by recorders. */
export async function start({ human = true, mailFails = false, notifyFails = false } = {}) {
  const sent = { mails: [], alerts: [], checks: [], events: [] };
  const outside = {
    verifyHuman: async (token, ip) => {
      sent.checks.push({ token, ip });
      return human;
    },
    sendMail: async (message) => {
      if (mailFails) throw new Error('smtp down');
      sent.mails.push(message);
    },
    notify: async (text) => {
      if (notifyFails) throw new Error('telegram down');
      sent.alerts.push(text);
    },
  };
  const server = createServer(createApp({ config, catalog, outside, log: (e) => sent.events.push(e) }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body, { headers = {}, raw } = {}) =>
    fetch(`${url}/api/design`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
      body: raw ?? JSON.stringify(body),
    });
  return { url, post, sent, stop: () => new Promise((resolve) => server.close(resolve)) };
}
