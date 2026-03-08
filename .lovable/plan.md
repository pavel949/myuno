

# Deep Technical Audit: myUNO SuperApp

## 1. Architecture Overview

The platform is a monolithic React SPA (~28,600 lines in types.ts alone) serving as a SuperApp for Phuket expats. It covers 20+ verticals (property, yachts, restaurants, fitness, etc.), 5 professional roles (Admin, MC, Vendor, Staff, Owner), and a consumer-facing marketplace.

**Stack**: React 18 + Vite + Tailwind CSS + TanStack Query + Supabase (Lovable Cloud)
**Scale**: ~467 files with DB queries, ~117 edge functions, ~280+ hooks, ~60+ page directories

---

## 2. SECURITY

### 2.1 Strengths
- Admin role check uses server-side `has_role` RPC (not localStorage) -- correct pattern
- Shared `auth-guard.ts` validates JWT via `supabase.auth.getUser()` in edge functions
- No `service_role` key leaked to frontend (`src/` is clean)
- RoleGuard uses server-resolved context for admin bypass
- CORS headers consistently applied across all edge functions
- No `dangerouslySetInnerHTML` with user input (only static map popups and chart styles)

### 2.2 Issues Found

**CRITICAL: ALL edge functions have `verify_jwt = false`**
Every single function in `config.toml` (60+) sets `verify_jwt = false`. While many implement `requireAuth()` in code, ~40+ functions lack any auth check. Functions like `send-promotions`, `leads-factory`, `send-email`, `admin-manage-mc-subscription` are callable without authentication by anyone who knows the endpoint URL. This is the most serious finding.

**Affected functions without auth guard** (sampled):
- `send-email`, `send-promotions`, `send-crm-email` -- can send arbitrary emails
- `leads-factory`, `auto-vendor-nurture`, `send-nurture-messages` -- can trigger automation
- `admin-manage-mc-subscription` -- can modify subscriptions
- `update-user-segments`, `execute-campaign-rules` -- can modify user data
- `enrich-projects`, `generate-sitemap` -- resource exhaustion risk

**MEDIUM: GOOGLE_MAPS_API_KEY exposed in `system_config` table**
The network request shows `system_config` returns empty array with anon key, meaning RLS blocks it. But the key fetch architecture relies on the table being readable -- verify RLS policy allows read for authenticated users only, not public.

### 2.3 Recommendations
1. Audit every edge function: add `requireAuth()` or `X-Internal-Secret` guard to all unprotected functions
2. For cron/internal functions (booking-reminders, scheduled-sync, etc.), require `X-Internal-Secret` header
3. Consider re-enabling `verify_jwt = true` for user-facing functions and keeping `false` only for webhooks/cron

---

## 3. PERFORMANCE

### 3.1 Strengths
- Well-structured cache profiles (STATIC/DYNAMIC/REALTIME) in `queryConfig.ts`
- Code splitting with `manualChunks` separating vendor bundles
- Lazy loading via centralized `pageRegistry.ts`
- Service Worker with NetworkOnly for HTML (prevents stale app issues)
- Image caching with CacheFirst strategy and 7-day expiry

### 3.2 Issues Found

**HIGH: Provider nesting depth (15 levels)**
`App.tsx` nests 15 context providers. Each re-render propagates through the entire tree. While React optimizes some cases, any provider that triggers frequent state updates (e.g., `LocationProvider`, `CurrencyProvider`) will cause unnecessary re-renders across the entire app.

**HIGH: types.ts is 28,630 lines**
Auto-generated, but impacts IDE performance and TypeScript compilation time significantly. This is a side effect of ~100+ database tables.

**MEDIUM: 467 files with DB queries, massive `as any` usage**
93 files use `as any` casts for Supabase queries, indicating type mismatches between the code and the database schema. This bypasses TypeScript safety and can mask runtime errors.

**MEDIUM: Supabase API cached in Service Worker**
The SW caches Supabase API responses with `NetworkFirst` + 1hr expiry. This means stale data can be served for up to 5 seconds (networkTimeoutSeconds) on slow connections. For mutations and real-time data, this can cause confusing UX.

**LOW: 1,537 console.log/warn/error statements in 184 files**
Production builds ship with extensive console output. Should use a logging utility with environment-aware filtering.

