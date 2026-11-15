# Lindrize website: build plan

- Based on: `SPEC.md` (approved 14 November 2026). If this plan and the spec disagree, the spec wins.
- Builder: Claude Code. The owner plans to run the build on Fable.
- **How to use this file:** each phase lists what gets built, what the owner provides, the checks that must pass, and how to preview the result. A phase is done only when every check passes and the owner has seen the result.

---

## Decision rule for the build (set by the owner, 14 November 2026)

The building model may change **non-critical** decisions on its own when that makes the site better, safer or more complete. This applies especially to code, research, design details and security. It must still think each change through and record it in `docs/DECISIONS.md`: what changed, why, and what it replaced.

**Non-critical: decide and record.**
- code structure, libraries and versions
- making security stricter
- performance work
- accessibility fixes
- design refinements that stay inside direction B
- wording polish that keeps the meaning
- adding something the spec missed that clearly serves its goals

**Critical: ask the owner first.**
- the main goal or call to action
- the offer, prices or anything shown about pricing
- any claim shown to visitors
- the honesty rules
- what personal data is collected, or where it goes
- anything that costs money
- anything touching the live server, DNS or email
- publishing to the live domain
- deleting anything the owner made
- making security weaker

## Contents

1. Technology choices
2. File structure
3. Content model
4. Components
5. Phase 0: Save the project on GitHub
6. Phase 1: Design system, layout, header, footer, Home
7. Phase 2: Other pages and all content
8. Phase 3: Builder, email receiver, SEO and AI files
9. Phase 4: Accessibility and speed pass
10. Phase 5: Server, publishing, Umami, domain move, launch
11. What the owner provides, by phase
12. Quality checks
13. How to preview
14. Risks and how they're handled
15. Documents this plan produces

---

## 1. Technology choices

| Need | Choice | Why |
|---|---|---|
| Site builder | **Astro** (current stable version, pinned in `package.json`) | Produces static pages with almost no JavaScript, which makes them fast and hard to attack. |
| Interactive parts | Small **TypeScript** scripts. The builder uses **Preact** (about 4 KB). | JavaScript loads only on the parts that move. |
| Languages | Astro's built-in language routing: English at `/`, Arabic at `/ar/` | Clean addresses, and `hreflang` comes easily. |
| Styling | Plain CSS with design tokens and logical properties (they flip automatically for right to left) | No framework to fight, and Arabic layout comes for free. |
| Fonts | `@fontsource` packages for IBM Plex Sans, Serif and Sans Arabic, self-hosted and split into subsets | Fast, and no requests to Google. |
| Images | Astro image tools (`sharp`) produce AVIF/WebP in several sizes | The owner just drops a photo in a folder. |
| Content | Astro **content collections** with schemas (Zod) | A wrong or missing field stops the build with a clear message. |
| Editing screen | **Pages CMS** (`.pages.yml`) | Forms for the owner, and saving goes through GitHub. |
| Sitemap | `@astrojs/sitemap` with language links | Standard and reliable. |
| Email receiver | Node.js (LTS) service using `nodemailer`, in a Docker container | Small, and isolated from everything else. |
| Visitor counting | **Umami** (official Docker image) plus PostgreSQL | Cookie-free and stays on the owner's own server. |
| Web server | **Nginx** on the VPS, with **Let's Encrypt** (certbot) | Fast, with security headers and free HTTPS. |
| Publishing | **GitHub Actions** → `rsync` over SSH → swap a release folder in one step | Saves publish automatically, and undo is one click. |
| Tests | Playwright with axe-core, Lighthouse CI, a link checker, `astro check`, content validation | These are the phase checks in section 12. |

The exact version numbers are chosen and pinned at the start of Phase 1, using versions released at least 2 weeks earlier.

---

## 2. File structure

