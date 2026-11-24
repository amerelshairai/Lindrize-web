/**
 * Settings come only from environment variables (the .env file on the server).
 * Secrets are never written in the code or committed to GitHub.
 */
const required = (env, name) => {
  const value = env[name];
  if (!value) throw new Error(`Missing setting: ${name}. Add it to the .env file on the server.`);
  return value;
};

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT ?? 8080),
    /** Only requests sent by pages of this site are accepted. */
    /** One address, or several separated by commas (used while the site is tested on a second address). */
    allowedOrigins: required(env, 'ALLOWED_ORIGIN')
      .split(',')
      // Tolerate spaces, quotes and a final slash, which are easy to type by mistake.
      .map((origin) => origin.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, ''))
      .filter(Boolean),
    /** Optional: the published site's own list of choices, so the receiver follows content edits. */
    catalogPath: env.CATALOG_PATH || null,
    turnstileSecret: required(env, 'TURNSTILE_SECRET'),
    smtp: {
      host: required(env, 'SMTP_HOST'),
      port: Number(env.SMTP_PORT ?? 465),
      user: required(env, 'SMTP_USER'),
      pass: required(env, 'SMTP_PASS'),
    },
    mailFrom: required(env, 'MAIL_FROM'),
    ownerEmail: required(env, 'OWNER_EMAIL'),
    bookingUrl: env.BOOKING_URL ?? 'https://lindrize.online/book',
    /** Telegram is optional: without it the owner still gets the email. */
    telegram: env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID ? { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID } : null,
    limits: {
      perVisitorPerHour: Number(env.LIMIT_PER_VISITOR_PER_HOUR ?? 5),
      totalPerDay: Number(env.LIMIT_TOTAL_PER_DAY ?? 200),
    },
  };
}
