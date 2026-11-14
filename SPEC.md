# Lindrize website: specification

Status: **approved by the owner on 14 November 2026.** The build follows `PLAN.md`.

- Owner: Amer El-shair, founder of Lindrize, Amman, Jordan
- Domain: www.lindrize.online
- Written: 13 November 2026, from the 14-round interview plus `SPEC-INPUTS.md`
- Where the interview and `SPEC-INPUTS.md` disagree, the interview wins. The clashes and how they were settled are listed in section 17.

---

## Contents

1. Goal and audience
2. Pages and content
3. The 30 systems and the industries
4. Design your agent (the builder)
5. Ways to get in touch
6. Data, the email box and logins
7. Visual design
8. Motion
9. Ease of use for non-technical visitors
10. Accessibility
11. SEO (Google)
12. Being found by AI assistants
13. Speed and media
14. Legal, privacy and visitor counting
15. Hosting, security, publishing and the domain move
16. Editing the site later
17. Clashes with SPEC-INPUTS.md
18. Build phases and checks
19. Tasks the owner does by hand
20. Open questions
21. Reference files

---

## 1. Goal and audience

- **Main goal:** book the 15-minute Google Meet call on Calendly:
  https://calendly.com/amerelshair-ai-lindrize/15-minute-call-with-lindrize
  The site also offers the short link **www.lindrize.online/book**, which forwards to it.
- **Backup actions,** in order: WhatsApp → try the live Instagram demo → watch the 2-minute video.
- **Audience:** travel agency and tour operator **owners and managers**, who decide and pay. One short section speaks to staff ("what your team gets").
- **Markets:** Jordan and the GCC, treated equally.
- **Success measures:** Calendly bookings per month and WhatsApp chats started from the site. **Target: 4 booked calls a month** within 3 months.
- **What the old site got wrong, and how the new one fixes it:**

  | Old site | New site |
  |---|---|
  | Hard to change or add to | Text lives in simple content files with an editing screen (section 16) |
  | No way to collect feedback | Client feedback section, ready for real quotes |
  | Looked AI-made | Original design, direction B |
  | Couldn't connect to data | The builder's answers reach the owner by Calendly, WhatsApp and email. Anonymous counts go to Umami. |
  | No Arabic | Full Arabic, right to left |
  | No SEO | Full SEO and AI-search setup |
  | Slow | Static pages, no outside scripts until the visitor clicks |

- **Old-site ideas kept:**
  - one clear goal
  - the order problem → solution → process → proof → book
  - a 4-step process
  - honest founding-client urgency
  - an honest testimonials placeholder
  - a sticky mobile button
  - form spam protection
- **Old-site things dropped:**
  - the e-commerce message
  - jargon
  - the old /30min Calendly link
  - builder scripts
  - unused components
  - the mailto: form
  - the old fonts and colours

  No code from the old site is reused.

---

## 2. Pages and content

### 2.1 Page list

Every page exists in English and Arabic. English pages sit at the root; Arabic pages sit under `/ar/`, using the same English words in the address.

| Page | English address | Arabic address |
|---|---|---|
| Home | `/` | `/ar/` |
| Solutions (all 30 systems) | `/solutions/` | `/ar/solutions/` |
| One page per system (30) | `/solutions/<slug>/` | `/ar/solutions/<slug>/` |
| Industries | `/industries/` | `/ar/industries/` |
| How pricing works | `/pricing/` | `/ar/pricing/` |
| Design your agent | `/design-your-agent/` | `/ar/design-your-agent/` |
| FAQ | `/faq/` | `/ar/faq/` |
| About | `/about/` | `/ar/about/` |
| Contact | `/contact/` | `/ar/contact/` |
| Privacy Policy | `/privacy/` | `/ar/privacy/` |
| Terms | `/terms/` | `/ar/terms/` |
| Booking short link | `/book` | forwards to Calendly |
| Page not found | 404 | Arabic 404 |

**Later, not at launch:**
- a Case Studies page, after 2 real clients
- separate industry pages, after the first client in that field
- a "Guides" section, when the owner can write about one article a month

### 2.2 Home page, in order

1. **Top section (hero).**
   - Serif headline: "Every traveller answered in seconds, day and night."
   - One short paragraph.
   - "Book a 15-minute call" (main teal button) and "Design your agent" (second button).
   - The line "Message @darb_alyasmeen from your own Instagram and try it yourself."
   - A demo chat that plays once (section 8).
   - A "Watch the 2-minute demo" link, which appears only once the video link is set.
2. **The story.**
   - Heading: "One message, from 11:41 PM to a confirmed booking."
   - The product screen stays in place while 3 steps scroll past: the customer asks, the assistant answers, the team confirms.
   - The block ends with **"Try it yourself"**: 3 sample questions and a button that opens a chat with @darb_alyasmeen.
