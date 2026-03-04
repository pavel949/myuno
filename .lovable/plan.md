

# Plan: Normalize Admin Dashboard UX + Improve Catalog Table

## Problems Identified

1. **Inconsistent page wrappers**: Some admin pages use `<PageContainer>` (with proper padding, max-width), others use raw `<div className="p-4 md:p-6">` (AdminDashboard, AdminUnifiedCatalog, AdminContracts, AdminVendorProspects). This creates different padding, spacing, and max-width behavior across sections.

2. **Inconsistent headers**: Some pages use `<PageHeader>` (gradient banner), others use `<SectionHeader>` from DS components, others use raw `<h1>` tags with different font sizes/weights. The catalog page uses a plain `<h1 className="text-xl font-bold">` while providers uses `<PageHeader>`.

3. **Catalog table is uninformative**: The `UnifiedCatalogTable` shows Name, Type, Price, Status — but missing: Provider/Owner, Category, Created date. No way to see who owns what.

4. **Font/theme readability**: `PageHeader` uses hardcoded `text-white` which may not work in all theme contexts. The muted-foreground colors need verification across light/dark.

## Solution

### 1. Normalize all admin pages to use `PageContainer` + `SectionHeader`

Replace inconsistent wrappers across all admin pages that currently use raw `<div className="p-4 ...">`:
- `AdminDashboard.tsx` — already uses raw div, switch to `PageContainer`
- `AdminUnifiedCatalog.tsx` — raw div, switch to `PageContainer` + `SectionHeader`
- `AdminContracts.tsx` — raw div, switch to `PageContainer`
- `AdminVendorProspects.tsx` — raw div, switch to `PageContainer`

Use `SectionHeader` (from DS2.0) consistently instead of mixing `PageHeader` gradient banners and raw `<h1>` in admin context. The gradient `PageHeader` is designed for guest-facing pages, not admin dashboards.

### 2. Enrich Catalog Table columns

Add to `UnifiedCatalogTable`:
- **Provider/Owner** column — show `provider_name` with a small avatar/icon, linked to provider detail
- **Category** column — show the category badge
- **Created** column — show relative date (e.g. "3 days ago")
- Fix column widths for better readability: Name gets `min-w-[200px]`, Provider `w-[180px]`, others stay compact
- On mobile: hide Provider and Created columns (responsive `hidden md:table-cell`)

Update `useUnifiedCatalog` hook to also fetch `category` field for services and `owner_id`/profile info for properties.

### 3. Typography normalization

- Create a shared admin page header pattern using `SectionHeader` with consistent `heading-lg` scale from DS2.0
- Ensure all admin text uses `text-foreground` (not hardcoded colors) for dark mode compatibility
- Verify `text-muted-foreground` contrast meets DS2.0 standard (42% lightness min)

### Files to Edit
- `src/pages/admin/AdminDashboard.tsx` — wrap in PageContainer, keep SectionHeader
- `src/pages/admin/AdminUnifiedCatalog.tsx` — wrap in PageContainer, replace raw h1 with SectionHeader
- `src/pages/admin/AdminContracts.tsx` — wrap in PageContainer
- `src/pages/admin/AdminVendorProspects.tsx` — wrap in PageContainer
- `src/components/admin/catalog/UnifiedCatalogTable.tsx` — add Provider, Category, Created columns
- `src/hooks/useUnifiedCatalog.ts` — include category data in queries

