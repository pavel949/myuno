# Canonical Layout Audit — 2026-04-26

## Canonical hierarchy (per CLAUDE.md §1.5 + ARCHITECTURE_V2 §13)

```
AppLayout (consumer | workspace)         ← outer chrome: header, bottom-nav, banners
  └─ FeatureLayout (mode="miniapp" | "landing")  ← catalog/landing shell
       exported as MiniAppLayout / LandingLayout
       └─ ECOSYSTEM_PAGE_CONTAINER + ECOSYSTEM_MAIN_SPACING  ← horizontal bounds
```

**Adoption today:**
- `AppLayout` — 131 pages
- `MiniAppLayout` / `FeatureLayout` — 40 pages
- `ECOSYSTEM_PAGE_CONTAINER` standalone — 10 pages

## Deviations

### A. Catalog Index pages bypassing MiniAppLayout (HIGH)
These render their own header (`CatalogHeader`) + `ECOSYSTEM_PAGE_CONTAINER` instead of using `MiniAppLayout`. Result: drift in sticky behavior, hero, search, persona-filter ribbon.

| File | Current | Should be |
|---|---|---|
| `src/pages/services/ServicesIndex.tsx` | AppLayout + CatalogHeader + ECOSYSTEM_* | MiniAppLayout |
| `src/pages/legal/LegalServicesIndex.tsx` | AppLayout + CatalogHeader + ECOSYSTEM_* | MiniAppLayout |
| `src/pages/transport/TransportIndex.tsx` | AppLayout + CatalogHeader + ECOSYSTEM_* | MiniAppLayout |
| `src/pages/babysitter/BabysitterIndex.tsx` | AppLayout + ECOSYSTEM_* (manual) | MiniAppLayout |

### B. Detail pages without ANY shell (CRITICAL)
No AppLayout → no bottom-nav, no PWA banners, no email-verification banner, no install CTA. Users on these pages are stranded without nav.

23 pages affected, including:
- `property/PropertyDetail.tsx`, `OffplanDetail.tsx`, `ResaleDetail.tsx`, `LandDetail.tsx`, `CommercialDetail.tsx`, `DeveloperDetail.tsx`
- `events/EventDetail.tsx`, `fitness/GymDetail.tsx`, `medical/ClinicDetail.tsx`, `beauty/SalonDetail.tsx`
- `education/CourseDetail.tsx`, `TutorDetail.tsx`
- `invest/InvestmentDetail.tsx`, `InvestmentDealPublicDetail.tsx`
- `capital/CapitalContactDetail.tsx`, `CapitalInvestmentDealDetail.tsx`
- `owner/ContactDetail.tsx`, `OwnerPropertyDetail.tsx`, `SalesDealDetail.tsx`
- `admin/AdminProviderDetail.tsx`, `AdminTicketDetail.tsx`
- `developer-portal/DeveloperLeadDetail.tsx`
- `newbuilds/NewbuildsAreaDetail.tsx`

These all start with `<div className="flex flex-col min-h-screen bg-background">` → manual full-screen wrapper bypassing AppLayout.

### C. Property hub sub-tabs (LOW)
`property/PropertyIndex.tsx` is a tabbed hub. Its sub-views (`HotelsIndex`, `OffplanIndex`, `ResaleIndex`, `LandIndex`, `CommercialIndex`, `DevelopersIndex`) render inside the hub shell — acceptable, as long as the hub itself wraps in AppLayout. Verified — PropertyIndex does use AppLayout.

### D. Workspace pages (acceptable)
`owner/PipelinesIndex.tsx` and similar use `AppLayout variant="workspace"` directly (no MiniAppLayout) — this is canonical for dashboards (per AppLayout §variant doc).

## Recommendations

**P0 — Detail pages**: Wrap all 23 detail pages with `<AppLayout showBottomNav>` (consumer pages) or workspace variant (owner/admin pages). Risk: low — purely additive.

**P1 — Catalog migration**: Migrate `services`, `legal`, `transport`, `babysitter` Index pages to `MiniAppLayout`. Estimate: ~30 min each. Benefit: persona-filter ribbon, unified search header, sticky behavior, hero support.

**P2 — Deprecate manual `CatalogHeader` usage** outside of MiniAppLayout. Move shared logic into FeatureLayout if anything is missing.

## Out of scope of this audit
- Visual polish (DS2.0 token compliance) — separate audit
- Internal `<main>` content composition
