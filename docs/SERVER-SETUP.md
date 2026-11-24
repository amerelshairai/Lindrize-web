# Server setup

How to put the new website on your Hostinger VPS, next to n8n. You do each step; every step
ends with a **Check** and the result to expect. If a check shows something else, stop and send
me what you see.

**Fitted to your server (inspection of 21 November 2026):** Hostinger KVM 1 (1 processor,
4 GB memory, about 2.6 GB free, 43 GB disk free), Ubuntu 24.04.4, with n8n, its Postgres
database and Traefik running in Docker.

## How it fits next to n8n

- **n8n and its database are not changed, moved or restarted** by any step here.
- **Traefik** (Hostinger's program that receives every visit on ports 80 and 443 and handles
  HTTPS for n8n) also takes the Lindrize addresses and gets their HTTPS certificates the same
  way. Nothing new listens on the website ports.
- The website adds four small containers in their own project, `lindrize`: the web server, the
  email receiver, Umami and Umami's own database. Together they use under 1 GB of memory.

| Address | Goes to |
|---|---|
| `n8n-a6ew.srv1994370.hstgr.cloud` | n8n, as today |
| `new.lindrize.online` | The website, for testing before launch (hidden from search engines) |
| `stats.lindrize.online` | The Umami dashboard (private, with a login) |
| `lindrize.online`, `www.lindrize.online` | The website, from launch day (`docs/DNS-MOVE.md`) |

## Rules for the whole guide

- **Never paste a password, key or token into our chat, an email or GitHub.** They go into
  files on the server or into GitHub's "Secrets" boxes, and nowhere else.
- Nothing here changes `lindrize.online`, `www`, your email records or your email. The main
  address is switched on later, on launch day (`docs/DNS-MOVE.md`).
- Lines in grey boxes are typed into the server's terminal, one box at a time. Paste with
  right-click → Paste (or Ctrl + Shift + V), then press Enter.
- `YOUR-IP` means your server's address from the Overview page in hPanel (four numbers with
  dots).

## Hostinger: where things are in the panel

All of these are in **hPanel** (hpanel.hostinger.com) → **VPS** → your server → **Manage**.

| You need | Where |
|---|---|
| The server's IP address, plan and operating system | The **Overview** page |
| A terminal in the browser | **Browser terminal** button (top right of Overview) |
| A full copy of the server before changes | **Backups and monitoring** → **Snapshots** |
| Hostinger's firewall (in front of the server) | **Security** → **Firewall** |
| Root password reset, if you are ever locked out | **Settings** (root access) |

Hostinger renames menu items now and then. If one is not where this table says, use hPanel's
search box, or send me a screenshot.

## Where things live on the server

| Folder | What |
|---|---|
| `/var/www/lindrize/releases/` | The last 5 published versions of the site |
| `/var/www/lindrize/current` | A pointer to the version visitors see |
| `/srv/lindrize/repo/` | A copy of the GitHub repository (server files and the receiver) |
| `/srv/lindrize/.env`, `/srv/lindrize/.env.receiver` | The secrets. Only on the server, readable only by the administrator |
| `/srv/lindrize/backups/` | Nightly copies of the visitor counts, 14 days |
| `/var/log/lindrize/` | The web server's logs (shortened visitor addresses), 14 days |
| `/docker/n8n-a6ew/`, `/docker/traefik/` | n8n and Traefik, as Hostinger set them up. Not touched. |

## Where every secret goes

You enter each of these yourself. None of them ever goes into chat, email or a file on GitHub.

