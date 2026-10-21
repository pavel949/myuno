/**
 * Full guest → partner → admin loops for every bookable marketplace vertical.
 *
 * Skipped automatically when SUPABASE_SERVICE_ROLE_KEY is not configured
 * (e.g. local dev without e2e env) — see globalSetup.
 */
import { test } from '@playwright/test';
import { BOOKABLE_VERTICALS } from '../../fixtures/marketplaceVerticals';
import { runVerticalLoop } from '../../flows/marketplaceFlow';

test.describe('Marketplace · full transaction loop', () => {
  test.beforeAll(() => {
    test.skip(
      process.env.E2E_SEED_SKIPPED === '1',
      'Marketplace e2e requires SUPABASE_SERVICE_ROLE_KEY + E2E_TEST_TOKEN',
    );
  });

  for (const spec of BOOKABLE_VERTICALS) {
    test(`${spec.id} · guest → partner → admin`, async ({ browser }) => {
      test.slow(); // these loops are heavy
      await runVerticalLoop(browser, spec);
    });
  }
});
