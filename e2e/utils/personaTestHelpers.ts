/**
 * Persona / Onboarding E2E helpers — M5 H.7 automation
 *
 * These helpers cover the canonical M5 flows so the E2E suite can exercise:
 *   1. /account → PersonaDetectionPreview (empty + filled + refine loop)
 *   2. Home → PersonaPromptBanner (visible/dismiss/CTA)
 *   3. Anon onboarding → signup → backfill verification (best-effort,
 *      auto-skipped when the env enforces email confirmation)
 *
 * Strategy:
 *   - "Seed login" path uses `test-admin@myuno.app` (a0000000…05). We reset
 *     its canonical persona columns via the public Supabase REST API as the
 *     authenticated user before each spec, so it always starts from the
 *     "empty" state.
 *   - "Fresh signup" path generates a unique email (`e2e-${ts}@myuno.app`)
 *     and signs up through the UI; if email-confirmation is enforced in the
 *     environment, the helper exposes `await session()` returning `null`,
 *     letting specs `test.skip()` cleanly.
 */
import { Page, expect, request as pwRequest } from '@playwright/test';

export const SEED_ADMIN = {
  id: 'a0000000-0000-0000-0000-000000000005',
  email: 'test-admin@myuno.app',
  password: 'TestPass123!',
} as const;

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://kakkwibljrjsawxgnupk.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk';

/**
 * Sign in via Supabase REST password grant (no UI), returning the access
 * token. Cheaper + more reliable than driving the auth form for setup work.
 */
async function getSeedAdminToken(): Promise<string | null> {
  const ctx = await pwRequest.newContext();
  try {
    const res = await ctx.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        data: {
          email: SEED_ADMIN.email,
          password: SEED_ADMIN.password,
        },
      },
    );
    if (!res.ok()) return null;
    const body = await res.json();
    return (body?.access_token as string) ?? null;
  } catch {
    return null;
  } finally {
    await ctx.dispose();
  }
}

/**
 * Reset the seed admin's canonical persona columns so /account renders the
 * "empty" state. Uses PostgREST PATCH as the authenticated user — RLS allows
 * a user to update their own profile.
 */
export async function resetSeedAdminPersona(): Promise<void> {
  const token = await getSeedAdminToken();
  if (!token) {
    throw new Error('resetSeedAdminPersona: failed to authenticate seed user');
  }
  const ctx = await pwRequest.newContext();
  try {
    const res = await ctx.patch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${SEED_ADMIN.id}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        data: {
          lifecycle_stage: null,
          detected_persona: null,
          detected_persona_confidence: null,
          active_clusters: [],
        },
      },
    );
    if (!res.ok()) {
      const text = await res.text();
      throw new Error(
        `resetSeedAdminPersona: PATCH failed ${res.status()} — ${text}`,
      );
    }
  } finally {
    await ctx.dispose();
  }
}

/**
 * Drive the /auth UI to log in as the seed admin. Used when the spec needs
 * the page to be authenticated end-to-end (cookies, localStorage, etc).
 */
export async function loginAsSeedAdmin(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Make sure we are on the login tab (default), then fill and submit.
  await page.locator('input[type="email"]').first().fill(SEED_ADMIN.email);
  await page.locator('input[type="password"]').first().fill(SEED_ADMIN.password);

  const loginBtn = page
    .locator(
      '[data-testid="login-button"], button:has-text("Login"), button:has-text("Войти"), button:has-text("Sign in")',
    )
    .first();
  await loginBtn.click();

  // After login the app routes to / or /account. Either is fine here.
  await page.waitForLoadState('networkidle');
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 15000 });
}

/**
 * Try to sign up a brand-new user through the UI with a unique email.
 * Returns the email used and a `confirmed` flag — if the environment
 * requires email confirmation, the resulting session won't exist and
 * `confirmed` will be `false` so the spec can soft-skip.
 */
export async function signupFreshUser(
  page: Page,
): Promise<{ email: string; confirmed: boolean }> {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1000)}@myuno.app`;
  const password = 'E2eSecurePass123!';

  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  const signupTab = page
    .locator('button:has-text("Sign up"), button:has-text("Регистрация"), [data-value="signup"]')
    .first();
  if (await signupTab.isVisible().catch(() => false)) {
    await signupTab.click();
  }

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);

  const confirm = page.locator(
    'input[name="confirmPassword"], input[placeholder*="confirm" i], input[placeholder*="ещё раз" i]',
  );
  if (await confirm.first().isVisible().catch(() => false)) {
    await confirm.first().fill(password);
  }

  const submit = page
    .locator(
      '[data-testid="signup-button"], button[type="submit"]:has-text("Sign"), button[type="submit"]:has-text("Зарегистр")',
    )
    .first();
  await submit.click();

  // Either the app redirects (= session, confirmed) or shows a "check email"
  // toast (= unconfirmed). We wait briefly for whichever happens.
  const navigated = await page
    .waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  return { email, confirmed: navigated };
}

/**
 * Walk the StartOnboardingV2 flow with a deterministic answer set:
 *   Q1 lifecycle = tourist
 *   Q2 role = consumer
 *   Q3 modifiers = (none)
 * Returns when the result step is rendered.
 */
export async function completeCanonicalOnboarding(page: Page): Promise<void> {
  await page.locator('[data-testid="onboarding-lifecycle-tourist"]').click();
  await page.locator('button:has-text("Continue"), button:has-text("Дальше")').first().click();

  await page.locator('[data-testid="onboarding-role-consumer"]').click();
  await page.locator('button:has-text("Continue"), button:has-text("Дальше")').first().click();

  // Q3 — skip selecting any modifier and go straight to finish.
  await page
    .locator('button:has-text("See my recommendations"), button:has-text("Показать рекомендации")')
    .first()
    .click();

  await expect(page.locator('[data-testid="onboarding-result"]')).toBeVisible({
    timeout: 20000,
  });
}
