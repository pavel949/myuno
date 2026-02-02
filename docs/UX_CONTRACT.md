# myUNO SuperApp — UX Design Contract

> **Version**: 1.0.0  
> **Last Updated**: 2026-02-02  
> **Status**: Active  
> **Maintainers**: Platform Architecture Team

---

## 1. Executive Summary

This document defines the **mandatory UX patterns, component usage, and design standards** for all 40+ verticals within the myUNO SuperApp platform. Compliance with this contract ensures:

- **Consistency**: Users experience familiar patterns across all services
- **Efficiency**: Developers reuse proven components instead of reinventing
- **Quality**: Standardized layouts reduce bugs and edge cases
- **Scalability**: New verticals inherit established patterns automatically

### Compliance Levels

| Level | Description | Enforcement |
|-------|-------------|-------------|
| 🔴 **MUST** | Mandatory requirement | Build will fail / PR blocked |
| 🟡 **SHOULD** | Strong recommendation | Code review flagged |
| 🟢 **MAY** | Optional enhancement | At developer discretion |

---

## 2. Layout Architecture

### 2.1 MiniAppLayout (🔴 MUST)

All vertical mini-apps **MUST** use `MiniAppLayout` as their root layout wrapper.

```tsx
import { MiniAppLayout } from '@/components/layout/MiniAppLayout';

export default function VerticalIndex() {
  return (
    <MiniAppLayout
      title="Vertical Name"
      showBackButton={true}
      headerVariant="sticky"
    >
      {/* Content */}
    </MiniAppLayout>
  );
}
```

**Required Props:**
- `title`: Localized string (supports `{en, ru}` object)
- `showBackButton`: Boolean for navigation context
- `headerVariant`: `'sticky'` | `'fixed'` | `'static'`

### 2.2 Page Structure (🔴 MUST)

Every vertical index page **MUST** follow this structure:

```
┌─────────────────────────────────────┐
│  UnifiedHeader (sticky, blur)       │ ← Search + Navigation
├─────────────────────────────────────┤
│  UnifiedFilterRibbon                │ ← Category/Audience tabs
├─────────────────────────────────────┤
│  FilterBar (UnifiedFiltersKlook)    │ ← Advanced filters (if applicable)
├─────────────────────────────────────┤
│  Content Grid/List                  │ ← ItemCards or VerticalCards
├─────────────────────────────────────┤
│  Empty State (if no results)        │ ← Standardized empty component
└─────────────────────────────────────┘
```

### 2.3 Bottom Navigation (🔴 MUST)

- **USE**: `AdaptiveBottomNav` — role-based navigation component
- **DO NOT USE**: Legacy `BottomNav` (deprecated)

```tsx
// ✅ Correct
import { AdaptiveBottomNav } from '@/components/layout/AdaptiveBottomNav';

// ❌ Deprecated - Do not use
import { BottomNav } from '@/components/layout/BottomNav';
```

---

## 3. Header Components

### 3.1 UnifiedHeader (🔴 MUST)

All pages **MUST** use `UnifiedHeader` for consistent top navigation.

```tsx
import { UnifiedHeader } from '@/components/shared/UnifiedHeader';

<UnifiedHeader
  title={isRu ? 'Красота' : 'Beauty'}
  showSearch={true}
  showCart={false} // true for marketplace verticals
  onSearchChange={handleSearch}
/>
```

**Styling Requirements:**
- Position: `sticky top-0`
- Background: `bg-background/95 backdrop-blur`
- Z-index: `z-50`
- Border: `border-b border-border/50`

### 3.2 UnifiedSectionHeader (🟡 SHOULD)

Section titles within pages **SHOULD** use `UnifiedSectionHeader`.

```tsx
<UnifiedSectionHeader
  title={isRu ? 'Популярные салоны' : 'Popular Salons'}
  actionLabel={isRu ? 'Все' : 'View All'}
  onAction={() => navigate('/beauty/all')}
/>
```

---

## 4. Filter System

### 4.1 UnifiedFiltersKlook (🔴 MUST for filterable verticals)

All verticals with filtering capabilities **MUST** use `UnifiedFiltersKlook`.

