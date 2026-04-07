# Architecture Audit Report

**Date:** 2026-04-07
**Scope:** Full codebase analysis — routing, auth, state management, security, and structural patterns.

---

## CRITICAL Issues

### 1. ~~Realtime Subscription Memory Leak in `useAdminAuditLogsRealtime`~~ [RESOLVED]

**File:** `src/hooks/useAdminAuditLogs.ts:80-112`

**Resolution:** Subscription is now correctly placed inside a `useEffect` with a `supabase.removeChannel(channel)` cleanup return. No memory leak.

---

### 2. ~~Race Condition in Cart Sync on Login~~ [RESOLVED]

**File:** `src/contexts/CartContext.tsx:165-185`

**Resolution:** After sync, `loadDatabaseCart()` results are now compared against the local items count. If DB returns fewer items than were synced (replication lag), the local items are merged as a safety net. Items are never silently lost.

---

### 3. ~~Overly Permissive RLS Policy — Profiles Table~~ [RESOLVED]

**File:** `supabase/migrations/20260407030000_restrict_profiles_rls.sql`

**Resolution:** Migration drops the permissive policy and replaces with `USING (auth.uid() = id)` — users can only read their own profile.

---

### 4. ~~`.env` File Committed to Git~~ [RESOLVED]

**Resolution:** `.env` is listed in `.gitignore` and is no longer tracked by git.

---

### 5. ~~Unprotected Developer Portal — Privilege Escalation~~ [RESOLVED]

**File:** `src/components/newbuilds/DeveloperPortalLayout.tsx:28`

**Resolution:** `DeveloperPortalLayout` now checks `if (!developer) return <Navigate to={APP_ROUTES.NEWBUILDS} replace />;` — non-developers are redirected.

---

### 6. ~~RoleGuard Uses Two Conflicting Permission Sources~~ [RESOLVED]

**File:** `src/components/auth/RoleGuard.tsx:54-63`

**Resolution:** `RoleGuard` now uses `useResolvedContext()` exclusively. The `serverRole` from resolved context is compared against allowed roles for all users, not just admins. Permissions array is also checked for wildcard (`*`) access.

---

## HIGH Priority Issues

### 7. ~~Unprotected MC Registration Route~~ [RESOLVED]

**File:** `src/components/layout/AnimatedRoutes.tsx:608`

**Resolution:** `/mc/register` is now wrapped with `<AuthGuard>`, consistent with `/mc/onboarding`.

---

### 8. Inconsistent Auth Guard Patterns Across Routes

**File:** `src/components/layout/AnimatedRoutes.tsx:570-572, 607-608`

Similar onboarding/registration routes use different protection patterns. Vendor onboarding (line 571) has no guard, MC onboarding (line 607) has `AuthGuard`, MC registration (line 608) has none. This inconsistency creates security blind spots.

**Fix:** Establish and enforce a consistent guard pattern for all protected route categories.

---

### 9. ~~Duplicate Supabase Client in Error Handler~~ [RESOLVED]

**File:** `src/lib/errorHandler.ts:123`

**Resolution:** Error handler now uses the shared `supabase` client via `supabase.from('analytics_events').insert(rows)`, inheriting user session and RLS.

---

### 10. Wide-Open CORS on All Edge Functions

**Files:** 15+ files in `supabase/functions/*/index.ts`

Every edge function returns `Access-Control-Allow-Origin: "*"`, including sensitive endpoints like `whatsapp-incoming-webhook`, `lifecycle-processor`, and `geocode-address`.

**Fix:** Restrict to your app domain(s): `https://myuno.app`.

---

### 11. Refresh Tokens Stored in localStorage

**Files:** `src/hooks/usePinManagement.ts:34,64,74,114`, `src/hooks/usePinAuth.ts`

```ts
localStorage.setItem(PIN_REFRESH_TOKEN_KEY, session.refresh_token);
```

`localStorage` is accessible to any XSS attack. Refresh tokens enable full account takeover.

**Fix:** Use Supabase's built-in session storage (httpOnly cookies) or encrypt before storing.

---

### 12. No Content Security Policy (CSP)

**File:** `index.html`

No `Content-Security-Policy` meta tag or header exists. The app is vulnerable to inline script injection and third-party script loading.

**Fix:** Add a CSP meta tag restricting `script-src`, `connect-src`, `style-src`, etc.

---

### 13. Missing Error Exposure in Query Hooks (Widespread)

**Files:** `src/hooks/useYachts.ts:140`, `src/hooks/usePropertyBookings.ts:93`, `src/hooks/useProfile.ts:80-91`, and many others.

Many hooks destructure only `{ data, isLoading }` from `useQuery` and return synthetic defaults, swallowing errors:

```ts
const { data, isLoading } = useQuery({...});
return { yachts: data || [], isLoading }; // error is invisible to consumers
```

**Impact:** Components cannot distinguish "no data" from "fetch failed". Users see empty screens with no error feedback.

**Fix:** Expose `error` and `refetch` from all query hooks.

---

## MEDIUM Priority Issues

### 14. Dual Toast System (250 + 82 import sites)

**Files:** `src/hooks/use-toast.ts` (adapter), every file using `toast()`

The codebase has **250 files** importing directly from `sonner` and **82 files** importing from `@/hooks/use-toast`. The adapter wraps sonner but adds an unnecessary abstraction layer and inconsistent API surface.

Some files call `toast.success("msg")` (sonner API), others call `toast({ title, description, variant })` (adapter API). This creates confusion and inconsistent UX (different toast styling/positioning).

**Fix:** Standardize on one pattern. Since the adapter already delegates to sonner, migrate remaining `use-toast` imports to direct sonner usage and delete the adapter.

---

### 15. 649 `as any` Type Casts Across 244 Files

**Files:** Concentrated in `src/hooks/useAdminContent.ts` (36 casts), `src/hooks/useDayBriefing.ts` (16 casts), `src/hooks/useProfileDetails.ts` (12 casts), `src/utils/generateReportPdf.ts` (12 casts), `src/lib/adapters/contentAdapters.ts` (12 casts)

Excessive use of `as any` defeats TypeScript's purpose and masks real type errors at runtime.

**Root cause:** Many hooks query tables not yet in the generated Supabase types (`src/integrations/supabase/types.ts`), forcing `as any` casts on `.from('table_name' as any)`.

**Fix:** Regenerate Supabase types (`npx supabase gen types`), or create manual type declarations for missing tables.

---

### 16. Unstable useEffect Dependencies in Realtime Hooks

**File:** `src/hooks/useOrderTracking.ts:72-106`

```ts
useEffect(() => {
  const channel = supabase.channel(`order-tracking-${orderId}`).on(...).subscribe();
  return () => { supabase.removeChannel(channel); };
}, [orderId, user, refetch, fetchTimeline]); // refetch/fetchTimeline change every render
```

`refetch` and `fetchTimeline` are new function references on each render, causing the subscription to be torn down and recreated continuously.

**Fix:** Wrap functions in `useCallback` or use refs.

---

### 17. Silent Cart Mutation Failures

**File:** `src/contexts/CartContext.tsx:210-254`

Cart operations (add/update/remove) catch Supabase errors but only log them — no user feedback via toast or state rollback.

**Fix:** Show error toasts and implement optimistic update rollback.

---

### 18. XSS Risk — `dangerouslySetInnerHTML` Without Final Sanitization

**Files:** `src/pages/MapView.tsx:250-260`, `src/components/map/SalonMap.tsx:143-154`

`createMapPopupHtml()` escapes individual fields but the **final assembled HTML** is never passed through `DOMPurify.sanitize()`.

**Fix:** Apply `DOMPurify.sanitize()` to the final HTML output before setting it via `dangerouslySetInnerHTML`.

---

### 19. Hardcoded Supabase Project ID in Source Code

**File:** `src/components/ui/optimized-image.tsx:27`

```ts
const SUPABASE_PROJECT_ID = 'erfwtoavipwjqmylpizt';
```

Hardcoded in compiled JS bundles. Should derive from `VITE_SUPABASE_URL` env var.

---

### 20. Dead Radix Toast Components Still in Codebase

