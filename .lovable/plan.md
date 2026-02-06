
# System Normalization: Broken Logic, Duplications & Optimization

## Summary of Findings

After auditing 250+ hooks, 60+ edge functions, and core data patterns, I identified **6 critical problem areas** with concrete fixes.

---

## FINDING 1: 4 Duplicate Stripe Checkout Hooks (CRITICAL)

**Problem:** Four nearly identical hooks exist, each copy-pasting the same Stripe checkout pattern:
- `useStripeCheckout.ts` (restaurants)
- `useStripeFlowersCheckout.ts` (flowers)  
- `useStripeMarketCheckout.ts` (marketplace)
- `useStripeServiceCheckout.ts` (services)

All four implement the same `isMountedRef` + `setIsProcessing` + `supabase.functions.invoke()` + `window.location.href` pattern. Three of them duplicate auth-check and error-handling blocks identically.

**Fix:** Create a single `useStripeUnifiedCheckout.ts` hook with a generic `createCheckout(functionName, params)` method. Migrate all 4 consumers to use it. Delete the 4 old files.

---

## FINDING 2: 3 Overlapping Favorites/Wishlist Hooks (BROKEN LOGIC)

**Problem:** Three hooks exist for the same concept:
- `useWishlist.ts` -- queries `marketplace_wishlist` table (products only)
- `useFavorites.ts` -- queries `favorites` table (all item types)
- `useUserCollections.ts` -- queries `favorites` table (unified replacement, backward-compatible)

Additionally, `useFavorites.ts` contains a **critical bug**: the fetch logic is duplicated -- it runs both inside `fetchFavorites` callback AND inside a `useEffect` with its own `loadFavorites` closure. This causes **double network requests** on every mount and dependency change.

**Active consumers:**
- `useFavorites` is still imported in 4 files
- `useWishlist` is imported in **0 files** (completely dead code)
- `useUserCollections` is imported in 4 files

**Fix:**
1. Delete `useWishlist.ts` (zero imports -- dead code)
2. Migrate 4 consumers from `useFavorites` to `useUserCollections`
3. Delete `useFavorites.ts`
4. Fix the remaining `useUserCollections` as the single source of truth

---

## FINDING 3: 2 Duplicate "Recently Viewed" Hooks + 1 DB-backed Equivalent

**Problem:** Three separate view-tracking mechanisms:
- `useRecentlyViewedProducts.ts` -- localStorage, products only
- `useRecentlyViewedServices.ts` -- localStorage, services only
- `useViewHistory.ts` -- Supabase `view_history` table, all item types

The localStorage hooks are structurally identical (copy-paste) and track data that `useViewHistory` already persists to the database. Furthermore, `useViewHistory.ts` has the **same double-fetch bug** as `useFavorites` -- `fetchHistory` callback and `useEffect > loadHistory` both fire the same query.

**Fix:**
1. Fix double-fetch bug in `useViewHistory.ts`
2. Keep localStorage hooks as offline-first quick views (they serve a valid UX purpose for non-logged-in users)
3. Deduplicate localStorage hooks into a single generic `useRecentlyViewed.ts`

---

## FINDING 4: Edge Function Version Drift (SECURITY / STABILITY)

**Problem:** A shared Supabase client exists at `_shared/supabase.ts` (pinned to `@2.49.4`), but **12+ edge functions import directly from esm.sh** with mismatched versions:

| Function | Supabase Version | Stripe Version |
|---|---|---|
| `create-checkout-session` | `@2.45.0` | `stripe@14.21.0` |
| `create-market-checkout` | `@2.45.0` | `stripe@14.21.0` |
| `create-flowers-checkout` | `@2.45.0` | `stripe@14.21.0` |
| `create-restaurant-checkout` | `@2.45.0` | `stripe@14.21.0` |
| `create-checkout` | `@2.57.2` | `stripe@18.5.0` |
| `create-order-checkout` | `@2.57.2` | `stripe@18.5.0` |
| `vendor-portal` | `_shared` | `stripe@18.5.0` |
| `stripe-webhook` | `_shared` | `stripe@18.5.0` |
| `ai-agent` | `@2.49.4` (direct) | -- |
| `ai-personalize-home` | `@2.49.4` (direct) | -- |
| `intake-listing-agent` | `@2.49.4` (direct) | -- |
| `vendor-acquisition` | `@2.49.4` (direct) | -- |
| `leads-factory` | `@2.49.4` (direct) | -- |

