# Server setup

How to prepare your Hostinger VPS for the new website. You do each step; every step ends with
a **Check** and the result to expect. If a check shows something else, stop and send me what
you see.

**Status: draft until step 1 is done.** I have not seen your server. Step 1 only looks and
changes nothing. Its output tells me whether the rest fits as written (for example, whether
something on the server already uses the web ports). Do not go past step 1 until I confirm.

## Rules for the whole guide

- **Never paste a password, key or token into our chat, an email or GitHub.** They go into
  files on the server or into GitHub's "Secrets" boxes, and nowhere else.
- Nothing in steps 1 to 13 touches `lindrize.online`, `www`, your domain's email records or
  your email. The main address is switched on later, on launch day (`docs/DNS-MOVE.md`).
- Lines in grey boxes are typed into the server's terminal, one box at a time.
- `YOUR-IP` means your server's address from the Hostinger panel (four numbers with dots).

## What gets installed

| Part | Job |
|---|---|
| Nginx | The web server: sends the pages, the security headers and the redirects |
| Certbot | Free HTTPS certificates from Let's Encrypt, renewed automatically |
| Docker | Runs the three background services, each in its own closed box |
| Email receiver | Sends "Email me my design" to the visitor and to you |
| Umami and its database | Cookie-free visitor counting, on your own server |
| UFW, fail2ban, automatic updates | Firewall, blocks password guessing, installs security fixes |

Where things live on the server:

| Folder | What |
|---|---|
| `/var/www/lindrize/releases/` | The last 5 published versions of the site |
| `/var/www/lindrize/current` | A pointer to the version visitors see |
| `/srv/lindrize/repo/` | A copy of the GitHub repository (server files and the receiver) |
| `/srv/lindrize/.env`, `/srv/lindrize/.env.receiver` | The secrets. Only on the server, readable only by the administrator |
| `/srv/lindrize/backups/` | Nightly copies of the visitor counts, 14 days |

## Where every secret goes

You enter each of these yourself. None of them ever goes into chat, email or a file on GitHub.

| Secret | Where you get it | Where it goes | Step |
|---|---|---|---|
| Your server login password | You choose it | Your password manager (asked for by `sudo`) | 2 |
| Your SSH key passphrase | You choose it | Your password manager | 2 |
| Publishing key (`lz-publish`) | Created on the server | GitHub secret `DEPLOY_SSH_KEY`, then deleted from the server | 7, 9 |
| Server fingerprint | Printed on the server | GitHub secret `DEPLOY_KNOWN_HOSTS` | 9 |
| Server address | Hostinger panel | GitHub secret `DEPLOY_HOST` | 9 |
| Turnstile **secret key** | Cloudflare → Turnstile | `/srv/lindrize/.env.receiver`, line `TURNSTILE_SECRET=` | 10 |
| Google app password | Google account of `amer.ai@lindrize.online` → App passwords | `/srv/lindrize/.env.receiver`, line `SMTP_PASS=` | 10 |
| Telegram bot token | `@BotFather` in Telegram | `/srv/lindrize/.env.receiver`, line `TELEGRAM_BOT_TOKEN=` | 10 |
| Telegram chat id | The `getUpdates` page | `/srv/lindrize/.env.receiver`, line `TELEGRAM_CHAT_ID=` | 10 |
| Umami database password, app secret, two-factor key | Made on the server by one command | `/srv/lindrize/.env` (filled in by that command; you never see them) | 10 |
| Umami admin password | You choose it | The Umami dashboard itself, and your password manager | 11 |

Not secret (safe in chat, and they go into `site/src/data/settings.json` on GitHub): the
Turnstile **site key** and the Umami **Website ID**. Not secret either (GitHub **variables**,
not secrets): `DEPLOY_ENABLED` and `PUBLISH_CHECK_URL`.

---

## Step 1. Look at the server (changes nothing)

1. Open the Hostinger panel → VPS → your server. Note the **IP address** and the plan's
   memory and storage.
