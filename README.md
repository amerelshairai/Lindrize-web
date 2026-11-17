# Lindrize-web

Website for Lindrize, a founder-led studio in Amman building AI sales assistants for travel agencies in Jordan and the GCC.

Fast, bilingual (English/Arabic) site built with Astro. Self-hosted, accessible and cookie-free, with no invented reviews or numbers.

## Start here

- `SPEC.md`: what the site must be (approved).
- `PLAN.md`: how it gets built, phase by phase, and the decision rule for the build.
- `SPEC-INPUTS.md`: brand, demo data, business name and contact answers.
- `brand/`: logos, favicons, share image.
- `content/demo/`: the fictional demo agency's packages and FAQs (not travel advice).
- `docs/design-samples/`: the design and motion drafts approved during the interview.
- `docs/DECISIONS.md`: changes made during the build, and why.
- `HOW-TO-EDIT.md`: how the owner changes text, and how to undo.
- `docs/SERVER-SETUP.md`, `docs/DNS-MOVE.md`, `docs/LAUNCH-CHECKLIST.md`, `docs/SEO-SETUP.md`: going live, step by step.
- `arabic-pages.md`: every Arabic text on the site, page by page, for proofreading (`node scripts/export-arabic.mjs` in `site/` rewrites it).
- `docs/LEGAL-REVIEW.md`: what the owner confirms before approving the legal pages.
- `server/`: the web server rules, background services and publish scripts, with their tests.

## Preview the site on your computer

You need Node.js 22 or newer.

```bash
cd site
```

```bash
npm ci
```

```bash
npm run dev
```

Then open http://localhost:4321 (Arabic: http://localhost:4321/ar/).

## Run the checks

```bash
npm run check
```

```bash
npm test
```

```bash
npm run lighthouse
```

`npm run check` builds the site and checks types, content rules and links. `npm test` runs the
accessibility, keyboard and behaviour tests in a browser. `npm run lighthouse` checks the speed
targets. All three also run automatically on GitHub for every change.