**Files:** `src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, `src/components/ui/use-toast.ts`

The Radix UI toast system (ToastProvider, ToastViewport, Toast, ToastAction, etc.) is fully dead code. `App.tsx` only mounts `<Sonner />`, never `<Toaster />`. The `@radix-ui/react-toast` package is still in `package.json` adding bundle weight for zero benefit.

**Fix:** Remove `src/components/ui/toast.tsx`, `toaster.tsx`, `use-toast.ts`, and uninstall `@radix-ui/react-toast`.

---

### 21. Incomplete Barrel Exports in `src/components/shared/index.ts`

**File:** `src/components/shared/index.ts`

Only 9 of 14+ shared components are exported. Missing: `AIDescriptionGenerator`, `AISmartFieldMapper`, `CatalogHeader`, `ExploreVerticalsSheet`, `GooglePlacesAutocomplete`. Components are imported via direct file paths elsewhere, creating inconsistent import patterns.

**Fix:** Export all public shared components from the barrel file.

---

### 22. Duplicated Filter Configuration Schema

**Files:** `src/lib/filterConfigs/restaurantFiltersKlook.ts`, `transportFiltersKlook.ts`, `yachtFiltersKlook.ts`

Each implements the same structure (showDateFilters, pricePresets, sortOptions, chipSections) with copy-pasted boilerplate. No shared base type or factory function.

**Fix:** Create a shared `FilterConfig` type and factory, with per-vertical overrides.

---

### 23. Scattered Sanitization Utilities

**Files:** `src/lib/sanitize.ts`, `src/lib/sanitizePayload.ts`, `src/lib/sanitizeSearch.ts`

Three separate files for sanitization with no unified export. Some are re-exported from `src/lib/index.ts`, others require direct imports.

**Fix:** Consolidate into a single `src/lib/sanitize/index.ts` module.

---

## LOW Priority / Architectural Notes

### 24. Inconsistent Cache Strategy

Some hooks use centralized `CACHE_PROFILES` from `src/lib/queryConfig.ts`, others hardcode `staleTime`/`gcTime` or omit them entirely (defaulting to React Query's 0ms stale time). This leads to unpredictable data freshness.

### 25. Missing `queryClient.invalidateQueries` After Cart Operations

`CartContext` manages cart state independently of React Query. If any component also queries cart data via React Query, it won't be notified of changes.

### 26. Subscription Channel Name Collisions

Generic channel names like `'notifications-realtime'` can collide if multiple component instances subscribe. Prefer including user IDs: `'notifications-${userId}'`.

### 27. Language Context Subscription Created Regardless of Initial Load Failure

**File:** `src/contexts/LanguageContext.tsx:96-114`

If the initial translations fetch fails, the realtime subscription is still created, attempting to process updates for data that was never loaded.

### 28. No Barrel Export for UI Components

**File:** `src/components/ui/` (67 files, no `index.ts`)

Every consumer must import individual files. A barrel export would standardize the import surface and make dead code easier to identify.

### 29. Inconsistent Data Fetching Patterns

Components mix three patterns with no convention: (A) `useState + useEffect` with manual fetch, (B) custom hooks wrapping `useQuery`, (C) direct React Query usage. All three appear within the same feature modules.

---

## Summary

| # | Issue | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | ~~Realtime subscription memory leak~~ | CRITICAL | Memory Leak | RESOLVED |
| 2 | ~~Cart sync race condition on login~~ | CRITICAL | Data Loss | RESOLVED |
| 3 | ~~Profiles table readable by all users~~ | CRITICAL | Privacy | RESOLVED |
| 4 | ~~`.env` committed to git~~ | CRITICAL | Security | RESOLVED |
| 5 | ~~Developer portal accessible to any auth user~~ | CRITICAL | Auth / Privilege Escalation | RESOLVED |
| 6 | ~~RoleGuard uses two conflicting permission sources~~ | CRITICAL | Auth / Consistency | RESOLVED |
| 7 | ~~Unprotected MC registration route~~ | HIGH | Auth | RESOLVED |
| 8 | Inconsistent auth guard patterns across routes | HIGH | Auth | OPEN |
| 9 | ~~Duplicate Supabase client in errorHandler~~ | HIGH | Architecture | RESOLVED |
| 10 | Wide-open CORS on edge functions | HIGH | Security | OPEN |
| 11 | Refresh tokens in localStorage | HIGH | Security | OPEN |
| 12 | No Content Security Policy | HIGH | Security | OPEN |
| 13 | Query hooks swallow errors | HIGH | UX / Reliability | OPEN |
| 14 | Dual toast system (332 call sites) | MEDIUM | Consistency | OPEN |
| 15 | 649 `as any` casts | MEDIUM | Type Safety | OPEN |
| 16 | Unstable useEffect deps in realtime | MEDIUM | Performance | OPEN |
| 17 | Silent cart mutation failures | MEDIUM | UX | OPEN |
| 18 | XSS risk in map popups | MEDIUM | Security | OPEN |
| 19 | Hardcoded Supabase project ID | MEDIUM | Config | OPEN |
| 20 | Dead Radix toast components | MEDIUM | Dead Code | OPEN |
| 21 | Incomplete barrel exports in shared/ | MEDIUM | Consistency | OPEN |
| 22 | Duplicated filter config schema | MEDIUM | Duplication | OPEN |
| 23 | Scattered sanitization utilities | MEDIUM | Organization | OPEN |
| 24 | Inconsistent cache strategy | LOW | Performance | OPEN |
| 25 | Cart state not synced with React Query | LOW | Architecture | OPEN |
| 26 | Channel name collisions | LOW | Reliability | OPEN |
| 27 | Translations subscription after failure | LOW | Reliability | OPEN |
| 28 | No barrel export for UI components | LOW | Organization | OPEN |
| 29 | Inconsistent data fetching patterns | LOW | Consistency | OPEN |

**Resolved: 8/29 issues (all 6 CRITICAL + 2 HIGH)**
