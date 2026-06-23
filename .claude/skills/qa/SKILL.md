---
name: qa
description: >
  Quality assurance for myUNO — exercise the app and hunt for bugs before
  release. Use when asked to QA, test the site/flow, "find bugs", smoke-test, or
  verify a feature end-to-end. Triggers: qa, test the site, smoke test, find
  bugs, regression check, manual test.
---

# QA — Exercise & Find Bugs

Verify behavior the way a user would, on a mobile-first app.

## Setup
- Dev server: `npm run dev` (localhost:8080, `VITE_BYPASS_COMING_SOON=true` to
  see gated screens). Preview: `npm run build` then `npm run preview` (4173).
- Automated: `npm run test` (Vitest), `npm run test:e2e` (Playwright),
  `npm run lighthouse:mobile` for perf/a11y.
- **All environments hit the same prod DB `kakkwibljrjsawxgnupk`** — mark any
  test data with markers; do not create real orders/leads carelessly.

## What to check (priority order)
1. **Money & leads** — checkout → order in `orders` → ledger entries; viewing
   request → lead created → WhatsApp to Pavel. These must not silently fail.
2. **Auth/roles** — first-login role assignment, RoleGate per `app_role`,
   impersonation, admin gating.
3. **Core flows per vertical** — STAYS owner dashboards, DEALS listings/offplan,
   Thai Business catalogue/chat (behind its flag), Navigator v3 `/discover`.
4. **Mobile-first 375px** — layout, 44×44 touch targets, `Sheet` vs `Dialog`,
   loading + error states for every async op.
5. **Bilingual** — RU and EN both render; no raw keys, no hardcoded copy.
6. **Console/network** — no errors, no `console.log`, no failed requests.

## Process
1. Pick the scope (changed area or full smoke). List the flows you'll exercise.
2. Walk each flow; record steps, expected vs actual, severity.
3. Re-test after any fix.

## Output
A bug list: severity (Blocker/Major/Minor), repro steps, expected vs actual,
suspected `file:line`. State clearly what passed and what you did not test.
