import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the built site (`astro preview`), so they test exactly what visitors
 * get, including the content security policy.
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
    command: 'npm run preview -- --port 4321 --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