```
lindrize-website/
├─ SPEC.md, PLAN.md, SPEC-INPUTS.md
├─ HOW-TO-EDIT.md                 (Phase 5)
├─ docs/
│  ├─ KEYWORDS.md                 (Phase 2: search terms per page)
│  ├─ PRIVACY-TERMS-CHECKLIST.md  (Phase 2: for the owner to write from)
│  ├─ SERVER-SETUP.md             (Phase 5)
│  ├─ DNS-MOVE.md                 (Phase 5)
│  ├─ SEO-SETUP.md                (Phase 5: Search Console, Bing, Google Business Profile)
│  └─ LAUNCH-CHECKLIST.md         (Phase 5)
├─ brand/                         (as supplied; source files)
├─ content/demo/                  (packages.csv, faq.csv: source data)
├─ .pages.yml                     (Pages CMS: which fields the owner can edit)
├─ .github/workflows/
│  ├─ check.yml                   (runs every check on every change)
│  ├─ deploy-site.yml             (publishes the site after checks pass)
│  └─ deploy-receiver.yml         (rebuilds the receiver when /receiver changes)
├─ site/
│  ├─ astro.config.mjs
│  ├─ package.json
│  ├─ public/
│  │  ├─ favicon.svg, favicon-32.png, favicon-48.png, apple-touch-icon.png
│  │  ├─ icon-192.png, icon-512.png, site.webmanifest
│  │  ├─ og-image.png
│  │  └─ robots.txt               (generated)
│  └─ src/
│     ├─ content/
│     │  ├─ config.ts             (schemas for every collection)
│     │  ├─ systems/              (30 files, one per system, English and Arabic fields)
│     │  ├─ faqs/                 (FAQ items, with where each appears)
│     │  ├─ industries/           (8 files)
│     │  ├─ feedback/             (empty at launch; adding a file shows the section)
│     │  ├─ chats/                (the 4 demo chats, built from content/demo)
│     │  └─ pages/                (page text per page, en + ar)
│     ├─ data/
│     │  ├─ settings.json         (Calendly, WhatsApp, email, video link, founding places)
│     │  ├─ builder.json          (business types, sizes, problems, ranges, currencies, assumptions)
│     │  └─ ui.en.json, ui.ar.json (small interface words: buttons, labels)
│     ├─ styles/
│     │  ├─ tokens.css            (colours, fonts, spacing, motion timings: light + dark)
│     │  ├─ base.css              (reset, type scale, focus, reduced motion)
│     │  └─ utilities.css
│     ├─ layouts/
│     │  └─ BaseLayout.astro      (html lang/dir, head tags, header, footer, sticky bar)
│     ├─ components/              (see section 4)
│     ├─ scripts/                 (motion, theme, calendly, whatsapp, analytics helpers)
│     ├─ lib/                     (i18n helpers, JSON-LD builders, estimate maths)
│     ├─ images/feedback/         (owner drops client photos here later)
│     └─ pages/
│        ├─ index.astro, solutions/…, industries.astro, pricing.astro,
│        │  design-your-agent.astro, faq.astro, about.astro, contact.astro,
│        │  privacy.astro, terms.astro, 404.astro, llms.txt.ts
│        └─ ar/ (same pages, Arabic)
├─ receiver/                      (email receiver service)
│  ├─ src/server.ts, src/validate.ts, src/compose.ts, src/turnstile.ts, src/telegram.ts
│  ├─ test/
│  ├─ Dockerfile
│  └─ .env.example                (names of the secrets only, never values)
├─ server/                        (copied to the VPS by hand, following SERVER-SETUP.md)
│  ├─ nginx/lindrize.conf         (site, redirects, /book, /api, /u, security headers, CSP)
│  ├─ nginx/stats.conf            (Umami dashboard)
│  ├─ docker-compose.yml          (receiver + umami + postgres)
│  ├─ backup-umami.sh
│  └─ rollback.sh                 (go back one release from the server, as a backup to GitHub re-run)
└─ tests/
   ├─ a11y.spec.ts                (axe on every page, EN + AR, light + dark)
   ├─ keyboard.spec.ts            (tab order, builder by keyboard, focus visible)
   ├─ rtl.spec.ts                 (Arabic layout screenshots)
   ├─ builder.spec.ts             (steps, rules, clear-answers, Calendly/WhatsApp text)
   └─ lighthouserc.json           (score and size budgets)
```

---

## 3. Content model

Every collection has a schema. The build fails, naming the file and the field, if:
- a required field is missing
- an Arabic field is empty
- a system mentions a related system or feature that doesn't exist

