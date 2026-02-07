

# Full UX Audit: Vacation Rentals -- Mobile User Journey (Search to Booking)

## Executive Summary

I walked through the entire flow on a 390x844 mobile viewport, acting as a real user. The system has a solid foundation but **6 critical UX issues** break or confuse the booking funnel. The most important: **the mobile "Check Dates" button is a dead end** -- it navigates to the inquiry page without dates, which immediately redirects back.

---

## Step-by-Step Journey & Findings

### Step 1: Landing on /property (Search Page)

**What works:**
- Sticky header with title, Map button, and filter drawer icon
- Airbnb-style search bar (location, dates, guests)
- Category ribbon (Rent/Buy toggle + property type pills)
- Projects carousel visible
- Quick filter chips (beachfront, instant booking, sea view, etc.) -- scrollable
- Sort selector + results count
- Infinite scroll loads 27 properties correctly
- Property cards show image, district, title, specs, price

**Issues found:**
- [P2] The sticky header is very tall (~180px): Back button + title + search bar + category ribbon. On a 844px viewport, ~21% is eaten by chrome before content appears.
- [P3] Quick filter chips are not visually distinguishable from category chips -- two horizontally scrolling rows look similar.

---

### Step 2: Clicking a Property Card (Detail Page)

**What works:**
- Image gallery with photo counter badge and lightbox
- Title, rating, verified badge, district
- Airbnb-style highlights (property type, view, instant booking, building info)
- Specs grid (beds, baths, area, guests)
- Description, amenities, price breakdown, included services, utilities, check-in details, house rules, cancellation policy, location section
- Share and Favorite buttons in sticky header

**Issues found:**
- [P1] **Image gallery**: For properties with fewer than 5 images (most DB records have only 1 cover_image), the gallery renders a single full-width image with no visual cue that you can open a lightbox. Only a tiny "1 photos" badge in the corner.
- [P2] The detail page is extremely long on mobile (amenities, utilities, house rules, check-in details, etc.) before reaching any CTA. Users must scroll significantly.

---

### Step 3: Mobile Bottom Bar (The Critical CTA)

**What works:**
- Fixed bottom bar shows price per night, instant booking badge, Phone icon, Message icon, and main CTA button.
- CTA dynamically changes label: "Book Now" for instant booking, "Check Dates" otherwise.

**CRITICAL ISSUE [P0]:**
- **The "Check Dates" / "Проверить даты" button navigates to `/property/:id/inquiry` WITHOUT date parameters** (line 648: `navigate(\`/property/${id}/inquiry\`)`).
- The inquiry page (PropertyInquiry.tsx, line 67-72) checks for `checkIn` and `checkOut` params. If missing, it shows an error toast and **redirects back** to the detail page.
- **Result: The mobile booking button is a dead end. Clicking it flashes back to the same page with an error toast.** The user has no way to proceed on mobile.

**Root cause:** On desktop, the `PropertyBookingCard` sidebar has a date picker that collects dates and passes them as URL params to the inquiry page. On mobile, that sidebar is `hidden lg:block` (line 592), so the date picker is completely invisible. The bottom bar button has no date selection mechanism.

---

### Step 4: Inquiry Page (if accessed with dates)

**What works (when accessed directly with date params):**
- Clean layout with check-in/check-out summary, nights count, guests
- Contact form with auto-fill from profile
- Auth gate (sign in required)
- Deposit payment options appear when form is valid
- Booking terms card with cancellation policy, house rules
- Validation for min-stay and max-guests

**Issues found:**
- [P1] **No way to change dates on the inquiry page** -- there's only a "Change dates" link that sends users back to the detail page, where they still can't select dates on mobile.
- [P2] No step progress indicator -- the user doesn't know where they are in the booking process.

---

## Summary of All Issues (Priority Order)

| # | Priority | Issue | Impact |
|---|----------|-------|--------|
| 1 | P0 | Mobile "Check Dates" button is a dead end (no date picker, redirects back) | **Booking is impossible on mobile** |
| 2 | P1 | No mobile date picker anywhere in the detail-to-booking flow | Users cannot select dates on mobile |
| 3 | P1 | Most properties have only 1 image -- gallery looks flat, no multi-photo UX | Low engagement, low trust |
| 4 | P2 | No booking step indicator (no progress stepper) | User disorientation |
| 5 | P2 | Bottom bar Phone button has no onClick handler | Dead button |
| 6 | P2 | Sticky header takes ~21% of mobile viewport | Less content visible |
| 7 | P3 | Quick filters and category ribbon look visually similar | Minor confusion |

---

## Implementation Plan

### Fix 1 (P0/P1): Add Mobile Date Picker to Detail Page

The core fix. On mobile, when the user taps "Check Dates", instead of navigating to the inquiry page, open an **inline date range picker sheet/drawer** directly on the detail page. Once dates are selected, the CTA changes to "Reserve" / "Book Now" and navigates to `/property/:id/inquiry?checkIn=...&checkOut=...&guests=...`.

**Changes:**
- **PropertyDetail.tsx**: Add state for `dateRange` and `guests`. Import `Calendar` component + `Sheet` (Vaul drawer).
- When CTA is tapped without dates: open a bottom sheet with a date range picker + guest selector.
- When dates are selected: update CTA text to show price calculation and "Reserve" action.
- CTA with dates: navigate to inquiry page with full params.
- Remove the `hidden lg:block` restriction from a **simplified** mobile booking card, or integrate date picker directly into the bottom bar flow.

### Fix 2 (P2): Add Booking Step Progress

**Changes:**
- Import existing `BookingStepProgress` component into `PropertyInquiry.tsx`
- Add 3 steps: Dates -> Contact -> Payment
- Show step 2 (Contact) when on the inquiry page

### Fix 3 (P2): Wire up the Phone Button

**Changes:**
- Add `onClick` to the Phone button in the bottom bar: `window.open(\`tel:${rentalTerms?.manager_phone}\`)` or open a contact sheet if no phone available.

### Fix 4 (P2): Compact the Sticky Header on Scroll

**Changes:**
- Collapse the search bar and category ribbon on scroll (e.g., hide search bar after 100px scroll, show a compact single-line version).

### Fix 5 (P3): Visual Distinction for Filter Rows

**Changes:**
- Add subtle section labels or different chip styling between category ribbon and quick filter chips.

---

## Technical Details

### Files to modify:
1. `src/pages/property/PropertyDetail.tsx` -- Add mobile date picker sheet, wire phone button, manage date state
2. `src/pages/property/PropertyInquiry.tsx` -- Add BookingStepProgress, handle missing dates gracefully
3. `src/pages/property/PropertyIndex.tsx` -- Optional: compact header on scroll

### New components needed:
- None required -- reuse existing `Calendar` (react-day-picker), `Sheet` (vaul), and `BookingStepProgress`

### Dependencies:
- All already installed (vaul, react-day-picker, date-fns)

