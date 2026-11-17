# Inquiry date-price lifecycle correction

Base: main `0e599eaf467eed60d49f7f86e417f93bf364c345`.

## Cause and minimal correction
`PropertyInquiry` parsed URL strings into fresh Date objects on every render.
Its date-price read effect depended on those objects and updated local state,
restarting itself and cancelling prior responses. Memoizing the two parsed dates
by the URL strings stabilizes the existing effect without changing civil-date
parsing, RPC arguments, canonical pricing, auth, submission, payment or inventory.

## Evidence
- Actual-page synthetic integration test against original source fails with the
  bounded `Inquiry pricing render loop` guard; the corrected source passes.
- Four lifecycle cases cover one settled read, contact edits/parent rerenders,
  changed URL dates and stale responses, explicit error retry, and missing dates.
- Two existing submission/idempotency guard tests also pass.
- Scoped ESLint: zero errors, two existing hook-dependency warnings elsewhere in
  the component. No baseline or lint suppression changes.
- No live booking, payment, database write or notification was performed.

## Limits
This fixes repeated client reads; it does not establish server pricing accuracy,
booking availability, financial readiness, or production deployment. Exact-head
CI/build and browser acceptance remain release gates. Do not merge financial
activation candidates as a side effect of this narrowly scoped change.
