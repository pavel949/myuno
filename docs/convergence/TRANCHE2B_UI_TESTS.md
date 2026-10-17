# Tranche 2B — isolated bookings-list UI regressions

Scope: test-only additions. `MCBookingsPage.tsx`, its runtime components,
queries, mutations, status/pricing/payment/permission/inventory contracts and
schema are unchanged. No production records or booking mutations were used.

## Files

- `src/pages/owner/__tests__/bookingsList.fixtures.ts`: two synthetic bookings
  with long RU/EN names, property titles, email, phone and formatted amounts.
- `src/pages/owner/__tests__/MCBookingsPage.test.tsx`: isolated component tests.
- `scripts/qa/bookings-list-ui.mjs`: test-only browser bundle of the real page
  and current controls; replaces hooks, client, detail and feedback boundaries.
- `scripts/qa/bookings-list-ui.py`: browser interactions and width checks;
  serves generated test files through request interception, denies other traffic.
- `AGENTS.md`: regression isolation rule.
- `roadmap.md`: task completion.
- This report.

## Repeatable checks

```sh
bun run test src/pages/owner/__tests__/MCBookingsPage.test.tsx
node scripts/qa/bookings-list-ui.mjs
git diff --check
```

The browser runner requires the existing preview at localhost:8080 only to
fetch its compiled stylesheet. It never boots the application, restores auth,
loads real data or invokes the real client. No persistent test route is added.
Generated JS/CSS/HTML, JSON results and screenshots stay under
`/tmp/browser/bookings-list-isolated`.

## Results

- Component tests: **12/12** in RU/EN; select/deselect without details,
  selected card opens/closes the detail boundary, both bulk actions require
  confirmation, No never submits, Yes passes the exact selected ID/status to
  an in-memory stub, select-all/clear, loading/empty fixtures.
- Browser matrix: **6/6**, RU/EN × 375/390/430. Keyboard Space and checkbox
  tap select without opening details; card opens the correct fixture;
  confirmation backout/submission use stubs only.
- Document scroll width equals viewport width in all six cases. Visible
  controls remain within horizontal bounds. No runtime errors or external
  requests observed. Each case records exactly two in-memory stub submissions.
- Latest automatic application build: **build OK**. No manual build or
  standalone typecheck was run. Diff whitespace check passes.
- Screenshot review: RU 375 confirmation and EN 430 cancellation reviewed.
  The RU heading is truncated at 375 ("Бро…"); long card fields also truncate
  according to existing presentation. No presentation fix or claim of full
  text visibility is made in this test-only tranche.

## Verification limits

The detail sheet is a stub: these tests prove page selection/prop handoff,
not the real sheet's queries/history or internal actions. Rejected stub
submissions avoid reload and prove confirmation dispatch, not real successful
order mutations, permission enforcement or inventory updates. Shell/nav and
authenticated production journeys are not exercised. No unavailable query
error UI was fabricated. Earlier CI typecheck and Stripe journey blockers
remain documented separately in TRANCHE1_REMAINING_CHECKS.md.