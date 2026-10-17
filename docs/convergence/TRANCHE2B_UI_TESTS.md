# Tranche 2B — isolated bookings-list UI regressions

Scope: original isolated tests plus the Tranche 2B runtime correction.
`MCBookingsPage.tsx` presentation is now changed; queries, mutations,
status/pricing/payment/permission/inventory contracts and schema are unchanged.
No production records or booking mutations were used.

## Files

- `src/pages/owner/MCBookingsPage.tsx`: the only runtime file changed in the
  correction. Full untruncated title above a single primary New Booking action
  on phones; export/sort moved into a secondary control area; mobile 2×2 KPIs;
  six bounded status choices (2 columns at 375, 3 at 390/430, 6 on desktop).
  Guest/contact/property text wraps instead of colliding with status/amount;
  guest/contact titles retain full labels. Cards are keyboard-focusable and
  Enter/Space opens detail; checkbox pointer/key/click propagation is isolated.
  Bulk count/actions intentionally wrap with 44px controls and existing gated
  confirmation. Shared components were not changed.

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
- Browser matrix: **8/8**, RU/EN × 375/390/430/1280. Keyboard Space and checkbox
  tap select without opening details; card opens the correct fixture;
  confirmation backout/submission use stubs only.
- Full H1 visibility and absence of ellipsis/element clipping asserted in all
  eight cases, including RU 375. List and selected-bar screenshots also saved.
- Document scroll width equals viewport width in all eight cases. Visible
  controls remain within horizontal bounds. No runtime errors or external
  requests observed. Each case records exactly two in-memory stub submissions.
- Latest automatic application build: **build OK**. No manual build or
  standalone typecheck was run. Diff whitespace check passes.
- Correction screenshots reviewed: `ru-375-selected.png`, `en-430-list.png`,
  `ru-1280-list.png`. Full heading, wrapped guest/property/contact fields,
  amounts/statuses and bounded controls are visible. Original test-only
  screenshots had exposed RU heading truncation; the runtime correction
  replaces that presentation, rather than merely documenting it.

## Verification limits

The detail sheet is a stub: these tests prove page selection/prop handoff,
not the real sheet's queries/history or internal actions. Rejected stub
submissions avoid reload and prove confirmation dispatch, not real successful
order mutations, permission enforcement or inventory updates. Shell/nav and
authenticated production journeys are not exercised. No unavailable query
error UI was fabricated. Earlier CI typecheck and Stripe journey blockers
remain documented separately in TRANCHE1_REMAINING_CHECKS.md.