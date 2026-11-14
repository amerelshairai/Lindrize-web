# Lindrize website: answers to the 4 open items for SPEC.md

Give this folder to Claude Code. Copy `brand/` into the project's `/brand` folder and `demo-data/` into `/content/demo`.

---

## 1. Brand kit

All files are in `brand/`.

| Need | File | Notes |
|---|---|---|
| Logo for light backgrounds (navy text) | `brand/logo/lindrize-logo-for-light-bg.svg` | Header on light pages |
| Logo for dark backgrounds (teal text) | `brand/logo/lindrize-logo-for-dark-bg.svg` | Header on navy sections and footer |
| White logo | `brand/logo/lindrize-logo-white.svg` | On photos or gradients |
| Icon only (teal L) | `brand/logo/lindrize-icon.svg` | Small spaces, loading states |
| Icon only (navy L) | `brand/logo/lindrize-icon-navy.svg` | On light backgrounds |
| High-resolution PNG logos (4000 px) | `brand/logo/*-4000x1359.png` | Only where SVG can't be used |
| Favicon (SVG, modern browsers) | `brand/favicons/favicon.svg` | `<link rel="icon" type="image/svg+xml">` |
| Favicon PNGs | `brand/favicons/favicon-32.png`, `favicon-48.png` | Fallbacks |
| Apple touch icon | `brand/favicons/apple-touch-icon-180.png` | iPhone home screen |
| Web app icons | `brand/favicons/icon-192.png`, `icon-512.png` | `site.webmanifest` |
| Share image (Open Graph / Twitter) | `brand/og-image-1200x630.png` | Text: "AI sales assistants for travel agencies, every inquiry answered in seconds, day and night." |
| Brand CSS | `brand/brand.css` | Colour tokens plus `.lz-corner`, `.lz-button` and `.lz-dots` helpers |
| Decorative elements | `brand/elements/*.svg` | Corners, dot divider, dot pattern tile, bullet dot |

**Colours:**

| Token | Hex | Use |
|---|---|---|
| `--lz-navy` | `#0C1320` | Dark backgrounds, text on light |
| `--lz-teal` | `#22CEC3` | Primary brand colour |
| `--lz-cyan` | `#0FB8D2` | Gradient partner |
| `--lz-deep` | `#0F5C63` | Links and labels on light backgrounds (use this, not teal, for small text on white, for contrast) |
| `--lz-paper` | `#F4F6F5` | Light backgrounds |

**Fonts** (all free, self-host with `@fontsource`):
- Outfit 500/600: wordmark and headings
- IBM Plex Sans: body
- IBM Plex Sans Arabic: Arabic pages
- IBM Plex Mono: small labels and numbers

**Contrast note:** teal `#22CEC3` on white fails WCAG AA for normal text. Use teal on navy, and deep teal `#0F5C63` for text on white.

---

## 2. Demo agency: Darb Al-Yasmeen Travel (fictional)

Source: the demo's Google Sheet "Darb Al-Yasmeen Travel – AI Assistant Demo", exported to `demo-data/packages.csv` (15 packages) and `demo-data/faq.csv` (25 FAQs).

**Rule for the website:** every example chat must be labelled **"Live demo with Darb Al-Yasmeen, a fictional agency"**. It must never be presented as a real client, a testimonial or real results.

- **Instagram handle:** **@darb_alyasmeen**
- **Location in the demo:** Mecca Street, Amman
- **Opening hours in the demo:** Sat–Thu, 9:30 AM–7:00 PM
- **Prices:** per person, shared double room, in JOD

### Packages (adult / child, standard season)

| ID | Package | Nights | Adult | Child | Current offer |
|---|---|---|---|---|---|
| MKK-01 | Umrah Economy by Bus | 7 | 265 | 190 | Groups of 4+ get the Makkah Ziyarat tour free |
| MKK-02 | Umrah by Bus Plus | 9 | 345 | 250 | Early booking until 15 Nov: already 30 JOD off |
| MKK-03 | Umrah by Air, 7 Nights | 7 | 595 | 455 | Free Umrah kit + 5 L Zamzam bottle |
| MKK-04 | Umrah Premium, Haram View | 7 | 1,190 | 880 | January: free Kaaba-view room upgrade |
| MKK-05 | Ramadan Last 10 Nights Umrah | 10 | 1,950 | 1,450 | Book before 31 Dec: already 100 JOD off |
| SSH-01 | Sharm Budget Escape | 3 | 255 | 180 | Thursday departures: free glass-boat trip |
| SSH-02 | Sharm Family All-Inclusive | 5 | 455 | 250 | Child price already 40% off |
| SSH-03 | Sharm Diving & Reef Adventure | 5 | 495 | 360 | Book 2+: free underwater photo package |
| SSH-04 | Sharm Honeymoon Sea-View Suite | 6 | 760 | adults only | Free room decoration and cake |
| SSH-05 | Sharm & Cairo Pyramids Combo | 7 | 690 | 520 | Free Nile dinner cruise |
| DXB-01 | Dubai Long Weekend | 3 | 365 | 275 | Thursday departures: free Dubai Frame tickets |
| DXB-02 | Dubai City & Shopping | 4 | 520 | 390 | January: 50 JOD mall voucher per room |
| DXB-03 | Dubai Family Fun | 5 | 640 | 480 | Under-12s: free theme park tickets |
| DXB-04 | Dubai Luxury Beach & Sky | 5 | 1,150 | 820 | Honeymooners: free suite upgrade when available |
| DXB-05 | Dubai & Abu Dhabi Explorer | 6 | 780 | 590 | Free Louvre Abu Dhabi tickets |

