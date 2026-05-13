# Service data entry — inventory (admin vs vendor)

Canonical fields for catalogue/SEO: bilingual name and description, category/cluster alignment, lifecycle tags (`docs/canonical/02-service-catalogue-v2.md`).

## Matrix

| Surface | Route / entry | Primary form | Pain |
|--------|-----------------|--------------|------|
| Vendor | `/vendor/services` (VendorServices) | Dialog + `VendorFormWizard` (basic → media → preview) | Long wizard; easy to skip EN/RU pair; draft UX only on create |
| Admin | `/admin/services` (AdminServices) | Dialog + single scroll + `AdminFormToolbar` (progress, auto-translate, duplicate) | Dense single page; same bilingual gap as vendor |
| Admin (on-behalf) | Admin + `OnBehalfBanner` | Same as AdminServices | Extra mental load: provider + category first |

## Quick UX wins shipped this iteration

1. **`ServiceBilingualHint`** (`src/components/services/ServiceBilingualHint.tsx`) — short RU/EN note at top of both **Vendor** and **Admin** service dialogs reminding that both languages matter for catalogue and landings.
2. **Admin** already exposes **Auto-translate** and **Duplicate** in `AdminFormToolbar`; vendor path keeps **draft restore** — no change required beyond the shared hint.

## Follow-ups (not in this pass)

- Optional shared `ServiceFormLayout` wrapper (toolbar + hint + scroll region) if more vertical-specific service forms appear.
- Align optional fields (tags, lifecycle) with a single checklist component driven from `contactsImportFields`-style metadata if product wants stricter data quality gates.
