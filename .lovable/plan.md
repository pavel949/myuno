

# Audit: Booking Paths Across All Verticals

## Summary of All Booking Flows

| Vertical | Route | Booking Engine | Status |
|----------|-------|---------------|--------|
| **Yachts** | `/yachts/:id/booking` | `useBooking` (deprecated) | Issues found |
| **Experiences** | `/experiences/:id/book` | `useBooking` (deprecated) | Issues found |
| **Transport (Rental)** | `/transport/booking/:id` | `useBooking` (deprecated) | Issues found |
| **Transport (Transfer)** | `/transport/airport-transfer` | `useOrders` (correct) | OK |
| **Property** | `/property/:id/inquiry` | `useOrders` (correct) | OK |

---

## Issues Found

### 1. Yacht and Experience bookings use deprecated `useBooking` hook

Both `YachtBooking.tsx` and `ExperienceBooking.tsx` still use the **deprecated** `useBooking()` hook (line 129: `@deprecated Use useOrders() instead`). `PropertyInquiry` and `AirportTransferBooking` already use the canonical `useOrders()`.

**Impact:** Deprecated hook may diverge from canonical order lifecycle, missing fields like `start_at`/`end_at`, proper `order_type`, and atomic RPC.

**Fix:** Migrate `YachtBooking` and `ExperienceBooking` from `useBooking().createBooking()` to `useOrders().createOrder()`, aligning the payload structure with the canonical `create_order_atomic` RPC.

### 2. Yacht booking uses `booking_type: 'transport'` instead of `'yacht'`

In `YachtBooking.tsx` line 204: `booking_type: 'transport'` with a comment "Maps to 'yacht' via metadata." This is fragile -- the order type should be explicit.

**Fix:** Change to `order_type: 'yacht'` when migrating to `useOrders`.

### 3. Transport rental availability check uses wrong vertical

In `TransportBooking.tsx` line 89: `vertical: 'service'` with comment "Transport uses service-type availability check." The `AvailabilityVertical` type does not include `'transport'`, but using `'service'` is semantically incorrect and will not match transport-specific availability rules.

**Fix:** Either add `'transport'` to `AvailabilityVertical` type and handle it in the RPC, or document that `'service'` is intentional for vehicle rentals.

### 4. Experience booking lacks availability check

`ExperienceBooking.tsx` does NOT call `useAvailabilityCheck` before submitting. A user could book a fully-booked tour slot.

**Fix:** Add `checkAvailability()` call with `vertical: 'tour'` before submission in `handleSubmit`.

### 5. Experience booking has no auth redirect

Unlike Yacht and Transport bookings (which redirect unauthenticated users to `/auth`), `ExperienceBooking.tsx` has no auth guard. An unauthenticated user could reach the booking page and fail silently on submit.

**Fix:** Add `useEffect` auth redirect matching Yacht/Transport pattern.

### 6. Transport rental booking lacks `scheduled_at` ISO string conversion

In `TransportBooking.tsx` line 185: `const scheduledAt = pickupDate;` -- passes a raw `Date` object. The `useBooking` hook expects `Date | string`, but `useOrders` expects ISO string. This should be normalized during migration.

---

## What Works Well

- **Property** (`/property/:id/inquiry`): Full Airbnb-style flow with date range, guest count, price breakdown with weekly/monthly discounts, cancellation policy, Instant vs Request-to-Book, 10% deposit, uses canonical `useOrders()`.
- **Airport Transfer** (`/transport/airport-transfer`): 3-step wizard, dynamic pricing, Stripe/cash/concierge advance, uses canonical `useOrders()`.
- **Yacht Booking UI**: Good UX with charter type selection, experience add-ons, deposit logic, availability check.

---

## Proposed Fixes (in priority order)

### Step 1: Migrate YachtBooking to useOrders
- Replace `useBooking` with `useOrders`
- Change `booking_type: 'transport'` to `order_type: 'yacht'`
- Align payload with `createOrder` signature (items, participants, metadata)
- Keep existing availability check logic

### Step 2: Migrate ExperienceBooking to useOrders
- Replace `useBooking` with `useOrders`
- Add auth redirect guard
- Add availability check before submission
- Align payload with `createOrder` signature

### Step 3: Migrate TransportBooking to useOrders
- Replace `useBooking` with `useOrders`
- Fix availability vertical or document the `'service'` usage
- Normalize date formats

### Step 4: Add `'transport'` to AvailabilityVertical type
- Update `src/types/availability.ts` to include `'transport'`
- Update availability RPC if needed

These changes ensure all verticals use the same canonical order creation path (`create_order_atomic` RPC), consistent status lifecycle, and proper availability validation.
