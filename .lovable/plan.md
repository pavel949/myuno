
# P1 Implementation Plan: Rate Limiting, iCal Token Rotation, and Soft Delete

## Executive Summary
All three P1 items have **partial implementations** that need completion:
- **P1-1**: Rate limiting infrastructure exists but only 3 of 20+ edge functions use it
- **P1-2**: Backend token rotation is complete but frontend lacks the "Regenerate" button
- **P1-3**: Soft delete columns and RLS exist - **FULLY COMPLETE**, no changes needed

---

## P1-1: Rate Limiting — Add to Remaining Edge Functions

### Current State
| Protected | Not Protected |
|-----------|---------------|
| `ai-support-chat` | `create-checkout-session` |
| `ai-translate` | `create-flowers-checkout` |
| `calendar-export` | `create-order-checkout` |
| | `create-restaurant-checkout` |
| | `create-vendor-subscription` |
| | `check-vendor-subscription` |
| | `generate-booking-voucher` |
| | `get-mapbox-token` |
| | `get-weather` |
| | `ical-sync` |
| | `vendor-portal` |

### Implementation
Add `withRateLimit` middleware to each unprotected function with appropriate limits:

```text
Payment endpoints (RATE_LIMITS.payment - 20/min):
- create-checkout-session
- create-flowers-checkout  
- create-order-checkout
- create-restaurant-checkout
- create-vendor-subscription
- stripe-webhook (skip - has signature validation)

Auth/Subscription endpoints (RATE_LIMITS.auth - 5/min):
- check-vendor-subscription
- vendor-portal

Public read endpoints (RATE_LIMITS.publicRead - 100/min):
- get-mapbox-token
- get-weather
- generate-booking-voucher
- ical-sync
```

### Code Pattern for Each Function
```typescript
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

// Inside handler, after CORS check:
const rateLimitResponse = await withRateLimit(
  req,
  'function-name',
  RATE_LIMITS.payment, // or .auth, .publicRead
  corsHeaders,
  userId // if authenticated
);
if (rateLimitResponse) return rateLimitResponse;
```

---

## P1-2: iCal Token Rotation — Add Frontend UI

### Current State
- **Database**: `rotate_ical_token()` RPC exists and works
- **Validation**: `validate_ical_token()` RPC enforces expiration
- **Frontend**: Missing "Regenerate Link" button

### Implementation

**Step 1: Extend `useICalExportUrl` hook** with rotation mutation:
```typescript
// Add to useExternalCalendars.ts
const rotateToken = useMutation({
  mutationFn: async (propertyId: string) => {
    const { data, error } = await supabase.rpc('rotate_ical_token', {
      p_property_id: propertyId
    });
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ical-export-url'] });
  },
});

return { 
  exportUrl, 
  isLoading, 
  rotateToken: rotateToken.mutateAsync,
  isRotating: rotateToken.isPending 
};
```

**Step 2: Add "Regenerate Link" button** to `CalendarSyncManager.tsx`:
```typescript
// In the Calendar Export card, after the copy button:
<Button 
  variant="outline" 
  onClick={handleRotateToken}
  disabled={isRotating}
>
  <RefreshCw className={cn("h-4 w-4", isRotating && "animate-spin")} />
</Button>

// Handler:
const handleRotateToken = async () => {
  try {
    await rotateToken(propertyId);
    toast.success(isRu ? 'Ссылка обновлена' : 'Link regenerated');
  } catch (error) {
    toast.error(isRu ? 'Ошибка обновления' : 'Failed to regenerate');
  }
};
```

**Step 3: Add expiration warning** when token is about to expire:
```typescript
// Fetch ical_token_expires_at along with token
const { data } = await supabase
  .from('owner_properties')
  .select('ical_token, ical_token_expires_at')
  .eq('id', propertyId)
  .single();

// Show warning if expires within 30 days
if (expiresAt && new Date(expiresAt) < new Date(Date.now() + 30*24*60*60*1000)) {
  // Render warning badge
}
```

---

## P1-3: Soft Delete for Orders — COMPLETE

### Verification
| Component | Status |
|-----------|--------|
| `deleted_at` column | ✅ Exists |
| `deleted_by` column | ✅ Exists |
| `soft_delete_order()` RPC | ✅ Admin-only |
| RLS filters `deleted_at IS NULL` | ✅ Enforced |
| Audit trail in `order_status_history` | ✅ Logged |

**No changes required** — P1-3 is fully implemented.

---

## Technical Details

### Files to Modify

**P1-1 Rate Limiting (10 edge functions):**
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/create-flowers-checkout/index.ts`
- `supabase/functions/create-order-checkout/index.ts`
- `supabase/functions/create-restaurant-checkout/index.ts`
- `supabase/functions/create-vendor-subscription/index.ts`
- `supabase/functions/check-vendor-subscription/index.ts`
- `supabase/functions/generate-booking-voucher/index.ts`
- `supabase/functions/get-mapbox-token/index.ts`
- `supabase/functions/get-weather/index.ts`
- `supabase/functions/ical-sync/index.ts`
- `supabase/functions/vendor-portal/index.ts`

**P1-2 Token Rotation UI (2 files):**
- `src/hooks/useExternalCalendars.ts` — Add `rotateToken` mutation
- `src/components/owner/CalendarSyncManager.tsx` — Add regenerate button + expiration warning

---

## Verification Steps

### P1-1 Verification
```bash
# Test rate limiting by making 6 rapid requests
for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" \
  "https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/get-weather"; done
# Expected: First 5 return 200, 6th returns 429
```

### P1-2 Verification
1. Navigate to Owner → Properties → Calendar Sync
2. Click "Regenerate Link" button
3. Copy new URL and verify old URL returns 401
4. Confirm new URL works

### P1-3 Verification
```sql
-- As admin, soft delete an order
SELECT soft_delete_order('some-order-uuid');

-- Verify user can't see it
SELECT * FROM orders WHERE id = 'some-order-uuid'; -- Empty for user

-- Verify admin can see it
SELECT * FROM orders WHERE id = 'some-order-uuid'; -- Shows with deleted_at set
```

---

## Implementation Order
1. **P1-3**: Already complete — verify only
2. **P1-2**: Add frontend rotation UI (2 files)
3. **P1-1**: Add rate limiting to remaining edge functions (10 files)

## Estimated Changes
- **SQL migrations**: None required
- **Edge functions**: 10 files (add import + middleware call)
- **Frontend**: 2 files (hook extension + UI button)
- **Total lines changed**: ~150-200 lines
