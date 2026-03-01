

# Professional Financial Categories with Classification System

## Problem

Current financial categories are flat lists without any classification metadata. This prevents:
- Separating fixed vs variable expenses in P&L reports
- OPEX vs CAPEX distinction for asset-heavy property portfolios
- Grouping by business function (Operations, Administration, Marketing)
- Filtering reports by unit, complex, owner, or category group
- Matching real-world management agreements where expense responsibility varies per category

## Solution: Multi-Dimensional Category Taxonomy

Enhance `financial_categories` and `company_category_settings` with professional classification fields, then build a rich settings UI where MCs configure each category's behavior.

---

## Database Changes

### 1. Extend `financial_categories` table (custom categories)

Add columns for classification metadata:

```text
category_class   : 'fixed' | 'variable' | 'semi_variable' | 'one_time'
category_group   : 'operations' | 'administration' | 'marketing' | 'taxes_fees' | 'capex' | 'finance' | 'revenue' | 'other'
affects_net_profit: boolean (default true) -- included in owner P&L
is_tax_deductible : boolean (default false)
allocation_method : 'per_unit' | 'by_area' | 'equal_split' | 'direct' (for complex-level shared costs)
```

### 2. Extend `company_category_settings` table (standard category overrides)

Add the same classification columns so MCs can override defaults for standard categories:

```text
category_class    : text (nullable -- null means use default)
category_group    : text (nullable)
affects_net_profit: boolean (nullable)
is_tax_deductible : boolean (nullable)
allocation_method : text (nullable)
custom_name_en    : text (nullable) -- rename standard category
custom_name_ru    : text (nullable)
```

### 3. Seed defaults for standard categories

Insert default classifications via a migration data block:

| Category | Class | Group | Affects P&L | Tax Deductible |
|---|---|---|---|---|
| cleaning | variable | operations | yes | yes |
| electricity | variable | operations | yes | yes |
| water | variable | operations | yes | yes |
| internet | fixed | operations | yes | yes |
| insurance | fixed | administration | yes | yes |
| management_fee | variable | administration | yes | no |
| platform_fee | variable | marketing | yes | no |
| maintenance | variable | operations | yes | yes |
| repair | semi_variable | operations | yes | yes |
| furniture | one_time | capex | configurable | yes |
| depreciation | fixed | finance | yes | yes |
| loan_payment | fixed | finance | no (cash flow only) | no |
| taxes | fixed | taxes_fees | yes | no |
| advertising | variable | marketing | yes | yes |
| rent (income) | variable | revenue | yes | yes |

---

## Frontend Changes

### 1. Update `FinanceCategorySettings.tsx`

Transform from a simple toggle list into a professional settings panel:

- **Group-by selector**: Show categories organized by group (Operations, Administration, CAPEX, etc.)
- **Inline classification chips**: Each category row shows its class (Fixed/Variable) and group as small badges
- **Expandable row**: Click a category to reveal editable fields:
  - Class (Fixed / Variable / Semi-variable / One-time) -- dropdown
  - Group (Operations / Admin / Marketing / CAPEX / Taxes / Finance) -- dropdown
  - Affects Net Profit -- toggle
  - Tax Deductible -- toggle
  - Allocation Method (for shared costs) -- dropdown
  - Custom name override (EN/RU)
- **Bulk "Enable All in Group"** button per group header
- Counter shows: "18 of 22 active | 8 fixed, 10 variable"

### 2. Update `useFinancialCategories` hook

Return enriched category objects with classification metadata:

```typescript
interface FinancialCategory {
  code: string;
  name_en: string;
  name_ru: string;
  category_class: 'fixed' | 'variable' | 'semi_variable' | 'one_time';
  category_group: string;
  affects_net_profit: boolean;
  is_tax_deductible: boolean;
  allocation_method: string;
  isCustom?: boolean;
}
```

Merge logic: company_category_settings overrides > standard defaults > fallback.

### 3. New hook `useCategoryClassification`

Utility hook for reports to:
- Get categories filtered by class (all fixed expenses)
- Get categories filtered by group (all CAPEX)
- Calculate totals by classification dimension

### 4. Update `QuickCategoryGrid`

- Show category group as a subtle label under category name
- Color-code by class: fixed = blue badge, variable = green badge, one_time = orange badge

### 5. Create custom category dialog enhancement

When adding a custom category, the dialog now includes:
- Name EN/RU (existing)
- Class selector (new)
- Group selector (new)
- Affects Net Profit toggle (new, default: true)
- Tax Deductible toggle (new, default: false)

---

## Standard Defaults Map

Built as a TypeScript constant `CATEGORY_DEFAULTS` so the system works without any DB configuration (backward compatible):

```typescript
const CATEGORY_DEFAULTS: Record<string, CategoryMeta> = {
  cleaning:       { class: 'variable',      group: 'operations',     affectsProfit: true,  taxDeductible: true  },
  electricity:    { class: 'variable',      group: 'operations',     affectsProfit: true,  taxDeductible: true  },
  management_fee: { class: 'variable',      group: 'administration', affectsProfit: true,  taxDeductible: false },
  furniture:      { class: 'one_time',      group: 'capex',          affectsProfit: false, taxDeductible: true  },
  depreciation:   { class: 'fixed',         group: 'finance',        affectsProfit: true,  taxDeductible: true  },
  loan_payment:   { class: 'fixed',         group: 'finance',        affectsProfit: false, taxDeductible: false },
  // ... all 22 categories
};
```

---

## Files to Create/Edit

| File | Action |
|---|---|
| `supabase/migrations/...extend_category_taxonomy.sql` | Add columns to both tables + seed defaults |
| `src/lib/categoryDefaults.ts` | **New** -- Standard classification constants |
| `src/hooks/useFinancialCategories.ts` | Return enriched objects with classification |
| `src/hooks/useCompanyCategorySettings.ts` | Handle new columns in toggle/upsert |
| `src/hooks/useCategoryClassification.ts` | **New** -- Utility for report filtering |
| `src/components/mc/settings/FinanceCategorySettings.tsx` | Full redesign with groups + expandable rows |
| `src/components/owner/QuickCategoryGrid.tsx` | Show class badges |

## Implementation Order

1. Create `categoryDefaults.ts` with all standard metadata
2. DB migration: extend both tables
3. Update hooks to merge classification data
4. Redesign FinanceCategorySettings UI with grouping and inline editing
5. Update QuickCategoryGrid with subtle classification indicators
6. Create `useCategoryClassification` for downstream report usage