3. **Statement:** "It never confirms a booking and never takes a payment. Your team keeps the final word…"
4. **Systems:** 5 rows from the systems table and a "See all 30 systems" link.
5. **Working with us,** in 4 steps:
   1. 15-minute call
   2. Setup session
   3. We build it
   4. 10-day live trial
6. **Client feedback.** Hidden until real quotes are added (section 16). It only ever holds real clients who agreed to be quoted.
7. **FAQ.** The 6 most-asked questions, with answers always visible, and a link to the full FAQ page.
8. **Final call to action:** "See it working for your own agency." Book a call, plus Design your agent.

The working draft that shows this order and its motion is at https://claude.ai/artifact/3S4mUmGazX6P3AuJS788D8.

### 2.3 System page template (all 30 follow the same order)

1. What it does, in one sentence
2. See it work: the system's live board or a chat
3. What it never does
4. 3 short FAQs
5. Book a call, plus a WhatsApp link with a message already typed for this system

There is **no** "what you need to provide" checklist. Setup is done for the client, and the page says: "We set everything up for you. Bring your questions to the 15-minute call."

The **AI Travel Sales Assistant** page is fuller. It adds:
- the "Try it yourself" block
- the video slot
- the 4 demo chats from `SPEC-INPUTS.md`

### 2.4 How pricing works

- **No prices on the site.** Pricing is custom.
- The page explains:
  - a one-time setup fee plus a monthly fee, with two kinds of monthly plan: service only, or including managed AI usage
  - the **10-day live trial**
  - the **3-month minimum**
  - **founding-client discounts of 30% / 20% / 15%** on setup, with "places left" that the owner updates by hand (the number of places per tier is still open, section 20)
- The page ends with "Design your agent" and "Book a call".
- There's no currency picker on this page.

### 2.5 About

**"Lindrize at a glance":** a short block of plain, true facts.
- who Amer is
- what Lindrize does
- what makes it different (final wording is open)
- the languages it works in
- how to start

Every claim must be true. The founder is named "**Amer El-shair, Founder**", with a photo and LinkedIn link if the owner provides them.

### 2.6 Contact

- Calendly
- WhatsApp: +962 78 553 6571
- Email: amer.ai@lindrize.online
- City: Amman, Jordan

There is **no contact form**.

### 2.7 Who writes what

- **Claude** drafts all page text in both languages.
- **The owner** reviews it and proofreads the Arabic (about 1–2 hours).
- **The owner writes the Privacy Policy and Terms.** Claude supplies a checklist and the page headings (section 14).

### 2.8 Tone and claims

- **Tone:** direct and practical. Every page says what the visitor gets.
- **Claims:** only product facts the demo can show:
  - replies within seconds, day and night
  - Jordanian Arabic and English
  - recommends the agency's packages and quotes from its price list
  - collects details and sends staff a booking request on Telegram
  - never confirms bookings or takes payment, and staff keep the final word
- **Never:** invented reviews, clients, logos, numbers, percentages, results or industry statistics. Placeholders must be clearly marked and never shown to visitors.

### 2.9 Languages

- English and Arabic at launch, with a full right-to-left layout on Arabic pages.
- Arabic site text is in clear Modern Standard Arabic. **Demo chats are in Jordanian dialect.**
- Brand and app names stay in English letters, for example Lindrize, Instagram, WhatsApp, Telegram, Google Meet and Calendly. Some common business terms may also stay in English. Everything else is in Arabic.
- Arabic pages use **Western digits (1, 2, 3)** for prices, times and phone numbers.

---

## 3. The 30 systems and the industries

### 3.1 Groups

- **Win more bookings:** 1–6, 14, 15
- **Look after travellers:** 7–13
- **Run your office:** 16–30

### 3.2 List