| Secret | Where you get it | Where it goes | Step |
|---|---|---|---|
| Your server login password | You choose it | Your password manager (asked for by `sudo`) | 2 |
| Your SSH key passphrase | You choose it | Your password manager | 2 |
| Publishing key (`lz-publish`) | Created on the server | GitHub secret `DEPLOY_SSH_KEY`, then deleted from the server | 6, 10 |
| Server fingerprint | Printed on the server | GitHub secret `DEPLOY_KNOWN_HOSTS` | 10 |
| Server address | hPanel Overview | GitHub secret `DEPLOY_HOST` | 10 |
| Turnstile **secret key** | Cloudflare → Turnstile | `/srv/lindrize/.env.receiver`, line `TURNSTILE_SECRET=` | 8 |
| Google app password | Google account of `amer.ai@lindrize.online` → App passwords | `/srv/lindrize/.env.receiver`, line `SMTP_PASS=` | 8 |
| Telegram bot token | `@BotFather` in Telegram | `/srv/lindrize/.env.receiver`, line `TELEGRAM_BOT_TOKEN=` | 8 |
| Telegram chat id | The `getUpdates` page | `/srv/lindrize/.env.receiver`, line `TELEGRAM_CHAT_ID=` | 8 |
| Umami database password, app secret, two-factor key | Made on the server by one command | `/srv/lindrize/.env` (filled in by that command; you never see them) | 8 |
| Umami admin password | You choose it | The Umami dashboard itself, and your password manager | 11 |

Not secret (safe in chat; they go into `site/src/data/settings.json` on GitHub): the Turnstile
**site key** and the Umami **Website ID**. Not secret either (GitHub **variables**, not
secrets): `DEPLOY_ENABLED` and `PUBLISH_CHECK_URL`.

---

## Step 1. Take a snapshot

A snapshot is a full copy of the server as it is now. If anything in the next steps goes wrong,
Hostinger can put the whole server back exactly as it was.

1. hPanel → **VPS** → **Manage** → **Backups and monitoring** → **Snapshots** → **Create
   snapshot**.
2. Wait until it shows as finished (a few minutes).

**Check:** the snapshot is listed with today's date.

Good to know: restoring a snapshot also takes n8n back to that moment, so workflow changes made
after it would be lost. It is the emergency exit, not the first fix. Hostinger keeps one
snapshot at a time, so a new one replaces this one.

---

## Step 2. Your own login with a key, no passwords

Today the server accepts the root password from anyone who guesses it. A key is a file on your
computer that cannot be guessed.

1. **On your own computer** (open **PowerShell**, not the server), create a key. Press Enter to
   accept the file name, then choose a passphrase you will remember:

```bash
ssh-keygen -t ed25519 -C "amer-laptop"
```

2. Show the public half and copy the whole line (it starts with `ssh-ed25519`). The public
   half is safe to copy; the file without `.pub` never leaves your computer.

```bash
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

3. **On the server** (Browser terminal), create your administrator account. It asks for a
   password: choose a long one and keep it in your password manager (`sudo` asks for it). Press
   Enter through the other questions.

```bash
adduser amer
```

```bash
usermod -aG sudo,docker amer
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

4. **Keep the Browser terminal open.** In PowerShell on your computer, test the new login:

```bash
ssh amer@YOUR-IP
```

```bash
sudo whoami
```

**Check:** the second command prints `root`. Only when it does, continue.

5. In that PowerShell window, switch password logins off:

```bash
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' | sudo tee /etc/ssh/sshd_config.d/10-lindrize.conf
```

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Check:** open a new PowerShell window and run `ssh amer@YOUR-IP`: it logs in with your key.

Good to know: root can no longer log in with a password. Hostinger's **Browser terminal** may
stop working because of that. That is expected; use PowerShell with your key from now on. If you
are ever locked out, a root password reset in hPanel → **Settings**, or the snapshot from step 1,
gets you back in. Tell me before using either.

From here on, every command is typed as `amer`, in PowerShell after `ssh amer@YOUR-IP`.

---

## Step 3. Firewall (in hPanel)

Today no firewall is on, and n8n can also be reached directly at `http://YOUR-IP:32768`, without
HTTPS, bypassing Traefik. Hostinger's firewall sits in front of the server and closes everything
except three doors: your login (22) and the website ports (80, 443).

