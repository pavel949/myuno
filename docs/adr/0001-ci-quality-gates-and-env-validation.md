# ADR 0001: CI quality gates and public env validation

**Status:** Accepted  
**Date:** 2026-03-23

## Context

The platform needs reproducible checks on every PR and safe production builds without committing secrets.

## Decision

1. **GitHub Actions** runs `npm ci`, `npm run lint`, `npm run test:run`, `npm run build` on push/PR to `main`/`master`.
2. **Placeholder `VITE_*` values** in CI satisfy the Vite production build; real keys remain in Vercel/Supabase.
3. **`validatePublicEnv()`** in `src/lib/env.ts` enforces non-empty valid Supabase URL + key in **production** builds; development only logs a warning if `.env` is incomplete.
4. **`.gitignore`** includes `.env` and `.env.*` with `!.env.example` preserved.

## Consequences

- PRs cannot merge if lint/tests/build break (branch protection should enforce required checks).
- Local `npm run build` without `.env` may fail in production mode — developers use `.env` from `.env.example`.
