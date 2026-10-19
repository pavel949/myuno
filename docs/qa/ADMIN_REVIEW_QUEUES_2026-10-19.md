# Admin property/project review views

## Scope and findings

Base: `83e23cefb36f897cff0f150506a7e313f1863e1c`. This tranche changes the read/display/filter layer of AdminProperties and AdminProjects only. Existing create/update/delete/approval/enrichment writers and authorization remain unchanged.

- Property activity filtering previously returned before checking approval, so active + pending included active approved/draft records.
- AdminProjects ignored the existing newbuilds console `?filter=pending|orphan|needs_review|stale` links.
- Properties discarded read failures; projects did not render their query error. Both could display an empty catalogue/count of zero after failed reads.
- Approval, activity and project construction stage are independent fields. Missing values must not be reclassified as pending/draft/inactive.

## Changes

- URL-composable property `provider`, `q`, `activity`, `status`; project `q`, `stage`, `filter`. Browser history changes restore the view. Unrelated query parameters and property editor context survive filter updates.
- Counts are facets of the currently loaded, authorized list after search/provider/activity (properties) or search/construction stage (projects), before the selected review filter. They are not new global database totals. Existing query scope/limits are unchanged.
- Existing project orphan sentinel and 45-day stale KPI predicate are preserved exactly. No inferred null-developer orphan state or new persisted status.
- Loading/error counts are unavailable, with retry on failed reads. Filtered absence offers reset rather than asking to create duplicate records.
- Separate approval/activity badges; unknown values are explicitly labelled. Project missing-address indicator stays local to each record, not an invented completeness score.
- Removed four large, repetitive project statistic cards (including null-unit sums). Clear review action opens the existing editor; document links and existing administration controls remain.

## Local evidence

- Focused Vitest: 26 tests passed in four files (helper 6, queue UI 8, read hook 3, existing editor regression 9).
- Changed-file ESLint: 0 errors, 13 pre-existing warnings in legacy editor/click-target code.
- No full typecheck/build or local browser launch. Real browser evidence is a separate CI fixture commit and must be inspected before acceptance.
- Tests are synthetic; read-hook tests stub Supabase and throw on writes. Queue tests assert no write calls, preserving user data.

## Separate moderation audit finding (not changed here)

Dashboard pendingContent counts all pending properties + pending listings. OperationsModerationTab reads pending listings, pending properties with owner_id, and inactive services/products, with source limits 500/500/100/100. Therefore the dashboard and mixed queue do not have matching definitions. Approved=0 is inevitable in the current pending-only reader. These are source findings, not a verified record-level explanation of the live 248 versus 255 counts. Both readers also discard per-query errors. Root coordinates that separate tranche.

## Browser fixture (separate commit)

Run `node scripts/qa/admin-review-queues.mjs` with Vite serving port 8080. Outputs `/tmp/browser/admin-review-queues-isolated/results.json` and 96 screenshots across RU/EN × widths 375/390/430/1280.

- Actual AdminProperties/AdminProjects, PropertyCard, ProviderSelector, PageHeader/PageContainer, filters, badges, Radix menus/sheets/selects and shared CSS.
- Synthetic catalogue/read hooks and identity; network permits only GET of the three generated local files. All unexpected data operations throw and are recorded. No production business records are read or written.
- Unrelated domain-health/bulk-link panels, AI/intake/upload integrations, and unchanged property editor internals are explicit fixture boundaries. Existing property-editor fixture covers the full form separately. These screenshots are review-list evidence, not a claim of full admin-shell/editor coverage.
- Asserts property activity + approval intersection, existing project console links, route parameter preservation, keyboard activation, editor opening, construction-stage selection, loaded/empty/error states, retry, 44px review filter targets, viewport containment and selected-filter contrast ≥4.5:1.
- Local evidence: esbuild `--bundle-only` succeeds; Python AST syntax check succeeds. Chromium was not launched locally. CI execution and visual inspection remain required.


## Independent review corrections

The initial source candidate was NO-GO: manual retry lacked the effect-only mounted guard, allowing a late provider-A retry to replace provider-B data, and the URL helper incorrectly removed a literal `q=all`. Corrective commit adds a shared request generation/current-context guard for all reads (including retries, old callbacks and unmount), and reserves the `all` sentinel for the four enum filter keys only. Deferred regressions cover late success/error, concurrent retries, saved callbacks and the literal search input. Independent re-review remains required; initial test success was not sufficient acceptance evidence.
