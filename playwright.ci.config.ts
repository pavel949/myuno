import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CI config: chromium-only, slower retries, marketplace seed enabled.
 * Used in .github/workflows/e2e.yml.
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 120_000,
  expect: { timeout: 10_000 },
  globalSetup: path.resolve(__dirname, './e2e/fixtures/seedListings.ts'),
  globalTeardown: path.resolve(__dirname, './e2e/fixtures/teardownListings.ts'),
  use: {
    baseURL: 'http://localhost:8099',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'vite --port 8099 --strictPort',
    url: 'http://localhost:8099',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { ...process.env, VITE_BYPASS_COMING_SOON: 'true' },
  },
});