This means different checkout functions use **different Stripe API versions** (`14.21.0` vs `18.5.0`) and different `apiVersion` strings (`2023-10-16` vs `2025-08-27.basil`). This is a silent production risk.

**Fix:** 
1. Add `stripe.ts` to `_shared/` with pinned Stripe version
2. Migrate all edge functions to import from `_shared/supabase.ts` and `_shared/stripe.ts`
3. Eliminate all direct esm.sh imports for these libraries

---

## FINDING 5: 7 Duplicate Checkout Edge Functions

**Problem:** Seven separate edge functions handle Stripe checkout creation:
- `create-checkout` -- generic order payment
- `create-checkout-session` -- wallet top-up
- `create-order-checkout` -- canonical order creation + payment
- `create-flowers-checkout` -- flowers-specific
- `create-market-checkout` -- marketplace-specific  
- `create-restaurant-checkout` -- restaurant-specific
- `create-service-checkout` -- service-specific

All 7 repeat the same pattern: auth check, get/create Stripe customer, build line items, create session, return URL. The only differences are the metadata and which tables they write to.

`create-order-checkout` is the most complete -- it follows the canonical order lifecycle (creates order, items, participants, addresses, status history, payment intent). The other 5 vertical-specific ones bypass this entirely.

**Fix:** 
1. Consolidate into 2 functions: `create-checkout` (generic order payment) and `create-checkout-session` (wallet top-up)
2. All vertical checkouts should use `create-order-checkout` with `order_type` to distinguish verticals
3. Delete `create-flowers-checkout`, `create-market-checkout`, `create-restaurant-checkout`, `create-service-checkout` after migration

---

## FINDING 6: Inconsistent Error Handling in Hooks

**Problem:** Of 230+ hooks, ~95 use raw `console.error()` while the platform has a proper `createErrorHandler` utility. The `useViewHistory` hook, for example, uses raw `console.error` 5 times despite the error handler being available.

**Fix:** Migrate hooks with raw `console.error` to use `createErrorHandler` for consistency. This is a P2 item -- no functional breakage, but important for observability normalization.

---

## Implementation Plan (Priority Order)

### Phase 1 -- Fix Broken Logic (P0)
1. Fix double-fetch bug in `useFavorites.ts` and `useViewHistory.ts`
2. Delete dead `useWishlist.ts`
3. Migrate `useFavorites` consumers to `useUserCollections`
4. Delete `useFavorites.ts`

### Phase 2 -- Consolidate Frontend Hooks (P0)
5. Create `useStripeUnifiedCheckout.ts`
6. Migrate 4 Stripe checkout hooks' consumers
7. Delete 4 old Stripe hooks
8. Create generic `useRecentlyViewed.ts`, migrate consumers, delete 2 old hooks

### Phase 3 -- Normalize Edge Functions (P1)
9. Create `_shared/stripe.ts` with pinned version
10. Migrate all edge functions to use shared imports
11. Consolidate vertical checkout functions into `create-order-checkout`

### Phase 4 -- Error Handling Normalization (P2)
12. Sweep hooks using raw `console.error` and migrate to `createErrorHandler`

---

## Technical Details

### Unified Stripe Checkout Hook (Phase 2)

```typescript
// src/hooks/useStripeUnifiedCheckout.ts
export function useStripeUnifiedCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isMountedRef = useRef(true);

  const createCheckout = async (
    functionName: string, 
    params: Record<string, unknown>
  ): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { errorHandler.auth(...); return false; }
      
      const response = await supabase.functions.invoke(functionName, { body: params });
      if (response.error) throw response.error;
      if (response.data?.url) { window.location.href = response.data.url; return true; }
      throw new Error('No checkout URL');
    } catch (error) { ... }
    finally { if (isMountedRef.current) setIsProcessing(false); }
  };

  return { createCheckout, isProcessing };
}
```

### Shared Stripe Module (Phase 3)

```typescript
// supabase/functions/_shared/stripe.ts
import Stripe from "https://esm.sh/stripe@18.5.0";

export function createStripeClient() {
  return new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });
}

export { Stripe };
```

### Double-Fetch Bug Fix Pattern

```typescript
// BEFORE (broken -- fires query twice):
const fetchData = useCallback(async () => { /* query */ }, [deps]);
useEffect(() => { 
  const loadData = async () => { /* same query copy-pasted */ };
  loadData();
}, [deps]);

// AFTER (correct):
const fetchData = useCallback(async () => { /* query */ }, [deps]);
useEffect(() => { fetchData(); }, [fetchData]);
```
