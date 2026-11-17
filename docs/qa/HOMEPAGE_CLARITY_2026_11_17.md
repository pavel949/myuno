# Homepage clarity — 17 November 2026

Base: `0e599eaf467eed60d49f7f86e417f93bf364c345` (main, PR #213).
Scope: public anonymous homepage only; no tokens, shared navigation primitives, auth, database or production changes.

## Changes
- Keep four direct hero intents; remove the repeated search-shaped discovery link and tenancy row.
- Reduce content-driven hero spacing and make the owner entry secondary.
- Put experiences/services before new developments; preserve the experiences catalogue route on empty photo previews with an honest empty state.
- Keep the partner grid for owners/operators/developers/providers; remove the consumer card and duplicate owner panel.
- Align rental-card content; replace dual rent/buy links in the rental showcase with a single rental-detail action.
- Preserve every canonical recorded tariff. If different periods carry the same amount, request confirmation explicitly in RU/EN/TH. Equality is not proof either amount is incorrect. No guessed correction, conversion or database edit.

## Verification
- 160 tests passed in 19 homepage/component suites, including RU/EN/TH, empty/error/loading, intent routing, tariff preservation, media failure and auth-loading separation.
- Design-system audit: zero new/structural findings (existing baseline remains).
- Scoped ESLint: zero errors, three pre-existing warnings.
- Independent read-only source review: no blocking homepage logic findings.
- Isolated browser fixture compiled from actual components with synthetic reads; production client excluded.
- Chromium could not launch: `socket() failed: Operation not permitted`, also after authorized sandbox escalation. No mobile/desktop screenshot acceptance claimed.
- Production build stopped during transform (`Killed`), not a successful build.
- Initial default-heap typecheck ran out of memory; larger-heap retry recorded separately below.
- Initial concurrent broad suite had an unrelated RoleSheet timeout; bounded final rerun passed all 160 tests without skips or assertion weakening.

## Remaining gates
Actual responsive visual review (375/390/430 + desktop), full build/typecheck/CI on the exact candidate, and current-main overlap reconciliation before integration. Other active platform design work is separate. This is a draft, not a deployment.

Data-source verification of Canvas tariffs and editing database-authored listing titles remain outstanding. Shared `/search` taxonomy/field accessibility is deliberately outside this narrowly coordinated homepage change.
