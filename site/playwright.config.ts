import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the built site (dist/), so they test exactly what visitors get,
 * including the content security policy. Build first: `npm run build`.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 860 },
  },
  webServer: {
    command: 'node scripts/serve.mjs 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
