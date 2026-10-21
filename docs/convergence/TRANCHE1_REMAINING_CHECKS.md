# Tranche 1 remaining verification — 2026-10-17

## Outcome

Neither outstanding gate is closed. No Tranche 2 work, production payment,
guest-booking update, payment-mode change, or new inventory record was performed.

## Independent CI typecheck: blocked

- `.github/workflows/verify.yml` already has a blocking `npm run typecheck` step
  and supports `workflow_dispatch`; its thresholds were not changed.
- No accessible GitHub connector connection is available to this session.
- Neither `GH_TOKEN` nor `GITHUB_TOKEN` is present. The configured Git remote is
  Lovable internal storage, not an identified external GitHub Actions repository.
- No matching GitHub Actions app MCP was found.
- Consequently no workflow was dispatched and no remote job URL, run ID,
  source SHA or separate typecheck exit status was obtained.
- Manual builds/typechecks are forbidden by workspace policy. Automatic
  `build OK` evidence does not establish the requested independent typecheck.

Required next input: access to the actual synced GitHub repository through an
authorized GitHub connection, or a CI run/log for its exact source SHA.

## Full Stripe booking journey: blocked on isolation

Verified read-only:

- `system_settings.stripe_mode` is `test`.
- The available `STRIPE_SECRET_KEY` has a test-mode credential prefix; its value
  was not disclosed. This does not independently prove the deployed key or the
  matching deployed webhook endpoint/secret.
- The Stripe account can be read successfully.
- A name-based query found zero properties explicitly labelled `[TEST]`,
  `test resort`, `test hotel`, or Tranche/QA test inventory. This is not proof
  that no unlabelled disposable inventory exists; none was identified or approved.

Safety evidence:

- `create-property-deposit-checkout/index.ts:298–340` persists the commercial
  order and verifies a real `property_bookings` hold before creating Checkout.
- `_shared/stripe.ts:13–16` uses the configured key, not a per-request test-mode
  override or isolated database.
- `stripe-webhook/index.ts:159–218` confirms the order and records payment and
  status history; `:253–269` invokes confirmation email processing.
- Test-mode payment therefore does not isolate booking, calendar, accounting
  or notification writes in the shared production database.

No Checkout session was created and no test card submitted. A standalone Stripe
API payment would not verify the canonical booking → hold → payment → webhook →
owner/calendar/ledger journey and is not presented as an end-to-end result.

Required safety prerequisites: positively identified disposable inventory and
test identity, verified deployed test-key/webhook pairing, and contained or
explicitly approved notification/accounting side effects. Alternatively use a
genuinely isolated backend with the same canonical code; a Lovable draft is not
such an environment. None was provisioned or enabled in this verification pass.

## Executed checks

`bun run test -- src/lib/__tests__/hotelQuote.test.ts
src/lib/__tests__/propertyQuote.test.ts src/lib/__tests__/propertyInventory.test.ts
src/lib/__tests__/propertyInventory.postgres.test.ts
src/lib/__tests__/checkoutPaymentGuard.test.ts`

- Five files, **70/70 passing**, exit **0**.
- Includes real isolated PostgreSQL exclusion/assignment/writer/rollback tests;
  it is not a deployed Stripe journey or a typecheck.
- Current source HEAD when these tests completed:
  `9ace07885f51ec58c3d08222a29bbbd0334f1590`.

Recommendation: keep Tranche 2 paused until independent CI evidence and the
isolated full payment journey are available; do not relax either gate.