**System file** (`systems/quote-follow-up.yaml`, for example):
```yaml
id: 2
slug: quote-follow-up
group: win-bookings            # win-bookings | look-after | run-office
status: on-request             # live-demo | available | on-request
name: { en: "Quote Follow-up", ar: "متابعة عروض الأسعار" }
summary: { en: "...", ar: "..." }
never: { en: "...", ar: "..." }      # what it never does
problems: [went-quiet]               # ids from builder.json
industries: [travel, umrah, venues]
features:                            # this system's own extra features for the builder
  - id: next-morning
    name: { en: "...", ar: "..." }
    storyEffect: next-morning-message
story:                               # board steps, always shown as "Example"
  - { pane: customer, en: "...", ar: "...", mood: neutral }
faqs: [faq-2-1, faq-2-2, faq-2-3]
related: [1, 3, 16]
seo: { titleEn: "...", titleAr: "...", descEn: "...", descAr: "...", keyword: "..." }
```

**builder.json** holds:
- business types and sizes
- the problems, each with the system it suggests
- the ranges (messages per day, staff, salary, booking value, after-hours share)
- currencies, with fixed rounded rates and USD as the default
- the assumptions: `routineShare`, `minutesPerReply` and `workHoursPerMonth`. **All start empty, and the estimate step stays hidden until they're filled in.**

**Estimate maths** (in `lib/estimate.ts`, with tests):

- Routine hours per week = messages per day × 7 × routine share × minutes per reply ÷ 60
- Cost freed per month = routine hours per month × (monthly salary ÷ work hours per month)
- The low and high ends of each range give the result as a range.
- "How we worked this out" shows this formula and the owner's numbers.

