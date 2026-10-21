# PWA deployment identity and explicit update safety

## Scope and evidence

Reviewed current-main tree corresponding to `56050ac81652c505645d84d585b379a37de724a1`
(local integration baseline `5acdb839b9913d5b7c520b845bc7f3d55f6f76ee`) and
PR #91 donor `e9e55529a7b7069f0c0252473eac718f51c9c854`.
Only PWA/deployment identity is salvaged. Transfer handlers, financial logic,
backend configuration and the donor's old CI workflow are excluded.

The current source compared only app version `3.55.5`. Its Update now handler
cleared all sessionStorage (including `useBookingDraft` state), then navigated
even when cleanup failed. The watcher also silently navigated long-hidden tabs.
The installed `vite-plugin-pwa` 1.3.0 registration client additionally reloads on
worker activation unless the application provides `onNeedReload`. The pre-existing
HTTP 412 and chunk-error recovery paths also automatically reloaded; canonical
booking and vendor draft hooks could still have debounced edits pending at reload.

## Changed contract

- Package version, validated commit identity and canonical ISO build time identify
  a deployment. A different commit or a newer build at the same version is offered;
  a rebuild of the same commit also has its own dismissal key.
- One Vite plugin supplies the bundle's timestamp/commit and emits the same values
  to output `version.json`. This covers direct Vite invocations as well as npm build.
  The output asset supersedes the legacy public JSON copy. Valid hosting commit
  metadata is optional; when absent, time remains the comparable identity.
- Polling, focus, reconnection, returning from a hidden tab and worker activation
  only request/check/show an update. They never grant permission to navigate.
- The RU/EN prompt warns to save unfinished changes. Only Update now starts a
  bounded fresh availability check. If the deployment changed, the new candidate
  needs another click. Failed/offline/malformed/unchanged checks do not clean caches.
- Cleanup unregisters only the same-origin root `/sw.js` registration and removes
  only `myuno-assets` plus the exact root Workbox v2 precache. Unrelated workers,
  caches, sessionStorage, localStorage and IndexedDB are untouched. The existing
  pull-to-refresh caller also inherits this storage-preserving cleanup boundary.
- Both existing canonical draft hooks (`useBookingDraft`, `useFormDraft`) flush
  pending latest input before cleanup and again immediately before navigation.
  These are local draft writes only, never booking/submission/business requests.
  A failed storage write blocks navigation. Hook unmount flushes its own pending
  draft and unregisters its callback. Explicitly cleared drafts stay cleared across
  success rerenders, unmount and update; subsequent real edits can create a new draft.
- Existing matching HTTP 412 responses are returned unchanged to the caller and
  only request a recovery prompt. Ordinary API/metadata 412s are not intercepted.
  Recovery can reload the same deployment after an explicit click and a fresh valid
  metadata response. Chunk failures/rejections only offer recovery. If an outer
  error boundary unmounts the app prompt, its existing inline reload button uses
  the same checked, draft-preserving boundary and displays a retryable failure.
- Failed cleanup does not navigate; the visible prompt allows retry or dismissal.
  Dismissal works in memory when browser storage is blocked. User-chosen navigation
  retains the route, query and fragment, adding the deployment-specific `_v` value.

## Isolated verification

77 tests pass across five files:

- `src/lib/__tests__/appVersion.test.ts`: identity validation, commit and timestamp
  comparisons, version-only compatibility, navigation target and cleanup ownership.
- `src/lib/__tests__/deploymentMetadata.test.ts`: real plugin hooks emit identical
  client/public metadata and entrypoints wire identity emission/reload suppression.
- `src/components/pwa/__tests__/PWAUpdatePrompt.integration.test.tsx`: real watcher,
  prompt, both canonical draft hooks, fresh-check and cleanup functions; only browser network,
  SW/cache APIs, language/animation and final navigation are synthetic. Covers
  Update now success, draft edit/persist/restore, auth/session retention, per-build
  dismissal, failed HTTP/network/invalid/changed checks, timeout, unregister/cache
  failure and retry, offline retry, double-click protection, long-hidden tab,
  activation-triggered check, blocked storage, unmount and RU text. Includes
  immediate last-keystroke preservation without advancing debounce timers, edits
  during delayed fetch/cleanup, clear/success-rerender non-resurrection, StrictMode,
  vendor storage failures, unchanged-deployment 412 recovery, no recursion, and
  caught/unhandled chunk errors with no automatic cleanup/navigation.
- Existing `src/test/components/ErrorBoundary.test.tsx` and
  `src/hooks/__tests__/formDraftLifecycle.test.tsx`: fallback/retry/reporting and
  baseline/reset/discard lifecycle regressions.

Targeted ESLint and `git diff --check` pass. Full typecheck hit the local Node heap
limit (exit 134, approximately 2 GB); it was not retried. No app build, browser
acceptance or deployment was run. Aggregate CI must verify full types/build/tests
before merge. Synthetic evidence is not hosted installability, offline or business
acceptance. A future publish must verify the deployed JSON and bundle correspond;
already-loaded older bundles retain their old updater until refreshed.

Preservation is guaranteed by the tested local persistence contracts for these two
canonical draft hooks, not for every arbitrary component state in the platform.
Forms without a persistence contract still require the user to save before choosing
reload; the prompt and inline recovery UI say so. A storage failure blocks explicit
reload while mounted; a React crash that already unmounts a form cannot itself be
cancelled by this patch, and unavailable storage can still prevent that unmount
flush from persisting input. No claim of universal crash recovery is made.

## Rollback / publication boundary

This is source-only. No production settings, business data, domains, secrets,
telemetry, database schema, backend functions or deployment were changed.
If rollback is needed, preserve the storage-safe cleanup and no-automatic-reload
boundaries while disabling the metadata prompt changes; do not restore
sessionStorage clearing or silent hidden-tab navigation. Publication remains a
separate user-controlled action.
