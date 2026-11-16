# Decisions log

Changes the building model made on its own under the decision rule in `PLAN.md`. Each one is
non-critical: it makes the site safer, faster, more accessible or more honest, and stays inside
what `SPEC.md` asks for. Newest phase first.

## Phase 5 (16 November 2026)

Decided under the decision rule in `PLAN.md`. None of these changes what a visitor sees or
what data is collected.

### Security

| Decision | Why | Replaced |
|---|---|---|
| **The publishing key is locked to one small program** (`server/deploy-gate.sh`). It can upload a release folder, switch the site to it and list releases. Nothing else. | A key stored at GitHub should not be able to open a terminal on the server. If it leaked, the worst case is a changed website, which one undo fixes. | PLAN said "rsync over SSH" without limits. |
| **No automatic rebuild of the email receiver from GitHub.** `deploy-receiver.yml` is not created. Updates are one command typed on the server. | An automatic rebuild needs a key with full Docker rights, which is as powerful as the administrator. The receiver changes a few times a year. | PLAN section 2 listed `deploy-receiver.yml`. |
| **The receiver reads the published site's own list of choices** and re-reads it after each publish. | Without it, adding a feature in the editing screen would make the receiver refuse that feature until someone rebuilt it by hand. The file is validated; a broken one is ignored. | The list was fixed inside the receiver. |
| **The server's identity is pinned in a GitHub secret** (`DEPLOY_KNOWN_HOSTS`). | The publish refuses to talk to a machine pretending to be the server. | — |
| **Publishing is switched on by a repository variable** (`DEPLOY_ENABLED`). | The workflow can sit in the repository safely before the server exists. | — |
| **Umami trusts only the visitor address that Nginx passes on,** and its own update and usage reports are switched off. | A visitor could otherwise fake their address with a header. Umami then sends nothing to anyone. | — |
| **The database sits on a closed network** that only Umami can reach. Every service listens on the server itself only. | Docker ignores the firewall for published ports, so nothing is published to the outside at all. | — |
| **HSTS without `includeSubDomains` and without preload.** | Other subdomains you may use (for example for n8n) keep working whatever their setup. | — |
| **Only visits to `www.lindrize.online` are counted** (`data-domains`). | Test visits on the test address would otherwise inflate the numbers. | — |

### Going live

| Decision | Why | Replaced |
|---|---|---|
| **A test address, `new.lindrize.online`,** carries the new site before the domain move. It is hidden from search engines and forwards to the real address after launch. | The whole site, the email form and publishing can be tried on the real server while the old site stays live. Adding the record changes no existing record. | PLAN went straight to the move. |
| **The certificate for the real name is requested right after the DNS change,** accepting about two minutes of certificate warnings at a quiet hour. | The alternative (proving ownership through extra DNS records beforehand) is more steps in the one place where mistakes cost most. | — |
| **Brotli is optional.** Gzip is always on. | Ubuntu's Nginx needs an extra package for Brotli. The site meets its speed targets with gzip. | PLAN listed brotli and gzip. |
| **Receiver and Umami secrets are in two separate files.** | The receiver never sees the database password, and the other way round. | PLAN said one `.env`. |

### Editing screen and tests

| Decision | Why | Replaced |
|---|---|---|
| **`.pages.yml` is generated from the content files** (`npm run cms`) and checked on every change. | The editing screen saves only the fields it knows. Generating the list guarantees every field of every file is there. | Hand-written file. |
| **An optional field left blank counts as left out.** | The editing screen may save a blank optional field as an empty value, which would otherwise stop the build with a confusing message. | — |
| **The Nginx rules, the publish gate and the services file are tested on every change** (`server/test/`), by running the real files on spare ports. | Server rules are where a silent mistake does most harm. The first run caught two. | PLAN had no server tests. |
| **Umami 3.4.1** (released 23 October 2026) is pinned by exact version. | Follows the two-week rule. 3.5.0 exists; its release date could not be confirmed from here. | PLAN said "official image". |

## Phase 4 (16 November 2026)