1. First, open your n8n at `https://n8n-a6ew.srv1994370.hstgr.cloud` and check it works. After
   this step that is the only way to reach n8n. If anything you know of uses
   `http://YOUR-IP:32768` (a client's system, a bookmark, a webhook), tell me before continuing.
2. hPanel → **VPS** → **Manage** → **Security** → **Firewall** → **Create firewall
   configuration**. Name it `lindrize`.
3. Add three rules, each **Accept**, protocol **TCP**, source **Any**:

| Action | Protocol | Port | Source |
|---|---|---|---|
| Accept | TCP | 22 | Any |
| Accept | TCP | 80 | Any |
| Accept | TCP | 443 | Any |

4. Make sure the configuration is **assigned to this server** and press **Activate** (changes
   apply only after that). Never activate an empty configuration: it blocks everything,
   including your own login.

**Check:**
- `ssh amer@YOUR-IP` still logs in.
- `https://n8n-a6ew.srv1994370.hstgr.cloud` still opens n8n.
- `http://YOUR-IP:32768` in your browser no longer loads.

If any check fails, switch the configuration off in the same Firewall page and tell me.

The server's own firewall (UFW) stays off: Docker bypasses it, so it would give a false sense
of safety. Hostinger's firewall covers everything.

---

## Step 4. Block password guessing, security fixes, and spare memory

On this server Ubuntu's main update server does not answer over plain `http` (found
23 November 2026: the daily update job had been stuck since 22 October). Switch it to `https`
first, and stop the stuck job:

```bash
sudo sed -i 's#http://archive.ubuntu.com#https://archive.ubuntu.com#' /etc/apt/sources.list.d/ubuntu.sources
```

```bash
sudo pkill -x apt-get; sleep 2; pgrep -a apt-get || echo CLEAR
```

```bash
sudo apt-get update && sudo apt-get install -y fail2ban git rsync
```

On Ubuntu 24.04 the login service is called `ssh.service`, so the guard is told to watch that:

```bash
printf '[sshd]\nenabled = true\nmaxretry = 5\nbantime = 1h\nbackend = systemd\njournalmatch = _SYSTEMD_UNIT=ssh.service + _COMM=sshd\n' | sudo tee /etc/fail2ban/jail.d/lindrize.local
```

```bash
sudo systemctl enable --now fail2ban && sudo systemctl restart fail2ban
```

Automatic security updates are already installed. Make sure they are switched on:

```bash
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' | sudo tee /etc/apt/apt.conf.d/20auto-upgrades
```

The server has no spare memory on disk ("swap"). With n8n and the website together, a 2 GB swap
file stops a busy moment from crashing either of them:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Check:**
- `sudo fail2ban-client status sshd` shows `Currently banned:` with a number, and
  `Journal matches:  _SYSTEMD_UNIT=ssh.service`.
- `free -m` shows a `Swap:` line with about `2047` in the total column.

---

## Step 5. The repository copy and the host pieces

