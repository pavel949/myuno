# AGENTS.md — myUNO

Concise guide for AI / autonomous agents working in this repo. Read this **after** `CLAUDE.md`, `PROJECT.md`, and `docs/canonical/*` — those documents are the source of truth.

## Required reading (in order)

1. `PROJECT.md` — strategic source of truth (audience, monetisation, design standards, 5-test for new features).
2. `CLAUDE.md` — operational rules (stack, DB, code rules, design tokens, git workflow).
3. `docs/canonical/` — segmentation, services, ToV, IA, design system, ClearView, AI prompts, **data schema**.
4. `docs/canonical/architecture/OVERVIEW.md` + `ARCHITECTURE_V2.md` — architecture hard rules (no new top-level routes, no new shells, no hardcoded hex, no cross-cluster imports, no auto-money-moves).

If a request contradicts these documents, **stop and ask Pavel.** Do not silently override canon.

## Package manager

This project uses **npm**. Vercel runs `npm run build`. There is one lockfile (`package-lock.json`). Do not introduce `bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, or `yarn.lock`.

## Required local checks before opening a PR

```bash
npm ci
npm run lint        # ESLint (known config caveat: see notes below)
npm test            # Vitest unit tests
NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p tsconfig.app.json
npm run build       # production Vite build
```

Lint and several unit tests have known **pre-existing** failures unrelated to most changes. When you run baselines, capture the failures before editing so you can prove your change did not cause new ones. Save logs to `.audit/<YYYY-MM-DD>/` (already gitignored) if useful — do not commit large logs.

## Things you MUST NOT touch without explicit approval

- `src/integrations/supabase/types.ts` — auto-generated, ~900KB. Never hand-edit.
- `supabase/migrations/*.sql` — schema is canon. Migrations only via approved DB workflow.
- Stripe / payments / webhooks / ledger code:
  - `supabase/functions/stripe-webhook/*`
  - `supabase/functions/_shared/checkout-handler.ts`
  - Anything touching `record_ledger_entries`, `process_payout`, `payment_intents`, `ledger_entries`, `vendor_payouts`.
- Top-level route table in `src/components/layout/AnimatedRoutes.tsx` — do not add new top-level routes. Put new screens under an existing cluster or `/operate/*`.
- App shells (`MiniAppLayout`, Operate shell, Admin/MC/Vendor/Guest layouts) — do not create new shells.

## Things you SHOULD avoid in unrelated PRs

- Large architectural refactors. Keep PRs focused; split unrelated work.
- "Securities" / investment-product wording on landing/marketing surfaces (M2 hardening is tracked separately — see `docs/canonical/audits/` and `PROJECT.md`). If you encounter speculative copy, flag it in the PR description rather than rewriting it ad-hoc.
- Hardcoded hex colours / non-canonical fonts. Use `src/styles/tokens.css` semantic tokens (`bg-primary`, `text-accent`, `text-foreground`, `bg-card`, `border-border`). Fonts: Source Serif 4 (display), Geist (body), IBM Plex Mono (numerics). See `DESIGN.md`.
- Console logging in production code. Use the existing logger.
- Hardcoded admin emails / phone numbers in Edge Functions — use `_shared/admin-config.ts`.

## Database

There is **one** production Supabase project: `kakkwibljrjsawxgnupk`. There is no staging DB. Local dev hits production data. Mark any test rows clearly. See `docs/ENVIRONMENT.md`.

All tables are in the `public` schema. **There is no `v2` schema** — never call `supabase.schema('v2')`. Always import the singleton client from `src/integrations/supabase/client.ts`.

## Feature flags

New verticals / risky changes ship behind a `feature_flag:*` row in `system_settings`. Check `useFeatureFlag` before assuming a screen is dead — e.g. `IndexLegacy` is gated by `feature_flag:home_simplified_v1` and must be preserved as a regression-safe fallback.

## Commit & PR conventions

- Conventional commits, English: `feat:`, `fix:`, `refactor:`, `chore:`, `design:`, `build:`.
- PR title under ~70 chars; details in body. Include a short "Summary" + "Testing" section.
- Never approve a PR as an agent. Open it, leave it for human review.
