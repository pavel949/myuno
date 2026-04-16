

# Fix: Trust Stats Showing "0" and Contrast Issues

## Problem

The "ПОЧЕМУ MYUNO" section shows "0+" for all stats because:

1. **Properties & Providers**: The `head: true` count query works for anon users (public RLS policies exist), BUT the query for properties uses `.eq('is_active', true)` without filtering by `approval_status = 'approved'` — this shouldn't cause 0 though, since the RLS policy adds that filter. The real issue is likely **the sandbox network failure** returning null counts.

2. **Bookings** (`property_bookings`): All SELECT policies require `auth.uid()`. Anonymous visitors **always get 0** — this is a real RLS issue. The count of 585 bookings is invisible to unauthenticated users.

3. **Hardcoded dark borders**: Lines 44-45, 57, 79 still use `hsl(0 0% 100% / 0.07)`.

## Plan

### Step 1: Fix booking count for anonymous users

Create a **database function** (security definer) that returns aggregate counts without exposing row data. This avoids granting anon SELECT on `property_bookings`:

```sql
CREATE OR REPLACE FUNCTION public.get_trust_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'properties', (SELECT count(*) FROM properties WHERE is_active = true AND approval_status = 'approved'),
    'bookings', (SELECT count(*) FROM property_bookings),
    'providers', (SELECT count(*) FROM providers WHERE is_active = true)
  );
$$;
```

### Step 2: Update TrustStats component

Replace the 3 separate Supabase queries with a single RPC call:

```typescript
const { data: stats } = useQuery({
  queryKey: ['trust-stats-home'],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_trust_stats');
    if (error) throw error;
    return data as { properties: number; bookings: number; providers: number };
  },
  staleTime: 10 * 60 * 1000,
});
```

### Step 3: Fix hardcoded border colors

Replace all `hsl(0 0% 100% / 0.07)` in TrustStats.tsx with `hsl(var(--border))`.

## Files Changed
- **Migration**: New `get_trust_stats()` RPC function
- **`src/components/home/TrustStats.tsx`**: Switch to RPC + fix border tokens

## Risk
- Zero risk — security definer function only returns aggregate counts, no row data exposed
- Border fix is purely cosmetic token swap

