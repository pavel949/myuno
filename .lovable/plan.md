

## Airbnb Booking Flow Redesign

### How Airbnb Actually Works

Airbnb uses a **2-page flow**, not a multi-step wizard:

1. **Property Detail Page** -- user selects dates and guests in a booking widget, sees price per night, clicks "Reserve"
2. **"Confirm and Pay" Page** -- a single scrollable page with everything needed to finalize:
   - Trip summary (dates, guests) with "Edit" links that go back to the detail page
   - Price breakdown (already calculated)
   - Contact info (auto-filled from profile)
   - Payment method selection
   - Cancellation policy and house rules (read-only)
   - One big "Confirm and pay" button

There is **no step-by-step wizard** on the booking page. Everything is visible at once on a single page.

### What Changes

**1. Property Detail Page (PropertyDetail.tsx)** -- keep as-is, it already handles date/guest selection and navigates to the inquiry page with URL params.

**2. PropertyInquiry.tsx -- full redesign to match "Confirm and Pay" pattern:**

- Remove the `BookingStepProgress` wizard -- replace with a simple "Confirm and Pay" header
- Assume dates and guests arrive via URL params (from the detail page). If missing, show an inline prompt to go back and select dates
- Layout becomes a single scroll:
  - **"Your trip" section** -- dates and guests displayed as summary rows with "Edit" links (navigate back to property detail)
  - **Price breakdown** -- always visible, no toggle
  - **Contact info** -- auto-filled from profile, collapsible if already filled
  - **Payment method** -- inline selection (deposit options)
  - **Cancellation policy** -- compact, read-only
  - **Ground rules** -- collapsible section with house rules
  - **"Confirm and pay" button** -- sticky at bottom

**3. PropertyListingCard.tsx** -- "Book" button behavior change:

- Instead of navigating directly to `/property/{id}/inquiry`, navigate to `/property/{id}` (the detail page) so the user can see the property, pick dates, then proceed. This matches Airbnb where you always go through the listing first.

### Technical Details

**PropertyInquiry.tsx rewrite:**
- Remove `BookingStepProgress` import and `propertyBookingSteps` config
- Remove `currentStep` logic entirely
- If `checkIn`/`checkOut` URL params are missing, show a message with a "Select dates" button linking back to the detail page
- Flatten all sections into a single scrollable layout
- Keep existing hooks: `usePropertyWithRentalTerms`, `usePropertyBlockedDates`, `useProfile`, `useAuth`
- Keep existing pricing logic
- Make the "Confirm and pay" button sticky at the bottom of the screen
- Auto-fill contact from profile silently; show editable fields only if profile data is incomplete

**PropertyListingCard.tsx update:**
- Change the "Book" button `onClick` from `/property/${id}/inquiry` to `/property/${id}` (detail page)

**Files to modify:**
- `src/pages/property/PropertyInquiry.tsx` -- major rewrite
- `src/components/property/PropertyListingCard.tsx` -- minor route change
