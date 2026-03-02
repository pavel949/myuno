
# Advanced Pricing Rules for Property Cards

## Summary
Implement a comprehensive pricing management system for each property, covering seasonal pricing enhancement, length-of-stay discounts, early booking discounts, payment schedules, refundable deposit in USD, and a guest negotiation/special offer UX.

## What Exists Today
- **Seasonal Pricing**: Basic component (`SeasonalPricing.tsx`) with high/low/holiday/custom seasons and % price modifiers
- **Discounts**: Weekly (7+ nights) and monthly (28+ nights) percentage discounts
- **Deposit**: Simple numeric field in THB only (no currency selector)
- **Payment Terms**: Taxonomy presets in `propertyTaxonomy.ts` (10%, 50%, 100%, pay-on-arrival) but NOT wired to the property editor or booking flow
- **No early booking discounts, no last-minute deals, no negotiation UX**

## Best Practices (Airbnb, Booking.com, VRBO)
1. **Tiered length-of-stay discounts** (weekly, monthly, custom thresholds)
2. **Early bird discount** (book 30/60/90 days ahead = X% off)
3. **Last-minute discount** (book within 1-7 days = X% off)
4. **Payment schedule per property** (prepayment %, balance due date)
5. **Deposit in fixed currency** (USD is standard for international markets)
6. **Special offers** (manager sends a personalized price to a specific guest)
7. **Price negotiation** (guest proposes a price, manager accepts/counters/declines)

---

## Implementation Plan

### 1. Database Migration -- New columns on `properties` table

```text
properties table additions:
- early_booking_discount    NUMERIC       (% off if booked N+ days ahead)
- early_booking_days        INTEGER       (threshold: e.g., 30 days)
- last_minute_discount      NUMERIC       (% off if booked within N days)
- last_minute_days          INTEGER       (threshold: e.g., 3 days)
- payment_policy            TEXT          ('prepay_10' | 'prepay_50' | 'full_prepay' | 'pay_on_arrival' | 'custom')
- prepay_percent            -- ALREADY EXISTS
- balance_due_days          INTEGER       (days before check-in to pay balance)
- deposit_currency          -- ALREADY EXISTS (just needs UI wiring)
- negotiation_enabled       BOOLEAN       (allow guest price proposals)
- custom_length_discounts   JSONB         (array of {min_nights, discount_percent})
```

New table for special offers and negotiations:

```text
property_price_offers:
  id              UUID PK
  property_id     UUID FK -> properties
  booking_id      UUID FK -> property_bookings (nullable)
  guest_user_id   UUID FK -> auth.users (nullable)
  type            TEXT ('special_offer' | 'negotiation_request' | 'counter_offer')
  original_price  NUMERIC
  offered_price   NUMERIC
  discount_percent NUMERIC
  valid_from      DATE
  valid_until     DATE
  nights          INTEGER
  message         TEXT
  status          TEXT ('pending' | 'accepted' | 'declined' | 'expired' | 'countered')
  created_by      UUID FK -> auth.users
  responded_at    TIMESTAMPTZ
  response_message TEXT
  created_at      TIMESTAMPTZ DEFAULT now()
```

RLS: Managers can CRUD offers for their properties; guests can view/respond to offers directed at them.

### 2. Enhanced Pricing Rules UI (Property Editor)

Add a new **"Pricing Rules"** card/section inside the existing Pricing tab of the Property Editor, containing:

**A. Early Booking Discount**
- Toggle on/off
- Days threshold selector (30 / 60 / 90 days)
- Discount % input
- Preview: "Book 60+ days ahead = 15% off"

**B. Last-Minute Discount**
- Toggle on/off
- Days threshold (1-7 days)
- Discount % input
- Preview: "Book within 3 days = 10% off"

**C. Custom Length-of-Stay Discounts**
- Extend current weekly/monthly with custom tiers
- Add/remove rows: min_nights + discount_percent
- Example: 14+ nights = 12%, 60+ nights = 30%

**D. Payment Schedule**
- Selector from taxonomy presets (prepay_10, prepay_50, full_prepay, pay_on_arrival)
- Custom option: free % input + "Balance due X days before check-in"
- Per-property -- each unit can have different rules

**E. Deposit in USD**
- Add currency selector (THB/USD) next to deposit amount field
- Wire existing `deposit_currency` DB column to the form
- Default: USD for international properties

### 3. Negotiation and Special Offers UX

**For Manager (MC Dashboard):**
- "Send Special Offer" button on guest inquiry / booking request
- Form: select property, dates, custom price, discount %, validity period, message
- Offer card in booking detail view with status tracking
- Accept/decline guest counter-offers

**For Guest (Booking Flow):**
- "Propose Your Price" button on property detail page (only if `negotiation_enabled`)
- Simple form: desired price per night, dates, message
- Status tracker: Pending -> Accepted/Countered/Declined
- If countered, guest can accept the counter or decline

**Shared:**
- Notification on new offer/response (uses existing notification system)
- Offer expiration (auto-expire after `valid_until` date)

### 4. Booking Flow Integration

Update `PropertyBookingCard` and `PropertyInquiry` to:
- Apply early booking / last-minute discount automatically based on dates
- Display active special offers with "Apply Offer" button
- Show payment schedule breakdown (prepayment + balance)
- Display deposit amount with currency (USD)
- Stack discounts display: seasonal + length + early/last-minute

### 5. Files to Create/Modify

**New files:**
- `src/components/property/PricingRulesSection.tsx` -- Early bird, last-minute, custom length discounts
- `src/components/property/PaymentPolicySection.tsx` -- Payment schedule selector
- `src/components/property/NegotiationPanel.tsx` -- Manager-side offer/negotiation UI
- `src/components/property/GuestPriceProposal.tsx` -- Guest-side "propose price" UI  
- `src/hooks/usePropertyPriceOffers.ts` -- CRUD hook for property_price_offers table
- `src/lib/pricingEngine.ts` -- Pure function: calculate final price applying all rules

**Modified files:**
- `src/components/owner/property-wizard/steps/PricingStep.tsx` -- Add new sections
- `src/pages/owner/PropertyEditor.tsx` -- Wire new fields to save
- `src/hooks/usePropertyWizard.ts` -- Add new form fields
- `src/types/property.ts` -- Extend VendorProperty type
- `src/components/property/PropertyBookingCard.tsx` -- Apply pricing rules
- `src/pages/property/PropertyInquiry.tsx` -- Show payment schedule and offers
- `src/lib/propertyTaxonomy.ts` -- Already has payment presets, just export for reuse

### 6. Execution Order

1. Database migration (new columns + new table + RLS)
2. Extend TypeScript types and form data interfaces
3. Build `PricingRulesSection` and `PaymentPolicySection` components
4. Wire deposit currency selector into existing deposit field
5. Integrate into Property Editor and Wizard
6. Build pricing calculation engine (`pricingEngine.ts`)
7. Update booking flow components to apply rules
8. Build negotiation/special offer UI (manager + guest sides)
9. Connect notifications for offers
