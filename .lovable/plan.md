

## Fix: Service Checkout Success URL Mismatch

### Problem
The `create-service-checkout` Edge Function sets `success_url` to `/services/success?session_id={CHECKOUT_SESSION_ID}`, but no route exists at that path. The actual route is `/services/order/success` (line 288 in AnimatedRoutes.tsx). After a successful Stripe payment, users hit a 404 page.

All other checkout flows (`flowers`, `market`, `property-deposit`, `wallet`, `restaurants`, `orders`) have matching routes and are correct.

### Fix (1 file, 1 line change)

**File: `supabase/functions/create-service-checkout/index.ts`** (line 115)

Change:
```
success_url: `${origin}/services/success?session_id={CHECKOUT_SESSION_ID}`
```
To:
```
success_url: `${origin}/services/order/success?session_id={CHECKOUT_SESSION_ID}`
```

Additionally, update `ServiceOrderSuccess.tsx` to read `session_id` from the URL search params (currently it only reads from `location.state`), so users arriving via Stripe redirect see proper confirmation data.

### Verification Matrix

| Checkout Function | success_url | Route | Status |
|---|---|---|---|
| create-service-checkout | `/services/order/success` | line 288 | WILL FIX |
| create-flowers-checkout | `/flowers/success` | line 280 | OK |
| create-market-checkout | `/market/success` | line 364 | OK |
| create-property-deposit-checkout | `/property/deposit-success` | line 184 | OK |
| create-checkout-session (wallet) | `/wallet?success=true` | line 145 | OK |
| create-restaurant-checkout | `/restaurants/:id?payment=success` | line 227 | OK |
| create-order-checkout | `/bookings/:id?success=true` | line 130 | OK |
| create-checkout (generic) | `/bookings/:id?success=true` | line 130 | OK |
| create-mc-subscription | `/mc/subscription?success=true` | MC routes | OK |
| create-vendor-subscription | `/vendor/subscription?success=true` | Vendor routes | OK |