| Decision | Why | Replaced |
|---|---|---|
| **The footer email link was made taller** (it was 22px, the standard asks for 24px). | Found by the new target-size check on all 82 pages. | — |
| **Every page is now tested, not one of each kind:** axe in light and dark, reading at 320px, control size, wider text spacing and focus behind the header. | PLAN asked for "every page". | Earlier phases tested page types. |
| **A colour contrast check runs with the other checks** and writes `docs/CONTRAST.md`. | A colour change can never quietly break contrast. | PLAN asked for a table. |
| **Chosen options get an outline in Windows high-contrast mode.** | That mode removes background colours, which was the only sign of a chosen segment. | — |
| **Outside links are checked on GitHub, weekly and on demand,** not inside the main checks. | This build machine cannot reach Calendly, Instagram or WhatsApp, and another company's outage should never block publishing. | PLAN: "a link check across the whole site". |
| **Lighthouse does not judge the SEO score of pages hidden from search engines.** | Privacy and Terms are hidden on purpose until they are written. | — |

## Phase 3 (15 November 2026)

### Security

| Decision | Why | Replaced |
|---|---|---|
| **The builder is plain HTML with a small script, not a Preact app.** Every choice is rendered at build time. | No extra library to trust or update, less code sent to phones, and it works under the strict security policy without exceptions. | PLAN 1 named Preact. |
| **The design is sent to the receiver as choice ids only,** and the receiver rebuilds the wording from its own list. | A visitor (or a script) cannot put their own text or links into emails sent from the owner's address. | PLAN said "checks input against the builder's own option IDs"; this goes one step further. |
| **The receiver is plain JavaScript with one dependency (nodemailer),** runs as an unprivileged user, and refuses to start without its settings. | Small surface, nothing to compile on the server. | PLAN showed TypeScript files. |
| **The Telegram alert does not contain the visitor's email address.** | Telegram is a third party. The address stays in the owner's inbox. | SPEC 6 did not say. |
| **Scripts caught by the trap field or the timer get a normal "sent" answer.** | They learn nothing about what stopped them. | — |
| **The email option stays hidden until a Turnstile site key is set** (`turnstileSiteKey` in `settings.json`, Phase 5). | Without the human check the form must not be usable. | — |
| **Cloudflare's script is the only outside script the policy allows,** and it loads only when the email box is used. | SPEC 13: nothing from another company until the visitor acts. | — |
| **The preview panel can be reached with Tab** when it scrolls on short screens. | Found by the accessibility scan. | — |

### Honesty and privacy

| Decision | Why | Replaced |
|---|---|---|
| **The estimate step, the salary question and the currency picker are all hidden** until the owner sets the three assumptions in `design.yaml`. The booking-value question was left out. | They exist only to feed the estimate. Asking for salary without showing a result would be friction for nothing, and booking value is not used by the agreed formula. | SPEC 4.1 listed them under step 5. |
| **"Working hours a month" is a third assumption the owner must set.** | The formula needs it to turn salary into a value for time, and it should not be guessed. | PLAN listed two assumptions in the text and three in the formula. |
| **The estimate is capped by the hours the chosen number of people actually work.** | Otherwise a large message count could "free" more time than exists. | — |
| **"Without an assistant" is offered for the Sales Assistant only.** | It is the one system with an obvious before and after. Inventing a "before" story for 29 other systems would be guesswork. | SPEC 4.2 described it generally. |
| **Chosen extras appear as a list under the example,** and the example replays when one is added. | The owner has not yet reviewed how each extra would change each story, so they are shown without invented steps. | SPEC 4.2: "with that feature visible in it". |
| **Structured data is left off pages hidden from search engines.** FAQ data is checked word for word against the visible page. | SPEC 12: the labels must always match the page. | — |
| **`llms.txt` and the sitemap are generated from the same content as the pages.** | They can never disagree with the site. | — |

### Structure

| Decision | Why | Replaced |
|---|---|---|
| **The sitemap, `robots.txt` and `llms.txt` are small files of our own** instead of a sitemap package. | No dependency, and full control of the language links. | PLAN named `@astrojs/sitemap`. |
| **A class (`no-js-only`) replaces `<noscript>`** for fallbacks. | It behaves the same in every browser and can be tested. | — |

## Phase 2 (15 November 2026)

### Honesty and rules of other services

