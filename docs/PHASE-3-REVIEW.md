# Phase 3: what to review

Phase 3 built "Design your agent" with its example board, the email receiver, and the files that
help Google and AI assistants understand the site.

## Please review

1. **Design your agent**, in English and Arabic, on a phone and a laptop. Go through all five
   steps and check:
   - the problems in step 2, and the system each one suggests
   - the extras offered for the systems you care about most
   - the example board, the Play and Replay buttons, and "Without an assistant"
   - the summary at the end, and what "Send this to us on WhatsApp" types for you
2. **`llms.txt`** (`/llms.txt` on the preview). This is what AI assistants will read about you.
   Every line should be true.

## Two things to do

### 1. Add one question to your Calendly event

This is where a visitor's design appears when they book.

1. Open Calendly and go to **Scheduling**, then your event **15 Minute Call with Lindrize**.
2. Open **Invitee questions** (also called "Booking form").
3. Add a question with the type **Multiple lines**.
4. Name it: **Your agent design (filled in automatically)**.
5. Leave it **not required**, and make sure it is the **first** custom question.
6. Save.

The site fills the first custom question, so it must be first.

### 2. Decide the estimate numbers (optional, can wait)

The "what it could free up" step stays hidden until you set three numbers in
`site/src/content/pages/design.yaml` under `assumptions`:

| Setting | Meaning | Example of the format |
|---|---|---|
| `routineShare` | Share of customer messages the assistant can answer by itself | `0.5` means half |
| `minutesPerReply` | Minutes a staff member spends on one routine reply | `3` |
| `workHoursPerMonth` | Working hours in a month for one staff member | `176` |

The examples show the format only. Use numbers you can stand behind, for example from your demo
or your first live trial, because visitors see them under "How we worked this out".

Once set, the builder also asks for a salary range and a currency, and shows a range of hours and
staff-time value. Please also confirm the exchange rates in the same file (`currencies`).

## Still needed from you (from earlier phases)

- Which systems can you deliver within about two weeks, and how many founding-client places.
- The Privacy Policy and Terms text (`docs/PRIVACY-TERMS-CHECKLIST.md`).
- The Arabic proofread, your name in Arabic, and the demo checks from Phase 1.

## What Phase 5 will switch on

These are built and tested, and wait for accounts and keys that are set up on the server:

| Feature | Waits for |
|---|---|
| "Email me my design" | A Cloudflare Turnstile key, the mail password and (optional) the Telegram bot |
| Visitor counting | Umami installed on the server |
| `/book` as a real redirect | The web server |

## Checked automatically (all pass)

| Check | Result |
|---|---|
| Build and type check | 82 pages, 0 errors |
| Builder | Steps cannot be skipped, the problem suggests a system, answers stay on the device and survive a reload, "Clear my answers" wipes them, the summary fills Calendly and WhatsApp, the board plays, pauses and compares |
| Email form | Hidden without a key. With one: checks the address, waits for the human check, sends only choice ids, and explains failures |
| Receiver | 15 tests: good and bad input, other websites refused, trap field, timer, human check, limits, mail failure, plain text only |
| Sitemap, robots.txt, llms.txt | Valid, and every address in them exists |
| Structured data | Valid on every indexable page, matches the visible text word for word, no ratings |
| Accessibility (axe, WCAG 2.2 AA) | 0 issues, including every step of the builder in both languages |
| Lighthouse (mobile) | 100 / 100 / 100 / 100 on eight page types |
| Launch gate | Only Privacy and Terms (both languages) still block launch |
