# Legal pages: what to confirm before approving

**Owner's answers (21 November 2026):** n8n stays in the buy-out section only (removed from
"Third-party services"). The buy-out *starts from* 750 JOD for the basic assistant. OpenAI for
the demo and the 30-day answer time are confirmed. Still open: demo-chat retention (point 2)
and the Arabic name (point 4). The owner switches `approved` on in the three files.

The three pages are written and visible on the preview:

| Page | English | Arabic | File |
|---|---|---|---|
| Privacy Policy | `/privacy/` | `/ar/privacy/` | `site/src/content/pages/privacy.yaml` |
| Terms | `/terms/` | `/ar/terms/` | `site/src/content/pages/terms.yaml` |
| Ownership and Buy-out Policy | `/ownership/` | `/ar/ownership/` | `site/src/content/pages/ownership.yaml` |

All three are linked in the footer. The site cannot go live until each file has
`approved: true` (editing screen: the page → **Approved**). Before switching it on, answer the
points below. This is not legal advice: have someone qualified read the three pages together
with your Service Agreement.

## 1. Clashes with earlier rules (your choice)

| # | Clash | What I did | Alternative |
|---|---|---|---|
| 1 | Your rule: nothing about n8n on the website. The Ownership policy names n8n twice (the buy-out handover and "Third-party services"). | Kept your text as written: a buy-out client needs to know the platform. | "ready to import into your own automation account", and drop n8n from the list of services. |
| 2 | The Pricing page says "there is no price list here". The Ownership policy shows **750 JOD** for the buy-out. Your file says to confirm this before publishing. | Kept 750 JOD. | Keep only "Price: stated in your proposal." |
| 3 | The site never uses words like "automation", "workflows" or "prompts". The legal pages need them to be precise. | The three legal pages are exempt from the plain-wording check. Every other page is still checked. | Rewrite those words in plain terms (less precise). |

## 2. Facts I wrote that only you can confirm

| Page | Statement | Why I need you |
|---|---|---|
| Privacy | The demo account's replies are written with OpenAI. | Taken from your Ownership policy's list of services. Confirm it applies to the demo. |
| Privacy | Demo conversations are read to improve the demo and deleted within 12 months. | Matches the 12 months for emailed designs. Is that what you do? |
| Privacy | Requests to see or delete data are answered within 30 days, free. | A common standard. Choose your own if different. |
| Privacy | The server is rented from Hostinger. | From your answers. |
| Privacy | Calendly sends you the name, email and answers of whoever books. | That is how Calendly works by default. |
| Terms | "Fair use" and "Responsibility" sections. | Standard wording, not from you. Your lawyer should check them. |

The server was set up to match the Privacy Policy exactly: its logs keep only shortened
visitor addresses and Ubuntu deletes them after 14 days.

## 3. Small changes I made to your Ownership file

The meaning is unchanged.

- Arabic digits written as 7, 30, 750 (not ٧, ٣٠, ٧٥٠), like the rest of the Arabic site.
- Brand names in Latin letters in Arabic (Instagram, WhatsApp, Facebook, Google), as agreed in
  SPEC section 5.
- Section numbers dropped from the headings. "Last updated" is shown automatically from the
  date in the file.
- The `[date of publishing]` placeholder became the `updated` date. Set it to the launch day
  when you approve.

## 4. One question

Your file gives your name in Arabic: **عامر الشاعر**. The Arabic footer and About page still
say "Amer El-shair". Use the Arabic name there too?
