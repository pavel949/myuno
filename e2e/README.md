# E2E tests

Playwright suite covering smoke + full marketplace transaction loops for all
11+ marketplace verticals before commercial launch.

## Quick start (local)

```bash
# 1. Env (one-time) — put into .env.e2e or export in shell
export VITE_SUPABASE_URL=https://kakkwibljrjsawxgnupk.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
export SUPABASE_SERVICE_ROLE_KEY=<service role key>   # only for marketplace seed
export E2E_TEST_TOKEN=<must match Supabase secret>    # only for full loop

# 2. Install browsers (one-time)
bunx playwright install chromium

# 3. Run
bunx playwright test                           # all (default config, chromium + mobile)
bunx playwright test --project=chromium        # chromium only
bunx playwright test e2e/tests/marketplace     # marketplace folder only
bunx playwright test --config=playwright.ci.config.ts  # mirror CI exactly
```

## Without service role key

`globalSetup` detects missing `SUPABASE_SERVICE_ROLE_KEY` and sets
`E2E_SEED_SKIPPED=1`. The marketplace full-loop specs auto-skip in that case;
discover-filter smokes still run.

## Test layout

```
e2e/
├── fixtures/
│   ├── marketplaceVerticals.ts  — vertical registry for e2e
│   ├── seedListings.ts          — globalSetup (insert 1 listing/vertical)
│   ├── teardownListings.ts      — globalTeardown (delete by run_id)
│   ├── multiActor.ts            — loginAs(role) → isolated browser context
│   ├── serviceClient.ts         — service-role Supabase client
│   ├── auth.fixture.ts          — existing
│   └── testUsers.ts             — existing
├── flows/
│   └── marketplaceFlow.ts       — runVerticalLoop / runSmoke
├── pages/                       — existing POMs
└── tests/
    ├── marketplace/
    │   ├── discover-filters.spec.ts  — 20 smokes (all verticals)
    │   └── vertical-loops.spec.ts    — 17 full loops (bookable)
    ├── auth/ booking/ navigation/ onboarding/ vendor/ wallet/  — existing
    └── simulation.spec.ts
```

## Payment mock — `e2e-mark-paid` edge function

Real Stripe checkout is not exercised in e2e. Instead the loop calls
`POST /functions/v1/e2e-mark-paid` with an `x-e2e-token` header. The function:

1. Validates `x-e2e-token` against the `E2E_TEST_TOKEN` Supabase secret.
2. Refuses to touch any order whose `metadata.e2e_seed !== true` — production
   orders are safe by construction.
3. Sets `status='paid'`, `paid_at=now()`, inserts a `payment_intents` row, and
   best-effort calls `record_ledger_entries` RPC.

A real Stripe end-to-end test is intentionally out of scope for the pre-launch
gate — see `.lovable/plan.md` for follow-ups.

## Required Supabase secret

Add `E2E_TEST_TOKEN` (random 32+ char string) as a Supabase Edge Function
secret. The exact same value must be configured as a GitHub Actions secret
named `E2E_TEST_TOKEN` for CI runs.

## CI

`.github/workflows/e2e.yml` runs on every PR against `main` using
`playwright.ci.config.ts`. Required GH secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_TOKEN`

Report is uploaded as the `playwright-report` artifact for 14 days.

## Adding a new vertical

1. Add row to `e2e/fixtures/marketplaceVerticals.ts`.
2. If the vertical has its own table (not `public.listings`), extend
   `seedListing()` in `seedListings.ts`.
3. If the discover route or CTA differs, override `discoverPath` / `ctaText`.

## Known limitations (intentional)

- Stripe redirect is mocked (see above).
- Mobile viewport runs locally only — disabled in CI for speed.
- ClearView / Newbuilds flows live under `/newbuilds` and are covered
  separately.
- Partner refusal / refund paths are next-wave work.