```tsx
import { UnifiedFiltersKlook } from '@/components/shared/UnifiedFiltersKlook';

const VERTICAL_CONFIG: UnifiedFiltersKlookConfig = {
  showDateFilters: true,
  showPriceFilter: true,
  priceRange: { min: 0, max: 50000, step: 500 },
  pricePresets: [
    { label: 'Budget', labelRu: 'Бюджет', min: 0, max: 5000 },
    { label: 'Mid-range', labelRu: 'Средний', min: 5000, max: 15000 },
    { label: 'Premium', labelRu: 'Премиум', min: 15000, max: null },
  ],
  sortOptions: [
    { value: 'popular', label: 'Most Popular', labelRu: 'Популярные' },
    { value: 'price_asc', label: 'Price: Low to High', labelRu: 'Цена: по возрастанию' },
    { value: 'price_desc', label: 'Price: High to Low', labelRu: 'Цена: по убыванию' },
    { value: 'rating', label: 'Highest Rated', labelRu: 'По рейтингу' },
  ],
  chipSections: [
    {
      id: 'features',
      title: 'Features',
      titleRu: 'Особенности',
      options: [/* feature chips */],
    },
  ],
};
```

### 4.2 Filter Configuration by Vertical Type

| Vertical Type | Date Filters | Price Filter | Category Chips | Location Filter |
|---------------|--------------|--------------|----------------|-----------------|
| Experiences   | 🔴 MUST      | 🔴 MUST      | 🔴 MUST        | 🟡 SHOULD       |
| Services      | 🟡 SHOULD    | 🔴 MUST      | 🔴 MUST        | 🟡 SHOULD       |
| Marketplace   | ❌ NO        | 🔴 MUST      | 🔴 MUST        | 🟡 SHOULD       |
| Property      | 🔴 MUST      | 🔴 MUST      | 🔴 MUST        | 🔴 MUST         |

### 4.3 UnifiedFilterRibbon (🔴 MUST)

Category/audience navigation **MUST** use `UnifiedFilterRibbon`.

```tsx
<UnifiedFilterRibbon
  categories={categories}
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  variant="scrollable" // 'scrollable' | 'wrap' | 'dropdown'
/>
```

---

## 5. Card Components

### 5.1 Card Selection Matrix

| Content Type | Primary Card | Alternative | Notes |
|--------------|--------------|-------------|-------|
| Services (People) | `ItemCard` | `ProviderCard` | Use avatar, ratings |
| Experiences | `ExperienceCard` | `ItemCard` | Duration, difficulty badges |
| Products | `ProductCard` | `ItemCard` | Price, cart actions |
| Properties | `PropertyCard` | `ItemCard` | Location, amenities |
| Institutions | `InstitutionCard` | `ItemCard` | Logo, entity badge |

### 5.2 ItemCard (🔴 MUST for individuals/services)

Standard card for service providers and individuals.

```tsx
import { ItemCard } from '@/components/shared/ItemCard';

<ItemCard
  id={item.id}
  image={item.cover_image}
  title={isRu ? item.name_ru : item.name_en}
  subtitle={isRu ? item.category_ru : item.category_en}
  price={item.price}
  currency={item.currency}
  rating={item.rating}
  reviewCount={item.review_count}
  badges={[
    { label: 'Verified', variant: 'success' },
    { label: 'Top Rated', variant: 'primary' },
  ]}
  onClick={() => navigate(`/vertical/${item.id}`)}
/>
```

**Required Visual Elements:**
- Cover image with aspect ratio `3:2` or `4:3`
- Title: `font-semibold text-base`
- Subtitle: `text-sm text-muted-foreground`
- Price: `font-bold` with currency symbol
- Rating: Star icon + numeric value

### 5.3 ProductCard (🔴 MUST for marketplace)

E-commerce optimized card with cart integration.

```tsx
<ProductCard
  product={product}
  showAddToCart={true}
  showWishlist={true}
  showCondition={product.seller_type === 'individual'}
  variant="grid" // 'grid' | 'list' | 'compact'
/>
```

**C2C Marketplace Requirements:**
- Display `condition` badge for individual sellers
- Show `seller_type` indicator (Business/Individual)
- Include "Negotiable" tag when applicable

### 5.4 Card Grid Layouts (🔴 MUST)

```tsx
// Standard 2-column mobile, 3-4 column desktop
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>

// List view (full width)
<div className="flex flex-col gap-3">
  {items.map(item => <ItemCard key={item.id} variant="horizontal" {...item} />)}
</div>
```

---

## 6. Entity Type System

### 6.1 Semantic Entity Classification (🔴 MUST)

All database entities **MUST** have an `entity_type` field for correct UI rendering.

```sql
-- Standard entity_type values
'institution'  -- Schools, Clinics, Companies
'individual'   -- Tutors, Freelancers, Babysitters
'service'      -- Abstract offerings (not tied to specific provider)
```

