# Phase 2: what to review

Phase 2 built every page except "Design your agent": Solutions, the 30 system pages, Industries,
How pricing works, FAQ, About, Contact, and the Privacy and Terms pages, all in English and Arabic.

## Please review

1. **The 30 system pages** (`site/src/content/systems/`, one file each). For each one, check:
   - `does`: is this what the system does?
   - `never`: is this a promise you can keep?
   - `story`: is the example realistic?
   - `faqs`: are the three answers right?
   - `features`: these are the extras offered in "Design your agent" in Phase 3.
2. **Review & Referral (system 12).** I changed it to ask *every* traveller for a review, because
   Google's rules forbid asking only happy customers. Tell me if you see it differently.
3. **The Arabic text** on all new pages (about 1–2 hours). The system names in Arabic are my
   proposals; change any that do not sound right.
4. **How pricing works.** It shows no amounts. Check that the four parts and the founding-client
   wording match your offer.
5. **The FAQ page** (24 questions). Every answer needs your approval.
6. **About.** "What makes Lindrize different" uses only facts from the interview. Add or remove.
7. **Industries.** Eight fields with their best-fit systems, from your list.

## Still needed from you

| # | Question | What happens until you answer |
|---|---|---|
| 1 | Which systems can you deliver within about two weeks? | All but the Sales Assistant say "On request". |
| 2 | Do voice-note replies work today? | "Understands voice notes" is only a feature option for Phase 3. |
| 3 | How many founding-client places per discount? | The discounts show without "places left". |
| 4 | About page: languages you work in, a photo, LinkedIn or Instagram links. | None are shown. |
| 5 | Your name in Arabic. | Shown in Latin letters on Arabic pages. |
| 6 | Questions owners ask you on calls. | The FAQ uses questions drafted from the interview. |
| 7 | The Privacy Policy and Terms text. | Both pages show a notice and block launch. The checklist is in `docs/PRIVACY-TERMS-CHECKLIST.md`. |

## Checked automatically (all pass)

| Check | Result |
|---|---|
| Build and type check | 82 pages, 0 errors |
| Content rules | One main heading per page, language and direction set, unique titles and descriptions within length, security policy on every page |
| Plain wording | No "never say" words in visitor-facing text |
| Honesty | No unfinished text, no private email address, no ratings |
| Links | 2,692 internal links checked, 0 broken |
| Accessibility (axe, WCAG 2.2 AA) | 0 issues on every kind of page, in English and Arabic, light and dark |
| Behaviour | Search, filters, arrow keys, links from Industries, scripts off, all 60 system pages follow the same order |
| Right to left | Every kind of page in Arabic on a phone and a laptop: no sideways scroll, screenshots reviewed |
| Lighthouse (mobile) | 100 / 100 / 100 / 100 on six page types in both languages. Main content in under 0.9 s. Layout shift 0. |
| Browser tests | 95 of 95 pass |

Launch gate: 6 pages still block launch, as intended: "Design your agent" (Phase 3) and the
Privacy and Terms pages in both languages.
