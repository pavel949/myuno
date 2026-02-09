

# Global Information Architecture Overhaul
## 4 User Modes, Normalized Naming, Grouped Services Hub

---

## What Changes

This is a **UX/IA/naming-layer-only** refactoring. No routes, database tables, or APIs are modified. The changes affect how content is labeled, grouped, and navigated.

---

## 1. Bottom Navigation: 4 Tabs

Current (5 tabs): `Home | Discover | Services (drawer) | Bookings | Account`

New (4 tabs): `Life | Services | Marketplace | Me`

| Tab | Icon | Route | Purpose |
|-----|------|-------|---------|
| Life | Sparkles | `/` (Home) | LifeOS situations, context-driven guidance |
| Services | LayoutGrid | `/discover` (reused) | Grouped service catalog |
| Marketplace | ShoppingBag | `/market` | Products, transactions |
| Me | User | `/account` | Orders, properties, settings |

**File**: `src/components/layout/AdaptiveBottomNav.tsx`
- Replace 5 `guestNavItems` with 4
- Remove `isServicesSheet` logic and `ExploreVerticalsSheet` import
- Remove `/bookings` tab (accessible from Me section)
- Labels: EN `Life / Services / Marketplace / Me`, RU `Жизнь / Услуги / Маркет / Мой`

---

## 2. Global Naming Normalization

Update `labelEn` and `labelRu` in `src/lib/verticals.ts`:

| Internal ID | Old labelEn | New labelEn | New labelRu |
|-------------|-------------|-------------|-------------|
| property | Property | Real Estate | Недвижимость |
| yacht | Boat Charters | Yacht Charter | Яхт-чартер |
| vehicle | Transport | Car & Bike Rental | Аренда авто и мото |
| experience | Experiences | Things To Do | Чем заняться |
| cleaning | Cleaning | Home Cleaning | Клининг |
| babysitter | Babysitters | Childcare | Присмотр за детьми |
| beauty | Beauty & Spa | Beauty & Wellness | Красота и велнес |
| medical | Medical | Healthcare | Здоровье |
| legal | Legal | Legal Services | Юридические услуги |
| education | Education | Education & Courses | Образование |
| fitness | Fitness | Fitness & Gyms | Фитнес и залы |
| water_activity | Water Activities | Water Sports | Водный спорт |
| pet_service | Pet Services | Pet Care | Уход за питомцами |
| flower | Flowers | Flower Delivery | Доставка цветов |
| transfer | Transfers | Airport & City Transfers | Трансферы |
| insurance | Insurance | Insurance | Страхование |
| restaurant | Restaurants | Restaurants | Рестораны |
| event | Events | Events | События |

**Also remove TOUR entry** from `VERTICALS` (deprecated; data lives in experiences).

**Also update** `src/lib/config/entityTypes.ts` to match the same canonical names.

---

## 3. Services Hub: Grouped Catalog

Create `src/lib/verticalGroups.ts` — the grouping registry:

```text
Transport & Mobility:
  - transfer (Airport & City Transfers)
  - vehicle (Car & Bike Rental)
  - [airport_fast_track] (Fast Track)

Home & Living:
  - property (Real Estate)
  - cleaning (Home Cleaning)
  - babysitter (Childcare)
  - pet_service (Pet Care)
  - [expat] (Relocation Services)

Leisure & Lifestyle:
  - experience (Things To Do)
  - event (Events)
  - water_activity (Water Sports)
  - yacht (Yacht Charter)
  - fitness (Fitness & Gyms)
  - beauty (Beauty & Wellness)
  - restaurant (Restaurants)
  - flower (Flower Delivery)

Health & Administration:
  - medical (Healthcare)
  - [pharmacy] (Pharmacy)
  - insurance (Insurance)
  - legal (Legal Services)
  - education (Education & Courses)

Premium & Assistance:
  - [vip_concierge] (Concierge)
  - [sos] (Emergency Help)
```

Items in `[brackets]` are standalone screens (not in `VERTICALS`); they are mapped by route.

**Refactor** `src/pages/Discover.tsx` (which already serves as the services discovery screen) to render grouped sections instead of the current flat Klook-style layout. Each group gets a collapsible section header with verticals displayed as icon+label buttons.

**Remove** `ExploreVerticalsSheet` flat grid usage from the bottom nav (the sheet component itself stays for other uses).

---

## 4. Home Page = Life Mode

`src/pages/Index.tsx` changes:
- Remove `QuickActionsGrid` (services now live on Services tab)
- Keep: `HeroBlock`, `LifeSituationSelector`, `ActiveSituationBanner`, `PersonaChips`, `DiscoveryCarousel` (promotions only)
- The page focuses on: "What's happening in your life?" + contextual recommendations

---

## 5. Me Tab Consolidation

The `/account` route already exists. Bookings (previously a separate tab) become a section within Me. No new page needed — just the tab removal from bottom nav. Users still access `/bookings` via the account menu.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/verticalGroups.ts` | Canonical grouping registry with labels EN/RU |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/verticals.ts` | Update all `labelEn`/`labelRu`, remove TOUR |
| `src/lib/config/entityTypes.ts` | Align labels with new canonical names |
| `src/components/layout/AdaptiveBottomNav.tsx` | 4 tabs, remove sheet logic |
| `src/pages/Discover.tsx` | Grouped services hub layout |
| `src/pages/Index.tsx` | Remove QuickActionsGrid |
| `src/components/shared/ExploreVerticalsSheet.tsx` | Remove TOUR, use new labels |
| `src/components/home/QuickActionsGrid.tsx` | Update labels to match canonical names |

## Files NOT Changed

- All route definitions (AnimatedRoutes.tsx)
- All database hooks and queries
- All mini-app pages (pages/flowers, pages/yachts, etc.)
- Database schema and tables
- Authentication and authorization

---

## Summary

- **4 clear modes**: Life (situations) / Services (grouped catalog) / Marketplace (products) / Me (control center)
- **29 services** organized into **5 logical groups** instead of a flat list
- **Consistent naming** across all screens — no more "Boat Charters" vs "Yacht" vs "Charter" confusion
- **Zero route changes**, zero DB changes, zero API changes
- User never sees words: mini-app, vertical, hub, engine

