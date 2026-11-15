/** The three outside services: Cloudflare's human check, the mail server and Telegram. */
import nodemailer from 'nodemailer';

const TIMEOUT_MS = 8000;

export function createOutside(config) {
  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    requireTLS: true,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    connectionTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
    // Plain text only, and files or web addresses can never be attached by a message.
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  return {
    async verifyHuman(token, ip) {
      const body = new URLSearchParams({ secret: config.turnstileSecret, response: token });
      if (ip) body.set('remoteip', ip);
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return false;
      const result = await response.json();
      return result.success === true;
    },

    sendMail: (message) => transport.sendMail(message),

    async notify(text) {
      if (!config.telegram) return;
      await fetch(`https://api.telegram.org/bot${config.telegram.token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegram.chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    },
  };
}
