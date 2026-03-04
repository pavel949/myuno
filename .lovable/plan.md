

# Plan: Canonicalize the Provider Form

## Problem
The provider create/edit form in `AdminProviders.tsx` (lines 454–677) is a raw `Dialog` with flat `useState` fields and manual `<Label>` + `<Input>` pairs. This violates the platform's canonical form standard:

- No `VendorFormSection` grouping (all fields are flat)
- No `VendorFormWizard` step structure
- No `TranslatableInput` for bilingual descriptions (uses two separate Textareas)
- No `CompactField` / `FormFieldWithHelp` components
- No visual grouping or collapsible sections
- Form is a single scrollable blob — poor UX for 15+ fields

## Solution

Replace the inline form Dialog with a **structured wizard-style Sheet** using existing canonical components:

### Step 1 — Extract form into `ProviderFormSheet.tsx`
New file: `src/components/admin/ProviderFormSheet.tsx`

Uses a `Sheet` (side panel) instead of Dialog for more space, with `VendorFormWizard` providing step navigation:

**Step 1 — Identity**: Name, Category (CategorySelector), Provider Type toggle, Logo upload  
**Step 2 — Details**: TranslatableInput for descriptions (EN/RU), Service Domains, Languages  
**Step 3 — Contact & Status**: Phone, Email, Website, Address (grid layout), Response Time, Switches (Active, Verified, Insurance, Guarantee)

Each step wrapped in `VendorFormSection` with icons, badges ("Required"/"Optional"), and `helpText` tooltips.

### Step 2 — Update `AdminProviders.tsx`
- Remove the inline 200-line Dialog form (lines 454–677)
- Import and use `<ProviderFormSheet>` instead
- Pass `editingProvider`, `onSubmit`, `open/onOpenChange` props
- Keep BusinessCardScanButton integration (pass scanned data as `initialData`)

### Step 3 — Use canonical field components
- `TranslatableInput` for description_en / description_ru (single component, tabbed)
- `CompactField` for phone, email, website, address (reduces vertical space)
- `VendorFormSection` with `collapsible={true}` for "Certifications & Badges" section

### Files to Create/Edit
- **Create**: `src/components/admin/ProviderFormSheet.tsx` — new canonical form component
- **Edit**: `src/pages/admin/AdminProviders.tsx` — replace inline Dialog with ProviderFormSheet

