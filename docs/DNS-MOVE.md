# Moving the domain to the new site

Pointing `lindrize.online` at the new server, without touching your email.

**The one rule:** only the website records change. Every record that carries email (MX, SPF,
DKIM, DMARC and anything Google asked you to add) stays exactly as it is, character for
character. Your Google Workspace mailbox and your cold-email campaign depend on them.

**Status:** waiting for your DNS export (step 1). Nothing has been changed.

---

## Step 1. Find where DNS is managed, and export it (changes nothing)

DNS is managed wherever the domain's **nameservers** point. That may be the company you
bought the domain from, or Vercel, or Hostinger.

1. Open https://www.whatsmydns.net, choose **NS**, type `lindrize.online`. Note the result.

| Nameservers contain | DNS is managed at |
|---|---|
| `vercel-dns.com` | Vercel → your project → Settings → Domains → the domain → DNS Records |
| `dns-parking.com` or `hostinger` | Hostinger panel → Domains → DNS / Nameservers |
| `namecheap`, `registrar-servers.com`, `godaddy`, `domaincontrol.com`, `cloudflare` | That company's DNS page |

2. On that DNS page, export every record. If there is an "Export" button, use it. If not,
   take screenshots that show **every** row, including the full value of long records.
3. Send me the export or the screenshots. DNS records are public information, so they are
   safe to share. Never share your login to that account.

## Step 2. The record table (I fill this in from your export)

| # | Type | Name | Value | TTL | What it is for | Action |
|---|---|---|---|---|---|---|
| | | | | | | |

When it is filled in, every row has one of three actions:

- **DO NOT TOUCH**: email and verification records (MX, the SPF `TXT` starting `v=spf1`,
  DKIM records such as `google._domainkey`, the `_dmarc` record, Google site verification,
  and anything used by your cold-email tool).
- **CHANGE on move day**: the website records for `@` and `www` only.
- **ADD**: `new` and `stats` (step 8 of `docs/SERVER-SETUP.md`), which do not affect anything
  existing.

You confirm the table before anything is changed.

## Step 3. Before move day

All of this must be true first:

- [ ] `docs/LAUNCH-CHECKLIST.md` is fully ticked, including the "Launch check" on GitHub.
- [ ] The new site has been live on `https://new.lindrize.online` and you have used it on
      your phone in both languages.
- [ ] You know the address your cold emails link to (`www.lindrize.online`,
      `lindrize.online` or `/book`). All three keep working after the move; I only need to
      know so we test that exact link.
- [ ] You have chosen a quiet hour (late evening Amman time, not while a campaign is
      sending).

**One day before:** lower the TTL of the website records (the rows marked CHANGE) to `300`.
Change nothing else. TTL is how long other computers remember the old answer; lowering it
makes the move, and an undo, take minutes instead of hours.

Write down the current values of those rows here, so the undo is one copy-paste:

| Type | Name | Old value (Vercel) |
|---|---|---|
| | `@` | |
| | `www` | |

## Step 4. Move day

Expect about two minutes during which some visitors see a certificate warning: the server
can only get the HTTPS certificate for the real name once the name points at it. That is why
it is done at a quiet hour.

1. Send a test email **to** your Lindrize address from a personal account, and one **from**
   it. Both arrive. This proves email works before you start.
2. In DNS, change only the rows marked CHANGE:

| Type | Name | New value | TTL |
|---|---|---|---|
| A | `@` | YOUR-IP | 300 |
| A | `www` | YOUR-IP | 300 |

   If `www` is a `CNAME` today, delete that one `CNAME` and add the `A` record in its place.
   If there is an `AAAA` record for `@` or `www`, delete it (the server is set up for
   YOUR-IP only). Touch no other row.

3. On the server, wait until both names answer with YOUR-IP (repeat the two commands until
   they do, usually within five minutes):

```bash
dig +short www.lindrize.online @1.1.1.1
```

```bash
dig +short lindrize.online @1.1.1.1
```

4. Get the certificate for the real names and switch the real site on:

```bash
sudo certbot certonly --webroot -w /var/www/certbot --cert-name www.lindrize.online -d www.lindrize.online -d lindrize.online --deploy-hook "systemctl reload nginx"
```

```bash
sudo ln -s /etc/nginx/sites-available/lindrize.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
```

**Check, in this order:**

- [ ] `https://www.lindrize.online` shows the new site with a padlock.
- [ ] `https://lindrize.online` and `http://lindrize.online` both end up on `https://www.lindrize.online`.
- [ ] `https://www.lindrize.online/book` opens your Calendly page.
- [ ] The exact link from your cold emails opens correctly.
- [ ] Send a test email **to** and **from** your Lindrize address again. Both arrive.
- [ ] Send yourself a design from "Design your agent". Both emails arrive.
- [ ] https://www.whatsmydns.net → **MX** → `lindrize.online` shows the same Google servers as before.

## Step 5. Undo, if anything is wrong

Put the old values from the table in step 3 back into the two rows. Within about five minutes
visitors are on the old Vercel site again. Email is unaffected either way, because its
records were never touched. Then tell me what you saw.

## Step 6. After the move

Same day:

- [ ] On GitHub (Settings → Secrets and variables → Actions → Variables), change
      `PUBLISH_CHECK_URL` to `https://www.lindrize.online`.
- [ ] In `/srv/lindrize/.env.receiver`, set `ALLOWED_ORIGIN=https://www.lindrize.online`,
      then run `sudo /srv/lindrize/repo/server/services.sh up -d`.
- [ ] Make the test address forward to the real one:

```bash
sudo cp /srv/lindrize/repo/server/nginx/lindrize-preview-after-launch.conf /etc/nginx/sites-available/lindrize-preview.conf && sudo nginx -t && sudo systemctl reload nginx
```

- [ ] Change the UptimeRobot monitor to `https://www.lindrize.online/`.
- [ ] Open the Umami dashboard: your own visit is counted.
- [ ] Start `docs/SEO-SETUP.md`.

After one week without problems: raise the TTL of `@` and `www` back to `3600`.

After two weeks: remove the domain from the Vercel project (Vercel → Settings → Domains),
then delete or archive the old project. Until then the old site stays as the fallback.