### 3.3 Recommendations
1. Consider splitting providers: group rarely-changing providers (Theme, Language) vs. frequently-updating ones (Cart, Location)
2. Remove Supabase API from SW cache or reduce TTL to 30 seconds
3. Gradually replace `as any` casts with proper type assertions or database schema updates
4. Add a build-time console stripping plugin

---

## 4. ERROR HANDLING

### 4.1 Strengths
- Global `ErrorBoundary` with chunk-error detection and user-friendly recovery
- `useGlobalErrorHandler` catches unhandled promise rejections
- Bilingual error messages (EN/RU)

### 4.2 Issues Found

**MEDIUM: 1,192 empty catch blocks across 150 files**
Pattern `catch { }` or `catch { // Silent fail }` appears extensively. While some are intentional (draft saving), many silently swallow errors that could indicate real problems.

**MEDIUM: No structured error logging/reporting**
`errorLog.silent()` is used but there's no external error tracking service (Sentry, LogRocket, etc.). Errors in production are invisible to the team.

### 4.3 Recommendations
1. Add an error reporting service for production monitoring
2. Audit empty catch blocks -- add at minimum `console.warn` for unexpected failures
3. Differentiate between "expected failures" (offline draft save) and "unexpected failures" (DB errors)

---

## 5. CODE QUALITY

### 5.1 Strengths
- Centralized query key factories in `queryConfig.ts`
- Shared edge function utilities (`_shared/supabase.ts`, `_shared/stripe.ts`, `_shared/auth-guard.ts`, `_shared/rate-limit.ts`)
- Consistent bilingual pattern across the codebase
- Well-documented architecture via `docs/DATABASE.md`, `docs/EDGE_FUNCTIONS.md`
- Memory system tracks architectural decisions

### 5.2 Issues Found

**HIGH: Codebase scale approaching maintainability limits**
- 280+ hooks in a single directory (no subdirectories)
- 60+ component subdirectories
- 117 edge functions
- This is a monolith that would benefit from domain-based organization

**MEDIUM: TODOs remaining in production code**
At least 4 TODO comments indicating unfinished features (bulk import, arrival card flow, order completion modal).

**LOW: `cdn.tailwindcss.com` loaded in production**
Console warning shows Tailwind CDN is being loaded alongside the PostCSS build. This is redundant and adds ~300KB of unnecessary JavaScript.

### 5.3 Recommendations
1. Organize hooks into subdirectories by domain (`hooks/property/`, `hooks/crm/`, `hooks/admin/`)
2. Remove Tailwind CDN reference
3. Track and resolve TODOs or convert them to backlog items

---

## 6. PWA & OFFLINE

### 6.1 Strengths
- NetworkOnly for navigation prevents serving stale HTML
- Proper cache versioning (v3) with old cache cleanup
- SOS page pre-caching for emergency offline access
- PWA update prompt for seamless upgrades

### 6.2 Issues Found
**LOW: `skipWaiting()` called both in install handler AND message handler**
Redundant -- the aggressive `skipWaiting()` at top-level already takes effect. The message handler version is dead code.

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1 Strengths
- 4-layer defense: ComingSoonGate > Route Guards > RLS > API Gateway
- Server-resolved context via `resolve_user_context` RPC
- Admin cache cleared on logout
- Email verification not auto-confirmed (secure default)
- `clearAdminCache()` called on sign-out prevents role leakage

### 7.2 Issues Found
**LOW: Admin cache uses in-memory Map**
`adminCache` in `useIsAdmin.ts` is a module-level `Map`. On page refresh, it's cleared automatically, which is fine. But in a long-lived session, the cache is never invalidated if admin status changes server-side.

---

## 8. SUMMARY SCORECARD

| Area | Score | Critical Issues |
|------|-------|----------------|
| Security | 6/10 | 40+ unprotected edge functions |
| Performance | 7/10 | Provider depth, `as any` casts |
| Error Handling | 5/10 | 1,192 empty catches, no external monitoring |
| Code Quality | 7/10 | Good patterns but scale issues |
| PWA | 9/10 | Solid implementation |
| Auth/Authz | 8/10 | Strong layered model |

### Top 5 Priority Actions
1. **Audit and protect all edge functions** -- add auth/internal-secret guards to unprotected endpoints
2. **Add production error monitoring** (Sentry or similar)
3. **Remove Tailwind CDN** from production
4. **Reduce `as any` usage** in Supabase queries (type safety)
5. **Organize hooks directory** by domain for maintainability

