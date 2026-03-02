# myUNO DS2.0 — Super-App UX Patterns

## Pattern Components (`src/components/ds/`)

All patterns use DS2.0 tokens (elevation scale, semantic colors, typography).

---

### 1. SectionHeader
Section labeling with icon + title + optional action link.

```tsx
import { SectionHeader } from '@/components/ds';

<SectionHeader
  title="Popular Services"
  subtitle="Most booked this week"
  icon={Flame}
  action={{ label: 'See all', onClick: () => navigate('/services') }}
  size="lg" // sm | md | lg
/>
```

---

### 2. CategoryGrid
Super-app category navigation grid (Gojek-style).

```tsx
import { CategoryGrid } from '@/components/ds';

<CategoryGrid
  columns={4}
  items={[
    { id: 'flowers', icon: '🌸', label: 'Flowers', onClick: () => navigate('/flowers') },
    { id: 'yachts', icon: Sailboat, label: 'Yachts', badge: 'NEW' },
  ]}
/>
```

---

### 3. ServiceHubSection
Horizontal scroll section with header (home screen pattern).

```tsx
import { ServiceHubSection } from '@/components/ds';

<ServiceHubSection
  title="Near You"
  subtitle="Top-rated services"
  icon={MapPin}
  actionLabel="View All"
  onAction={() => navigate('/near-me')}
  layout="scroll" // or "grid"
>
  <ItemCard ... />
  <ItemCard ... />
</ServiceHubSection>
```

---

### 4. PromoBanner
Promotional banner with navy gradient + optional background image.

```tsx
import { PromoBanner } from '@/components/ds';

<PromoBanner
  title="First booking 20% off"
  subtitle="Use code WELCOME20"
  image="/promo-bg.jpg"
  ctaLabel="Book now"
  onClick={handlePromo}
  variant="hero" // default | compact | hero
/>
```

---

### 5. TrustBadge
Provider verification indicator.

```tsx
import { TrustBadge } from '@/components/ds';

<TrustBadge level="verified" />
<TrustBadge level="premium" label="UNO Premium" />
<TrustBadge level="top-rated" />
```

---

### 6. FilterBar
Listing page filter/sort controls.

```tsx
import { FilterBar } from '@/components/ds';

<FilterBar
  resultsCount={42}
  resultsLabel="properties"
  sortOptions={[
    { id: 'price-asc', label: 'Price: Low → High' },
    { id: 'rating', label: 'Top Rated' },
  ]}
  activeSort="rating"
  onSortChange={setSort}
  filterCount={3}
  onFilterClick={openFilters}
/>
```

---

### 7. PriceBreakdown
Checkout price summary with line items.

```tsx
import { PriceBreakdown } from '@/components/ds';

<PriceBreakdown
  currency="฿"
  items={[
    { label: '2 nights × ฿3,500', value: 7000 },
    { label: 'Cleaning fee', value: 500, type: 'fee' },
    { label: 'Discount', value: -700, type: 'discount' },
    { label: 'Total', value: 6800, type: 'total' },
  ]}
/>
```

---

### 8. CheckoutPanel
Sticky checkout summary (mobile: bottom, desktop: sidebar).

```tsx
import { CheckoutPanel } from '@/components/ds';

<CheckoutPanel
  title="Booking Summary"
  priceItems={priceItems}
  ctaLabel="Confirm & Pay"
  onSubmit={handleCheckout}
  isLoading={isSubmitting}
  secondaryAction={{ label: 'Cancel', onClick: goBack }}
/>
```

---

## UX Pattern Recipes

### Home Hub Pattern
```
DiscoverHero
├── SectionHeader (Featured)
├── ServiceHubSection (scroll)
│   └── ItemCard[]
├── CategoryGrid (4 cols)
├── PromoBanner (hero)
├── SectionHeader (Popular)
└── ServiceHubSection (grid)
    └── ItemCard[]
```

### Listing Pattern
```
CatalogHeader (sticky)
├── FilterBar
├── [grid/list of ItemCards]
└── Pagination
```

### Detail Pattern
```
Media Gallery
├── TrustBadge
├── Key Facts (meta grid)
├── Description
├── Amenities Grid
├── Reviews Section
└── CheckoutPanel (sticky bottom)
```

### Checkout Pattern
```
Surface (card)
├── Editable Options
├── PriceBreakdown
├── Payment Section
└── CheckoutPanel (CTA)
```