| # | System | What it does |
|---|---|---|
| 1 | AI Travel Sales Assistant | Answers Instagram, WhatsApp and Messenger in seconds, day and night. Recommends packages, collects details, sends staff a booking request. |
| 2 | Quote Follow-up | Follows up with customers who got a price and went quiet. |
| 3 | Customer Reactivation | Brings past travellers back with seasonal offers (Eid, summer, Umrah season). |
| 4 | Instant Quote & Itinerary | Turns a chat into a branded PDF quote or a day-by-day itinerary in minutes. |
| 5 | Ad Lead Responder | Replies on WhatsApp within seconds to people who fill in a Meta or Google ad form. |
| 6 | Website Chat & Booking Request | The same assistant on the agency's website. |
| 7 | Booking Confirmation & Travel Updates | Confirmations, flight and hotel details, change alerts. |
| 8 | Payment Reminders | Deposit and instalment reminders with payment instructions. Never takes payment. |
| 9 | Document Collector | Checklist and reminders for passport copies, photos and visa papers, with secure handling. |
| 10 | Pre-trip Concierge | Meeting point, what to bring, guide contact and weather, sent automatically before departure. |
| 11 | In-trip Support Line | Round-the-clock answers during the trip. Emergencies go straight to staff. |
| 12 | Review & Referral | Asks happy travellers for a Google review and a referral after the trip. |
| 13 | Group Registration | Sign-up forms for Umrah, school and company trips, with automatic lists. |
| 14 | Offer Broadcasts | New packages sent to opted-in customers, grouped by interest. |
| 15 | AI Phone Receptionist | Answers the landline after hours and logs the request (more advanced). |
| 16 | Leads & Bookings Dashboard | One place for every inquiry, its status and who is handling it. |
| 17 | Owner Daily Summary | Each morning: inquiries, bookings, response times, top destinations. |
| 18 | Staff Handoff & Task Assignment | Routes each lead to the right staff member and tracks it. |
| 19 | Package & Price Updater | Staff edit one sheet, and the assistant, website and quotes update. |
| 20 | Supplier Booking Requests | Sends hotel, bus and guide requests and tracks confirmations. |
| 21 | Guide & Transport Scheduler | Plans guides, drivers and buses, and spots clashes. |
| 22 | Rooming List & Manifest Generator | Room and bus lists for groups, especially Umrah. |
| 23 | Visa Application Tracker | Status and deadlines per traveller. |
| 24 | Payments & Instalments Ledger | Who paid, who owes, export for the accountant. |
| 25 | Supplier Invoices & Commission Tracker | What is owed to suppliers and what is earned. |
| 26 | Complaint & Refund Tracker | Every case logged, assigned and closed on time. |
| 27 | Reputation Monitor | Alerts on new Google or TripAdvisor reviews, with suggested replies. |
| 28 | Staff Knowledge Assistant | Staff ask about policies, visa rules or packages and get an instant answer. |
| 29 | Offer Content Generator | Instagram posts and captions from the package sheet. |
| 30 | Partner Inbox Triage | Sorts emails from airlines, hotels and B2B partners and flags the urgent ones. |

### 3.3 Readiness labels

Every system shows one label. Labels are words, never colour alone.
- **Live demo:** only system 1 at launch.
- **Available:** systems the owner can deliver within about 2 weeks. The list is still open.
- **On request:** everything else, including system 15.

### 3.4 Content per system (one file each)

Each system's file holds the following, in English and Arabic:
- name and slug
- group and readiness label
- one-line description
- the board story: about 6 steps, always labelled "Example"
- its own list of extra features for the builder
- 3 FAQs
- the problems it solves, used by the builder
- related systems

Claude drafts all 30 files, and the owner checks them.

### 3.5 Industries page

One page with a short section per field. Each section links to its best-fit systems, and the Solutions page gets an industry filter.

| Field | Best-fit systems |
|---|---|
| Travel agencies and tour operators (first) | All |
| Hajj & Umrah offices | 1, 8, 9, 13, 22, 10 |
| Inbound tour operators | 1 (multilingual), 4, 20, 21, 27 |
| Hotels, camps, guesthouses (Wadi Rum, Dead Sea, Petra) | 1, 7, 10, 12, 27, plus room upgrade offers |
| Car rental | 1, 9 (licence and ID), return reminders, 24 |
| Visa offices | 1 (requirements by nationality), 9, 23 |
| Study-abroad agencies | 1 (student fit questions), 9, application deadline tracker, 18 |
| Event & wedding venues | 1 (availability and quote), 8, 2, event-day coordination |

### 3.6 Solutions page

- A search box with instant filtering.
- Filters by group and by industry.
- A compact list in direction B's table style.

---

## 4. Design your agent (the builder)

The builder is a **visual preview**, labelled "Illustration of your setup. The real system is built for you after the call." It is not the product.

### 4.1 Steps

1. **Your business:** two taps, for agency type and size.
2. **Your problem:** tappable sentences such as "We miss messages at night", "Customers ask for a price, then disappear", "Umrah group paperwork takes days" and "I don't know what my team is doing".
3. **Main system:** the builder suggests the best match by fixed rules (problem → system). The visitor can change it, and any of the 30 systems can be chosen.
4. **Extra features:** each system has its own list, from its content file.
5. **Business ranges:** picked from options, never typed.
   - messages per day
   - staff who answer messages
   - average monthly salary per staff member
   - average booking value
   - share of messages that arrive after hours

   This step also has a **currency picker**: USD by default, plus JOD, SAR, AED, QAR, KWD, BHD and OMR. Fixed rates live in the settings file, rounded to clean numbers. The Kuwaiti dinar rate needs checking now and then.
