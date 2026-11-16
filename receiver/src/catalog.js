/**
 * The list of choices the builder offers. The copy shipped with the receiver is always the
 * starting point. When CATALOG_PATH points at the published site's own copy, that one is used
 * and re-read after each publish, so a content edit never needs the receiver to be rebuilt.
 * A missing or broken file is ignored and the last good list stays in use.
 */
import { readFileSync, statSync } from 'node:fs';

const LISTS = ['types', 'sizes', 'problems', 'systems'];
const MAX_BYTES = 512 * 1024;
const RECHECK_MS = 30_000;

export const looksValid = (catalog) =>
  catalog !== null &&
  typeof catalog === 'object' &&
  LISTS.every((key) => catalog[key] !== null && typeof catalog[key] === 'object' && Object.keys(catalog[key]).length > 0);

export function createCatalog({ bundled, path = null, log = () => {}, now = Date.now }) {
  let current = bundled;
  let stamp = '';
  let checkedAt = -Infinity;

  return function catalog() {
    if (!path || now() - checkedAt < RECHECK_MS) return current;
    checkedAt = now();
    try {
      const info = statSync(path);
      const seen = `${info.mtimeMs}:${info.size}:${info.ino}`;
      if (seen === stamp) return current;
      stamp = seen;
      if (info.size > MAX_BYTES) throw new Error('too large');
      const fresh = JSON.parse(readFileSync(path, 'utf8'));
      if (!looksValid(fresh)) throw new Error('unexpected shape');
      current = fresh;
      log('catalog-updated');
    } catch {
      log('catalog-unreadable');
    }
    return current;
  };
}
