

## Naming Normalization Audit: Yacht Vertical

### Industry Standard Analysis

Global charter platforms use a consistent pattern:

| Platform | Primary Label (EN) | Navigation |
|----------|-------------------|------------|
| Sailo | Boat Rentals | "Rent a Boat" |
| GetMyBoat | Boat Rentals | "Find a Boat" |
| Click&Boat | Boat Rental | "Rent a Boat" |
| Boatsetter | Boat Rentals | "Rent a Boat" |

Common pattern: **"Boat Charters"** or **"Boat Rentals"** -- never "Yachts & Boats" (asset-listing language, not intent language).

### Current myUNO Inconsistencies Found

| Location | Current EN | Current RU | Issue |
|----------|-----------|-----------|-------|
| YachtsIndex.tsx (page title) | "Yachts & Boats" | "Яхты и лодки" | Non-standard |
| categories table (DB) | "Yachts & Boats" | "Яхты и лодки" | Non-standard |
| ThematicSection.tsx | "Yachts & Boats" | "Яхты и катера" | Inconsistent RU |
| VipConcierge.tsx | "Yachts & Boats" | "Яхты и катера" | Mixed variant |
| RefundPolicyPage.tsx | "Yachts & Boats" | "Яхты и катера" | Mixed variant |
| TermsPage.tsx | "Yachts & boats" | "Яхты и катера" | Lowercase "boats" |
| DisputeResolutionPage.tsx | "Yachts & boats" | "Яхты и катера" | Lowercase |
| verticals.ts (SoT) | "Yachts" | "Яхты" | Short form only |
| entityTypes.ts | "Yachts" | "Яхты" | Short form only |
| ContentPreviewRibbon.tsx | "Yachts" | "Яхты" | Short form |
| AdminVerticalsBlock.tsx | "Yachts" | "Яхты" | Short form |
| DashboardQuickServices.tsx | "Yachts" | "Яхты" | Short form |
| leadVerticalConfig.ts | "Yachts" | "Яхты" | Short form |
| BusinessCardScanner.tsx | "Yachts & Boats" | "Яхты и лодки" | Non-standard |
| scan-business-card (edge fn) | "Yachts & Boats" | "Яхты и лодки" | Non-standard |
| searchData.ts | "Yachts" | "Яхты" | Short form |
| ContentCreatorMenu.tsx | "Yacht" | "Яхта" | Singular |
| useTaxonomyDefinitions.ts | "Yachts" | "Яхты" | Short form |

**3 different RU variants**: "Яхты и лодки", "Яхты и катера", "Яхты"

### Proposed Canonical Naming

Based on industry standards and the Phuket charter market context:

| Context | EN | RU |
|---------|----|----|
| **Full label** (page title, catalog) | Boat Charters | Аренда яхт и катеров |
| **Short label** (nav, icons, admin grids) | Charters | Чартер |
| **Vertical SoT** (verticals.ts) | Boat Charters | Чартер |
| **CTA / action** | Charter a Boat | Арендовать яхту |
| **Search category label** | Charters | Чартер |

### Implementation Plan

**Step 1: Update Sources of Truth**

- `src/lib/verticals.ts` -- change `labelEn: 'Yachts'` to `'Boat Charters'`, `labelRu: 'Яхты'` to `'Чартер'`
- `src/lib/config/entityTypes.ts` -- update `labelEn`, `labelRu`, `pluralEn`, `pluralRu`

**Step 2: Update Page Title and Catalog**

- `src/pages/yachts/YachtsIndex.tsx` -- title from "Yachts & Boats" to "Boat Charters" / "Аренда яхт и катеров"
- `src/hooks/useSuperAppCatalog.ts` -- verify catalog section name
- `src/hooks/useTaxonomyDefinitions.ts` -- VERTICAL_CONFIG yachts label

**Step 3: Update Navigation and Discovery**

- `src/components/home/ContentPreviewRibbon.tsx` -- label
- `src/components/account/DashboardQuickServices.tsx` -- label
- `src/components/discover/ThematicSection.tsx` -- category name
- `src/lib/searchData.ts` -- category label
- `src/lib/leadVerticalConfig.ts` -- nameEn/nameRu, CTA text

**Step 4: Update Admin and Vendor Labels**

- `src/components/admin/dashboard/AdminVerticalsBlock.tsx`
- `src/components/admin/dashboard/AdminAllVerticalsGrid.tsx`
- `src/components/admin/ContentCreatorMenu.tsx`
- `src/components/admin/data-import/BusinessCardScanner.tsx`

**Step 5: Update Info/Legal Pages**

- `src/pages/info/TermsPage.tsx`
- `src/pages/info/RefundPolicyPage.tsx`
- `src/pages/info/DisputeResolutionPage.tsx`
- `src/pages/VipConcierge.tsx`

**Step 6: Update Database**

- SQL migration to update `categories` table: `name_en = 'Boat Charters'`, `name_ru = 'Аренда яхт и катеров'` where `slug = 'yachts'`

**Step 7: Update Edge Functions**

- `supabase/functions/scan-business-card/index.ts` -- category label
- `supabase/functions/ai-smart-search/index.ts` -- category description

### Technical Notes

- URL routes (`/yachts`, `/yachts/:id`) remain unchanged -- they are slugs, not labels
- Database table name `yachts` remains unchanged -- it is an internal identifier
- Internal keys (`yacht`, `yachts`, `yacht_type`) remain unchanged -- they are system identifiers
- Only user-facing labels and display text change
- Total files affected: ~20 source files + 1 DB migration + 2 edge functions