6. **Estimate:**
   - a **range (low to high)**, never a single number
   - described as **time and cost freed up**, never "replace staff"
   - a "How we worked this out" link shows the assumptions
   - the label "Estimate, not a guarantee"
   - the two assumptions (the share of routine messages handled, and minutes per reply) live in the settings file
   - **Until the owner fills them in, the estimate step is hidden** and the builder goes straight from step 5 to step 7. No invented assumptions, ever.
7. **Book.** Three ways:
   - **Book a 15-minute call:** Calendly opens as a pop-up, with the design summary filled into a custom question.
   - **Send to us on WhatsApp:** WhatsApp opens with the summary already typed.
   - **Email me my design:** section 6.

### 4.2 The live board

- Three screens side by side: **the customer's phone, the assistant at work, and the team's screen**. On phones they stack in one column.
- **Play, Pause and Replay** controls, at about 1 second per step.
- **Changing a feature replays the story,** with that feature visible in it. For example, a voice note appears in the chat, a follow-up message arrives the next morning, or a dashboard tile counts up.
- **A customer-mood strip** under the board shows how the customer feels at each moment, using a simple drawn face and words. For example: "Waiting", "Answered in seconds", "Booked".
- **A "Without an assistant" comparison** shows the same customer waiting until morning and booking with another agency.
- Every story is labelled **"Live demo with Darb Al-Yasmeen, a fictional agency"** or "Example". No real clients appear.
- The board's story is also available as text for screen readers.
- Reference: https://claude.ai/artifact/7KtHTWp2yY3EvwdfVGSxdt

### 4.3 Memory and privacy

- Answers are saved **only on the visitor's own device**.
- **"Clear my answers"** wipes everything on the device: the design, the ranges and the currency.
- **Anonymous counts** of which systems, features and problems are chosen go to Umami, with no names attached.
- A **named** design reaches the owner only when the visitor books, sends it on WhatsApp, or emails it.

### 4.4 Later phase (not at launch)

- An AI model inside the builder (visitors describe their agency in their own words).
- It needs:
  - the OpenAI key kept on the server, never in the website code
  - usage limits and abuse protection
  - a privacy note saying that visitors' words are sent to OpenAI
- The model will be chosen at that time from OpenAI's current list.

---

## 5. Ways to get in touch

- **Calendly:**
  - opens as a pop-up, and its script loads only on click
  - takes the builder summary as a pre-filled answer, which needs the owner to add the question (section 19)
  - the short link `/book` forwards to it
- **WhatsApp:**
  - a small icon in the header
  - the phone sticky bar
  - the Contact page
  - the end of every system page

  Each one opens WhatsApp with a message already typed for that page, for example "Hi, I'm interested in Quote Follow-up".
- **Phone sticky bar:** a slim bar at the bottom with "Book a 15-min call" and a WhatsApp icon. It hides inside the builder, while Calendly is open, and when the footer is visible.
- **Instagram demo:** the hero line, the Home "Try it yourself" block, and the Sales Assistant page. Every mention says it's a fictional demo agency, and owners message it from their own account.
- **Video:**
  - a still preview image designed in the site's style
  - YouTube (privacy-enhanced mode) loads only when play is pressed
  - shown on Home and the Sales Assistant page
  - hidden until the link is set
- **Menu:** logo · Solutions · Industries · Pricing · Design your agent · EN/عربي · light/dark switch · **Book a call** (teal).
- **Every page** ends with the same "Book a 15-minute call" and WhatsApp block.

---

## 6. Data, the email box and logins

- **No login, no accounts and no database** for the website. The only database is Umami's own (section 14).
- **No contact form and no n8n on the site.**
- **"Email me my design"** is the one form, and it's optional, at the end of the builder.
  - **Fields:** email address only. The design is sent as the chosen option IDs, not as free text.
  - **The receiver:** a small program on the VPS at `POST /api/design`.
    1. It checks the input.
    2. It rebuilds the design summary itself from the IDs, so visitors can't inject their own text into the emails.
    3. It emails the design to **amer.ai@lindrize.online**.
    4. It sends the visitor a fixed-wording copy.
    5. It sends a **Telegram alert** to the owner directly, with no n8n.
  - **Spam protection:**
    - a hidden trap field
    - a "too fast to be human" timer
    - Cloudflare Turnstile, loaded only when the email box is focused and checked on the server
    - a limit on how many requests one visitor can send
  - **Privacy line under the box:** "We'll use your email only to send your design and follow up about it. See our Privacy Policy." No pre-ticked boxes, and no newsletter.
  - **Kept** in the inbox for up to 12 months, then deleted unless the person became a client.
- **Secrets** live only in a `.env` file on the server, never in the code or on GitHub:
  - the email-sending password (SMTP)
  - the Turnstile secret key
  - the Telegram bot token
  - later, the OpenAI key