2. Connect. On Windows, open **PowerShell** and type (Hostinger's "Browser terminal" also works):

```bash
ssh root@YOUR-IP
```

3. Download the inspection script. It prints facts about the server and no passwords, keys or
   file contents. You can read it first on GitHub: `server/inspect.sh`.

```bash
curl -fsSL https://raw.githubusercontent.com/amerelshairai/Lindrize-web/main/server/inspect.sh -o inspect.sh
```

```bash
bash inspect.sh
```

**Check:** it ends with `== Done ==`.

**Send me the whole output**, then wait. I am looking for:

| If the output shows | Then |
|---|---|
| Something already listening on port 80 or 443 (for example n8n's own web server) | The Nginx steps change. I rewrite them to fit before you continue. |
| Less than about 1 GB of free memory | Umami may not fit next to what already runs. We decide together. |
| A system other than Ubuntu 22.04 or 24.04 | Some commands differ. I adjust them. |
| Port 8081 or 8082 in use | I move the services to free ports. |

---

## Step 2. Your own login with a key, no passwords

Password logins are what attackers guess. A key is a file on your computer that cannot be
guessed.

1. **On your own computer** (a new PowerShell window, not the server), create a key. Press
   Enter to accept the file name, then choose a passphrase you will remember:

```bash
ssh-keygen -t ed25519 -C "amer-laptop"
```

2. Show the public half and copy the whole line (it starts with `ssh-ed25519`). The public
   half is safe to copy; the file without `.pub` never leaves your computer.

```bash
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

3. **On the server**, create your administrator account. It asks for a password: choose a
   long one and keep it in your password manager (it is asked for by `sudo`).

```bash
adduser amer
```

```bash
usermod -aG sudo amer
```

```bash
install -d -m 700 -o amer -g amer /home/amer/.ssh
```

```bash
nano /home/amer/.ssh/authorized_keys
```

   Paste the line from point 2, then press Ctrl+O, Enter, Ctrl+X.

```bash
chown amer:amer /home/amer/.ssh/authorized_keys && chmod 600 /home/amer/.ssh/authorized_keys
```

4. **Keep this window open.** In a second window on your computer, test the new login:

```bash
ssh amer@YOUR-IP
```

```bash
sudo whoami
```

**Check:** the second command prints `root`. Only when it does, continue.

5. In the second window, switch password logins off:

```bash
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\n' | sudo tee /etc/ssh/sshd_config.d/10-lindrize.conf
```

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Check:** open a third window and run `ssh amer@YOUR-IP`: it logs in. Then run
`ssh root@YOUR-IP`: it is refused. If you ever lock yourself out, Hostinger's "Browser
terminal" in the panel still gets you in.

From here on, every command is typed as `amer`.

---

## Step 3. Firewall

Only three doors stay open: SSH (your login), 80 and 443 (the website).

```bash
sudo apt-get update && sudo apt-get install -y ufw
```

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
```

```bash
sudo ufw --force enable
```

**Check:** `sudo ufw status` shows `Status: active` and exactly those three rules (each
listed twice, once marked `(v6)`).

Good to know: Docker opens its own doors and ignores this firewall. That is why every service
in this setup listens only on `127.0.0.1` (the server itself), which nothing outside can reach.
If step 1 showed that something else on the server needs another port from outside, I add it
here before you enable the firewall.

---

## Step 4. Block password guessing and install security fixes automatically

```bash
sudo apt-get install -y fail2ban unattended-upgrades
```

```bash
printf '[sshd]\nenabled = true\nmaxretry = 5\nbantime = 1h\n' | sudo tee /etc/fail2ban/jail.d/lindrize.local
```

```bash
sudo systemctl enable --now fail2ban && sudo systemctl restart fail2ban
```

```bash
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' | sudo tee /etc/apt/apt.conf.d/20auto-upgrades
```

**Check:** `sudo fail2ban-client status sshd` shows `Currently banned:` with a number, and
`systemctl is-enabled unattended-upgrades` prints `enabled`.

---

## Step 5. Docker

Skip this step if step 1 showed Docker **and** the compose plugin are already installed.

```bash
sudo apt-get install -y ca-certificates curl git
```

```bash
sudo install -m 0755 -d /etc/apt/keyrings && sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
```

```bash
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**Check:** `sudo docker run --rm hello-world` prints `Hello from Docker!`, and
`docker compose version` prints a version number.

---

## Step 6. The repository copy, Nginx and Certbot

```bash
sudo apt-get install -y nginx certbot git rsync
```

```bash
sudo install -d -m 755 /srv/lindrize && sudo git clone https://github.com/amerelshairai/Lindrize-web.git /srv/lindrize/repo
```

Remove Nginx's sample page (it would answer for addresses that are not yours):

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Install the Lindrize files and switch on the first one (port 80: it answers the certificate
check and sends everything else to HTTPS):

```bash
sudo ln -s /etc/nginx/sites-available/lindrize-http.conf /etc/nginx/sites-enabled/lindrize-http.conf
```

```bash
sudo /srv/lindrize/repo/server/install-nginx.sh
```

**Check:** it ends with `Installed, tested and reloaded.`

---

## Step 7. The publishing account

GitHub publishes the site through an account named `deploy`. Its key is locked to one small
program (`server/deploy-gate.sh`) that accepts three requests only: upload a release, switch
the site to it, list the releases. With that key nobody can open a terminal, read a file or
touch anything outside the website folder, even if the key leaked.

```bash
sudo adduser --disabled-password --gecos "" deploy
```

```bash
sudo install -d -m 755 -o deploy -g deploy /var/www/lindrize /var/www/lindrize/releases
```

Create the key pair on the server:

```bash
ssh-keygen -t ed25519 -N "" -C "github-publish" -f ~/lz-publish
```

Install the public half, locked to the gate:

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

```bash
echo "command=\"/usr/local/bin/lindrize-deploy-gate\",restrict $(cat ~/lz-publish.pub)" | sudo tee /home/deploy/.ssh/authorized_keys
```

```bash
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys && sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

**Check:** this must print `lindrize-deploy-gate: refused` (the key cannot run commands):

```bash
ssh -i ~/lz-publish -o StrictHostKeyChecking=accept-new deploy@localhost "whoami"
```

Leave the two `lz-publish` files where they are until step 9.

---

## Step 8. A test address with HTTPS

The new site first goes live on a test address, `new.lindrize.online`, so you can check
everything before the real domain moves. This step **adds** two DNS records. It changes and
removes nothing, so your email is not affected. Your current records are listed in
`docs/DNS-MOVE.md`.

1. In Namecheap: Domain List → `lindrize.online` → **Manage** → **Advanced DNS** →
   **Add New Record**, twice. Do not touch any existing row, and do not change the "Mail
   Settings" section further down the page.

| Type | Name | Value | TTL |
|---|---|---|---|
| A Record | `new` | YOUR-IP | Automatic |
| A Record | `stats` | YOUR-IP | Automatic |

2. Wait a few minutes. **Check:** both commands print YOUR-IP:

```bash
dig +short new.lindrize.online
```

```bash
dig +short stats.lindrize.online
```

3. Get the certificate (replace the email with the address that should receive expiry
   warnings):

```bash
sudo certbot certonly --webroot -w /var/www/certbot --cert-name new.lindrize.online -d new.lindrize.online -d stats.lindrize.online --deploy-hook "systemctl reload nginx" --agree-tos -m YOUR-EMAIL --no-eff-email
```

**Check:** it prints `Successfully received certificate`.

4. Switch on the test address and the stats address:

```bash
sudo ln -s /etc/nginx/sites-available/lindrize-preview.conf /etc/nginx/sites-enabled/ && sudo ln -s /etc/nginx/sites-available/lindrize-stats.conf /etc/nginx/sites-enabled/
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**Check:** `sudo certbot renew --dry-run` ends with `all simulated renewals succeeded`.
The site itself shows "404" until the first publish in step 9. That is expected.

---

## Step 9. Let GitHub publish

1. On the server, print the three values GitHub needs. **Copy them straight into GitHub, not
   into chat.**

```bash
cat ~/lz-publish
```

```bash
echo "YOUR-IP $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
```

2. On GitHub: the repository → **Settings → Secrets and variables → Actions**.

   Under **Secrets → New repository secret**, add:

| Name | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Everything the first command printed, including the `BEGIN` and `END` lines |
| `DEPLOY_KNOWN_HOSTS` | The one line the second command printed |
| `DEPLOY_HOST` | YOUR-IP |

   Under **Variables → New repository variable**, add:

| Name | Value |
|---|---|
| `DEPLOY_ENABLED` | `true` |
| `PUBLISH_CHECK_URL` | `https://new.lindrize.online` |

3. Delete the key from the server (GitHub now holds the only copy):

```bash
shred -u ~/lz-publish && rm ~/lz-publish.pub
```

4. On GitHub: **Actions → Publish → Run workflow → Run workflow**.

**Check:** after about two minutes the run has a green tick, and
`https://new.lindrize.online` shows the new site in English, `/ar/` in Arabic.

From now on every change saved to GitHub is checked and then published by itself. The address
is hidden from search engines, so Google will not list it.

---

## Step 10. The email receiver and Umami

You need three things from other websites first. Each gives you a secret value: keep its
browser tab open and paste the value into the server file below, never into chat.

| What | Where | Notes |
|---|---|---|
| **Cloudflare Turnstile** (the human check) | dash.cloudflare.com → Turnstile → Add widget | Free. Hostnames: `lindrize.online` and `new.lindrize.online`. Mode: Managed. You get a **site key** (public) and a **secret key**. |
| **Email-sending password** | Signed in as `amer.ai@lindrize.online`: myaccount.google.com → Security → 2-Step Verification → App passwords | Create one named "Lindrize website". If "App passwords" is missing, turn on 2-Step Verification for this mailbox first. If it is still missing, tell me: your Workspace admin settings may block it. |
| **Telegram alert** (optional) | In Telegram, message `@BotFather` → `/newbot` | You get a bot **token**. Then send your new bot any message and open `https://api.telegram.org/botTOKEN/getUpdates` in a browser: the number after `"chat":{"id":` is your **chat id**. |

1. Create the two secret files:

```bash
sudo install -m 600 /srv/lindrize/repo/server/.env.example /srv/lindrize/.env
```

```bash
sudo install -m 600 /srv/lindrize/repo/receiver/.env.example /srv/lindrize/.env.receiver
```

2. Fill the first one with three random values made on the server:

```bash
for name in UMAMI_DB_PASSWORD UMAMI_APP_SECRET UMAMI_TWO_FACTOR_KEY; do sudo sed -i "s/^$name=.*/$name=$(openssl rand -hex 32)/" /srv/lindrize/.env; done
```

3. Fill the second one by hand (Ctrl+O, Enter, Ctrl+X to save):

```bash
sudo nano /srv/lindrize/.env.receiver
```

| Line | Value |
|---|---|
| `ALLOWED_ORIGIN` | `https://lindrize.online,https://new.lindrize.online` |
| `TURNSTILE_SECRET` | The Turnstile **secret key** |
| `SMTP_USER` | `amer.ai@lindrize.online` |
| `SMTP_PASS` | The app password, without spaces |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | From BotFather, or leave both empty |

   Leave the other lines as they are.

4. Start the services (the first start downloads about 600 MB and takes a few minutes):

```bash
sudo /srv/lindrize/repo/server/services.sh up -d --build
```

**Check:** `sudo /srv/lindrize/repo/server/services.sh ps` lists `receiver`, `umami` and
`db`, each `Up` and `(healthy)` where shown. And this prints `{"ok":true}`:

```bash
curl -s http://127.0.0.1:8081/api/health
```

5. Switch the email form on: on GitHub, open `site/src/data/settings.json`, put the
   Turnstile **site key** (the public one) between the quotes of `"turnstileSiteKey"`, and
   save. Or tell me the site key and I do it; the site key is public, so it is safe in chat.

**Check:** after the publish finishes, open `https://new.lindrize.online/design-your-agent/`,
go to the last step, send a design to your own address. Two emails arrive (yours and the
visitor's copy) and, if set up, a Telegram alert.

---

## Step 11. Umami: first login

1. Open `https://stats.lindrize.online`. Log in with username `admin`, password `umami`.
2. **Immediately** change the password: profile icon → Profile → Change password. Use a long
   one from your password manager. Until you do, anyone could log in with the default.
3. Settings → Websites → Add website. Name: `Lindrize`. Domain: `lindrize.online`.
4. Open the new website's settings and copy its **Website ID** (a long code with dashes). It
   is not a secret.
5. Put it in `site/src/data/settings.json` as `"umamiWebsiteId"`, or send it to me.

**Check:** counting starts only on the real address, so the dashboard stays at zero until
the domain move. That is intended: your own test visits are not counted.

---

## Step 12. Nightly backup of the visitor counts

```bash
printf '17 3 * * * root /srv/lindrize/repo/server/backup-umami.sh\n' | sudo tee /etc/cron.d/lindrize-backup
```

Run it once now:

```bash
sudo /srv/lindrize/repo/server/backup-umami.sh && sudo ls -lh /srv/lindrize/backups/
```

**Check:** one file named `umami-` and today's date is listed.

The backups sit on the same server. For a copy elsewhere, switch on Hostinger's own weekly
VPS backups in the panel. Only anonymous visitor counts are in this database; the website
itself is always safe on GitHub.

---

## Step 13. Uptime alerts

1. Create a free account at uptimerobot.com.
2. Add monitor → HTTP(s) → `https://new.lindrize.online/` for now. After the domain move,
   change it to `https://lindrize.online/`.
3. Alert contact: your email (and Telegram, if you like).

**Check:** the monitor shows "Up".

---

## Looking after it

| Job | How often | How |
|---|---|---|
| Security fixes for the server | Automatic | Nothing to do. Restart the server from the Hostinger panel about once a month so fixes that need a restart take effect. |
| HTTPS certificates | Automatic, every 60 days | Nothing to do. Let's Encrypt emails you if a renewal ever fails. |
| Website libraries | Monthly | GitHub proposes updates ("Dependabot"). If the checks are green, press Merge. |
| Receiver or server file changes | When I change them | `sudo /srv/lindrize/repo/server/services.sh update`, then `sudo /srv/lindrize/repo/server/install-nginx.sh` |
| Umami version | A few times a year | I change the version number in `server/docker-compose.yml`; you run the `update` command above. |
| See what the receiver did | When an email is missing | `sudo /srv/lindrize/repo/server/services.sh logs --tail 50 receiver` (it logs events, never addresses) |
| Go back one website version | When a publish went wrong | See "Undo" in `HOW-TO-EDIT.md` |
