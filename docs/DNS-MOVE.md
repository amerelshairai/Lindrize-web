# Moving the domain to the new site

Pointing `lindrize.online` at the new server, without touching your email.

**The one rule:** only the website records change. Every record that carries email (MX, SPF,
DKIM, DMARC) and the Google verification stays exactly as it is, character for character.
Your Google Workspace mailbox and your cold-email campaign depend on them.

**The main address is `https://lindrize.online`** (your decision, 17 November 2026).
`www.lindrize.online` forwards to it, and `lindrize.online/book` forwards to your Calendly page.

**Status:** records listed (step 2). Nothing has been changed.

---

## Step 1. Where DNS is managed

At **Namecheap**: Domain List → `lindrize.online` → **Manage** → **Advanced DNS**.

Two places on that page must never be changed during this move:

- the **Mail Settings** section (it must stay on the custom MX setting that points at Google)
- every row marked DO NOT TOUCH below

## Step 2. The current records (from your list, 17 November 2026)

| # | Type | Name (Host) | Value | What it is for | Action |
|---|---|---|---|---|---|
| 1 | MX | `@` | `SMTP.GOOGLE.COM`, priority 1 | Delivers your email to Google Workspace | **DO NOT TOUCH** |
| 2 | TXT | `@` | `v=spf1 include:_spf.google.com ~all` | SPF: says Google may send your email | **DO NOT TOUCH** |
| 3 | TXT | `google._domainkey` | DKIM key | DKIM: signs your outgoing email | **DO NOT TOUCH** |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:amer.ai@lindrize.online` | DMARC: policy and reports | **DO NOT TOUCH** |
| 5 | TXT | `@` | `google-site-verification=…` | Proves to Google that you own the domain | **DO NOT TOUCH** |
| 6 | CNAME | `www` | old Vercel address | The old website (already removed from Vercel, so it no longer works) | **CHANGE on launch day** |
| — | A | `@` | none today | The main website address | **ADD on launch day** |
| — | A | `new` | none today | Test address (`docs/SERVER-SETUP.md` step 8) | **ADD before launch** |
| — | A | `stats` | none today | Visitor-count dashboard (step 8) | **ADD before launch** |

Good to know: because `@` has no website record and `www` points at a Vercel project that no
longer has the domain, **neither address shows a website today**. There is no old site to keep
alive, so the move cannot break anything visitors see now. It only fixes it.

Email does not use rows 6 or the new `A` records, so changing them cannot affect it. The new
email-sending from the website (step 10 of the server guide) goes through the same Google
mailbox, so the SPF and DKIM records above already cover it.

## Step 3. Before launch day

All of this must be true first:

- [ ] `docs/LAUNCH-CHECKLIST.md` is fully ticked, including the "Launch check" on GitHub.
- [ ] The new site has been live on `https://new.lindrize.online`, and you have used it on
      your phone in both languages.
- [ ] You have chosen a quiet hour (not while a cold-email campaign is sending).

**One day before:** in Advanced DNS, change only the TTL of row 6 (`www`) to **5 min**. Change
nothing else. TTL is how long other computers remember the old answer; lowering it makes the
change, and an undo, take minutes instead of hours.

Write down the current value of row 6 here, so an undo is one copy-paste:

| Type | Host | Old value |
|---|---|---|
| CNAME | `www` | |

## Step 4. Launch day

1. Send a test email **to** `amer.ai@lindrize.online` from a personal account, and one
   **from** it to a personal account. Both arrive. This proves email works before you start.
2. In Advanced DNS:

| Do | Type | Host | Value | TTL |
|---|---|---|---|---|
| Add a new record | A Record | `@` | YOUR-IP | 5 min |
| Edit row 6 (do not delete and re-add) | CNAME | `www` | `lindrize.online.` | 5 min |

   Namecheap may add the final dot itself. Touch no other row.

3. On the server, wait until both names answer with YOUR-IP (repeat the two commands until
   they do, usually within ten minutes):

```bash
dig +short lindrize.online @1.1.1.1
```

```bash
dig +short www.lindrize.online @1.1.1.1
```

4. Get the certificate for both names and switch the real site on:

```bash
sudo certbot certonly --webroot -w /var/www/certbot --cert-name lindrize.online -d lindrize.online -d www.lindrize.online --deploy-hook "systemctl reload nginx"
```

```bash
sudo ln -s /etc/nginx/sites-available/lindrize.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
```

**Check, in this order:**

- [ ] `https://lindrize.online` shows the new site with a padlock.
- [ ] `https://www.lindrize.online`, `http://lindrize.online` and `http://www.lindrize.online` all end up on `https://lindrize.online`.
- [ ] `https://lindrize.online/book` opens your Calendly page.
- [ ] Send a test email **to** and **from** your Lindrize address again. Both arrive.
- [ ] Send yourself a design from "Design your agent". Both emails arrive.
- [ ] https://www.whatsmydns.net → **MX** → `lindrize.online` still shows `smtp.google.com`.

## Step 5. Undo, if anything is wrong

Delete the `A` record for `@`, and put the old value from step 3 back into row 6. Email is
unaffected either way, because its records were never touched. Then tell me what you saw.

## Step 6. After launch

Same day:

- [ ] On GitHub (Settings → Secrets and variables → Actions → Variables), change
      `PUBLISH_CHECK_URL` to `https://lindrize.online`.
- [ ] In `/srv/lindrize/.env.receiver`, set `ALLOWED_ORIGIN=https://lindrize.online`, then run
      `sudo /srv/lindrize/repo/server/services.sh up -d`.
- [ ] Make the test address forward to the real one:

```bash
sudo cp /srv/lindrize/repo/server/nginx/lindrize-preview-after-launch.conf /etc/nginx/sites-available/lindrize-preview.conf && sudo nginx -t && sudo systemctl reload nginx
```

- [ ] Change the UptimeRobot monitor to `https://lindrize.online/`.
- [ ] Open the Umami dashboard: your own visit is counted.
- [ ] Start `docs/SEO-SETUP.md`.

After one week without problems: set the TTL of `@` and `www` back to **Automatic**.

The old Vercel project no longer has the domain. Deleting it is up to you; nothing here
depends on it.
