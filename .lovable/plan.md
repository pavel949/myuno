

# Ignatev CRM — Contacts Module Enhancement

## Current State

**What exists and works well:**
- `crm_contacts` table with 60+ columns (name, phone, email, social, budget, preferences, tags, scoring, lifecycle, address, VIP, etc.)
- `crm_roles` and `key_dates` columns already added
- ContactsList page with grid/list view, filters (type, source, tag, lifecycle, VIP, lead temp, CRM role), search, pagination, export, import
- ContactDetail page with Odoo-style smart buttons, tabbed layout (Timeline, Deals, Properties, Tasks, Documents), AI assistant panel
- CSV/XLSX import with column mapping
- Duplicate detection via Edge Function
- Create/Edit contact sheets with tabbed forms

**What's missing (per spec):**
- DB: `contact_type` is text (buyer/seller/etc) but spec wants `type` = person|company|household (current `is_company` boolean is partial)
- DB: Missing columns: `passport_country`, `tax_residency`, `segment[]` (investor|buyer|seller|owner|tenant|guest|broker|developer|vendor), `hnw_tier`, `aml_kyc_status`, `aml_kyc_date`, `pep_flag`, `sanctions_flag`, `preferences` JSONB, `ai_summary`, `last_activity_at`, `owner_user_id`
- DB: `contact_relationships` table doesn't exist in DB (only in TypeScript)
- UI: No KYC tab in contact forms
- UI: No segment multi-select (current `contact_type` is single-select)
- UI: No HNW tier filter in list
- UI: No saved views
- UI: No "Communications" tab on ContactDetail
- Seed: No realistic Phuket market contacts

## Plan

### Phase 1 — Database Migration

Add missing columns to `crm_contacts`:
```sql
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS contact_category TEXT DEFAULT 'person' CHECK (contact_category IN ('person','company','household')),
  ADD COLUMN IF NOT EXISTS passport_country TEXT,
  ADD COLUMN IF NOT EXISTS tax_residency TEXT,
  ADD COLUMN IF NOT EXISTS segment TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hnw_tier TEXT CHECK (hnw_tier IN ('standard','hnw','uhnw')),
  ADD COLUMN IF NOT EXISTS aml_kyc_status TEXT DEFAULT 'not_started' CHECK (aml_kyc_status IN ('not_started','pending','approved','rejected','expired')),
  ADD COLUMN IF NOT EXISTS aml_kyc_date DATE,
  ADD COLUMN IF NOT EXISTS pep_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sanctions_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID;
```

Create `contact_relationships` table:
```sql
CREATE TABLE public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_a_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  contact_b_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  notes TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
With RLS: team members of the company can read/write.

### Phase 2 — TypeScript & Hook Updates

**`src/hooks/useCrmContacts.ts`:**
- Add new fields to `CrmContact` interface: `contact_category`, `passport_country`, `tax_residency`, `segment`, `hnw_tier`, `aml_kyc_status`, `aml_kyc_date`, `pep_flag`, `sanctions_flag`, `preferences`, `ai_summary`, `last_activity_at`, `owner_user_id`
- Add `hnwTier` and `segment` filter params to `useCrmContacts` query

**`src/hooks/useContactRelationships.ts`:**
- Update to use actual DB table (currently may reference non-existent table)

### Phase 3 — ContactsList Enhancements

**`src/pages/owner/ContactsList.tsx`:**
- Add HNW tier filter chips (Standard / HNW / UHNW)
- Add segment filter (multi-select dropdown)
- Add saved views system (save current filter state to localStorage, show as tabs)
- Show segment badges and HNW tier indicator on contact cards

### Phase 4 — Contact Forms (Create + Edit)

**`src/components/owner/contacts/CreateContactSheet.tsx` & `EditContactSheet.tsx`:**
- Add "KYC" tab with: AML/KYC status, date, PEP flag, sanctions flag, passport country, tax residency
- Add "Segments" section with multi-select chips for segment array
- Add HNW tier selector
- Add `contact_category` radio (Person / Company / Household) replacing `is_company` boolean
- Add preferences JSONB editor (budget range, location prefs, property type prefs — structured)

### Phase 5 — ContactDetail KYC & Communications Tabs

**`src/pages/owner/ContactDetail.tsx`:**
- Add "KYC" tab showing AML status badge, PEP/sanctions flags, passport country, tax residency, KYC date
- Add "Communications" tab aggregating activities filtered to comm types (call, email, whatsapp, telegram)
- Show HNW tier badge prominently in header
- Show segment badges below name
- Display `ai_summary` in overview if present

### Phase 6 — Seed Data

Insert 10 realistic Phuket-market contacts via migration:
- 4 RU HNW investors (UHNW club deal, HNW off-plan, standard buyer-mandate, cold lead)
- 2 Expat buyers (UK family, Australian retiree)
- 2 Local Thai owners (landlord villa, condo)
- 1 Broker/agent partner
- 1 Developer contact
- With varied segments, lifecycle stages, HNW tiers, budgets in THB

### Phase 7 — Import Dedup Enhancement

**`src/pages/owner/ContactImportPage.tsx`:**
- Add dedup check by email+phone before insert (query existing contacts, show matches, let user skip/merge)

## Files to Change

**Migrations:** 1 SQL migration (new columns + contact_relationships table + seed)
**Code:**
- `src/hooks/useCrmContacts.ts` — extend interface + filters
- `src/hooks/useContactRelationships.ts` — verify DB alignment
- `src/pages/owner/ContactsList.tsx` — HNW/segment filters, saved views
- `src/pages/owner/ContactDetail.tsx` — KYC tab, Communications tab, HNW/segment display
- `src/components/owner/contacts/CreateContactSheet.tsx` — KYC tab, segments, category
- `src/components/owner/contacts/EditContactSheet.tsx` — KYC tab, segments, category
- `src/pages/owner/ContactImportPage.tsx` — dedup enhancement
- `src/types/contact.ts` — segment/HNW type definitions

