/**
 * M5 H.7 — Anon → user backfill (best-effort)
 *
 * Verifies that a user who completes canonical onboarding while anonymous
 * and then signs up gets their `concierge_sessions` / `persona_detection_log`
 * rows backfilled with their new `user_id`.
 *
 * Auto-skip behaviour:
 *   - If the environment requires email confirmation, signup will not
 *     produce an active session and we cannot complete the test deterministically.
 *     The spec calls `test.skip()` with an explanatory message instead of
 *     failing — flip Lovable Cloud auth to "auto-confirm" to enable it.
 */
import { test, expect } from '@playwright/test';
import {
  completeCanonicalOnboarding,
  signupFreshUser,
} from '../../utils/personaTestHelpers';

test.describe('M5 — anon → user backfill', () => {
  test('anon onboarding → signup backfills the canonical session', async ({
    page,
  }) => {
    // 1. Anon flow: complete /start/v2 without logging in.
    await page.goto('/start/v2');
    await page.waitForLoadState('networkidle');
    await completeCanonicalOnboarding(page);

    // 2. Capture the local anon_session_id the app stored, so we can later
    //    verify backfill against this exact row.
    const anonId = await page.evaluate(() => {
      try {
        return (
          localStorage.getItem('myuno_anon_session_id') ||
          localStorage.getItem('myuno-anon-session-id') ||
          null
        );
      } catch {
        return null;
      }
    });
    expect(anonId, 'expected an anon_session_id in localStorage').not.toBeNull();

    // 3. Sign up. If env requires email confirmation, soft-skip.
    const { email, confirmed } = await signupFreshUser(page);
    test.skip(
      !confirmed,
      `Signup required email confirmation (env policy). Re-run with auto-confirm enabled. email=${email}`,
    );

    // 4. After signup, AuthContext backfill should attach this user to the
    //    anon session within a few seconds. We simply verify the auth state
    //    is present and the home/account page loads — full DB verification
    //    requires a service-role key, which intentionally is NOT shipped to
    //    Playwright. Treat this as a smoke check for the backfill side-effect.
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15000 });

    // Visit /account — if backfill worked, PersonaDetectionPreview must
    // render the *filled* state (the canonical proposal saved while anon
    // is now linked to this user via AuthContext).
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-testid="persona-preview-filled"]'),
    ).toBeVisible({ timeout: 20000 });
  });
});
