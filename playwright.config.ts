import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [['html'], ['list']],
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:8099',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    // Cold Vite compile + parallel workers can exceed 15s first paint
    navigationTimeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    // Dedicated port so e2e never hijacks a developer's :8080 session; must pass bypass gate
    command: 'vite --port 8099 --strictPort',
    url: 'http://localhost:8099',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    // ComingSoonGate hides the real SPA from guests unless bypassed — required for smoke e2e
    env: { ...process.env, VITE_BYPASS_COMING_SOON: 'true' },
  },
});