### 6.2 Entity-to-UI Mapping

| Entity Type | Icon | Card Variant | Navigation |
|-------------|------|--------------|------------|
| `institution` | `Building2` | `InstitutionCard` | `/vertical/institution/:id` |
| `individual` | `User` | `ItemCard` (avatar) | `/vertical/provider/:id` |
| `service` | `Briefcase` | `ServiceCard` | `/vertical/service/:id` |

### 6.3 Tab/Filter Labels by Entity Type

```tsx
// ✅ Correct semantic mapping
const ENTITY_TABS = {
  institution: { en: 'Schools', ru: 'Школы', icon: Building2 },
  individual: { en: 'Tutors', ru: 'Репетиторы', icon: User },
};

// ❌ Incorrect - mixing entity types
const BAD_TABS = [
  { label: 'Schools', items: tutors }, // Semantic mismatch!
];
```

---

## 7. Icon System

### 7.1 IconBadge Component (🔴 MUST)

All icons **MUST** use the centralized `IconBadge` component.

```tsx
import { IconBadge } from '@/components/ui/icon-badge';

// With Lucide icon
<IconBadge icon={Sparkles} size="md" variant="primary" />

// With emoji
<IconBadge icon="🏖️" size="lg" variant="gradient" />
```

**Available Sizes:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`  
**Available Variants:** `default`, `primary`, `muted`, `gradient`, `outline`

### 7.2 Icon Resolution (🔴 MUST)

Icons are resolved through `iconMap.ts` (200+ mappings).

```tsx
// Automatic resolution from string
<IconBadge icon="beach" /> // Resolves to Umbrella icon
<IconBadge icon="spa" />   // Resolves to Flower2 icon
```

---

## 8. Color & Theming

### 8.1 Semantic Tokens (🔴 MUST)

**NEVER** use raw color values. Always use semantic tokens.

```tsx
// ✅ Correct - semantic tokens
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="bg-accent text-accent-foreground">

// ❌ Incorrect - raw colors
<div className="bg-white text-black">
<div className="bg-blue-500 text-white">
<div className="bg-[#1a1a2e]">
```

### 8.2 Status Colors

| Status | Token | Usage |
|--------|-------|-------|
| Success | `bg-green-500/10 text-green-600` | Verified, Approved, Active |
| Warning | `bg-amber-500/10 text-amber-600` | Pending, Review needed |
| Error | `bg-red-500/10 text-red-600` | Rejected, Failed, Expired |
| Info | `bg-blue-500/10 text-blue-600` | New, Featured, Highlighted |

### 8.3 Dark Mode (🔴 MUST)

All components **MUST** support dark mode.

```tsx
// ✅ Correct - dark mode compatible
<div className="bg-primary/10 dark:bg-primary/20">
<span className="text-blue-600 dark:text-blue-400">

// ❌ Incorrect - no dark mode consideration
<div className="bg-blue-100">
```

---

## 9. Typography

### 9.1 Heading Hierarchy (🔴 MUST)

```tsx
// Page titles
<h1 className="text-2xl font-bold">Page Title</h1>

// Section headers
<h2 className="text-xl font-semibold">Section Title</h2>

// Subsection headers
<h3 className="text-lg font-medium">Subsection Title</h3>

// Card titles
<h4 className="text-base font-semibold">Card Title</h4>

// Labels
<span className="text-sm font-medium">Label</span>

// Body text
<p className="text-sm text-muted-foreground">Description</p>

// Small text / captions
<span className="text-xs text-muted-foreground">Caption</span>
```

### 9.2 Truncation (🟡 SHOULD)

Long text **SHOULD** use proper truncation.

```tsx
// Single line
<p className="truncate">Long text here...</p>

// Multi-line (2 lines)
<p className="line-clamp-2">Long text here...</p>

// Multi-line (3 lines)
<p className="line-clamp-3">Long text here...</p>
```

---

## 10. Spacing & Layout

### 10.1 Standard Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Icon-text spacing |
| `gap-2` | 8px | Inline elements |
| `gap-3` | 12px | Card internal padding |
| `gap-4` | 16px | Grid gaps, section spacing |
| `gap-6` | 24px | Major section breaks |
| `gap-8` | 32px | Page section separation |

### 10.2 Page Padding (🔴 MUST)

```tsx
// Standard page container
<div className="px-4 py-6 max-w-7xl mx-auto">

