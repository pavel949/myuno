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
checking the same actor, route, role, entity and permission identity. MC also
binds this to active company ID and membership role. A successful unchanged
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

- 75 unit/regression tests in 11 affected auth/layout/navigation files passed;
  this includes the 22 focused guard/security cases (do not sum them).
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
npx vitest run src/components/auth src/test/layout src/test/navigation/sitemapMcGuard.test.tsx src/hooks/__tests__/useIsAdmin.actor.test.tsx
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
