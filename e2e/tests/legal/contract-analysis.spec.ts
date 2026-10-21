import { test, expect } from '@playwright/test';

/**
 * Smoke for /legal/contract-analysis (ContractAI A-2).
 *
 * Strategy: avoid real Gemini/Stripe calls. We intercept the two edge
 * function endpoints and assert that:
 *   1. Page renders the upload UI.
 *   2. Free preview is requested when user uploads a file + clicks "Free preview".
 *   3. After preview, the paywall renders and "Unlock" calls create-contract-checkout.
 */

const ANALYZE_RE = /\/functions\/v1\/analyze-contract/;
const CHECKOUT_RE = /\/functions\/v1\/create-contract-checkout/;

test.describe('ContractAI smoke', () => {
  test('renders upload UI, runs mocked preview, triggers mocked checkout', async ({ page }) => {
    let analyzeCalls = 0;
    let checkoutCalls = 0;

    await page.route(ANALYZE_RE, async route => {
      analyzeCalls += 1;
      const body = route.request().postDataJSON?.() ?? {};
      // preview branch only — full requires status=paid which we do not exercise here
      expect(body.mode).toBe('preview');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          analysisId: 'analysis-mock-123',
          preview: {
            risk_score: 7,
            summary: 'Mock risk summary for smoke test.',
            top_red_flag: 'Mock red flag clause.',
          },
        }),
      });
    });

    await page.route(CHECKOUT_RE, async route => {
      checkoutCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'about:blank#stripe-mock' }),
      });
    });

    await page.goto('/legal/contract-analysis');

    // Heading visible
    await expect(page.getByRole('heading', { name: /ContractAI/i })).toBeVisible({ timeout: 20_000 });

    // Free preview button starts disabled
    const previewBtn = page.getByRole('button', { name: /(Free preview|Бесплатное превью)/i });
    await expect(previewBtn).toBeDisabled();

    // Upload a tiny text contract
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-contract.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a sample lease contract for smoke testing.'),
    });

    await expect(previewBtn).toBeEnabled();
    await previewBtn.click();

    // Preview block appears
    await expect(page.getByText(/(Risk score|Оценка риска)/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Mock risk summary/)).toBeVisible();
    expect(analyzeCalls).toBeGreaterThanOrEqual(1);

    // Unlock paywall → checkout
    const unlockBtn = page.getByRole('button', { name: /(Unlock|Открыть|4,900|4900)/i }).first();
    await expect(unlockBtn).toBeVisible({ timeout: 5000 });

    // Prevent navigation to the mock stripe URL from breaking the run
    await page.evaluate(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...window.location, set href(v: string) { (window as any).__redir = v; } },
      });
    }).catch(() => { /* JSDOM-style guard; ignore if not possible */ });

    await unlockBtn.click();
    await expect.poll(() => checkoutCalls, { timeout: 8000 }).toBeGreaterThanOrEqual(1);
  });

  test('edge function CORS preflight (analyze-contract + create-contract-checkout)', async ({ request }) => {
    const base = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
    test.skip(!base, 'VITE_SUPABASE_URL not set; skipping live preflight check');

    for (const fn of ['analyze-contract', 'create-contract-checkout']) {
      const res = await request.fetch(`${base}/functions/v1/${fn}`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type',
          Origin: 'http://localhost:8099',
        },
      });
      expect(res.status(), `${fn} preflight`).toBeLessThan(400);
      expect(res.headers()['access-control-allow-origin']).toBeTruthy();
    }
  });
});