// Mobile-first responsive padding
<div className="px-4 md:px-6 lg:px-8">
```

---

## 11. Interactive States

### 11.1 Button States (🔴 MUST)

```tsx
// Primary action
<Button variant="default">Primary Action</Button>

// Secondary action
<Button variant="outline">Secondary</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Loading state
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  Loading...
</Button>
```

### 11.2 Card Hover States (🟡 SHOULD)

```tsx
<div className="rounded-xl border transition-all hover:shadow-lg hover:border-primary/20">
```

---

## 12. Loading & Empty States

### 12.1 Loading Skeleton (🔴 MUST)

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Card skeleton
<div className="space-y-3">
  <Skeleton className="h-40 w-full rounded-xl" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### 12.2 Empty State (🔴 MUST)

```tsx
import { EmptyState } from '@/components/shared/EmptyState';

<EmptyState
  icon={Search}
  title={isRu ? 'Ничего не найдено' : 'No results found'}
  description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
  action={{
    label: isRu ? 'Сбросить фильтры' : 'Clear filters',
    onClick: handleClearFilters,
  }}
/>
```

---

## 13. Localization

### 13.1 Bilingual Support (🔴 MUST)

All user-facing text **MUST** support Russian and English.

```tsx
const { language } = useLanguage();
const isRu = language === 'ru';

// Text rendering
<span>{isRu ? item.name_ru : item.name_en}</span>

// With fallback
<span>{isRu ? (item.name_ru || item.name_en) : item.name_en}</span>
```

### 13.2 Database Schema (🔴 MUST)

All content tables **MUST** include bilingual columns:

```sql
name_en TEXT NOT NULL,
name_ru TEXT,
description_en TEXT,
description_ru TEXT,
```

---

## 14. Accessibility

### 14.1 ARIA Labels (🟡 SHOULD)

```tsx
<Button aria-label={isRu ? 'Добавить в корзину' : 'Add to cart'}>
  <ShoppingCart className="h-4 w-4" />
</Button>
```

### 14.2 Keyboard Navigation (🟡 SHOULD)

Interactive elements **SHOULD** be keyboard accessible.

```tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
```

---

## 15. Performance

### 15.1 Image Optimization (🔴 MUST)

```tsx
// Lazy loading for below-fold images
<img src={url} loading="lazy" alt={alt} />

// Responsive images
<img
  src={url}
  srcSet={`${url}?w=400 400w, ${url}?w=800 800w`}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 15.2 Code Splitting (🔴 MUST for pages)

All page components **MUST** be lazy loaded.

```tsx
const VerticalIndex = lazy(() => import('@/pages/vertical/VerticalIndex'));
```

---

## 16. Vertical-Specific Overrides

### 16.1 Experiences Vertical

- **Date filters**: Required (Today/Tomorrow/Calendar)
- **Duration badges**: Required
- **Difficulty indicators**: Optional
- **Group size display**: Required

### 16.2 Marketplace Vertical

- **Cart integration**: Required
- **Wishlist support**: Required
- **Condition badges**: Required for C2C
- **Seller type indicator**: Required

### 16.3 Property Vertical

- **Map integration**: Required
- **Availability calendar**: Required
- **Amenity icons**: Required
- **Zone/District filters**: Required

### 16.4 Services Vertical (Beauty, Fitness, Medical)

- **Provider avatars**: Required
- **Ratings display**: Required
- **Booking CTA**: Required
- **Service duration**: Required

---

## 17. Compliance Checklist

Before submitting a PR for any vertical, verify:

- [ ] Uses `MiniAppLayout` as root wrapper
- [ ] Uses `UnifiedHeader` for navigation
- [ ] Uses `UnifiedFiltersKlook` for filtering (if applicable)
- [ ] Uses `IconBadge` for all icons
- [ ] Uses semantic color tokens (no raw colors)
- [ ] Supports dark mode
- [ ] Includes bilingual text (en/ru)
- [ ] Uses proper entity_type classification
- [ ] Implements loading skeletons
- [ ] Implements empty states
- [ ] Uses lazy loading for images
- [ ] Page component is lazy loaded

---

## 18. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-02 | Initial UX Contract established |

---

## 19. References

- **Component Library**: `/src/components/shared/`
- **Design Tokens**: `/src/index.css`, `/tailwind.config.ts`
- **Icon Map**: `/src/lib/iconMap.ts`
- **Layout Components**: `/src/components/layout/`

---

*This document is the source of truth for UX consistency across the myUNO SuperApp platform. All new development must comply with these standards.*
