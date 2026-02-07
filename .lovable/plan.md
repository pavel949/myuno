
# CTA Audit & Cross-Sell Enhancement

## Problem

Multiple cards and detail pages across the platform are purely informational -- they show price and info but lack a clear action button ("Book", "Buy", "Get Tickets"). Additionally, when a user views an activity like a zipline, there's no suggestion to complement it with dinner at a nearby restaurant or a related experience.

## Audit Results: Missing CTAs

### Cards Without CTA Buttons

| Card Component | Used In | Issue |
|---|---|---|
| `LifeFlowEntityCard` | Life Flow pages (Family, Arrival, etc.) | No CTA button at all -- just title, price, photo |
| `ItemCard` (horizontal) | Events, Gyms, Salons, Clinics, etc. | No CTA button -- only clickable area |
| `WaterSection` cards | Home page | Inline cards with price but no "Book" button |
| `ToursSection` cards | Home page | Inline cards with price but no "Book" button |

### Detail Pages: CTA Status

| Detail Page | Has Fixed Bottom CTA? | CTA Text | Status |
|---|---|---|---|
| ExperienceDetail | Yes | "Book with Operator" | OK |
| EventDetail | Yes | "Get Tickets" / "Book Now" | OK |
| PropertyDetail | Yes | "Reserve" / "Book Now" | OK |
| RestaurantDetail | Yes | "Reserve a Table" | OK |
| BabysitterDetail | Yes | "Book" | OK |
| CleaningDetail | Yes | "Book" | OK |
| VehicleDetail | Yes | "Book Now" | OK |
| TutorDetail | Yes | "Book Lesson" | OK |
| ProductDetailPage | Yes | "Add to Cart" | OK |
| InsuranceDetail | Yes | "Contact" | OK |
| LegalProviderDetail | Yes | "Contact" | OK |
| ServiceProviderDetail | Yes | "Book Services" | OK |

Detail pages are generally covered. The main gaps are in **card-level CTAs** and **contextual cross-sell**.

## Solution

### 1. Add CTA Button to `LifeFlowEntityCard`

Add a small action button at the bottom of each card. The CTA text is determined by entity type:
- experience/tour: "Book" 
- restaurant: "Reserve"
- property: "View"
- service/salon/clinic: "Book"
- marketplace_product: "Buy"

This converts passive browsing cards into conversion-oriented cards.

### 2. Add CTA prop to `ItemCard`

Add an optional `ctaLabel` prop to `ItemCard`. When provided, render a small button in the bottom-right corner next to the price. This allows every index page (Events, Gyms, Salons, etc.) to add context-appropriate CTAs like "Get Tickets", "Book", "Buy".

### 3. Add CTA to Home Page Section Cards

Add small "Book" buttons to `WaterSection` and `ToursSection` inline cards, matching the pattern already used in `ExperienceCard` ("Details" button).

### 4. Contextual Cross-Sell on ExperienceDetail

Currently `ExperienceDetail` has a generic `CrossSellSection` at the bottom. Enhance it with **contextual suggestions** based on the current experience category:

- **Zipline/Adventure** -> Suggest: Celebration dinner at a restaurant, Photography service
- **Waterpark** -> Suggest: Nearby restaurant, Sunscreen/gear from marketplace
- **Wildlife/Nature** -> Suggest: Related tours, Photography
- **Cooking class** -> Suggest: Restaurant with same cuisine, Market tour
- **Karting/Sports** -> Suggest: After-party dinner, Related activities

Implementation: Add a `contextualCrossSell` config map in `crossSellConfig.ts` that maps experience categories to recommended verticals with custom titles (e.g., "Celebrate after your adventure").

### 5. Add "Complete Your Day" Section to ExperienceDetail

Below the existing cross-sell, add a "Complete Your Day" section that suggests:
- A restaurant near the experience location (using district matching)
- A related activity in the same area
- Transport to/from the venue

This uses existing data from the database, filtered by district/location proximity.

## Technical Details

### Files to Modify

| File | Change |
|---|---|
| `src/components/life-flow/LifeFlowEntityCard.tsx` | Add CTA button based on entity type |
| `src/components/miniapp/ItemCard.tsx` | Add optional `ctaLabel` prop with button rendering |
| `src/components/home/WaterSection.tsx` | Add "Book" button to inline cards |
| `src/components/home/ToursSection.tsx` | Add "Book" button to inline cards |
| `src/pages/events/EventsIndex.tsx` | Pass `ctaLabel="Get Tickets"` to ItemCard |
| `src/lib/crossSellConfig.ts` | Add contextual cross-sell category mappings |
| `src/pages/experiences/ExperienceDetail.tsx` | Add "Complete Your Day" section with contextual suggestions |

### CTA Label Logic (for LifeFlowEntityCard)

```text
Entity Type -> CTA Label (EN / RU)
experience  -> "Book" / "Забронировать"
tour        -> "Book" / "Забронировать"  
restaurant  -> "Reserve" / "Столик"
property    -> "View" / "Смотреть"
service     -> "Book" / "Записаться"
salon       -> "Book" / "Записаться"
clinic      -> "Visit" / "Записаться"
gym         -> "Join" / "Записаться"
event       -> "Tickets" / "Билеты"
flower_shop -> "Order" / "Заказать"
marketplace -> "Buy" / "Купить"
default     -> "Open" / "Открыть"
```

### Contextual Cross-Sell Config

```text
Experience Category -> Suggested Verticals
zipline/adventure   -> restaurants (Celebrate!), tours (More adventures)
waterpark           -> restaurants (Lunch nearby), marketplace (Beach gear)
wildlife            -> tours (Nature tours), restaurants (Thai dinner)
cooking_class       -> restaurants (Try the cuisine), marketplace (Ingredients)
karting/sports      -> restaurants (Refuel after), experiences (More thrills)
attraction          -> restaurants (Family dining), tours (Explore more)
```

### ItemCard CTA Button Design

Small pill button (`size="sm"`, `variant="default"`) placed in the bottom-right of the card, replacing empty space next to the price. Stops event propagation so tapping the button can trigger a specific action (e.g., direct booking) vs tapping the card (goes to detail page).
