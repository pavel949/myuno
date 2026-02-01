
# Implementation Plan: Add to Cart + Book Now for Tours (Klook-style)

## Overview
This plan implements dual checkout paths for tours matching the Klook UX pattern - users can either add tours to their cart for batch checkout or instantly book a single tour.

---

## Step 1: Extend CartContext

**File:** `src/contexts/CartContext.tsx`

Update the `CartItem` interface to support tours and booking-specific fields:

```typescript
export interface CartItem {
  id: string;
  type: 'food' | 'flowers' | 'service' | 'product' | 'tour' | 'activity';
  name: string;
  nameRu?: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  providerId?: string;
  providerName?: string;
  providerNameRu?: string;
  options?: Record<string, string>;
  // New booking-specific fields
  scheduledDate?: string;
  scheduledTime?: string;
  participants?: number;
}
```

---

## Step 2: Create useBookNow Hook

**New File:** `src/hooks/useBookNow.ts`

Hook for instant booking that bypasses the cart:
- Takes tour data and optional pre-selected parameters (date, time, participants)
- Navigates to `/tours/:id/book` with state containing booking data
- Enables auto-fill on the booking page

---

## Step 3: Create TourBookingQuickSelect Component

**New File:** `src/components/tours/TourBookingQuickSelect.tsx`

A Bottom Sheet component with:
- Quick date selection (Today, Tomorrow, Other)
- Time slot selection from tour's `start_times`
- Participant counter with price calculation
- Two action buttons: "Add to Cart" and "Book Now"
- Shows "In Cart" indicator if tour already added
- Real-time total price display

---

## Step 4: Update TourDetail Page

**File:** `src/pages/tours/TourDetail.tsx`

Replace the current single "Book Now" footer with `TourBookingQuickSelect`:
- Hybrid sticky bar showing price + Cart + Book Now buttons
- Import and integrate the new component
- Remove old booking footer code

---

## Step 5: Update TourBooking Page

**File:** `src/pages/tours/TourBooking.tsx`

Add support for pre-filled data from `location.state`:
- Check for `bookNowData` in location state
- Auto-populate date, time, and participants if provided
- Skip redundant selection steps when data is pre-filled

---

## Step 6: Update Cart Page

**File:** `src/pages/Cart.tsx`

Add tour support to the cart display:
- Add `'tour'` type with appropriate icon and colors
- Display scheduled date, time, and participants for tour items
- Route tour checkout to `/tours/checkout` (or handle inline)
- Allow editing of tour booking parameters

---

## Technical Details

### Cart Item ID Strategy
For tours with the same base ID but different booking times:
```typescript
id: `${tour.id}-${date}-${time}`
```
This allows multiple bookings of the same tour with different dates/times.

### Component Hierarchy
```text
TourDetail
└── TourBookingQuickSelect (fixed bottom bar)
    └── Sheet (booking form)
        ├── DateSelection (quick dates + calendar)
        ├── TimeSelection (tour start_times)
        ├── ParticipantCounter
        ├── TotalPrice
        └── ActionButtons (Cart + Book Now)
```

### State Flow
```text
User selects date/time/participants
    │
    ├── [Add to Cart] → CartContext → Cart Page → Tour Checkout
    │
    └── [Book Now] → useBookNow → TourBooking (pre-filled)
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/contexts/CartContext.tsx` | Modify - add tour type and booking fields |
| `src/hooks/useBookNow.ts` | Create - instant booking hook |
| `src/components/tours/TourBookingQuickSelect.tsx` | Create - booking UI component |
| `src/pages/tours/TourDetail.tsx` | Modify - integrate new component |
| `src/pages/tours/TourBooking.tsx` | Modify - support pre-filled state |
| `src/pages/Cart.tsx` | Modify - add tour display support |

---

## Expected Outcome

- Users can add multiple tours to cart with different dates
- "Book Now" provides fast single-tour checkout (existing flow)
- Cart displays tours with date/time/participants metadata
- Consistent with marketplace "Buy Now" + "Add to Cart" pattern
- Ready for extension to Yachts, Activities, and other verticals
