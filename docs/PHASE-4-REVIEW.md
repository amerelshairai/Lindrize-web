# Phase 4: accessibility and speed report

Phase 4 tested the whole site against WCAG 2.2 AA and the speed targets in SPEC 13.
It changed very little on the site itself, because earlier phases were built to the standard.

## Results

| Check | Scope | Result |
|---|---|---|
| axe accessibility scan | All 82 pages, light and dark mode | 0 issues |
| Reading at 320px wide (400% zoom) | All 82 pages | No sideways scrolling, no cut-off text |
| Control size (at least 24 × 24px) | All 82 pages, phone and laptop | Pass after one fix |
| Wider letter, word and line spacing | All 82 pages | Nothing cut off |
| Focus hidden behind the header | 48 pages across every kind | Never |
| Colour contrast | 28 colour pairs, light and dark | All pass (`docs/CONTRAST.md`) |
| Keyboard walkthrough | Every kind of page and the whole builder | Pass (`docs/KEYBOARD-WALKTHROUGH.md`) |
| Reduced motion | Home, the builder, every animated part | Finished state shown, nothing moves |
| Right to left | Every Arabic page, phone and laptop | No overflow, screenshots reviewed |
| Lighthouse on mobile | All 80 real pages | Performance 100, accessibility 100, best practices 100 on every page |
| Lighthouse SEO | All 80 real pages | 100 on 76. The other 4 are Privacy and Terms, hidden from Google on purpose until written |
| Speed | All 80 real pages | Slowest main content: 0.91 s (target 2.5 s). Highest layout shift: 0.015 (target 0.1) |
| Page weight | All 80 real pages | 16 to 38 KB plus fonts (target 300 KB) |
| Sitemap, robots.txt, llms.txt | Whole site | Valid, every address exists |
| Structured data | Every indexable page | Valid, matches the visible text, no ratings |
| Internal links | 2,836 links | 0 broken |

## What was fixed

1. **The small email link at the bottom of every page** was 22px tall. WCAG 2.2 asks for 24px.
   It is now taller.
2. **Windows high-contrast mode:** a chosen option now gets an outline, because that mode removes
   the background colour that marked it.

## What could not be done here

1. **Outside links** (Calendly, Instagram, WhatsApp) cannot be reached from the build machine.
   A check now runs on GitHub every Monday and can be started by hand: **Actions → Outside links →
   Run workflow**. Instagram and WhatsApp often refuse automated visitors, so please also tap these
   four once on your phone:
   - Book a call (Calendly)
   - "Message @darb_alyasmeen on Instagram"
   - The @darb_alyasmeen profile link in the top section of Home
   - Any WhatsApp link
2. **The Schema.org and Google Rich Results validators** are websites that need the live address.
   The same rules are tested automatically here. After launch, paste the home page address into
   https://validator.schema.org and https://search.google.com/test/rich-results once.
3. **A real screen reader pass** (VoiceOver, TalkBack or NVDA), in Arabic and English, is worth
   15 minutes before launch.

## Nothing needed from you for this phase

One optional click on GitHub: the automatic update proposal **#1** ("Bump the actions group")
passes every check and only updates the tools that run the checks. You can press **Merge** on it.
Proposal #2 was closed automatically.
