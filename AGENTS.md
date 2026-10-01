# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | How to run | Port | Notes |
|---------|-----------|------|-------|
| Vite dev server (frontend) | `npm run dev` | 8080 | Only service needed; connects to remote Supabase |

### Quick reference

- **Dev server:** `npm run dev` → `http://localhost:8080`
- **Lint:** `npm run lint` (pre-existing warnings/errors in the repo; not blocking)
- **Tests:** `npm run test` (Vitest; 28/36 suites pass — some pre-existing failures related to `react-helmet-async` missing context in test setup)
- **Build:** `npm run build` (runs `scripts/validate-fonts.mjs` as prebuild step)

### Key caveats

1. **No local backend needed.** The app connects directly to the remote production Supabase instance (`kakkwibljrjsawxgnupk.supabase.co`). Supabase URL and anon key are hardcoded as fallbacks in `vite.config.ts`, so no `.env` file is required to start development.

2. **Single database for all environments.** Local dev, preview, and production all hit the same Supabase production database. Mark any test data with `[TEST]` / `source='smoke_test'` / `*@myuno.test`.

3. **Authentication gate.** Most routes are behind a `ComingSoonGate` for unauthenticated users. Public marketing pages include `/newbuilds`, `/auth`, `/invest/capital-advisory`, `/clearview`. To test authenticated flows, you need to log in via the `/auth` page.

4. **Lint exits with code 1** due to ~12 pre-existing errors and ~1597 warnings. This is known tech debt; the build still succeeds.

5. **Test failures.** 8 test suites fail due to missing `HelmetProvider` context in test setup (pre-existing). The remaining 28 suites (897 tests) pass.

6. **Google Maps.** Some pages reference Google Maps API which requires `VITE_GOOGLE_MAPS_API_KEY` in `.env`. Pages still render without it; the map widget just won't load.

7. **Port.** Vite dev server uses port 8080 (`host: true`). If port 8080 is busy, Vite will auto-increment.

8. **Playwright E2E.** The `playwright.config.ts` expects the dev server on port 5173 (mismatch with actual port 8080). Update the config or override `baseURL` if running E2E tests.