- **Future client area:** if ever needed, it becomes its own phase, using a ready-made login service, strong password rules and a limit on login attempts.

---

## 7. Visual design

### 7.1 Direction B, "Consultancy"

- A classic serif headline.
- Thin lines and plenty of space.
- Systems shown as a clean table instead of cards.
- Square buttons.
- Product screens drawn in code.
- **None of these:**
  - navy
  - gradients
  - glow
  - rounded cards everywhere
  - code-style labels above headings
  - emoji section markers
  - stock photos

### 7.2 Colours

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| Background | `#FFFFFF` | `#2A2826` | Pages |
| Soft surface | `#F5F4F2` | `#322F2C` | Panels, chat bubbles, footer band |
| Text | `#33302D` | `#EFECE8` | Body and headings |
| Muted text | `#6F6A65` | `#ABA59F` | Secondary text |
| Lines | `#E6E3DF` | `#3B3835` | Dividers |
| Strong lines | `#8C8680` | `#8C8680` | Table top rule, outlines |
| Assistant bubble | `#4A4642`, white text | `#D9D4CE`, dark text | The assistant's replies in chats |
| **Teal** | `#4CD9CF` | `#4CD9CF` | **Main buttons only**, with dark text `#06302D` on top |

- The greys are warm. There's no blue and no navy anywhere except inside the logo.
- **Light and dark mode:** the site follows the visitor's device setting, with a switch in the header. The visitor's choice is remembered on their device.

### 7.3 Fonts

All fonts are served from the site's own server and trimmed to the letters used. Text shows straight away in a backup font while they load.

| Role | Font |
|---|---|
| English headlines | IBM Plex Serif |
| English body | IBM Plex Sans |
| All Arabic (headlines and body) | IBM Plex Sans Arabic |
| Logo | The SVG logo file. Outfit isn't loaded as a font. |

### 7.4 Logo and brand files

- **Light mode header:** `brand/logo/lindrize-logo-for-light-bg.svg`
- **Dark mode header and footer:** `brand/logo/lindrize-logo-for-dark-bg.svg`
- **Favicons and app icons:** from `brand/favicons/`, plus a `site.webmanifest`.
- **Share image:** `brand/og-image-1200x630.png`, kept as-is for launch.
- `brand.css` helpers (`.lz-corner`, `.lz-button`, `.lz-dots`) and `brand/elements/` are **not used on the site**.

### 7.5 Images

- No photos at launch.
- Slots for real client photos and screenshots of delivered systems are added later, with each client's permission.

---

## 8. Motion

**Moderate motion**, used where it helps: buttons, the Home chat, the scroll story and the builder.

- **Home chat:** plays once on load. Messages arrive with typing dots, the whole story runs under 6 seconds, and a Replay button follows.
- **Headline:** the words rise into place on load, finishing in under 1 second.
- **Scroll:**
  - section headings and rows slide in gently
  - a short line draws in above each section heading
  - the sticky story changes with each step
  - the statement lights up word by word
  - the "Working with us" line fills as you scroll and each step's dot fills in

  Content is always visible if the scripts don't run.
- **Builder board:** section 4.2.
- **Buttons:**
  - colour changes in 0.15 seconds
  - the main buttons nudge their arrow forward, reversed in Arabic
  - nothing grows, bounces or casts a shadow
- **Between pages:**
  - no transition effect
  - a thin loading bar appears only if a page takes more than 0.3 seconds
  - a "No connection, try again" message appears if the connection drops
  - pages start loading when a link is pointed at or touched
- **Rules:**
  - small interface effects take 0.3 seconds or less, and stories 8 seconds or less
  - nothing makes the page jump
  - nothing flashes
  - **"reduce motion" is always respected:** visitors who turn it on see the finished state immediately
- **References:**
  - https://claude.ai/artifact/7KtHTWp2yY3EvwdfVGSxdt
  - https://claude.ai/artifact/3S4mUmGazX6P3AuJS788D8

---

## 9. Ease of use for non-technical visitors

- **"Never say" list** for visitor-facing text:

  | Never say | Say instead |
  |---|---|
  | AI agent, chatbot, bot | assistant |
  | n8n, workflow, automation, pipeline | system |
  | integration, API, webhook | "connects to…" |
  | CRM | customer list |
  | LLM, model, prompt | *(nothing)* |

  "AI" appears only in product names and short descriptions. Words like "chatbot" are allowed **only** in Google titles, page descriptions and FAQ questions (section 11).
- **One idea per screen.** Important information is visible at a glance and never hidden behind "read more" or folded sections. FAQ answers are always shown.
- **Short pages:** Home has at most 7 visible sections, and system pages fit about 3 phone screens.
- **Built for phones first** (internal rules, not mentioned on the site):
  - body text at 18px
  - strong contrast
  - buttons at least 48px tall
  - a next step always in reach