Docker is already installed (Hostinger's n8n setup), so nothing to install there.

```bash
sudo install -d -m 755 /srv/lindrize && sudo git clone https://github.com/amerelshairai/Lindrize-web.git /srv/lindrize/repo
```

```bash
sudo /srv/lindrize/repo/server/install-host.sh
```

It installs three small things: the publishing gate (step 6), the log folder, and two nightly
jobs (log clean-up after 14 days, and the visitor-count backup).

**Check:** it ends with `Installed.`

---

## Step 6. The publishing account

GitHub publishes the site through an account named `deploy`. Its key is locked to one small
program (`server/deploy-gate.sh`) that accepts three requests only: upload a release, switch the
site to it, list the releases. With that key nobody can open a terminal, read a file or touch
anything outside the website folder, even if the key leaked. It cannot reach n8n.

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

Leave the two `lz-publish` files where they are until step 10.

---

## Step 7. Two DNS records for testing (Namecheap)

This **adds** two records. It changes and removes nothing, so your email is not affected. Your
current records are listed in `docs/DNS-MOVE.md`.

1. Namecheap → **Domain List** → `lindrize.online` → **Manage** → **Advanced DNS** → **Add New
   Record**, twice. Do not touch any existing row, and do not change the **Mail Settings**
   section further down the page.

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `new` | YOUR-IP | Automatic |
| A Record | `stats` | YOUR-IP | Automatic |

2. Press the green tick on each row to save.

**Check** (on the server, after a few minutes): both print YOUR-IP.

```bash
dig +short new.lindrize.online @1.1.1.1
```

```bash
dig +short stats.lindrize.online @1.1.1.1
```

---

## Step 8. Keys for the email form, and the secret files

You need three things from other websites first. Each gives you a secret value: keep its
browser tab open and paste the value into the server file below, never into chat.

| What | Where | Notes |
|---|---|---|
| **Cloudflare Turnstile** (the human check) | dash.cloudflare.com → sign up or log in (free) → **Turnstile** → **Add widget** | Hostnames: `lindrize.online` and `new.lindrize.online`. Mode: **Managed**. You get a **site key** (public) and a **secret key**. |
| **Email-sending password** | Signed in as `amer.ai@lindrize.online`: myaccount.google.com → **Security** → **2-Step Verification** → **App passwords** | Create one named "Lindrize website". If "App passwords" is missing, turn on 2-Step Verification for this mailbox first. If it is still missing, tell me: your Workspace admin settings may block it. |
| **Telegram alert** (optional; not used, as Telegram is blocked in Jordan. The Privacy Policy no longer mentions it. Leave both lines empty.) | In Telegram, message `@BotFather` → `/newbot` | You get a bot **token**. Then send your new bot any message and open `https://api.telegram.org/botTOKEN/getUpdates` in a browser (TOKEN replaced by yours): the number after `"chat":{"id":` is your **chat id**. |

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

3. Fill the second one by hand. Move with the arrow keys; save with Ctrl+O, Enter, Ctrl+X.

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

**Check:** `sudo grep -c '=$' /srv/lindrize/.env` prints `0` (all three values filled).

---

## Step 9. Start the website's containers

The first start downloads about 600 MB and takes a few minutes. n8n keeps running throughout.

```bash
sudo /srv/lindrize/repo/server/services.sh up -d --build
```

**Check:**

1. `sudo /srv/lindrize/repo/server/services.sh ps` lists `web`, `receiver`, `umami` and `db`,
   each `Up`, with `(healthy)` where shown.
2. This prints `host`, which means Traefik can reach the website's containers:

```bash
docker inspect -f '{{.HostConfig.NetworkMode}}' traefik-traefik-1
```

   If it prints anything else, stop and send it to me.

3. After about a minute (Traefik fetches the HTTPS certificate), this prints a line starting
   with `HTTP/2 404`. That is right: the address works with HTTPS, and the site itself arrives
   in step 10.

```bash
curl -sI https://new.lindrize.online | head -1
```

4. `https://n8n-a6ew.srv1994370.hstgr.cloud` still opens n8n.

---

## Step 10. Let GitHub publish

1. On the server, print the three values GitHub needs. **Copy them straight into GitHub, not
   into chat.**

```bash
cat ~/lz-publish
```

```bash
echo "YOUR-IP $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
```

   (Type your real IP in place of YOUR-IP before pressing Enter.)

2. On GitHub: the repository → **Settings** → **Secrets and variables** → **Actions**.

   **Secrets** tab → **New repository secret**, three times:

| Name | Value |
|---|---|
| `DEPLOY_SSH_KEY` | Everything the first command printed, including the `BEGIN` and `END` lines |
| `DEPLOY_KNOWN_HOSTS` | The one line the second command printed |
| `DEPLOY_HOST` | YOUR-IP |

   **Variables** tab → **New repository variable**, twice:

| Name | Value |
|---|---|
| `DEPLOY_ENABLED` | `true` |
| `PUBLISH_CHECK_URL` | `https://new.lindrize.online` |

3. Delete the key from the server (GitHub now holds the only copy):

```bash
shred -u ~/lz-publish && rm ~/lz-publish.pub
```

4. On GitHub: **Actions** → **Publish** → **Run workflow** → **Run workflow**.

**Check:** after about three minutes the run has a green tick, and `https://new.lindrize.online`
shows the new site in English, and `/ar/` in Arabic.

From now on every change saved to GitHub is checked and then published by itself.

5. Switch the email form on: send me the Turnstile **site key** (the public one; safe in chat),
   or put it between the quotes of `"turnstileSiteKey"` in `site/src/data/settings.json` on
   GitHub.

**Check:** after that publish, open `https://new.lindrize.online/design-your-agent/`, go to the
last step and send a design to your own address. Two emails arrive (yours and the visitor's
copy), not in spam, and the Telegram alert if you set it up.

---

## Step 11. Umami: first login

1. Open `https://stats.lindrize.online`. Log in with username `admin`, password `umami`.
2. **Immediately** change the password: profile icon → **Profile** → **Change password**. Use a
   long one from your password manager. Until you do, anyone could log in with the default.
3. **Settings** → **Websites** → **Add website**. Name: `Lindrize`. Domain: `lindrize.online`.
4. Open the new website's settings and copy its **Website ID** (a long code with dashes). It is
   not a secret: send it to me, or put it in `site/src/data/settings.json` as `"umamiWebsiteId"`.

**Check:** counting starts only on the main address, so the dashboard stays at zero until
launch day. That is intended: your own test visits are not counted.

---

## Step 12. Backups and log clean-up

Both run by themselves every night (installed in step 5). Run each once now to see they work:

```bash
sudo /srv/lindrize/repo/server/backup-umami.sh && sudo ls -lh /srv/lindrize/backups/
```

```bash
sudo /srv/lindrize/repo/server/rotate-logs.sh && sudo ls /var/log/lindrize/
```

**Check:** the first lists one file named `umami-` and today's date. The second lists
`access.log` and `error.log` (and, from tomorrow, a dated copy of each).

The backups sit on the same server. Hostinger also keeps its own weekly backups of the whole
VPS (hPanel → **Backups and monitoring**); check they are switched on for your plan. The website
itself is always safe on GitHub.

---

## Step 13. Uptime alerts

1. Create a free account at uptimerobot.com.
2. **Add New Monitor** → **HTTP(s)** → `https://new.lindrize.online/` for now. On launch day,
   change it to `https://lindrize.online/`.
3. Alert contact: your email (and Telegram, if you like).

Worth adding a second monitor for `https://n8n-a6ew.srv1994370.hstgr.cloud/` while you are
there: you would hear at once if n8n went down.

**Check:** the monitor shows "Up".

---

## Looking after it

| Job | How often | How |
|---|---|---|
| Security fixes for the server | Automatic | Nothing to do. Restart the server from hPanel about once a month so fixes that need a restart take effect (n8n and the website start again by themselves). |
| HTTPS certificates | Automatic | Traefik renews them, for n8n and the website alike. |
| Website libraries | Monthly | GitHub proposes updates ("Dependabot"). If the checks are green, press Merge. |
| Server file or receiver changes | When I change them | `sudo /srv/lindrize/repo/server/services.sh update`, then `sudo /srv/lindrize/repo/server/install-host.sh` |
| Umami version | A few times a year | I change the version number in `server/docker-compose.yml`; you run the `update` command above. |
| See what the receiver did | When an email is missing | `sudo /srv/lindrize/repo/server/services.sh logs --tail 50 receiver` (it logs events, never addresses) |
| Go back one website version | When a publish went wrong | See "Undo" in `HOW-TO-EDIT.md` |
| n8n and Traefik | As before | Unchanged by this setup. Hostinger's tools for them work as they did. |
