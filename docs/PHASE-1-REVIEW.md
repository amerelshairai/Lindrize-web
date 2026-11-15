# Phase 1: what to review

Phase 1 built the design system, the header and footer, and the Home page in English and Arabic.
This page lists what the owner should look at, and what was checked automatically.

## Please review

1. **The Home page in English and Arabic,** on a phone and a laptop, in light and dark mode.
2. **The Arabic text on Home** (about 20 minutes). It lives in two files:
   - `site/src/content/pages/home.yaml`: headings and paragraphs
   - `site/src/data/ui.json`: buttons, menu and small labels
3. **The four example chats** (`site/src/content/chats/`). Please send each opening question to the
   real demo and confirm the demo answers in the same way. If it answers differently, the chats
   should be changed to match the demo.
4. **The six questions and answers** (`site/src/content/faqs/`). Every answer needs your approval.
5. **The four "Working with us" steps.** They are worded from what the interview said. Correct
   anything that is not how you work.
6. **The demo link.** The "Message @darb_alyasmeen on Instagram" button opens
   `https://ig.me/m/darb_alyasmeen`. Please tap it on your phone and confirm it opens a message
   to the demo account.

## Questions that came up

1. **Your name in Arabic.** How do you write "Amer El-shair" in Arabic? Until you say, Arabic
   pages show it in Latin letters.
2. **Which systems can you deliver within about two weeks?** (Open question 1 in SPEC.) Until you
   say, only the Sales Assistant has a positive label and the others say "On request".
3. **The distance to the Haram.** Your notes said "400 m from the Haram" for the Umrah by Air
   package, but the demo sheet has no distance. If the real demo knows it, add it to the sheet and
   it can go back into the example.

## Checked automatically (all pass)

| Check | Result |
|---|---|
| Build and type check | 32 pages, 0 errors |
| Content rules | One main heading per page, language and direction set, titles and descriptions present, security policy on every page |
| Plain wording | No "never say" words in visitor-facing text |
| Honesty | No unfinished text, no private email address, no ratings |
| Links | 930 internal links checked, 0 broken |
| Accessibility (axe, WCAG 2.2 AA) | 0 issues on Home in English and Arabic, light and dark, with and without motion |
| Keyboard | Skip link, every control reachable with a visible outline, tabs with arrow keys, booking dialog, phone menu |
| Behaviour | Light/dark memory, language switch, chat plays once, scroll story, reduced motion, scripts off, phone booking bar |
| Right to left | Arabic Home at 6 widths: no sideways scroll, screenshots reviewed |
| Lighthouse (mobile) | English 100 / 100 / 100 / 100, Arabic 100 / 100 / 100 / 100. Main content in 0.9 s. Layout shift 0. About 25 KB per page plus fonts. |

Not in Phase 1 by plan: structured data, sitemap, `llms.txt` (Phase 3), and checking outside links
against the live web (Phase 4).