| Decision | Why | Replaced |
|---|---|---|
| **Review & Referral asks every traveller for a review,** not only happy ones, and never offers a reward. | Google's review rules forbid asking only satisfied customers and forbid rewards. Asking "happy travellers" only could get an agency's reviews removed. Complaints still go to staff. | The system list said "Asks happy travellers for a Google review". |
| **Every system is labelled "On request" except the Sales Assistant ("Live demo").** A legend on the Solutions page explains the labels. | The owner has not yet said which systems can be delivered within two weeks. | — |
| **System pages describe what each system does and state what it never does,** using only what follows from the owner's one-line description. No numbers, timings or tool names were invented. Where a detail is the agency's choice, the page says "you decide in setup". | The site must not promise specifics for systems that are built to order. | — |
| **Follow-up and broadcast systems state that customers must have agreed to receive messages** and can stop them. | This is what WhatsApp and Meta require for business messages, and what the owner's description ("opted-in customers") says. | — |
| **Words like "chatbot", "شات بوت" and Arabic spellings of app names (واتساب، إنستغرام) appear only in page titles and descriptions** of Home and the Sales Assistant page. | These are the words owners type into Google (see `docs/KEYWORDS.md`). Page text keeps "assistant" and English app names, as decided in the interview. | — |
| **"Where is Lindrize based" says the systems are "built for" agencies in Jordan and the GCC,** not that Lindrize "works with" them. | There are no clients to point to yet. | Draft wording. |
| **The founding-client section shows the three discounts without "places left"** until the numbers are set in `settings.json`. | The number of places per tier is still an open question. | — |

### Structure and content

| Decision | Why | Replaced |
|---|---|---|
| **Each system page shows its example as lanes** (customer, the system, your team), one step per row. On phones it becomes one list. | It shows who does what, in order, and reads well without animation. Phase 3's "Design your agent" will play the same steps. | SPEC 2.3 said "the system's live board or a chat". |
| **Feature lists were drafted now but are not shown on system pages.** They appear in "Design your agent" (Phase 3). | SPEC 2.3 does not list features on the page, and they need the owner's review first. | — |
| **Privacy and Terms show their headings and a "being written" notice,** are hidden from search engines, and block the launch check until `ready: true`. | The owner writes both. The site cannot go live without them. | PLAN called this the launch gate. |
| **One file builds each page in both languages** (`src/pages/[...lang]/`). | Half the files, and the two languages cannot drift apart. | PLAN showed a separate `ar/` folder. |
| **Solutions filters accept a link** such as `/solutions/?industry=umrah`. | Each field on the Industries page can open the list already filtered. | — |
| **No search-volume numbers in `docs/KEYWORDS.md`.** | The keyword tool could not connect. Terms were chosen from live search results and should be revised from Search Console after launch. | SPEC 11: "researched". |

## Phase 1 (14–15 November 2026)

### Security

| Decision | Why | Replaced |
|---|---|---|
| **Calendly opens in a sandboxed frame inside our own dialog.** Calendly's script is never loaded into our pages. | A third-party script running inside the site can read and change everything on it. A frame cannot. The visitor sees the same pop-up calendar. | SPEC 5 and 13: "Calendly's script loads on click". |
| **A strict content security policy from day one,** generated by Astro with a hash for every script and style. No inline style attributes and no inline event handlers are used anywhere, and a check fails the build if one appears. | Blocks injected scripts. Building under the policy from the start means nothing has to be loosened later. | PLAN put the policy in Phase 5 only. The server still adds the headers a page cannot carry (HSTS, frame-ancestors) in Phase 5. |
| **Astro 7.4.7 instead of the newest version or the newest two-week-old one.** | 7.4.4 (the newest release older than two weeks) has two published security advisories, fixed in 7.4.7. 7.4.7 was 9 days old at install. `npm audit` reports 0 issues. | PLAN 1: "versions released at least 2 weeks earlier". This is the one exception, made for a security fix. |
| **`ignore-scripts=true` and exact versions in `site/.npmrc`.** | Packages cannot run install scripts on the build machine, a common route for supply-chain attacks. | Not specified. |
| **GitHub Actions pinned to exact commits, read-only permissions, and a separate dependency audit job.** | A moved tag can never run different code in the pipeline. | Not specified. |
| **Dependabot: one grouped update proposal a month, ignoring releases younger than 14 days.** TypeScript 7 and Playwright are excluded and updated by hand. | Keeps dependencies patched without daily noise, and keeps the two-week rule. The type checker does not support TypeScript 7 yet, and Playwright must move together with its override. | Not specified. |
| **The booking dialog only ever frames `https://calendly.com`,** and video ids are checked at build time and again in the browser. | Defence in depth: a wrong setting cannot make the site frame another address. | Not specified. |

### Privacy

