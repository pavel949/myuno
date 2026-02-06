

# UX Audit: Guest Experience on myUNO Platform

## Overall Impression
The platform has a premium, polished visual identity with a clear Klook/Airbnb-inspired design. Navigation is consistent, the bottom tab bar works well, and the home page contextual funnel is logical. However, there are several issues ranging from broken routes to booking flow dead-ends.

---

## CRITICAL Issues (Blocks Guest From Completing Goal)

### 1. `/transfers` route is 404
The route `/transfers` returns a "Page Not Found" error. Transfer services live at `/transfer` (landing page) or are nested inside `/transport`. If any link in the app points to `/transfers`, guests hit a dead-end.
**Fix**: Add a redirect from `/transfers` to `/transfer` in the router.

### 2. `/life` route is 404
Navigating to `/life` shows a 404. The correct route is `/life-flow`. Any internal links or sitemap references to `/life` are broken.
**Fix**: Add redirect `/life` -> `/life-flow`.

### 3. Flower booking flow dead-end
On the flower delivery landing (`/flower-delivery`), clicking "Vybirat buket" (Select Bouquet) opens a modal/card but there is no clear "Add to Cart" or "Order" CTA visible to complete the purchase. The flow stops at browsing without a clear next step.
**Fix**: Ensure the flower detail card has a prominent "Add to Cart" / "Order Now" button that routes to checkout or cart.

---

## HIGH Priority Issues (Hurts Conversion / Confusing)

### 4. Property page shows no listings
The `/property?mode=rent` page renders the structure (hero, filters, project promo section) but shows zero actual property cards in the listings grid. For a guest, this looks like an empty platform with nothing to offer.
**Fix**: Verify database seeding for rental properties. Ensure the query doesn't filter out all results (check RLS, status filters, or location defaults).

### 5. Experiences page shows loading skeleton indefinitely
The `/experiences` page renders the layout structure but shows skeleton placeholders that never resolve into actual content. This suggests a data-fetching issue or empty dataset.
**Fix**: Debug the experiences query (check `providers`, `services` tables for experience-type entries). Ensure fallback empty-state messaging exists.

### 6. Yachts page shows empty state
The `/yachts` page loads the layout but shows no yacht listings. Same pattern as property and experiences -- the catalog verticals appear to have no visible inventory for a guest user.
**Fix**: Verify yacht data in the database and that queries work for unauthenticated users (RLS policies allowing anon reads).

### 7. Market page content is thin
The `/market` page shows the marketplace layout with proper structure (hero carousel, categories) but the actual product grid appears sparse. A guest sees mostly placeholder-like content.
**Fix**: Seed marketplace products or ensure product queries return data.

---

## MEDIUM Priority Issues (UX Polish)

### 8. Home page "Phuket Today" widget shows placeholder data
The weather/utility widget appears functional but may show stale or mock data. For a real guest, inaccurate local info erodes trust.
**Fix**: Verify data source and freshness, or show clear "demo" labels.

### 9. Transport page has content but no clear booking CTA
The `/transport` page shows vehicle rental cards with prices, but the path from browsing to booking isn't immediately obvious. Cards need a stronger "Book Now" or "Reserve" button.
**Fix**: Add a clear primary CTA on each vehicle card leading to the booking form.

### 10. Life Flow page loads but feels disconnected
The `/life-flow` page shows the situation selector properly but the page layout has a lot of whitespace and the situations feel disconnected from actionable next steps. After selecting a situation, the results are unclear.
**Fix**: Ensure each life situation maps to visible, bookable services with clear CTAs.

### 11. Rent Phuket landing page CTA leads nowhere visible
The `/rent-phuket` landing page has nice hero copy and trust messaging, but the CTA button's destination should be the property catalog with pre-applied filters. Verify it navigates correctly.

---

## POSITIVE Observations (What Works Well)

- **Home page structure** is excellent: hero, smart widget, persona selector, quick actions -- logical contextual funnel
- **Bottom navigation** works correctly and is visually polished with proper active states
- **Service/Product toggle** on home page is clear and functional
- **Transfer landing page** (`/transfer`) is well-designed with trust copy, route cards, and fixed pricing
- **Flower delivery landing** (`/flower-delivery`) has premium visual quality with nice bouquet cards
- **Catalog drawer** (hamburger menu) provides comprehensive navigation taxonomy
- **Dark mode** is consistent across all pages
- **Bilingual support** (RU/EN) works throughout the interface
- **Visual design tokens** are consistent -- card hierarchy, spacing, typography all feel cohesive

---

## Summary Action Table

| # | Issue | Severity | Fix Effort |
|---|-------|----------|------------|
| 1 | `/transfers` 404 | Critical | Low (add redirect) |
| 2 | `/life` 404 | Critical | Low (add redirect) |
| 3 | Flower booking has no CTA to order | Critical | Medium |
| 4 | Property page shows 0 listings | High | Medium (data/query) |
| 5 | Experiences page stuck on skeleton | High | Medium (data/query) |
| 6 | Yachts page empty | High | Medium (data/query) |
| 7 | Market page sparse content | High | Medium (seeding) |
| 8 | Phuket Today widget accuracy | Medium | Low |
| 9 | Transport cards missing booking CTA | Medium | Low |
| 10 | Life Flow results unclear | Medium | Medium |
| 11 | Rent Phuket CTA destination | Medium | Low |

---

## Recommended Implementation Order

1. Fix broken routes (redirects for `/transfers`, `/life`) -- immediate, 5 min
2. Fix flower ordering CTA -- ensures at least one vertical is bookable E2E
3. Debug empty catalogs (property, experiences, yachts) -- likely a shared issue with data seeding or RLS for anon users
4. Add booking CTAs to transport cards
5. Polish Life Flow results display

