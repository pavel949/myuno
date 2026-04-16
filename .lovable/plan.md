

# CRM ↔ Properties Hub Integration

## Current Gap Analysis

**Critical finding:** `property_id` in `agent_deals` is **always set to null** (hardcoded on line 175 of CreateDealSheet). The deal form has a project selector but NO property selector. There is no way to link a deal to a specific property.

**Existing assets we leverage (no new tables needed):**
- `properties` table (100+ cols) — the SSOT for all real estate
- `property_projects` table — serves as "developments" 
- `agent_deals.property_id` + `agent_deals.property_project_id` — columns exist in DB, just unused in UI
- `deal_viewings` table — already created (property_id, contact_id, feedback, rating)

**What's missing from the spec vs reality:**
| Spec Table | Reality | Action |
|---|---|---|
| `property_owners` | `properties.owner_id` (single owner) | Create table for multi-owner tracking |
| `developments` | `property_projects` already covers this | No new table, reuse existing |
| `inventory_listings` | `properties.listing_type` + `listing_modes` | Create table for multi-listing per property |

## Implementation Plan

### Phase 1 — Property Picker Component + Deal Linking

**New: `PropertySearchInput.tsx`** (mirrors existing `ContactSearchInput`)
- Combobox searching `properties` by title_en/title_ru/address/district
- Shows: cover thumbnail, title, type badge, district, bedrooms, price
- Scoped to company via `management_company_id` or `owner_id` in team

**Update: `CreateDealSheet.tsx`**
- Add PropertySearchInput field below contact selector
- When property selected: auto-fill `preferred_districts`, `preferred_types`, `budget_min`/`budget_max` from property data
- Pass selected `property_id` to `createDeal` (replace hardcoded `null`)
- Show property card preview when linked

**Update: Deal detail view** (wherever deal is displayed)
- Show linked property card with photo, title, price — clickable to property detail

### Phase 2 — Database: `property_owners` + `inventory_listings`

**Migration 1: `property_owners` table**
```sql
CREATE TABLE public.property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','co_owner','beneficial_owner','nominee','tenant','investor')),
  ownership_pct NUMERIC CHECK (ownership_pct > 0 AND ownership_pct <= 100),
  since DATE,
  until DATE,
  notes TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
RLS: company team members can CRUD.

**Migration 2: `inventory_listings` table**
```sql
CREATE TABLE public.inventory_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale','rent_ltr','rent_str','club_deal','wholesale')),
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available','reserved','sold','rented','withdrawn')),
  exclusive BOOLEAN DEFAULT false,
  commission_structure JSONB DEFAULT '{}',
  published_on_channels TEXT[] DEFAULT '{}',
  viewing_count INT DEFAULT 0,
  inquiry_count INT DEFAULT 0,
  company_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 3 — Property Dossier Tabs (Owners, Listings, Deals)

**Property detail page** — add 3 new tabs:

1. **Owners tab**: List from `property_owners` joined with `crm_contacts`. Add/remove owners with role + ownership percentage. Clickable to contact detail.

2. **Listings tab**: CRUD for `inventory_listings`. Quick "Add Listing" button (sale/rent_ltr/rent_str/club_deal). Shows status badges, price, channel distribution, viewing/inquiry counts.

3. **Deals tab**: Query `agent_deals WHERE property_id = X`. Show linked deals with stage badges, client name, deal value. Quick-create deal from property context (pre-fills property_id + property data into the deal form).

### Phase 4 — Contact Detail: Properties Connection

**ContactDetail.tsx — Properties tab enhancement:**
- Query `property_owners WHERE contact_id = X` to show owned properties
- Query `agent_deals WHERE contact_id = X` to show property preferences across deals
- Show "Property Interest Map": aggregate preferred_districts + preferred_types from all deals into a visual summary

### Phase 5 — Deal Viewings Integration

**Use existing `deal_viewings` table** to track property showings:
- On deal detail: "Log Viewing" action → select property from company inventory → add feedback/rating
- On property detail → Viewings sub-tab: all viewings for this property across all deals
- On contact detail → Timeline: viewings appear as activity items

## Files to Create/Edit

**New files:**
- `src/components/owner/sales/PropertySearchInput.tsx` — reusable property combobox
- `src/hooks/usePropertyOwners.ts` — CRUD for property_owners table
- `src/hooks/useInventoryListings.ts` — CRUD for inventory_listings table
- `src/components/owner/property/PropertyOwnersTab.tsx`
- `src/components/owner/property/PropertyListingsTab.tsx`
- `src/components/owner/property/PropertyDealsTab.tsx`

**Edit files:**
- `src/components/owner/sales/CreateDealSheet.tsx` — add PropertySearchInput, pass property_id
- Property detail page — add Owners/Listings/Deals tabs
- `src/pages/owner/ContactDetail.tsx` — enhance Properties tab with ownership data

**Migrations:** 2 SQL (property_owners + inventory_listings with RLS)

