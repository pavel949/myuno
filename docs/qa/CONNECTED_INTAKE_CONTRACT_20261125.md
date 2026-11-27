# #347 first containment tranche: catalogue intake and legacy replay

Baseline: d151a23cf0526d6ae9183f2a7cc2f34ec8e6f25d. On 25 November, SELECT-only inspection of the live Lovable database confirmed that the CHECK constraint on consultation_requests admits vacation_rental, property_consultation, property_tour, full_management, investment_advice and the dedicated tours/tour_booking exception. The new catalogue form supplied property_rental_search and property_purchase_search, neither admitted. The general RPC creates a fresh UUID and has no request-key handling; the separate submit_experience_inquiry RPC has its own receipt/key mechanism.

## Implementation
Use the existing consultation path and actual catalogue query parser, allowlist metadata, preserve valid criteria/THB bands, never label long-stay requests as nightly rental, and expose the acknowledged UUID. No new request table or booking/payment state. Generic search intake is residential only; the dedicated experience form retains its separately verified explicit replay opt-in. All default clients now refuse replay of an uncertain general RPC, including after a remount; only the actual receipt-backed experience adapter and isolated candidate tests opt in. This is containment, not a server-side duplicate guarantee. On definite validation rejection, correction remains available. Search receipt does not certify delivery; the operator can use the ID. Invalidation covers existing consultations, Inbox and the signed-in user's requests.

## Validation / rollout
Added/revised isolated Vitest regressions for admitted types, search criteria/clear precedence, price basis, unknown keys, uncertain retries and confirmed replays. No production SQL/Edge/role/business writes. Exact-head CI and isolated browser tests are required before merge. Direct repository clone is unavailable in this runtime (DNS); no new locally run Vitest or full build is claimed. Existing review-only general consultation writer (docs/hardening/consultation-intake) and #310 need compatibility review with the current experience-specific writer; do not activate either as a side effect of this PR. Full server allowlist, idempotency, notification delivery, finance, roles and other connected gates remain in #347. Rollback: revert the frontend/test changes only; do not re-enable unsafe general replay without a verified server contract.


## Integrated review, 2026-11-27
Source from PR #348 (head 7ba45349407b3096daf9daa807537141c25223bc) is integrated into a readiness branch based on main b8aed6df. The later rental fixture denial boundary is replaced by one synthetic receipt writer, retaining the explicit ban on bundling live backend modules. Review also repaired loss of the homepage maxPrice sale cap: the enquiry intersects it with the same price band as catalogue results. Conflicting numeric bounds are withheld rather than inventing a valid budget; original allowlisted search criteria remain available to the team. Catalogues and canonical URLs are preserved. No SQL, Edge, credentials or production mutations are included.

### Verification before main refresh
- 98 focused tests passed across ten files, including the actual enquiry form and existing Inbox/consultation handoffs.
- Rental UI: 24 isolated browser cases passed (15 language/viewport combinations, six theme/contrast cases, loading/empty/error states); synthetic receipt writer only, no external requests.
- TypeScript, changed-file ESLint, design audit (zero new/structural), generated register and diff checks passed.
- Snapshot-only commit 185fefe6d passed all six active CI workflows; legacy e2e was skipped. Its verify job includes ten importer tests; the six locally blocked CLI tests passed there.
- Final combined-head CI remains required. No hosted business transactions, database restore, schema/Edge activation or actual notification delivery were tested.
