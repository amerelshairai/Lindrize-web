# How to edit the website

Three ways to change something, from easiest to most flexible. In every case the change is
checked automatically, and only a change that passes is published. A mistake cannot break the
live site: the checks stop it first.

**What happens after you save:** GitHub runs the checks (about 6 minutes), then publishes
(about 2 minutes). Watch it under the repository's **Actions** tab: a green tick on "Check",
then on "Publish".

---

## 1. The editing screen (Pages CMS)

A set of forms for all the text and settings. No code.

### Connect it once

1. Open https://app.pagescms.org and choose **Sign in with GitHub**.
2. When GitHub asks which repositories it may use, choose **Only select repositories** →
   `Lindrize-web`.
3. Open `Lindrize-web`, branch `main`.

Pages CMS is an outside service made by an independent developer. It can read and write this
one repository and nothing else. It never sees the server, your email or any secret, because
none of those are in the repository.

**Not yet tested with your account.** I could not open Pages CMS from my side. The first
time, please make one small edit (for example a word on the About page), save, and confirm
the Check and Publish runs go green. If a form looks wrong or a save is refused, send me a
screenshot and I adjust the form description (`.pages.yml`).

### What is where

| Menu entry | What you change there |
|---|---|
| Settings | Calendly link, WhatsApp number, email, YouTube video, founding-client places, the Turnstile and Umami ids |
| Page: Home … Page: Contact | The wording of each page, English and Arabic side by side |
| Page: Privacy Policy, Page: Terms | The legal text, and the `ready` switch |
| Systems (30) | Each system: name, summary, steps, features, its three questions, status |
| FAQ questions | Each question and answer, its group, and whether it shows on Home |
| Industries (list) | The eight fields and which systems fit them |
| Demo chats | The four example chats |
| Client feedback | Real client quotes. Empty until you have one |
| Interface words | Small words on buttons and menus |

### Rules the checks enforce

- Every text needs **both** English and Arabic. An empty one stops the publish.
- Some words are never shown to visitors (the "never say" list in `SPEC.md` section 9, such
  as "chatbot"). Using one stops the publish and the message names the page.
- Feedback needs the **consent** switch on: only real clients who agreed to be quoted.
- Do not change an existing `id`. Ids connect choices in "Design your agent" to the emails.

### Common jobs

| Job | Where |
|---|---|
| Add the YouTube video | Settings → Video id (the part of the link after `v=`) |
| Mark a system as available | Systems → the system → Status → `available` |
| Add a client quote | Client feedback → Add an entry |
| Update places left | Settings → Founding places (leave empty to hide the numbers) |
| Publish the Privacy Policy | Page: Privacy Policy → fill each section's Body in both languages → switch Ready on |
| Show the savings estimate | Page: Design your agent → Assumptions (all three numbers) |

---

## 2. Editing a file on GitHub

For a quick fix without the editing screen.

1. On GitHub, open the file (for example `site/src/content/pages/about.yaml`).
2. Press the pencil icon, change the text between the quotes, keep the quotes.
3. Press **Commit changes**.

Where the files are:

| Content | Folder |
|---|---|
| Page wording | `site/src/content/pages/` |
| Systems | `site/src/content/systems/` |
| FAQ | `site/src/content/faqs/` |
| Settings | `site/src/data/settings.json` |

## 3. Asking Claude

For anything that is not text: layout, a new page, a new feature. Open a session on this
repository and describe what you want. `SPEC.md` and `docs/DECISIONS.md` tell a new session
everything that was agreed.

---

## If the checks fail

Nothing is published and the live site stays as it was.

1. GitHub → **Actions** → the run with the red cross → open the failed step.
2. The last lines say what is wrong and where, in plain words, for example
   `faqs/price-range: Arabic text is missing`.
3. Fix that field and save again.

## Undo

**Undo a text change:** GitHub → the file → **History** → find the version before your
change → the `…` menu → view the file → copy the old text back and commit. Or simply edit it
again.

**Go back to an earlier version of the whole site (the usual way):**

1. GitHub → **Commits** (the clock icon on the repository's front page). Find the last
   version that was good and copy its id (the short code on the right).
2. GitHub → **Actions → Publish → Run workflow**. Paste the id into "version" and run.
3. In about three minutes the site shows that version.

The next saved change publishes the newest content again, so fix the problem before you edit
further, or ask me to revert the bad change.

**The backup way, from the server (instant):**

```bash
sudo -u deploy /srv/lindrize/repo/server/rollback.sh
```

It switches to the previous of the five versions kept on the server.

## What you cannot change from the editing screen

Prices and offers follow `SPEC.md`. The design, the menu, the "never say" list and the
checks are in code. Ask in a Claude session.
