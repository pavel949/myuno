---
name: health
description: >
  Codebase health check for myUNO — lint, types, tests, tech-debt and
  validators. Use for "is the code healthy?", a quality sweep, or pre-release
  confidence. Triggers: health check, code quality, tech debt, lint status,
  "is the build clean", quality sweep.
---

# Health — Codebase Quality Check

A fast, factual read on repository health. Report numbers, don't guess.

## Run the gates
- `npm run lint` — ESLint status (errors + warnings).
- `npx tsc --noEmit` — type errors.
- `npm run test` — Vitest unit suite.
- `npm run validate:fonts`, `npm run validate:service-tags`,
  `npm run validate:catalog-life-map` — repo validators (also run in
  `prebuild`).
- Optional: `npm run build` (memory-tuned) to confirm a clean production build;
  `npm run lighthouse:mobile` for perf/a11y.

## Tech-debt signals to quantify (Grep, give counts + worst offenders)
- **`any` usage** — there is a tracked baseline in CI (see CLAUDE.md history,
  e.g. ~758). Report current count vs baseline; flag drift up.
- **`console.log`** in `src/` production code — should be zero.
- **Raw colors / hex** instead of semantic tokens (`text-white`, `bg-navy`,
  `#`-literals in tsx) — DS 2.1 debt.
- **Hardcoded UI strings / stray em-en dashes** missing i18n keys.
- **`supabase.schema('v2')`** — must be zero (no v2 schema exists).
- **New Supabase client instances** outside `src/integrations/supabase/
  client.ts` — must be zero.

## Process
1. Run the gates; collect real output.
2. Grep the debt signals; tabulate counts.
3. Summarise: green / yellow / red per category, with the top items to fix.

## Output
A health dashboard: gate results (pass/fail with counts), tech-debt table with
numbers, and a prioritised top-5 fix list. Be honest — surface failures plainly.
