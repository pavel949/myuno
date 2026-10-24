# Protected-form background recheck regression — 2026-10-23

Base: `37de22d344274c0075e47f0717637bb40c6e5c1b` in `pavel949/myuno`.
This is source/isolated-browser evidence, not production activation or a live-session certificate.

## Reproduction

The actual `useResolvedContext` query exposes background `isFetching` as
`isVerifying`. RoleGuard, MCGuard and InvestorGuard returned a different loading
subtree during that state. A previously mounted form therefore unmounted.
On the baseline, the isolated owner case recorded one unmount, two mounts and
an empty input after a successful query, replacing the unsaved value.
Owner/Admin/Staff/Vendor/Team wrappers share RoleGuard. MC and Investor have the
same separate branching pattern. MCPortalGuard does not branch on background
fetching; it was not changed.

## Change and security boundary

AccessRecheckBoundary preserves a previously admitted component tree only while
checking the same actor, role, entity and permission identity. MC also
binds this to active company ID and membership role. RoleGuard also binds its
allowed-role policy. Sibling navigation keeps the existing workspace layout;
the router still owns page transitions. A successful unchanged
resolution restores the same form and its focused control.

Pending UI is not authorized on cached data. Its inline tree is hidden/inert.
An opaque native modal curtain covers the viewport and makes body-portaled
Radix overlays inert as well. Temporary capture listeners prevent retained
Radix Escape/outside-focus/pointer handlers from closing their own forms.
Retry click and keyboard handling remain usable. No canonical portal primitive
was changed. Without native `showModal`, the safe existing unmount behavior is
retained rather than exposing a portaled form.

Confirmed denial/revocation, query error, actor or scope/permission change drops
the retained subtree. This patch preserves drafts across successful checks;
it does not promise recovery after a verification error or account change.
Retained component effects/async tasks continue running. This is UI quarantine,
not server authorization or a mechanism for pausing business mutations. RLS and
checked server writers remain authoritative and were not changed.

## Isolated checks

- 83 unit/regression tests in 12 affected auth/layout/navigation files passed,
  including the unchanged stable-shell navigation/lazy-route regressions.
  Focused subsets overlap this total and must not be summed.
- TypeScript and production build passed.
- Scoped lint: zero errors, one existing RoleGuard HOC fast-refresh warning.
- Chromium matrix: 7 guards × inline/actual canonical Radix Dialog × 390/1440
  CSS px = 28 cases, with fresh production-build CSS.
- Each case checks preserved input and mount identity, restored focus,
  error/Retry, account isolation, verified revocation and zero synthetic saves.
- Portaled cases additionally check accessibility-tree exclusion, blocked
  pointer input and Escape while pending. The owner mobile portal case checks
  the 12-second deadline and keyboard Tab/Enter Retry.
- The curtain must be opaque and cover the viewport. Representative screenshots
  are inspected separately from DOM assertions.

Production data modules are excluded by the fixture bundler. Browser routing
allows local synthetic GET assets only; external requests and writes are
aborted, and service workers are blocked. The actual resolver, company provider,
query client, guards and Dialog primitive run against synthetic adapters.

Headless tab visibility did not reliably change when bringing another tab to
front. The harness explicitly drives React Query's actual focus-manager signal
after marking the actor query stale. It verifies the refetch/guard path, not
native foreground visibility across every browser/OS.

Commands:

```sh
npx vitest run src/components/layout/__tests__/stableLoadingShell.test.tsx src/components/auth src/test/layout src/test/navigation/sitemapMcGuard.test.tsx src/hooks/__tests__/useIsAdmin.actor.test.tsx
npm run typecheck
npm run build
node scripts/qa/guard-background-recheck.mjs
```

`GUARD_CSS_FILE` optionally selects freshly built `dist/assets/index-*.css`;
`GUARD_OUTPUT` selects the evidence directory. With no CSS override the fixture
uses diagnostic styling and must not be presented as a full application visual
acceptance. Output records its style source.

## Not verified or activated

Public `/version.json` on apex and www could not be accessed through the
available read-only web tool. Current live revision and live logged-in behavior
remain UNVERIFIED. No production accounts, roles, credentials, schema or data
were changed. This patch is not merged, published or remotely CI-certified.

Machine-readable focused security regression output is retained in
`docs/security/evidence/guard-background-recheck.security-report.json`.
It records actual test results and runtime hashes; it is not a general scanner
report or a live authorization certificate.


## Reconciliation with main2fa3d90b — 24 October

Main introduced a parallel inline-hidden boundary and pathname-bound wrapper identities. Its Role/MC/Investor changes overlap this branch. Two unchanged stableLoadingShell tests on clean main reproduce a layout remount (2 instead of1) on sibling navigation/lazy pending. The reviewed PR166 boundary remains canonical: native top-layer quarantine for body-portaled dialogs, no pathname in authorization identity, actor/context/policy/company/membership-role invalidation and safe unmount without native modality. Existing authorization predicates, resolver/RPC/cache truth and server RLS are not broadened.

Resolution preserves unrelated main AGENTS/roadmap/lockfile changes and the distinct upstream admission tests; it retires the now-unused duplicate AccessVerificationBoundary. Homepage PR168 is not included. Fresh targeted tests, browser evidence, exact-head CI and independent review remain required before declaring this reconciliation ready. No merge to main, deployment, role grant or schema activation is authorized by this report.

Current reconciliation local results:91/91 across12 files, including both unchanged stableLoadingShell assertions; captured security/shell subset26/26. Fresh actual-guard/real-Radix Chromium28/28 with current-source Vite CSS,7 guards × inline/portal ×390/1440. Retained Portal content is opaque-concealed and excluded from accessibility while pending; restored field/value/focus survives success; errors/revocation/actor changes discard it. Synthetic writes remain0. Pointer Retry after12s with retained Radix modal also passed (mount1/unmount0/writes0). Native OS tab-foreground behavior and live sessions remain unverified: the harness drives the actual React Query focus manager. Current-source CSS is labelled as such, not a production build. Pending and restored pixels were inspected. Independent reconciled-source review:GO, contingent on exact-head CI; no main merge or publication.
