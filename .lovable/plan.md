

# Next Steps Implementation Plan — Bible v2.0 Gap Closure

## Scope

This plan covers the **P0–P2 priorities** from the approved gap closure plan, focusing on what's immediately actionable without external API keys (WhatsApp Cloud API requires secrets — will be set up but not blocked on).

---

## Current State Assessment

**Already working:**
- Transfer booking: full flow with order creation → Stripe checkout → `notify-transfer-booking` (UltraMSG) ✅
- Flowers: cart → `create-flowers-checkout` → Stripe → success page ✅  
- Yachts: booking → `create-event-checkout` → Stripe → `notify-vendor-order` ✅
- ClusterHub on landing page ✅
- SIMstart (`/sim`) and ExchangeBot (`/exchange`) pages ✅
- MC workspace: 50+ pages, fully operational ✅

**Identified gaps for this iteration:**
1. **LEGAL cluster is empty** — VisaTrack, TaxNav, ContractAI have no frontend
2. **Hub landing page** needs polish — ClusterHub cards link to generic pages, not cluster-specific landing pages
3. **SEO missing** — no per-vertical JSON-LD or canonical tags
4. **No dedicated cluster landing pages** — ARRIVE, LIVE, LEGAL each need an index page showing their micro-apps
5. **Property management duplication risk** — Owner routes redirect to MC, but some pages (owner/) still exist in codebase

---

## Implementation Steps

### Step 1: Cluster Landing Pages (3 new pages)

Create three cluster index pages that act as hubs for their micro-apps. Each shows a grid of available apps within the cluster.

**`src/pages/arrive/ArriveClusterPage.tsx`** — routes: `/arrive`
- Grid of ARRIVE apps: Transfers, SIM Cards, Exchange, Car Rental, Banking
- Each card links to existing page (`/transport/airport-transfer`, `/sim`, `/exchange`, `/banking`, `/transport`)
- Hero with cluster accent color (teal)

**`src/pages/legal/LegalClusterPage.tsx`** — routes: `/stay-legal`  
- Grid: VisaTrack (`/visa`), Insurance (`/insurance`), Legal Services (`/legal`), ContractAI (coming soon), TaxNav (coming soon)
- Hero with cluster accent color (sky)

**`src/pages/invest/InvestClusterPage.tsx`** — routes: `/invest-hub`
- Grid: Property Search, Off-Plan, ROI Calculator, Developers
- Links to existing `/property/*` routes
- Hero with cluster accent color (blue)

Update ClusterHub.tsx paths to point to these new cluster pages instead of generic routes.

### Step 2: VisaTrack MVP (`/visa` enhancement)

Enhance existing `VisaImmigrationPage.tsx` (currently 817 lines of static visa info) with an interactive tracker:

**Database migration:**
```sql
CREATE TABLE public.visa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visa_type text NOT NULL,
  entry_date date,
  expiry_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','expired','renewal_pending')),
  document_url text,
  notes text,
  reminder_sent_30d boolean DEFAULT false,
  reminder_sent_14d boolean DEFAULT false,
  reminder_sent_7d boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.visa_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own visa records" ON public.visa_records
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**New component: `src/components/legal/VisaTracker.tsx`**
- Add/edit visa records form (visa type, entry date, expiry date, document upload)
- Dashboard showing days remaining with color-coded urgency (green >30d, amber 14-30d, red <14d)
- Document upload to Supabase Storage bucket `visa-documents`
- Integrated as a new tab in the existing VisaImmigrationPage

**Edge function: `visa-expiry-reminders`**
- Daily cron: check visa_records where expiry_date is 30/14/7 days away
- Send email notification via `send-email` function
- Update reminder_sent flags to avoid duplicates

### Step 3: ContractAI Frontend (`/legal/contract-analysis`)

**New page: `src/pages/legal/ContractAnalysisPage.tsx`**
- File upload (PDF) → calls existing `ai-legal-assistant` edge function
- Display results: risk score, key terms, red flags, recommendations
- Language toggle RU/EN for analysis output
- Uses Lovable AI (Gemini 2.5 Pro) via existing edge function

### Step 4: TaxNav MVP (`/tax`)

**New page: `src/pages/legal/TaxNavPage.tsx`**
- Interactive questionnaire (5-7 steps):
  1. Tax residency status (resident/non-resident/undetermined)
  2. Income sources (employment, rental, investment, freelance)
  3. Duration of stay in Thailand
  4. Existing tax obligations
- AI-generated summary via new `ai-tax-advisor` edge function using Lovable AI
- Output: tax obligations, filing deadlines, recommended actions
- CTA: "Connect with tax advisor" → creates CRM lead

### Step 5: SEO Foundation

**Enhance `src/components/seo/SEOHead.tsx`:**
- Add canonical link tag support
- Add per-vertical JSON-LD schemas:
  - `LocalBusiness` for services (cleaning, medical, legal)
  - `Product` for marketplace items
  - `Event` for events
  - `RealEstateListing` for properties
  - `TouristAttraction` for experiences

**Add SEO meta to key landing pages:**
- `/transfer` — transfer landing with structured data
- `/yachts` — yacht charter structured data  
- `/flowers` — flower delivery structured data
- `/visa` — visa services structured data

### Step 6: Route & Navigation Cleanup

**Update `APP_ROUTES`:**
```typescript
// Add cluster routes
ARRIVE_CLUSTER: '/arrive',
LEGAL_CLUSTER: '/stay-legal', 
INVEST_CLUSTER: '/invest-hub',
TAX_NAV: '/tax',
CONTRACT_ANALYSIS: '/legal/contract-analysis',
```

**Update `ClusterHub.tsx`** paths:
- ARRIVE → `/arrive` (new cluster page)
- LEGAL → `/stay-legal` (new cluster page)
- INVEST → `/invest-hub` (new cluster page)
- LIVE → `/discover` (already works)
- MANAGE → `/mc` (already works)
- BUILD → `/property/offplan` (already works)

**Register routes in `AnimatedRoutes.tsx` and `pageRegistry.ts`.**

### Step 7: Dead Code & Duplication Audit

**Owner pages:** All `/owner/*` routes already redirect to `/mc/*`. Verify no orphaned imports or components remain that bypass MC data isolation.

**Property management:** Confirm that all property CRUD flows in the MC workspace use `activeCompanyId` filtering (already fixed in previous iteration). No additional pages should bypass this.

**Remove unused exports** from `src/components/account/index.ts` if any widgets are no longer rendered.

---

## Files to Create
- `src/pages/arrive/ArriveClusterPage.tsx`
- `src/pages/legal/LegalClusterPage.tsx`
- `src/pages/invest/InvestClusterPage.tsx`
- `src/components/legal/VisaTracker.tsx`
- `src/hooks/useVisaRecords.ts`
- `src/pages/legal/ContractAnalysisPage.tsx`
- `src/pages/legal/TaxNavPage.tsx`
- `supabase/functions/visa-expiry-reminders/index.ts`
- `supabase/functions/ai-tax-advisor/index.ts`

## Files to Modify
- `src/lib/config/routes.ts` — add new route constants
- `src/components/layout/pageRegistry.ts` — register new lazy imports
- `src/components/layout/AnimatedRoutes.tsx` — add new routes
- `src/components/home/ClusterHub.tsx` — update cluster paths
- `src/pages/legal/VisaImmigrationPage.tsx` — add VisaTracker tab
- `src/components/seo/SEOHead.tsx` — add canonical + enhanced JSON-LD

## Database Changes
- New table: `visa_records` with RLS
- New storage bucket: `visa-documents`

