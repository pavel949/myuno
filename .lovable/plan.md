

## Audit: Navigation Links and Mini-App Context Consistency

### Issues Found

**1. Broken Route: `/banks` (2 places)**
- `LifeOSStatusBlock.tsx` — business context links to `/banks`
- `TripServicesGrid.tsx` — "Open Account" links to `/banks`
- Route `/banks` does NOT exist. The correct route is `/banking`.

**2. Broken Route: `/nightlife` (1 place)**
- `LifeOSStatusBlock.tsx` — nightlife context links to `/nightlife`
- Route `/nightlife` does NOT exist in `AnimatedRoutes.tsx` and has no legacy redirect.
- Fix: change to `/events` (the closest existing vertical for clubs/bars/events).

**3. Inconsistent Transfer Links**
- `LifeOSStatusBlock.tsx` (arrival, visa_travel contexts): links to `/transfer` — this is a **landing page** (SEO), not the booking flow.
- `QuickActionsGrid.tsx` (tourist): links to `/transport/airport-transfer` — this is the **actual booking flow**.
- For context actions (LifeOS), linking to the landing page is acceptable since it acts as an entry funnel. **No change needed**, but worth noting.

**4. Inconsistent Label: QuickAccessStrip**
- Uses "Real Estate" / "Недвижимость" for `/property`
- All other components use "Housing" / "Жильё" per the standardized naming convention.
- Fix: align to "Housing" / "Жильё".

### Changes Plan

| File | Change |
|------|--------|
| `src/components/home/LifeOSStatusBlock.tsx` | `business.banks`: `/banks` -> `/banking` |
| `src/components/home/LifeOSStatusBlock.tsx` | `nightlife.clubs`: `/nightlife` -> `/events` |
| `src/components/property/TripServicesGrid.tsx` | bank path: `/banks` -> `/banking` |
| `src/components/home/QuickAccessStrip.tsx` | Label: "Real Estate"/"Недвижимость" -> "Housing"/"Жильё" |

### Technical Details

All changes are simple string replacements in hardcoded configuration objects. No logic, routing, or component structure changes required. Total: 4 files, 4 line-level edits.