---

## 10. Accessibility (WCAG 2.2 AA)

- Proper page structure, with exactly one main heading per page and headings in order.
- Clearly marked regions (header, menu, main content, footer) and a "Skip to content" link.
- Every meaningful image has a description. Decorative images are skipped by screen readers.
- **Keyboard:** standard keys only. Tab moves between items, the arrow keys move within lists and groups, and Enter or Space presses. A clear focus outline is always visible.
- Contrast is checked for every colour pair. Teal is only ever a button background, with dark text on it.
- **Arabic pages** are marked as Arabic and right to left. Arabic snippets on English pages are marked too, so screen readers pronounce them correctly.
- **Errors** are written in words next to the field and read aloud by screen readers.
- **Accessibility note:** one footer sentence, "Trouble using this site? Email us at amer.ai@lindrize.online", with the email as a link. There's no separate page.

---

## 11. SEO (Google)

- **All website-side SEO is done by Claude and ready on launch day.** Search terms and facts are researched and chosen without per-item approval.
- **Search terms:** English and Arabic. Each page aims at one main search.
- **Every page gets:**
  - its own title and description
  - a clean English address
  - headings in the right order
  - a canonical address, so Google knows the main version
  - English and Arabic versions linked to each other (`hreflang`: en, ar, x-default)
  - a share preview (Open Graph and Twitter), using the share image
- **Site files:** `sitemap.xml` and `robots.txt`.
- **FAQs:**
  - 6 on Home
  - about 20 on the FAQ page, in groups: price, setup, safety, languages, what it doesn't do
  - 3 on each system page

  The owner sends questions heard on calls. Claude drafts the rest, and the owner approves every answer.
- **No blog at launch.**
- **Owner tasks with guides** (to discuss later, section 19): Google Search Console, Bing Webmaster Tools and a Google Business Profile.

---

## 12. Being found by AI assistants

- **`robots.txt` allows all crawlers, including AI ones:** GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot and Google-Extended. Only `/api/` is blocked.
- **Structured data** (invisible labels for Google and AI assistants, in JSON-LD format) on every page:
  - **Organization and ProfessionalService:**
    - name "Lindrize"
    - founder Amer El-shair
    - Amman, Jordan
    - serves Jordan, Saudi Arabia, the UAE, Qatar, Kuwait, Bahrain and Oman
    - phone, email and URL `https://www.lindrize.online`
    - links to public profiles once provided
  - **Service** for each system
  - **FAQPage** on pages with FAQs
  - **BreadcrumbList** and **WebSite**
- **Never:** star ratings or reviews in the structured data until real reviews exist. The labels must always match what's visible on the page.
- **`llms.txt`** at the root: a short English summary of the business and its key pages, with links to the Arabic pages.
- **The same details everywhere:** Lindrize · Amman, Jordan · +962 78 553 6571 · amer.ai@lindrize.online
  - Where they appear: the footer, Contact, About, structured data, `llms.txt` and the Google Business Profile.
  - Footer legal line: "Lindrize is operated by Amer El-shair, Amman, Jordan." No Ltd, LLC, Inc or registration number.
  - **amerelshair.ai@lindrize.online never appears on the site.**

---

## 13. Speed and media

- **Targets:**
  - Lighthouse 95+ on mobile for performance, accessibility, best practices and SEO
  - main content visible in under 2.5 seconds (LCP)
  - layout shift under 0.1 (CLS)
  - about 300 KB per page on a first visit, not counting fonts
