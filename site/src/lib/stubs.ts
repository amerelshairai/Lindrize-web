/**
 * Pages that the menu and footer link to but that are written in a later phase.
 * Each one shows a short "being written" notice and is hidden from search engines.
 * The launch check (scripts/check-content.mjs --launch) fails while this list is not empty,
 * so the site can never go live with an unfinished page.
 */
export const STUB_PAGES: readonly string[] = ['/design-your-agent/'];
