/**
 * Pages that the menu and footer link to but that are written in a later phase.
 * Each one shows a short "being written" notice and is hidden from search engines.
 * The launch check (scripts/check-content.mjs --launch) fails while this list is not empty,
 * so the site can never go live with an unfinished page.
 */
export const STUB_PAGES: readonly string[] = [
  '/solutions/',
  '/solutions/ai-travel-sales-assistant/',
  '/solutions/quote-follow-up/',
  '/solutions/customer-reactivation/',
  '/solutions/group-registration/',
  '/solutions/leads-bookings-dashboard/',
  '/industries/',
  '/pricing/',
  '/design-your-agent/',
  '/faq/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
];