- **Static pages,** with very little JavaScript, only where something moves or responds.
- **Images:** the owner drops a JPG or PNG into one folder. The build converts it to AVIF/WebP in several sizes, sets its width and height, and loads it only when the visitor scrolls near it (unless it's at the top).
- **No outside scripts until the visitor acts:**
  - Calendly loads on "Book a call"
  - Turnstile loads when the email box is focused
  - YouTube loads on play
- **Slots for later:** the video link and client feedback live in one settings file. Each section stays hidden while empty and appears once filled.

---

## 14. Legal, privacy and visitor counting

### 14.1 Visitor counting

- **Umami,** installed on the VPS. It sets **no cookies**.
- **What it records:** the page opened, where the visitor came from, the device type and browser, and the country (worked out from the internet address, which is then thrown away).
- **What it doesn't record:** names, and it doesn't follow visitors across other websites.
- **Events counted:**
  - Book-a-call clicks
  - WhatsApp clicks
  - Instagram demo clicks
  - video plays
  - builder choices (problem, system, features), anonymous
  - emailed designs
  - language switches
- **Dashboard:** at `stats.lindrize.online`, behind Umami's own strong password.
- **No other trackers** without the owner's approval.

### 14.2 Cookies

- **No cookie banner,** because the site sets no tracking cookies.
- **Saved on the visitor's device only:** light or dark mode, language and builder answers. "Clear my answers" removes the builder data.
- **Outside services** (Calendly, YouTube, Cloudflare) may set their own cookies, but only after the visitor clicks them. The Privacy Policy says so.

### 14.3 Privacy Policy

The owner writes it. **Checklist:**
- who runs the site and how to reach them
- what the email box collects and why
- Calendly, WhatsApp (Meta), Cloudflare Turnstile and YouTube, which each handle data under their own policies
- anonymous visitor counting with Umami
- what's saved on the visitor's device, and "Clear my answers"
- emails kept for up to 12 months
- visitors' right to see or delete their data, and how to ask
- data is never sold
- the Telegram alert to the owner

Jordan, Saudi Arabia and the UAE each have personal data laws, so a qualified person should glance over the text before launch.

### 14.4 Terms

The owner writes them. **Checklist:**
- the website is for information only, and mistakes can be corrected
- prices and service details are agreed in a written agreement with each client
- the builder's estimate is an estimate, not a guarantee
- Darb Al-Yasmeen is a fictional demo agency, and its FAQs are not travel advice
- the site's content belongs to Lindrize
- Jordanian law applies

Both pages are linked in the footer. The Privacy Policy is also linked under the email box.

---

## 15. Hosting, security, publishing and the domain move

### 15.1 Stack

- **Astro** builds the static site, served by **Nginx** on the owner's **Hostinger VPS**, with free HTTPS from Let's Encrypt.
- The **email receiver** and **Umami** run in separate containers on the same server.

### 15.2 Server security

The owner follows a step-by-step guide, with a check at the end of each step:
- log in with an SSH key only, no passwords
- the UFW firewall opens only the web ports and the login port
- fail2ban blocks anyone guessing logins
- automatic security updates
- **security headers:**
  - a strict content rule (CSP) that allows only the site, Calendly, YouTube's privacy mode and Cloudflare Turnstile
  - HSTS (always use HTTPS)
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
- gzip and brotli compression
- long caching for files whose names change when they change

### 15.3 Publishing

- The code lives in a **private GitHub repository**. Saving a change there publishes it automatically, through GitHub Actions to the VPS, in about 2 minutes.
- An automatic check runs first and **blocks publishing** if anything is broken: a missing Arabic version, a broken link or an empty required field.
- **Undo:** press "Re-run" on an older version in GitHub.

### 15.4 Domain move (email must not break)

1. The owner exports and sends **every** current DNS record.
2. The email records (MX, SPF, DKIM, DMARC, and any Google verification records) are marked **do not touch**.
3. A day before, lower the update delay (TTL) on the website records.
4. Change **only** the website records: `@` and `www` point to the VPS. Add `stats` for Umami.
5. Check the new site and send and receive a test email.
6. Keep the old Vercel site live for 2 weeks after the new one is confirmed working, then delete it.

**Main address:** `www.lindrize.online`. `lindrize.online` forwards to it, and `lindrize.online/book` forwards to Calendly.

### 15.5 Monitoring and backups

- UptimeRobot (free) checks the site every 5 minutes and emails the owner if it's down.
- The Umami database is backed up every night.

---

## 16. Editing the site later

- **Pages CMS** (free and open source): the owner logs in with GitHub and edits content through forms. Saving publishes the site. **There's no login on the website itself.**
- **English and Arabic fields sit side by side.** Saving something without its Arabic version blocks publishing and names the missing item.
- **Editable:**
  - the 30 systems
  - the FAQs
  - client feedback
  - the industries sections
  - the builder's ranges, assumptions and currency rates
  - settings: video link, phone, email, founding places left, Calendly link
- **Locked:** page layouts and design.
- **`HOW-TO-EDIT.md`:** a one-page guide in English. It covers:
  - change a setting or the founding places
  - add or edit an FAQ
  - add client feedback
  - add the video
  - add a new system
  - undo a change

---

## 17. Clashes with SPEC-INPUTS.md

| Topic | SPEC-INPUTS.md | Applied |
|---|---|---|
| Colours | Navy and paper backgrounds, deep teal text | Interview: warm greys on white, warm charcoal in dark mode, teal only on main buttons |
| Buttons | Teal-to-cyan gradient, 12px corners | Interview: solid `#4CD9CF`, square corners |
| Fonts | Outfit headings, IBM Plex Mono labels | Interview: IBM Plex Serif, Sans and Sans Arabic. Outfit only inside the logo. |
| Decorations | `.lz-corner`, `.lz-dots`, dot dividers | Interview: not used |
| Form notifications | n8n to Telegram and Google Sheets | Interview: no n8n. Receiver to inbox, plus a direct Telegram alert (confirmed by owner). |
| Main URL | `https://lindrize.online` | Interview: `https://www.lindrize.online` |
| Demo account | @darb_alyasmeen, "Darb Al-Yasmeen Travel" | **Owner confirmed @darb_alyasmeen** (replaces @Yasmeen_aldarb) |
| Share image | Navy, Outfit | **Owner confirmed: keep for launch** |

**Taken from SPEC-INPUTS.md without change:**
- the 4 example chats
- demo FAQs are not travel advice
- the business name, footer legal line and founder name
- the public email, phone and `/book` link
- the description line "AI sales assistants for travel agencies"

---

## 18. Build phases and checks

`PLAN.md` comes after approval: phases, file structure, components, and what the owner provides. The phases are:

1. **Design system and Home:** colour and font tokens, layout, header, footer, light/dark mode, language switch, the Home page.
2. **The other pages and content:** Solutions, the 30 system pages, Industries, Pricing, FAQ, About, Contact, Privacy and Terms skeletons, and Arabic for everything.
3. **Builder, email receiver, SEO and AI files:** the builder and board, the receiver with Turnstile and Telegram, `sitemap.xml`, `robots.txt`, `llms.txt`, structured data, Umami events.
4. **Accessibility and speed pass.**
5. **Server, publishing, Umami and the domain move.**

**Checks before a phase is called done:**
- the site builds without errors
- Lighthouse on mobile meets the targets
- an axe accessibility scan shows zero serious issues
- a keyboard-only walkthrough
- every link checked
- `sitemap.xml`, `robots.txt` and `llms.txt` validated
- structured data validated with the Schema.org validator
- an Arabic right-to-left check on every page

After each phase, the owner gets a summary of what changed and how to preview it.

**Standing rule:** never invent facts, testimonials, statistics or client names. Use clearly marked placeholders that visitors never see.

---

## 19. Tasks the owner does by hand

Each one comes with step-by-step instructions when it's needed:

- [ ] Send a test email from a personal Gmail to amer.ai@lindrize.online and check it reaches the inbox, not spam.
- [ ] In Calendly, add a long-answer question to the 15-minute event: "Your agent design (filled in automatically)".
- [ ] Write the Privacy Policy and Terms from the checklists.
- [ ] Proofread the Arabic (about 1–2 hours).
- [ ] Create a GitHub account and a private repository, then connect Pages CMS.
- [ ] Create a Cloudflare account and a Turnstile site key.
- [ ] Create a Telegram bot (with BotFather) and get the chat ID for alerts.
- [ ] Set up email sending for the receiver: a Google Workspace app password or SMTP relay for amer.ai@lindrize.online.
- [ ] Prepare the VPS: an SSH key, plus the security steps in section 15.2.
- [ ] Export all DNS records and change only the website records on move day.
- [ ] Set a strong password for the Umami dashboard.
- [ ] Set up UptimeRobot.
- [ ] Later: Google Search Console, Bing Webmaster Tools and a Google Business Profile.

---

## 20. Open questions

**Before Phase 2:**
1. Which systems can be delivered within about 2 weeks (these get the "Available" label)?
2. Do voice-note replies work today?
3. How many founding-client places does each discount tier have?
4. About page: what makes Lindrize different, the languages you work in, whether to include a photo, and your public profiles (Instagram, LinkedIn, and whether @amer_aiflow is still yours).
5. FAQ questions you hear on calls.
6. Should "Intelligence. Amplified." appear as a small line in the footer? (Default: no.)

**Before Phase 3:**

7. The two estimate assumptions: the share of routine messages the assistant handles, and the minutes per reply. Until these are set, the estimate step stays hidden.
8. Confirm the rounded currency rates. Claude will propose them.
9. Review the 30 draft feature lists and board stories.

**Before Phase 5:**

10. The Hostinger VPS plan (memory and storage) and what already runs on it (n8n?).
11. Where lindrize.online was bought, and where its DNS records are managed.
12. Do your cold emails link to `www.lindrize.online` or `lindrize.online`? (This confirms the main address.)

**After launch:**

13. The YouTube link for the 2-minute demo.
14. Real client feedback, each with the client's permission.

---

## 21. Reference files

- `SPEC-INPUTS.md`: the owner's answers on the brand, demo data, business name and email
- `brand/`: logos, favicons, share image, `brand.css`, decorative elements
- `content/demo/packages.csv`: 15 demo packages
- `content/demo/faq.csv`: 25 demo FAQs, not travel advice
- `design-sample/lindrize-home-scroll.html`: Home draft with scroll motion
- `design-sample/lindrize-motion.html`: motion rules demo
- `design-sample/lindrize-directions.html`: the three design directions (B chosen)
