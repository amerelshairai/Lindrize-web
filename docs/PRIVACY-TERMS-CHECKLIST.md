# Privacy Policy and Terms: what to write

**Done:** both texts were written on 17 November 2026 from this checklist. What is left for
the owner is in `docs/LEGAL-REVIEW.md`. This file stays as the record of what each must cover.

You write both texts (SPEC 14). The pages already exist with their headings. This file lists what
each section must cover. It is a checklist, not legal advice. Jordan, Saudi Arabia and the UAE each
have a personal data law, so ask someone qualified to read both texts before launch.

## Where to put the text

- Privacy Policy: `site/src/content/pages/privacy.yaml`
- Terms: `site/src/content/pages/terms.yaml`

Under each section's `title`, add a `body` with English and Arabic text. Leave a blank line
between paragraphs:

```yaml
sections:
  - title:
      en: "Who we are and how to contact us"
      ar: "من نحن وكيف تتواصل معنا"
    body:
      en: |
        First paragraph.

        Second paragraph.
      ar: |
        الفقرة الأولى.

        الفقرة الثانية.
```

When every section has its text, change `ready: false` to `ready: true` at the top of the file.
Until then the page shows a "being written" notice, stays out of search engines, and the site
cannot go live.

## Privacy Policy

1. **Who we are and how to contact us**
   - Lindrize is operated by Amer El-shair, Amman, Jordan.
   - Contact: amer.ai@lindrize.online and WhatsApp +962 78 553 6571.
2. **What we collect when you email yourself a design**
   - Only the email address the visitor types, and the choices they made in "Design your agent".
   - Why: to send them their design and to follow up about it.
   - It reaches your inbox by email, and a short alert reaches you on Telegram.
   - No newsletter, and no sharing with anyone else.
3. **Booking a call, WhatsApp, the human check and video**
   - Calendly handles bookings under its own privacy policy. It loads only after "Book a call" is
     pressed.
   - WhatsApp and Instagram (Meta) handle messages under their own policies.
   - Cloudflare Turnstile checks that the email box is used by a person. It loads only when the
     visitor uses that box.
   - YouTube plays the demo video in its privacy mode, and only after play is pressed.
   - Each of these may set its own cookies once the visitor uses it.
4. **Anonymous visitor counting**
   - The site counts visits with Umami, running on our own server. It sets no cookies.
   - It records: the page opened, the site the visitor came from, the device type and browser,
     and the country.
   - It does not record names and does not follow visitors to other websites.
   - It also counts button presses (book a call, WhatsApp, the demo, the video) and which systems
     and features are chosen in "Design your agent", with no names attached.
5. **What is saved on your device**
   - The light or dark mode choice.
   - The answers in "Design your agent". "Clear my answers" removes them.
   - Nothing else. The site sets no tracking cookies, so there is no cookie banner.
6. **How long we keep emails**
   - Emailed designs are kept for up to 12 months, then deleted unless the person became a client.
7. **Your rights**
   - Anyone can ask to see, correct or delete what we hold about them, by emailing the address
     above. Say how quickly you will answer.
8. **We never sell data**
   - State it plainly.
9. **Changes to this policy**
   - Say that the page shows the date of the last change.

## Terms

1. **About this website**
   - The website gives general information about Lindrize and its systems.
   - It can contain mistakes or be out of date, and it can change.
2. **Prices and services**
   - Prices and the exact service are set out in a written agreement with each client. If the
     website and the agreement differ, the agreement applies.
3. **The "Design your agent" estimate**
   - The result is an estimate based on the visitor's own answers and stated assumptions. It is
     not a guarantee of savings or results.
4. **The demo agency**
   - Darb Al-Yasmeen is a fictional agency created for the demo. Its packages, prices and answers
     are sample data and are not travel advice or real offers.
5. **Ownership of content**
   - The text, design and logo belong to Lindrize and may not be copied without permission.
6. **Governing law**
   - Jordanian law applies.
