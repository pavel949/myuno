# Public premium composition — local review evidence

Implementation follows the user-approved textual specification. Selected reference PNG bytes were unavailable in this executor; no reference-fidelity acceptance is claimed.

## Scope

Canonical responsive public tokens and CSS; guest Landing and authenticated Index/IndexV2 discovery; universal search entry and existing intent shortcuts; housing and three-project previews; compact rental search editor; 4:3 listing media; full-width property gallery with below-gallery offer panel and mobile summary; existing area page with one housing section. Existing correctness commits and main PR194 are preserved. No taxonomy, authorization, schema or role changes.

## Validation

- Public Chromium captures: homepage, search, property, area at 320/390/430/1440/1920. All 20 report no horizontal overflow.
- Synthetic authenticated Index capture at390; existing account composition tests cover legacy/V2 rollout and role priorities.
- Homepage → short-rental search → property; property → area → property → original search, reload and browser Back/Forward. Original guest criteria/history index restored.
- Map-mode loading, empty and read-error captures; error retains retry and criteria.
- Guest request cancellation, concierge keyboard/Escape, responsive action clearance tested separately with live writes blocked.
- Affected test run: 267 tests in22files. Three 5-second timeouts under concurrent build/browser load; both affected files reran with one worker and all80passed. Remaining20files/184tests passed in original run. Additional gallery/journey/scroll run:26tests in3files passed (gallery overlaps first group).
- Typecheck passed. Full lint:0errors,2471warnings. Design audit:0new structural findings,15baseline entries resolved.
- Final production build passed in2m54s (7134modules). Log: /tmp/myuno-spec-first-final-build.log.

## Evidence and limits

Screenshots and JSON live in /workspace/myuno-ui-evidence/spec-first-*; test/build logs /tmp/myuno-spec-first-*. Synthetic property media are clearly marked SYNTHETIC QA MEDIA and exist only in browser interception; no fixture inventory ships in source. A real read-only catalogue probe did not establish usable live inventory. No booking/request writes were submitted; server success is unverified. Area illustrations are labelled, not presented as photographs. Real-data visual richness depends on published permissible media and canonical offer data. Parent comparison against selected references is still pending.

Local Vite port8099 is a consumer-local preview, not an externally accessible published preview. No push, public PR or deployment was performed.

Library delivery attempt for8representative PNGs stopped before preparation: `library upload failed: hosted apps tools/list request failed: network` (exit1). No Library IDs or mutation result were returned. No fallback or retry attempted; local files preserved.

## PR #196 follow-up validation

At a3c05b1fe3c56c53b4b050180295be40a7ba75db, verify CI passed all370files/4594tests (including isolated PostgreSQL),4Lighthouse-evidence tests, typecheck and lint. Local full run passed4133tests with203skips;7PostgreSQL suites could not initialize because this consumer lacks postgres/pg_config. Expanded browser CI exposed stale fixture assumptions around the new disclosure, preserved intent, homepage composition/hook and company association; corrections preserve network denial and behavioral assertions.

Follow-up local browser results: homepage27cases (three locales/eight widths plus loading/error/empty), unified search8cases, browse8cases, complex12cases, canonical theme/rebrand114cases. Affected unit run42tests passed; build passed in2m25s with0new structural design findings. Public gutters now use the existing inset scale; normal pixels remain unchanged. Company association is labelled neutrally on complex surfaces too.

Implemented scope is the shared public foundation and connected housing journey, plus discovery sections below existing signed-in tasks. Owner/developer/partner presentations and their workspace redesigns are not implemented by this PR. The full property content/composition beyond this milestone, real-data acceptance, transaction success, full SEO/CWV acceptance and selected-image comparison remain separate work. Current exact-head CI and review status are recorded in the draft PR; this note does not certify future heads.
