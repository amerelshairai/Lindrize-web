# Email receiver

A small program that runs on the server next to the website. It does one job: when a visitor
presses **Send** under "Email me my design", it emails the design to the visitor and to the
owner, and sends the owner a short Telegram alert. It stores nothing.

## How it stays safe

- **No free text.** The design arrives as choice ids. The receiver accepts only ids that exist in
  `catalog.json` (exported from the website) and rebuilds the wording itself. The only thing a
  visitor types is their email address, which is checked strictly.
- **Plain-text emails with fixed wording.** No links or content from the visitor can appear.
- **Only this website can call it.** Requests from other sites are refused.
- **Human check.** Every send is verified with Cloudflare Turnstile on the server.
- **Trap field and timer.** A filled hidden field, or a send faster than 3 seconds, is dropped
  silently.
- **Limits.** 5 sends an hour per visitor and 200 a day in total.
- **Small requests only.** Anything over 8 KB is cut off.
- **Secrets only in `.env` on the server.** They are never in the code or on GitHub.
- **Logs say what happened, never who.** No email addresses and no visitor addresses.
- **The Telegram alert carries the design, not the visitor's email address.** That stays in the
  inbox.

## Settings

Copy `.env.example` to `/srv/lindrize/.env.receiver` on the server and fill it in.
`docs/SERVER-SETUP.md` step 10 walks through each value.

## For developers

```bash
npm ci
```

```bash
npm test
```

`catalog.json` is generated. After changing systems, features or the builder's choices in the
site, run `npm run catalog` in `site/` and commit the result. The site's check fails if the two
are out of step.

On the server the receiver also reads the published site's own copy
(`CATALOG_PATH`, set in `server/docker-compose.yml`) and re-reads it after each publish, so a
content edit never needs the receiver to be rebuilt. A missing or broken file is ignored.
