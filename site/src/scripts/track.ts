/**
 * Anonymous event counting (SPEC 14.1). Umami is added in Phase 5; until then this does nothing.
 * Never pass names, emails, phone numbers or free text here.
 */
type Umami = { track: (event: string, data?: Record<string, string | number>) => void };

export function track(event: string, data?: Record<string, string | number>): void {
  try {
    (window as unknown as { umami?: Umami }).umami?.track(event, data);
  } catch {
    /* Counting must never break the page. */
  }
}