| Decision | Why | Replaced |
|---|---|---|
| **The visitor's language is not saved on their device.** The page address (`/` or `/ar/`) carries it. | Less stored on the device, and no automatic redirects that could confuse search engines. | SPEC 14.2 listed "language" among things saved on the device. The Privacy Policy checklist should now say: light or dark mode and builder answers only. |

### Honesty

| Decision | Why | Replaced |
|---|---|---|
| **"400 m from the Haram" was left out of the Umrah example chat.** The assistant instead says a staff member will confirm the hotel's distance. | The distance is not in `content/demo/packages.csv`. Example chats must be built only from the demo data. It also shows the assistant passing on what it does not know. | `SPEC-INPUTS.md` chat 2. |
| **The family example travels on 21 January 2027.** | The demo data charges peak prices for the 24 December departure. January is the nearest date where 455 / 250 JOD is the correct price. Quoted total: 2 × 455 + 2 × 250 = 1,410 JOD. | `SPEC-INPUTS.md` chat 1 did not give a month. |
| **Trial wording does not say "before you commit" or "you decide after".** | Those are terms of the offer, which are agreed on the call. The site states only that there is a 10-day live trial with real customers. | Draft wording from the design sample. |
| **Four of the five systems on Home are labelled "On request".** | The owner has not yet said which systems can be delivered within two weeks (open question 1). | — |
| **The founder's name stays in Latin letters on Arabic pages.** | The Arabic spelling of "El-shair" has not been confirmed, and guessing a person's name is not acceptable. | — |
| **Feedback entries must carry `consent: true`** or the build stops. | Makes "only real clients who agreed to be quoted" a rule the software enforces. | Not specified. |

### Accessibility

| Decision | Why | Replaced |
|---|---|---|
| **Unlit words in the scrolling statement use a readable grey,** not a very faint one. | Every word must meet the contrast standard at every moment. | The design sample's faint grey failed contrast. |
| **Steps that are not active in the scroll story keep readable text** and are marked by a thin line instead of fading out. | Same reason. | The design sample faded inactive steps to 35%. |
| **The scroll story is pinned only on wide and tall screens.** Phones, short laptop screens, reduced motion and no-script visitors get the finished example. | The pinned version needs room. Everyone else still gets all the content. | — |
| **The phone booking bar is a labelled region and hides while the menu is open.** | Found by the accessibility scan. | — |

### Speed and layout

| Decision | Why | Replaced |
|---|---|---|
| **Fonts come from installed packages through Astro's font system,** limited to Latin and Arabic letters and five files (Sans 400/500, Serif 400, Arabic 400/500), with matched fallback fonts. | Self-hosted, small, and text does not jump when a font arrives. | PLAN named `@fontsource` CSS imports. |
| **Styles travel inside each page** instead of as a separate file. | One request less before anything shows (about 0.1 s faster on a phone). The pages stay under 20 KB compressed. | PLAN did not say. |
| **The Lighthouse check discards a warm-up run and, if a run misses a target, judges the middle of three.** | Timing on GitHub's shared machines varies from run to run. Accessibility, best-practice and SEO scores are not affected. | — |
| **The two hero buttons are always stacked on phones.** | A font arriving could re-wrap them and push the page down (measured layout shift 0.099 on Arabic phones, now 0). | — |
| **The phone booking bar appears only after the page's own booking button scrolls away.** | Avoids two identical buttons on the first screen. | SPEC 5 did not say when it appears. |

### Structure

| Decision | Why | Replaced |
|---|---|---|
| **Pages written in later phases exist now as short "being written" notices,** hidden from search engines. `check-content.mjs --launch` fails while any remain. | Menu and footer links work in previews, and the site cannot go live with an unfinished page. | PLAN had a launch gate for Privacy and Terms only. |
| **Content schemas live in `site/src/content.config.ts`, styles in one `global.css`, tests in `site/tests/`.** | Astro 7's layout, and one install covers the site and its tests. | PLAN section 2 file paths. |
| **Tests and the Lighthouse check use a small server of our own** (`site/scripts/serve.mjs`) with compression, caching and the 404 page. | Astro 7's preview server moves itself to the background, which test tools cannot manage. This is also closer to the real server. | PLAN named `astro preview`. |
| **`playwright-core` is held at one version (1.63.0)** through an override. | The accessibility library otherwise pulled in a newer copy, which broke type checks and skipped the two-week rule. | — |
| **`/book` is an Astro redirect page for now.** The server turns it into a real redirect in Phase 5. | Works in previews today. | — |