**settings.json** holds:
- the Calendly link
- WhatsApp number
- public email
- YouTube video ID (empty means the video section is hidden)
- founding places left per tier
- the Turnstile site key (public, so it's safe here)
- the Umami website ID

---

## 4. Components

**Layout and shared**
- `BaseLayout`: sets the language and direction (`lang` and `dir`) and the head tags (title, description, canonical, hreflang, Open Graph, JSON-LD). It also adds the skip link, header, footer and sticky bar.
- `Header`:
  - logo, which switches between the light and dark versions
  - menu
  - `LangSwitch`, which goes to the same page in the other language
  - `ThemeToggle`
  - WhatsApp icon
  - `BookButton`
- `Footer`: contact details, the legal line, Privacy and Terms links, and the accessibility sentence.
- `MobileStickyBar`: Book a call plus WhatsApp. It hides in the builder, while Calendly is open, and when the footer is in view.
- `Button`: main (teal) and secondary, with the arrow nudge.
- `BookButton`: loads Calendly's pop-up script on the first click and can pass in the design summary.
- `WhatsAppLink`: builds the pre-typed message from the page.
- `JsonLd`: the structured-data builders in `lib/`.
- `PageLoadBar`: the thin bar for slow pages, plus the connection-lost message.

**Home**
- `Hero`
- `ChatDemo`: plays once, with space reserved so nothing jumps, and Replay.
- `StoryScroll`: the sticky product screen with 3 steps. On phones the steps stack instead.
- `TryItYourself`
- `Statement`: lights up word by word.
- `SystemsTable`
- `WorkingWithUs`: the line that fills as you scroll.
- `FeedbackSection`: hidden when empty.
- `FaqList`: answers always visible.
- `FinalCta`
- `VideoSlot`: a click-to-play preview image, hidden while there's no video link.

**Other pages**
- `SolutionsFinder`: search and filters. It works without JavaScript too, as a plain list.
- `SystemPage` template, `IndustrySection`, `PricingExplainer`, `FoundingPlaces`, `AtAGlance`, `LegalPage`.

**Builder (Preact)**
- `BuilderApp`: holds the steps and the state, and saves to the visitor's device.
- `StepBusiness`, `StepProblem`, `StepSystem`, `StepFeatures`, `StepRanges` (with `CurrencyPicker`), `StepEstimate`, `StepBook`.
- `LiveBoard`: three panes, Play/Pause/Replay, replays when a feature changes, and a text version for screen readers.
- `MoodStrip`.
- `EmailDesignForm`: the trap field, the timer, Turnstile loaded on focus, and errors read aloud.
- `ClearAnswers`.

**Motion helpers** (`scripts/motion.ts`)
- Reveal on scroll, line draw and word light-up, all used only when supported and when "reduce motion" is off.
- Content is always visible without scripts.

---

## 5. Phase 0: Save the project on GitHub (before Phase 1)

This cloud session is temporary, so the files must live on GitHub before real work starts.

**Owner:**
1. Create a GitHub account if needed.
2. Create a private repository named `lindrize-website`.
3. Send the link.

**Claude:**
1. Connect the repository to this session.
2. Commit `SPEC.md`, `PLAN.md`, `SPEC-INPUTS.md`, `brand/`, `content/demo/` and the design samples.
3. Push them.

**Done when:** the files are visible in the owner's GitHub.

---

## 6. Phase 1: Design system, layout, header, footer, Home

**Build:**
1. Set up the Astro project in `site/`, with pinned versions, TypeScript in strict mode, and `npm run check`.
2. `tokens.css` with the exact colours, fonts, spacing scale and motion timings from SPEC 7 and 8, in light and dark mode.
3. Fonts self-hosted and split into subsets, with the main weights loaded first.
4. Favicons, web manifest and share image copied from `brand/`.
5. `BaseLayout`, `Header`, `Footer`, `MobileStickyBar`, `ThemeToggle`, `LangSwitch`, `Button`, `BookButton`, `WhatsAppLink`, `PageLoadBar`.
6. The Home page in English and Arabic, with every section from SPEC 2.2:
   - the 4 demo chats (from `content/demo`), each labelled "Live demo with Darb Al-Yasmeen, a fictional agency"
   - all motion from SPEC 8, with "reduce motion" respected
   - the feedback and video sections built but hidden, because they're empty
7. The 404 page in both languages.
8. A first version of `check.yml` on GitHub: build, `astro check`, content validation.

**Owner provides:** nothing new. The brand kit and demo data are already in.

**Owner reviews:**
- the Home page in English and Arabic
- the Arabic proofread for Home only, about 20 minutes

**Checks:** all of section 12 that applies to Home.

**Status:** done on 15 November 2026. Results and the owner's review list are in `docs/PHASE-1-REVIEW.md`. Decisions made along the way are in `docs/DECISIONS.md`.

---

## 7. Phase 2: Other pages and all content

**Build:**
1. Research the search terms and write `docs/KEYWORDS.md`: one main search per page, in English and Arabic.
2. Draft the content files for all 30 systems, in both languages. Each has its own feature list and board story, and its readiness label stays "On request" until the owner answers open question 1.
3. Pages:
   - Solutions (search and filters)
   - system page template ×30
   - Industries
   - How pricing works, with founding places
   - FAQ: about 20 questions, plus 3 per system and the 6 on Home
   - About ("at a glance")
   - Contact
   - Privacy and Terms page skeletons
4. Write `docs/PRIVACY-TERMS-CHECKLIST.md` with the headings and checklist from SPEC 14.3 and 14.4.
5. Add a **launch gate**: if the Privacy or Terms text is still a placeholder, the site can be previewed but can't be published.

**Owner provides:**
- open questions 1 to 5 from SPEC section 20: systems ready, voice notes, founding places, About details, FAQ questions from calls
- open question 6, the footer tagline (the default is no)

**Owner reviews:**
- all page text
- the Arabic proofread, about 1–2 hours
- a quick look at the 30 system drafts

**Checks:** section 12 on every page.

**Status:** done on 15 November 2026. Results and the owner's review list are in `docs/PHASE-2-REVIEW.md`.

---

## 8. Phase 3: Builder, email receiver, SEO and AI files

**Build:**
1. The **builder** (`/design-your-agent/`, both languages):
   - all 7 steps from SPEC 4.1
   - the rule-based system suggestion
   - each system's own features
   - ranges picked from options, with the currency picker
   - the estimate step, which shows **only** once the assumptions are filled in
   - Calendly pre-fill
   - the WhatsApp summary
   - "Clear my answers"
   - answers saved on the visitor's device
2. The **live board:** three panes, Play/Pause/Replay, replay when a feature changes, the mood strip, the "Without an assistant" comparison, and the text version for screen readers.
3. The **email receiver** (`receiver/`):
   - checks input against the builder's own option IDs
   - rebuilds the summary on the server
   - sends the owner's email, the visitor's fixed-wording copy and the Telegram alert
   - verifies Turnstile on the server
   - a rate limit
   - clear error messages
   - automated tests that stub out the outside services

   Real keys are added in Phase 5.
4. **Umami events** are wired in. They do nothing until Umami is live.
5. **SEO and AI files:**
   - `sitemap.xml` with language links
   - `robots.txt` allowing all crawlers including AI ones, with `/api/` blocked
   - `llms.txt`, generated from the content
   - JSON-LD on every page: Organization/ProfessionalService, Service, FAQPage, BreadcrumbList, WebSite
   - titles, descriptions, canonical addresses and Open Graph on every page

**Owner provides:**
- open question 7, the estimate assumptions (the estimate stays hidden until then)
- open question 8, confirming the currency rates I propose
- open question 9, reviewing the feature lists and stories
- the Calendly question added to the 15-minute event

**Checks:**
- section 12
- builder tests: every step, every rule, keyboard-only use, "Clear my answers", and the Calendly and WhatsApp text
- receiver tests: good input, bad input, the trap field, the too-fast timer, a Turnstile failure, the rate limit

---

## 9. Phase 4: Accessibility and speed pass

**Build:**
1. Run axe on every page, in both languages and both colour modes. Fix everything rated serious or critical.
2. A keyboard-only walkthrough of every page and the full builder, written down as a checklist.
3. A contrast table for every colour pair actually used. Every pair must pass AA.
4. Check "reduce motion" on every animated part.
5. Lighthouse CI on mobile for every page type, with budgets: 95+ on all four scores, LCP under 2.5 s, CLS under 0.1, about 300 KB per page without fonts.
6. Arabic right-to-left screenshots of every page, reviewed one by one.
7. A link check across the whole site.
8. Validate `sitemap.xml`, `robots.txt` and `llms.txt`. Validate the structured data with the Schema.org validator.

**Owner provides:** nothing.

**Owner reviews:** the results report.

---

## 10. Phase 5: Server, publishing, Umami, domain move, launch

Before any change to the server or DNS, the plan for that step is written out and shown to the owner first.

**Build and guide:**
1. **`docs/SERVER-SETUP.md`:**
   - create a deploy user
   - SSH key login only
   - the UFW firewall
   - fail2ban
   - automatic security updates
   - Docker installed
   - Nginx and certbot

   Each step ends with a check command and the result to expect.
2. **Nginx config:**
   - the site
   - redirects: `lindrize.online` → `www`, and `/book` → Calendly
   - `/api/design` → the receiver
   - `/u/` → the Umami tracker
   - `stats.lindrize.online` → the Umami dashboard
   - security headers and a strict CSP: the site's own files, plus Calendly, YouTube's privacy mode and Turnstile
   - brotli and gzip
   - caching
3. **`docker-compose.yml`:** the receiver, Umami and PostgreSQL.
   - Secrets come only from `.env` on the server.
   - The containers listen only inside the server; Nginx is the only way in from outside.
4. **Backups:** a nightly Umami database backup, keeping 14 days.
5. **Publishing:**
   - GitHub Actions run the checks, then upload a release folder and switch to it in one step.
   - The last 5 versions are kept.
   - Undo is a re-run of an older version. `rollback.sh` on the server is the backup method.
6. **`docs/DNS-MOVE.md`:**
   - a table of every current record, filled from the owner's export, with the email records marked **do not touch**
   - lower the TTL a day before
   - change only `@`, `www` and the new `stats` record
   - check the site, and send and receive a test email
   - keep Vercel live for 2 weeks, then remove it
7. **Pages CMS** connected, and `HOW-TO-EDIT.md` written.
8. **`docs/SEO-SETUP.md`:** Google Search Console, Bing Webmaster Tools and the Google Business Profile, done together when the owner is ready.
9. **UptimeRobot** set up.
10. **`docs/LAUNCH-CHECKLIST.md`:**
    - Privacy and Terms written
    - Arabic proofread
    - no visible placeholders
    - test email received
    - Calendly pre-fill works
    - Telegram alert arrives
    - Umami counting
    - all checks green

**Owner provides:**
- open questions 10 to 12: VPS plan, where the domain is managed, and the main address used in cold emails
- the DNS export
- SSH access, set up by following the guide
- accounts and keys, entered into `.env` on the server, never in chat:
  - Cloudflare Turnstile
  - the Telegram bot token and chat ID
  - the Google Workspace email-sending password
  - the Umami admin password
- the written Privacy Policy and Terms

---

## 11. What the owner provides, by phase

| Phase | Owner provides | Owner time (rough) |
|---|---|---|
| 0 | A private GitHub repository | 10 min |
| 1 | Review Home, proofread Home Arabic | 30–45 min |
| 2 | Systems ready, voice notes, founding places, About details, FAQ questions; review all text; Arabic proofread | 3–4 h |
| 3 | Estimate assumptions, currency rates OK, review of feature lists and stories, the Calendly question | 1–2 h |
| 4 | Read the results report | 15 min |
| 5 | VPS details, DNS export, server setup steps, accounts and keys, Privacy and Terms text | 4–6 h, spread out |

---

## 12. Quality checks

These run automatically on every change from Phase 1 onward. A phase can't be called done unless all of them pass.

| Check | Tool | Pass rule |
|---|---|---|
| Build | `astro build`, `astro check` | No errors |
| Content | Schemas + custom rules | Every required field present, Arabic present, no broken references |
| Accessibility | Playwright + axe-core, EN + AR, light + dark | Zero serious or critical issues |
| Keyboard | Playwright script + manual checklist | Every control reachable and usable, focus always visible |
| Speed | Lighthouse CI (mobile) | 95+ on all four scores, LCP < 2.5 s, CLS < 0.1, size budget met |
| Links | Link checker | No broken internal or external links |
| SEO and AI files | Validators + custom tests | `sitemap.xml`, `robots.txt` and `llms.txt` valid; every page has a title, description, canonical address and hreflang |
| Structured data | JSON-LD tests + Schema.org validator before launch | Valid; no ratings or reviews; matches what's visible on the page |
| Right to left | Playwright screenshots of every Arabic page | Reviewed; nothing mirrored wrongly, nothing overflowing |
| Builder and receiver | Unit and end-to-end tests | All pass |
| Honesty | Search for placeholders and banned words | No visible placeholder text; "never say" words only where SPEC 9 allows them |

---

## 13. How to preview

- **During the build:** after each phase, Claude starts the site in this session and shares a live preview link. Claude also sends screenshots of key pages in English and Arabic, on laptop and phone widths.
- **On the owner's own computer (optional):** install Node.js LTS, open the project folder in a terminal, then:
  ```bash
  cd site
  ```
  ```bash
  npm install
  ```
  ```bash
  npm run dev
  ```
  Then open http://localhost:4321 in a browser. The Arabic pages are at http://localhost:4321/ar/.
- **After Phase 5:** every saved change goes live at www.lindrize.online within about 2 minutes.

---

## 14. Risks and how they're handled

| Risk | How it's handled |
|---|---|
| Work lost when this cloud session ends | Phase 0 puts everything on GitHub first, and every phase is pushed. |
| Email breaks during the domain move | Only the website records change. Email records are listed and locked first, and the email is tested right after. |
| The email box gets used for spam | Fixed-wording emails rebuilt on the server, the trap field, the timer, Turnstile and rate limits. |
| Secrets leak | They live only in `.env` on the server. `.env` is excluded from Git, and checks fail if a key-like string is committed. |
| Invented numbers slip in | The estimate is hidden without the owner's assumptions, there's the honesty check, and there are no ratings in the structured data. |
| Arabic quality | Written as Arabic from the start (not translated word for word), proofread by the owner, with right-to-left screenshot review. |
| The site gets slow over time | Lighthouse budgets run on every change and block publishing if broken. |
| An edit breaks the site | The automatic checks block publishing, and undo is one click. |
| The VPS is short on memory | Checked in Phase 5 before installing. Umami and the receiver are light, and n8n's usage is checked first. |

---

## 15. Documents this plan produces

| File | Phase | Purpose |
|---|---|---|
| `docs/KEYWORDS.md` | 2 | Search terms per page |
| `docs/PRIVACY-TERMS-CHECKLIST.md` | 2 | Headings and checklist for the owner's legal text |
| `docs/SERVER-SETUP.md` | 5 | Server hardening, step by step |
| `docs/DNS-MOVE.md` | 5 | Domain move without breaking email |
| `docs/SEO-SETUP.md` | 5 | Search Console, Bing, Google Business Profile |
| `docs/LAUNCH-CHECKLIST.md` | 5 | Everything confirmed before going live |
| `HOW-TO-EDIT.md` | 5 | One-page guide for editing content |
