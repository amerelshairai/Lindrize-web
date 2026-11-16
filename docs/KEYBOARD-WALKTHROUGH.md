# Keyboard walkthrough

Done on 16 November 2026 on the built site, in English and Arabic, on a laptop width (1280px) and
a phone width (390px). Only the standard keys are used: **Tab** and **Shift+Tab** move between
controls, **arrow keys** move inside a group, **Enter** or **Space** presses, **Escape** closes.

Every item below is also covered by an automatic test that runs on each change
(`site/tests/keyboard.spec.ts`, `design.spec.ts`, `pages.spec.ts`, `every-page.spec.ts`).

## Every page

| Check | Result |
|---|---|
| The first Tab shows "Skip to content", and Enter moves to the page content | Pass |
| Order follows the page: skip link, header, content, footer | Pass (38 stops on Home, 59 on Solutions, 30 on Design your agent) |
| Every control can be reached and shows a clear outline when focused | Pass |
| Focus is never hidden behind the sticky header | Pass |
| The menu marks the current page | Pass |
| Arabic pages follow the same order, right to left | Pass |

## Header

| Check | Result |
|---|---|
| Language switch, light/dark switch and "Book a call" work with Enter | Pass |
| Phone: the Menu button opens the menu with Enter, Escape closes it and returns focus to the button | Pass |
| Phone: the booking bar at the bottom is reached after the footer and is skipped while hidden | Pass |

## Booking dialog

| Check | Result |
|---|---|
| Enter on "Book a 15-minute call" opens the dialog and keeps focus inside it | Pass |
| Escape closes it, and focus returns to the button that opened it | Pass |
| The calendar frame has a name for screen readers ("Calendly booking calendar") | Pass |

## Home

| Check | Result |
|---|---|
| The sample questions are tabs: one Tab stop, arrow keys move and select, Home and End jump | Pass |
| "Replay" under the demo chat works with Enter (hidden when the visitor asked for reduced motion) | Pass |
| With reduced motion, everything is shown finished and nothing moves | Pass |

## Solutions

| Check | Result |
|---|---|
| The search box, the "what you need" choices (arrow keys) and the "your field" list all work | Pass |
| The number of systems shown is announced when it changes | Pass |
| Each system row is one link | Pass |

## Design your agent

| Check | Result |
|---|---|
| Choices in each step are radio groups: Tab enters, arrow keys choose | Pass |
| "Next" without a choice explains what is missing and moves focus to the first choice | Pass |
| Moving to a new step moves focus to that step's heading | Pass |
| The system list is a standard drop-down | Pass |
| Play, Pause, Replay and the "With / Without" buttons work with Enter and say their state | Pass |
| The example panel can be scrolled with the keyboard on short screens | Pass |
| The email box: errors are written in words, linked to the field and read aloud | Pass |

## Not possible to test by machine

A real screen reader pass (NVDA on Windows, VoiceOver on iPhone, TalkBack on Android) is worth
doing once before launch, in Arabic and English. The site is built for it: landmarks, one main
heading per page, labels on every icon button, and Arabic text marked as Arabic.
