import { defineConfig } from '@playwright/test';

/**
 * Employee-app browser suite. Runs against a LOCAL stack only:
 *   - backend: BACKEND/test/qa/e2e-server.ts  (scratch DB, synthetic data, no external traffic)
 *   - web:     `VITE_API_URL=http://localhost:3100/api/v1 npx vite --port 5174 --strictPort`
 * Uses the system Chrome (channel: 'chrome') so no browser download is needed.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa/results/e2e.json' }],
    ['junit', { outputFile: 'qa/results/e2e-junit.xml' }],
  ],
  outputDir: 'qa/results/e2e-artifacts',
  use: {
    baseURL: process.env.QA_WEB_URL ?? 'http://localhost:5174',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
});
