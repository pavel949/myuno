# Code Quality & Performance Improvement Plan

## Why this plan

The app has 502 pages, 1000+ components, 15 global providers, and ~937 files importing `lucide-react`. We've already added route-chunk prefetching (good). The remaining wins are: a smarter bundle split, fewer wasted renders, type hygiene, and a single source of truth for logging.

## Scope (in order of impact)

### 1. Bundle split — eliminate the giant `vendor` chunk
**Problem**: `vite.config.ts` currently merges React + Router + Radix + Supabase + Framer + Lucide + react-query into one `vendor` chunk. Any cache-busted change forces re-download of all of it. Also ALL Radix primitives load up-front even on a route that uses one Sheet.

**Change** in `vite.config.ts` `manualChunks`:
- Split into stable groups: `vendor-react` (react, react-dom, react-router, scheduler), `vendor-supabase`, `vendor-query`, `vendor-radix`, `vendor-motion`, `vendor-icons` (lucide-react), `vendor-forms` (react-hook-form, zod, @hookform/resolvers), `vendor-utils` (date-fns, clsx, cva, tailwind-merge, dompurify), `vendor-sentry`, keep existing pdf/excel/charts/map.
- Keep current "no cross-chunk circular ESM" safeguard by NOT splitting Radix per-package — one `vendor-radix` chunk.

Expected: initial JS for cold-start drops 25–40%; cache hit-rate on deploys jumps because most chunks don't change.

### 2. Route prefetch — make it idle and viewport-aware
**Problem**: `prefetchAllPopularRoutes()` fires on AllAppsDrawer open and warms 22 chunks at once — that competes with whatever the user actually clicks.

**Change** in `src/lib/prefetchRoute.ts`:
- Throttle bulk prefetch to 2 chunks at a time (sequential, not parallel).
- Add `prefetchOnVisible(el, path)` helper using `IntersectionObserver` so cards in the home feed prefetch when scrolled into view, not on hover only (mobile has no hover).
- Wire it into `AllAppsDrawer` buttons and home category cards via `ref` callback.

### 3. Provider tree — defer non-critical contexts
**Problem**: 15 providers wrap the tree before first paint. `GoogleMapsProvider`, `StorefrontProvider`, `LifeSituationProvider`, `PWAInstallProvider`, `HintProvider` are not needed for the first home render.

**Change** in `src/App.tsx`:
- Move `GoogleMapsProvider`, `StorefrontProvider`, `LifeSituationProvider`, `HintProvider`, `PWAInstallProvider` into a lazy-loaded inner wrapper that mounts after first paint (via `requestIdleCallback`). They'll still be available before any code path that needs them (map page, storefront route, install prompt).
- Verify with grep that none of these are read during initial Index render.

### 4. Type hygiene — kill `any` in hot paths
**Problem**: 319 files use `any` / `as any`. Full sweep is out of scope, but the highest-traffic ones leak through to runtime bugs.

**Change** — type the top 8 offenders only (each ~9 occurrences):
- `src/utils/generateReportPdf.ts`, `src/components/property/canonical-form/CanonicalPropertyForm.tsx`, `src/components/owner/tasks/UnifiedTaskHub.tsx`, `src/pages/owner/PropertyEditor.tsx`, `src/pages/owner/OwnerDetailPage.tsx`, `src/pages/vendor/VendorRestaurants.tsx`, `src/components/owner/transparency/OwnerKPISummary.tsx`, `src/pages/admin/AdminProperties.tsx`.
- Replace `any` with generated Supabase row types (`Tables<'...'>`) or `unknown` + narrowing.

### 5. Logging — one logger, no `console.log`
**Problem**: We tell contributors not to use `console.log` but it's silently allowed. Only `src/lib/logger.ts` and `src/lib/errorHandler.ts` use it today (good baseline).

**Change**:
- Add ESLint rule `no-console: ['warn', { allow: ['warn', 'error'] }]` in `eslint.config.js` with override for `src/lib/logger.ts` and `src/lib/errorHandler.ts`.
- Existing code is already clean → zero churn, prevents regression.

### 6. React Query — fix stale defaults that cause double-fetches
**Problem**: `defaultQueryClientOptions` sets `staleTime: 1min` + `retry: 3` globally. Hooks built on `useSupabaseQuery` (legacy, not React Query) bypass this entirely and re-fetch on every mount.

**Change**:
- Audit `useSupabaseQuery` consumers (high-frequency ones only — owner dashboard widgets) and migrate ~5 to `useQuery` with the appropriate `CACHE_PROFILES` profile.
- Lower default `retry: 3` → `retry: 1` for queries (3 retries × exponential backoff = up to 18s of failed-state UX). Mutations stay at 1.

## Out of scope (call out, don't do)

- Full `any` removal across 319 files — needs separate pass per cluster
- Full migration of `useSupabaseQuery` to React Query — large
- Strict-mode TypeScript flip — documented in `docs/TYPESCRIPT_POLICY.md`, gradual
- Image optimization / WebP audit — separate skill

## Verification

- `npm run build` (harness runs automatically) — confirm no chunk over 800KB warning except expected `vendor-pdf` etc.
- Open preview, hard-reload `/`, check Network tab: initial JS payload should drop visibly (look for fewer/smaller chunks before `Index` render).
- Click into 3 mini-apps from `/` — confirm no Suspense flash (prefetch already in place; verify still works after changes).
- `npm run lint` — no new warnings; confirm `no-console` rule active.

## Files touched

- `vite.config.ts` — manualChunks rewrite
- `src/lib/prefetchRoute.ts` — throttle + IntersectionObserver helper
- `src/components/layout/AllAppsDrawer.tsx` — wire IO helper
- `src/App.tsx` — defer 5 providers
- `src/lib/queryConfig.ts` — `retry: 1`
- `eslint.config.js` (or `.eslintrc`) — `no-console` rule
- 8 files in §4 — `any` → typed
- ~5 owner-dashboard hooks — migrate to React Query
