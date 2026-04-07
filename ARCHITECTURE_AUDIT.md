# Architecture Audit Report

**Date:** 2026-04-07
**Scope:** Full codebase analysis — routing, auth, state management, security, and structural patterns.

---

## CRITICAL Issues

### 1. Realtime Subscription Memory Leak in `useAdminAuditLogsRealtime`

**File:** `src/hooks/useAdminAuditLogs.ts:80-106`

A Supabase realtime channel is created **inside `queryFn`** and never cleaned up. Every time React Query re-runs the query, a new subscription is created without unsubscribing the previous one.

```ts
// BUG: subscription created inside queryFn — no cleanup path
export function useAdminAuditLogsRealtime(onNewLog?) {
  return useQuery({
    queryFn: async () => {
      const channel = supabase.channel('admin-audit-logs-changes')
        .on('postgres_changes', {...}, (payload) => { onNewLog?.(payload.new); })
        .subscribe();
      return { channel }; // channel reference is lost when query refetches
    },
  });
}
```

**Fix:** Move the subscription to a `useEffect` with a cleanup return, not inside `queryFn`.

---

### 2. Race Condition in Cart Sync on Login

**File:** `src/contexts/CartContext.tsx:147-183`

When a user logs in, local cart items are synced to the database, then immediately reloaded. The reload can execute before Supabase has committed all upserts, causing items to be lost.

```ts
await syncLocalCartToDatabase(localItems);
const updatedItems = await loadDatabaseCart(); // may not yet reflect all upserted items
```

**Fix:** Ensure `syncLocalCartToDatabase` returns success confirmation or use a transaction, then reload.

---

### 3. Overly Permissive RLS Policy — Profiles Table

**File:** `supabase/migrations/20260108232401_*.sql`

```sql
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
```

**Every** authenticated user can read **every** profile (names, emails, phone numbers, avatars). This is a privacy violation at scale.

**Fix:** Restrict to `USING (auth.uid() = id)` for own-profile access, plus a separate policy for admin roles.

---

### 4. `.env` File Committed to Git

**File:** `.env` (tracked), `.gitignore` (missing `.env` entry)

The `.env` file contains Supabase credentials and is committed to the repository. While anon keys are expected on the frontend, committing this file sets a bad precedent and risks future secret leaks (e.g., service role key).

**Fix:** Add `.env` to `.gitignore`, remove from git history (`git rm --cached .env`), rotate keys if service_role key was ever committed.

---

### 5. Unprotected Developer Portal — Privilege Escalation

**File:** `src/components/layout/AnimatedRoutes.tsx:261-268`, `src/pages/developer-portal/DeveloperPortalLayout.tsx`

The `/developer-portal` route has **no route-level auth guard**. `DeveloperPortalLayout` checks if the user is authenticated but does **not** redirect when `useDeveloperProfile()` returns `null` (i.e., user is not a developer). The layout and all nested routes (`/projects`, `/leads`, `/analytics`) still render.

```tsx
// AnimatedRoutes.tsx:261 — no guard wrapping this route
<Route path="/developer-portal" element={<Suspense><Pages.DeveloperPortalLayout /></Suspense>}>
  <Route index element={<LazyPage><Pages.DeveloperOverview /></LazyPage>} />
  ...
</Route>

// DeveloperPortalLayout.tsx
if (!user) return <Navigate to="/auth" />;
// MISSING: if (!developer) return <Navigate to="/" />;
return <NewbuildsLayout>...</NewbuildsLayout>; // renders even if developer is null
```

**Impact:** Any authenticated user can access developer portal pages.

**Fix:** Add `if (!developer) return <Navigate to="/" />;` after the auth check, or wrap the route with a `DeveloperGuard`.

---

### 6. RoleGuard Uses Two Conflicting Permission Sources

**File:** `src/components/auth/RoleGuard.tsx:33-56`

`RoleGuard` uses **server-side** `useResolvedContext()` for admin bypass (line 51) but **client-side** `useUserContext().hasRole()` for all other role checks (line 56). The codebase documents `useResolvedContext` as the "SINGLE SOURCE OF TRUTH" for permissions, yet the actual permission gate uses the client-side derivation.

```tsx
const { hasRole } = useUserContext();           // CLIENT-SIDE role derivation
const { context } = useResolvedContext();        // SERVER-SIDE role resolution

if (context?.role === 'admin') return children;  // server source for admins
const hasAllowedRole = allowedRoles.some(r => hasRole(r)); // client source for everyone else
```

