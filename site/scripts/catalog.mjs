/**
 * Keeps the email receiver's list of allowed choices in step with the website.
 *   node scripts/catalog.mjs          copies dist/design-catalog.json to ../receiver/catalog.json
 *   node scripts/catalog.mjs --check  fails if the two differ (run after every build)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const built = fileURLToPath(new URL('../dist/design-catalog.json', import.meta.url));
const target = fileURLToPath(new URL('../../receiver/catalog.json', import.meta.url));
const fresh = readFileSync(built, 'utf8');

if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== fresh) {
    console.error('✗ receiver/catalog.json is out of date. Run "npm run catalog" in site/ and commit the result.');
    process.exit(1);
  }
  console.log('✓ The receiver knows every choice the builder offers');
} else {
  writeFileSync(target, fresh);
  console.log('Updated receiver/catalog.json');
}
