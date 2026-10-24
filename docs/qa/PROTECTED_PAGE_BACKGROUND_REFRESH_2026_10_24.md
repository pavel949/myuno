> Reconciliation note: the initial parallel implementation below is historical evidence, not the current guard contract. PR166 reconciles it with `AccessRecheckBoundary`: one native top-layer quarantine also covers body-portaled overlays; identity includes actor/context/policy/company/membership role but excludes pathname so sibling layouts remain mounted. The unused duplicate `AccessVerificationBoundary` is retired. Initial checks, errors, revocation and actor/scope changes remain fail-closed. Existing upstream admission tests are retained alongside the stronger late-response, membership-role and portal regressions. See `docs/qa/guard-background-recheck-20261023.md` for current evidence and limits. No backend/RLS/role changes or production activation.

# Protected-page background refresh — 2026-10-24

Finding: `1f935183-72f8-5a0b-8bd6-b62b2bf87dd3`.
Starting source HEAD: `5b6dab23cea8883431beda0b2da43d6d233e3c90`.

## Confirmed cause and correction

RoleGuard, MCGuard and the sibling InvestorGuard returned a different loading subtree on every resolved-context fetch. This unmounted local form state. Existing tests covered fail-closed visibility, not state retention.

The shared AccessVerificationBoundary retains only an already-admitted subtree for the same actor, resolved mode/entity/role/permissions, route and (MC) company. During verification it is hidden, inert and excluded from accessible content; the existing loading/recovery state remains separate. Initial checks never mount protected children. Errors, revoked access, logout and identity changes remove the old subtree. Fresh successful checks restore its existing state. Resolver fetching, query keys, role rules, RPCs and server authorization are unchanged. State retention does not pause mounted child effects or authorize their requests; existing server boundaries remain authoritative.

Files: `src/components/auth/AccessVerificationBoundary.tsx`, `RoleGuard.tsx`, `MCGuard.tsx`, `InvestorGuard.tsx`, `RoleGuard.verification.test.tsx`, root `AGENTS.md`, `roadmap.md`, this report.

## Current evidence

- Before change: `bun run test src/components/auth/RoleGuard.verification.test.tsx src/components/auth/InvestorGuard.test.tsx` — 13/13 PASS.
- After change: same command — 22/22 PASS (14 verification/state-retention cases and 8 existing investor cases).
- Tests exercise the actual resolved-context hook and QueryClient with synthetic auth and RPC responses: two successive refreshes retaining the same input/value; initial pending check; failure/revocation; actor/company/context changes; recovery deadline and retry.
- `node /tmp/browser/access-refresh/bundle.cjs` then `python3 /tmp/browser/access-refresh/check_refresh.py` — 3/3 PASS for actual Role/MC/Investor guards with real QueryClient, synthetic auth/RPC/company hooks and all non-fixture requests denied. Typed value restored; hidden/inert during fetch; revoked access removes form. Zero outbound requests and browser page errors. This is isolated browser verification, not live production E2E.
- Screenshots `/tmp/browser/access-refresh/{Role,MC,Investor}-{before,pending,restored}.png`; Role pending/restored images reviewed.
- Automatic build log: `2026-10-24T09:17:56Z` — build OK. No manual build/typecheck.

No publication, deployment, database/configuration changes, real records, invitations or outbound messages. No E3/financial gate activation. Production acceptance remains untested and publication still requires permission. Rollback: revert only this frontend boundary/guard/test change; server access rules are untouched. GO for the bounded code correction; not production workflow certification.