**Impact:** If server and client role logic diverge, regular users could be granted or denied access incorrectly. Admins are checked differently than other roles.

**Fix:** Use `useResolvedContext()` exclusively for all role checks.

---

## HIGH Priority Issues

### 7. Unprotected MC Registration Route

**File:** `src/components/layout/AnimatedRoutes.tsx:608`

`/mc/register` has no `AuthGuard`, while the adjacent `/mc/onboarding` (line 607) does. `MCRegistrationPage` checks auth internally via client-side redirect, but unauthenticated users briefly see the page contents before being redirected.

```tsx
// Line 607 — has guard
<Route path="/mc/onboarding" element={<AuthGuard><Pages.MCOnboarding /></AuthGuard>} />
// Line 608 — no guard
<Route path="/mc/register" element={<Pages.MCRegistrationPage />} />
```

**Fix:** Wrap with `<AuthGuard>` for consistency.

---

### 8. Inconsistent Auth Guard Patterns Across Routes

**File:** `src/components/layout/AnimatedRoutes.tsx:570-572, 607-608`

Similar onboarding/registration routes use different protection patterns. Vendor onboarding (line 571) has no guard, MC onboarding (line 607) has `AuthGuard`, MC registration (line 608) has none. This inconsistency creates security blind spots.

**Fix:** Establish and enforce a consistent guard pattern for all protected route categories.

---

### 9. Duplicate Supabase Client in Error Handler

**File:** `src/lib/errorHandler.ts:105-118`

Instead of importing the singleton `supabase` client from `@/integrations/supabase/client`, the error handler manually constructs a `fetch()` call with raw env vars. This bypasses auth state, RLS, and creates a parallel unauthenticated connection.

```ts
await fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
  headers: { 'Authorization': `Bearer ${supabaseKey}` }, // anon key, not user session
});
```

**Impact:** Error logs are always unauthenticated — RLS policies on `analytics_events` cannot identify the user. If the table requires auth, errors are silently dropped.

**Fix:** Import and use the shared Supabase client.

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
const SUPABASE_PROJECT_ID = 'kakkwibljrjsawxgnupk';
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

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | Realtime subscription memory leak | CRITICAL | Memory Leak |
| 2 | Cart sync race condition on login | CRITICAL | Data Loss |
| 3 | Profiles table readable by all users | CRITICAL | Privacy |
| 4 | `.env` committed to git | CRITICAL | Security |
| 5 | Developer portal accessible to any auth user | CRITICAL | Auth / Privilege Escalation |
| 6 | RoleGuard uses two conflicting permission sources | CRITICAL | Auth / Consistency |
| 7 | Unprotected MC registration route | HIGH | Auth |
| 8 | Inconsistent auth guard patterns across routes | HIGH | Auth |
| 9 | Duplicate Supabase client in errorHandler | HIGH | Architecture |
| 10 | Wide-open CORS on edge functions | HIGH | Security |
| 11 | Refresh tokens in localStorage | HIGH | Security |
| 12 | No Content Security Policy | HIGH | Security |
| 13 | Query hooks swallow errors | HIGH | UX / Reliability |
| 14 | Dual toast system (332 call sites) | MEDIUM | Consistency |
| 15 | 649 `as any` casts | MEDIUM | Type Safety |
| 16 | Unstable useEffect deps in realtime | MEDIUM | Performance |
| 17 | Silent cart mutation failures | MEDIUM | UX |
| 18 | XSS risk in map popups | MEDIUM | Security |
| 19 | Hardcoded Supabase project ID | MEDIUM | Config |
| 20 | Dead Radix toast components | MEDIUM | Dead Code |
| 21 | Incomplete barrel exports in shared/ | MEDIUM | Consistency |
| 22 | Duplicated filter config schema | MEDIUM | Duplication |
| 23 | Scattered sanitization utilities | MEDIUM | Organization |
| 24 | Inconsistent cache strategy | LOW | Performance |
| 25 | Cart state not synced with React Query | LOW | Architecture |
| 26 | Channel name collisions | LOW | Reliability |
| 27 | Translations subscription after failure | LOW | Reliability |
| 28 | No barrel export for UI components | LOW | Organization |
| 29 | Inconsistent data fetching patterns | LOW | Consistency |