Peak-season prices, departure dates, inclusions and exclusions are in the CSV.

### Key FAQ answers the assistant uses
- **Deposit:** 30% confirms the booking. The balance is due 14 days before departure.
- **Payment:** cash, bank transfer, CliQ or card at the office. Payment is never taken in the chat.
- **Instalments:** up to 3 for packages above 500 JOD.
- **Child price:** ages 2–11. Under 2 pays the infant price. 12+ pays the adult price.
- **Umrah visa:** included in all Umrah packages.

All 25 FAQs are in `demo-data/faq.csv`. They're marked "demo sample text, not verified travel rules", so the website must not present them as real travel advice.

### Example chats for the website (built only from the demo data)

**Chat 1: family by the sea, Arabic, at 11:40 PM**
> Customer: بدي رحلة بحر مع الولاد، شو عندكم؟
> Assistant: asks two short questions (how many adults and children, which month) → recommends **Sharm Family All-Inclusive**: 5 nights, 5-star, all inclusive, **455 JOD per adult and 250 JOD per child (already 40% off)** → asks for name and phone → "Rana from our team will confirm your booking in the morning ✅"
> Staff side (Telegram): new booking request with family size, dates, package and quoted total.

**Chat 2: Umrah for elderly parents, Arabic**
> Customer: أبوي وأمي كبار بالعمر، بدنا فندق قريب من الحرم
> Assistant → recommends **Umrah by Air, 7 Nights**: 4-star, 400 m from the Haram, flights instead of bus, **595 JOD per adult**, free Umrah kit and Zamzam bottle → hands over to Omar (Umrah specialist).

**Chat 3: honeymoon, English**
> Customer: Do you have honeymoon packages by the sea?
> Assistant → **Sharm Honeymoon Sea-View Suite**: 6 nights, adults-only 5-star, all inclusive, **760 JOD per person**, free room decoration and cake. Alternative: **Dubai Luxury Beach & Sky** (1,150 JOD).

**Chat 4: the safeguard**
> Customer: Can I pay now by card here?
> Assistant: "Payment is never taken in this chat. Our team will arrange it with you directly. Shall I send them your booking request?"

These four chats show speed (night-time reply), Arabic and English, real recommendations from a price list, the staff handoff and the safeguard. That covers the whole offer.

---

## 3. Exact business name

- **Brand name on the website: Lindrize.** Not "Lindrize AI". The logo, domain (lindrize.online), proposal, invoice, agreement and Calendly all say "Lindrize". Changing it now would make the brand inconsistent.
- **Tagline:** "AI sales assistants for travel agencies". Optionally "Intelligence. Amplified." as a secondary line.
- **Legal and footer line:** "Lindrize is operated by Amer El-shair, Amman, Jordan." Lindrize isn't a registered company yet, so don't use "Ltd", "LLC" or "Inc", and don't show a registration number.
- **Founder name everywhere:** Amer El-shair, Founder.
- **Structured data (Organization):** `"name": "Lindrize"`, `"founder": "Amer El-shair"`, `"address": "Amman, Jordan"`, `"url": "https://lindrize.online"`.

---

## 4. Does amer.ai@lindrize.online receive email?

**Yes, as far as I can check.** It's a full Google Workspace account on lindrize.online, not just an alias:
- it **owns Google Drive files** (the demo sheet and the email campaign sheet), which only a real Workspace user can do
- it has **sent emails that arrived** in amerelshair.ai@lindrize.online (31 Oct and 6 Nov 2026)

A Workspace user mailbox receives email by default. **One 30-second check to be 100% sure:** send an email from a personal Gmail to amer.ai@lindrize.online and confirm it arrives in its inbox, not spam.

**Which email to show on the website:**
- **Public contact address:** amer.ai@lindrize.online. It's the same address agencies see in your cold emails, which builds trust.
- **Contact-form notifications:** sent by the n8n webhook to Telegram plus Google Sheets, so the form never depends on an inbox.
- **Never show** amerelshair.ai@lindrize.online on the site. Keep it for invoices and subscriptions.
- **Phone / WhatsApp:** +962 78 553 6571
- **Booking link:** https://calendly.com/amerelshair-ai-lindrize/15-minute-call-with-lindrize, shown as **lindrize.online/book**

**Before the DNS move:** this mailbox and your cold-email campaign depend on the domain's MX, SPF, DKIM and DMARC records. Follow the DNS rule in the website prompt: list every record first and change only the website A/CNAME records.
