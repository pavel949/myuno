# CURSOR EXECUTION PLAN — myUNO Platform Build

> **How to use this file:**
> 1. Place this file in the project root as `EXECUTION_PLAN.md`
> 2. Make sure `CLAUDE.md` is also in the project root
> 3. Open Cursor → Ctrl+L (AI Chat)
> 4. Type: `Read EXECUTION_PLAN.md and CLAUDE.md. Start with STAGE 1, STEP 1. Execute each step sequentially. After completing each step, report what was done and ask me to confirm before moving to the next step.`
> 5. Cursor will execute step by step, asking for confirmation and credentials when needed

---

## MASTER SEQUENCE

```
STAGE 1: Foundation (Day 1-2)
  └── Infrastructure, schema, monorepo scaffold, design system

STAGE 2: StaySync — First App (Day 3-7)
  └── Property catalog, search, booking, Stripe, WhatsApp

STAGE 3: PropertySearch (Day 8-10)
  └── New development catalog, filters, lead generation, CRM

STAGE 4: Concierge Apps (Day 11-14)
  └── TransferRu, YachtCharter, BloomPhuket

STAGE 5: Admin Dashboard (Day 15-19)
  └── Back-office: listings management, bookings, CRM, payments

STAGE 6: Hub + Launch (Day 20-22)
  └── myuno.app landing, cross-links, SEO, analytics

STAGE 7: Owner Dashboard (Day 23-25)
  └── Owner portal: revenue, occupancy, reports

STAGE 8: Polish + Deploy (Day 26-28)
  └── Testing, mobile optimization, error handling, go-live
```

---

# ═══════════════════════════════════════════
# STAGE 1: FOUNDATION
# ═══════════════════════════════════════════

## STEP 1.1 — Verify Existing Infrastructure

```
CURSOR INSTRUCTION:

1. Check if .env or .env.local exists in the project root
2. Read it and identify:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY  
   - Any Stripe keys (VITE_STRIPE_*)
   - Any Google Maps keys
   - Any WhatsApp/Telegram keys
3. Report what credentials exist and what is missing
4. Check if the Supabase project is accessible by attempting a simple query

If .env does not exist, ASK ME for:
- Supabase Project URL
- Supabase Anon Key
- Supabase Service Role Key (for Edge Functions only)

DO NOT proceed until credentials are confirmed.
```

## STEP 1.2 — Create v2 Schema

```
CURSOR INSTRUCTION:

Connect to Supabase and execute the following SQL.
Use the Supabase Management API or generate a migration file at:
supabase/migrations/001_v2_schema.sql

SQL TO EXECUTE:

-- Create v2 schema (parallel to existing public schema)
CREATE SCHEMA IF NOT EXISTS v2;

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ═══ ENUMS ═══
DO $$ BEGIN
  CREATE TYPE v2.user_role AS ENUM ('guest','resident','owner','agent','developer','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.listing_type AS ENUM ('property','vehicle','yacht','service','sim_plan','product','event','venue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.booking_type AS ENUM ('transfer','charter','rental','service','appointment','event','delivery','reservation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.document_type AS ENUM ('contract','visa','permit','invoice','eia','title_deed','lease','tax_filing','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.payment_method AS ENUM ('stripe','bank_transfer','cash','crypto');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.payment_type AS ENUM ('booking_payment','deposit','commission','subscription','installment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.task_type AS ENUM ('cleaning','maintenance','inspection','construction','snagging','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.org_type AS ENUM ('developer','agency','pm_company','contractor','other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.channel_type AS ENUM ('whatsapp','telegram','in_app','email','line','sms');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE v2.lead_status AS ENUM ('new','contacted','qualified','proposal','closed_won','closed_lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═══ TABLE 1: PROFILES ═══
CREATE TABLE IF NOT EXISTS v2.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  display_name text,
  avatar_url text,
  locale text DEFAULT 'en' CHECK (locale IN ('ru','en','th','zh')),
  role v2.user_role DEFAULT 'guest',
  nationality text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═══ TABLE 2: ORGANIZATIONS ═══
CREATE TABLE IF NOT EXISTS v2.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type v2.org_type NOT NULL,
  tax_id text,
  contact_email text,
  phone text,
  logo_url text,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ═══ TABLE 3: ORG_MEMBERS ═══
CREATE TABLE IF NOT EXISTS v2.org_members (
  profile_id uuid REFERENCES v2.profiles(id) ON DELETE CASCADE,
  org_id uuid REFERENCES v2.organizations(id) ON DELETE CASCADE,
  role text DEFAULT 'staff' CHECK (role IN ('owner','manager','agent','staff')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, org_id)
);

-- ═══ TABLE 4: LISTINGS ═══
CREATE TABLE IF NOT EXISTS v2.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type v2.listing_type NOT NULL,
  subtype text,
  owner_id uuid REFERENCES v2.profiles(id),
  org_id uuid REFERENCES v2.organizations(id),
  title text NOT NULL,
  title_ru text,
  description text,
  description_ru text,
  location geography(Point, 4326),
  zone text,
  address text,
  price numeric,
  price_unit text DEFAULT 'thb' CHECK (price_unit IN ('thb','usd','per_night','per_day','per_hour','per_trip','fixed')),
  currency text DEFAULT 'THB',
  status text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','sold','archived')),
  media jsonb DEFAULT '[]',
  attributes jsonb DEFAULT '{}',
  availability jsonb,
  rating numeric DEFAULT 0,
  review_count int DEFAULT 0,
  featured boolean DEFAULT false,
  management_model text DEFAULT 'marketplace' CHECK (management_model IN ('full_pm','partner','marketplace')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_listings_type ON v2.listings(type);
CREATE INDEX IF NOT EXISTS idx_v2_listings_subtype ON v2.listings(subtype);
CREATE INDEX IF NOT EXISTS idx_v2_listings_zone ON v2.listings(zone);
CREATE INDEX IF NOT EXISTS idx_v2_listings_status ON v2.listings(status);
CREATE INDEX IF NOT EXISTS idx_v2_listings_owner ON v2.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_v2_listings_price ON v2.listings(price);
CREATE INDEX IF NOT EXISTS idx_v2_listings_featured ON v2.listings(featured) WHERE featured = true;

-- ═══ TABLE 5: LISTING_PRICES ═══
CREATE TABLE IF NOT EXISTS v2.listing_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES v2.listings(id) ON DELETE CASCADE,
  label text NOT NULL,
  price numeric NOT NULL,
  valid_from date,
  valid_to date,
  conditions jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_v2_listing_prices_listing ON v2.listing_prices(listing_id);

-- ═══ TABLE 6: BOOKINGS ═══
CREATE TABLE IF NOT EXISTS v2.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type v2.booking_type NOT NULL,
  listing_id uuid REFERENCES v2.listings(id),
  customer_id uuid REFERENCES v2.profiles(id),
  provider_id uuid REFERENCES v2.profiles(id),
  org_id uuid REFERENCES v2.organizations(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','refunded','no_show')),
  starts_at timestamptz,
  ends_at timestamptz,
  pax int DEFAULT 1,
  total_amount numeric,
  currency text DEFAULT 'THB',
  details jsonb DEFAULT '{}',
  notes text,
  source text DEFAULT 'platform',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_bookings_type ON v2.bookings(type);
CREATE INDEX IF NOT EXISTS idx_v2_bookings_customer ON v2.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_v2_bookings_listing ON v2.bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_v2_bookings_status ON v2.bookings(status);
CREATE INDEX IF NOT EXISTS idx_v2_bookings_starts ON v2.bookings(starts_at);

-- ═══ TABLE 7: PAYMENTS ═══
CREATE TABLE IF NOT EXISTS v2.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES v2.bookings(id),
  document_id uuid,
  payer_id uuid REFERENCES v2.profiles(id),
  payee_id uuid REFERENCES v2.profiles(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'THB',
  method v2.payment_method DEFAULT 'stripe',
  stripe_payment_id text,
  stripe_checkout_session_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed','refunded','cancelled')),
  type v2.payment_type,
  meta jsonb DEFAULT '{}',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_payments_booking ON v2.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_v2_payments_payer ON v2.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_v2_payments_status ON v2.payments(status);

-- ═══ TABLE 8: DOCUMENTS ═══
CREATE TABLE IF NOT EXISTS v2.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type v2.document_type NOT NULL,
  owner_id uuid REFERENCES v2.profiles(id),
  org_id uuid REFERENCES v2.organizations(id),
  listing_id uuid REFERENCES v2.listings(id),
  booking_id uuid REFERENCES v2.bookings(id),
  title text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','pending','active','expired','flagged','archived','signed','rejected')),
  file_url text,
  expires_at date,
  ai_analysis jsonb,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_documents_type ON v2.documents(type);
CREATE INDEX IF NOT EXISTS idx_v2_documents_owner ON v2.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_v2_documents_expires ON v2.documents(expires_at);

-- ═══ TABLE 9: DOCUMENT_EVENTS ═══
CREATE TABLE IF NOT EXISTS v2.document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES v2.documents(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created','signed','rejected','expired','renewed','ai_scan','flagged','commented')),
  actor_id uuid REFERENCES v2.profiles(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ═══ TABLE 10: CONVERSATIONS ═══
CREATE TABLE IF NOT EXISTS v2.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel v2.channel_type NOT NULL,
  booking_id uuid REFERENCES v2.bookings(id),
  listing_id uuid REFERENCES v2.listings(id),
  participants uuid[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active','resolved','archived')),
  subject text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ═══ TABLE 11: MESSAGES ═══
CREATE TABLE IF NOT EXISTS v2.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES v2.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES v2.profiles(id),
  content text,
  media_url text,
  parsed_data jsonb,
  is_ai boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_messages_conversation ON v2.messages(conversation_id);

-- ═══ TABLE 12: NOTIFICATIONS ═══
CREATE TABLE IF NOT EXISTS v2.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES v2.profiles(id),
  channel v2.channel_type,
  type text NOT NULL,
  title text,
  body text,
  ref_type text,
  ref_id uuid,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_notifications_recipient ON v2.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_v2_notifications_read ON v2.notifications(is_read) WHERE is_read = false;

-- ═══ TABLE 13: REVIEWS ═══
CREATE TABLE IF NOT EXISTS v2.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES v2.listings(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES v2.profiles(id),
  booking_id uuid REFERENCES v2.bookings(id),
  rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  response text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_reviews_listing ON v2.reviews(listing_id);

-- ═══ TABLE 14: LEADS ═══
CREATE TABLE IF NOT EXISTS v2.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES v2.profiles(id),
  source_app text NOT NULL,
  type text DEFAULT 'purchase' CHECK (type IN ('investment','rental','purchase','advisory')),
  status v2.lead_status DEFAULT 'new',
  assigned_to uuid REFERENCES v2.profiles(id),
  budget_min numeric,
  budget_max numeric,
  preferences jsonb DEFAULT '{}',
  score int DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes text,
  next_follow_up timestamptz,
  closed_at timestamptz,
  closed_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_leads_status ON v2.leads(status);
CREATE INDEX IF NOT EXISTS idx_v2_leads_score ON v2.leads(score);
CREATE INDEX IF NOT EXISTS idx_v2_leads_source ON v2.leads(source_app);
CREATE INDEX IF NOT EXISTS idx_v2_leads_assigned ON v2.leads(assigned_to);

-- ═══ TABLE 15: MARKET_DATA ═══
CREATE TABLE IF NOT EXISTS v2.market_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('price_index','occupancy','exchange_rate','absorption','adr','supply')),
  zone text,
  property_type text,
  value numeric,
  currency text,
  period date,
  source text DEFAULT 'manual',
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_market_data_type ON v2.market_data(type);
CREATE INDEX IF NOT EXISTS idx_v2_market_data_zone ON v2.market_data(zone);

-- ═══ TABLE 16: TASKS ═══
CREATE TABLE IF NOT EXISTS v2.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type v2.task_type NOT NULL,
  listing_id uuid REFERENCES v2.listings(id),
  booking_id uuid REFERENCES v2.bookings(id),
  assigned_to uuid REFERENCES v2.profiles(id),
  org_id uuid REFERENCES v2.organizations(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','done','verified','cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  media jsonb DEFAULT '[]',
  cost numeric,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_tasks_listing ON v2.tasks(listing_id);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_assigned ON v2.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_status ON v2.tasks(status);
CREATE INDEX IF NOT EXISTS idx_v2_tasks_due ON v2.tasks(due_at);

-- ═══ RLS POLICIES ═══

ALTER TABLE v2.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON v2.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON v2.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON v2.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public listings visible" ON v2.listings FOR SELECT USING (status = 'active');
CREATE POLICY "Owners manage own listings" ON v2.listings FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Admins manage all listings" ON v2.listings FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers see own bookings" ON v2.bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Providers see assigned bookings" ON v2.bookings FOR SELECT USING (provider_id = auth.uid());
CREATE POLICY "Admins see all bookings" ON v2.bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payers see own payments" ON v2.payments FOR SELECT USING (payer_id = auth.uid());
CREATE POLICY "Admins see all payments" ON v2.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON v2.leads FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assigned users see tasks" ON v2.tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Admins manage tasks" ON v2.tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews visible" ON v2.reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers manage own" ON v2.reviews FOR ALL USING (reviewer_id = auth.uid());

ALTER TABLE v2.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners see own documents" ON v2.documents FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Admins manage documents" ON v2.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients see own" ON v2.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Recipients update own" ON v2.notifications FOR UPDATE USING (recipient_id = auth.uid());

ALTER TABLE v2.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see conversations" ON v2.conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Admins see all conversations" ON v2.conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants see messages" ON v2.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM v2.conversations WHERE id = conversation_id AND auth.uid() = ANY(participants))
);

ALTER TABLE v2.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public orgs visible" ON v2.organizations FOR SELECT USING (true);
CREATE POLICY "Admins manage orgs" ON v2.organizations FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own memberships" ON v2.org_members FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admins manage memberships" ON v2.org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.listing_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public prices visible" ON v2.listing_prices FOR SELECT USING (true);

ALTER TABLE v2.market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public market data" ON v2.market_data FOR SELECT USING (true);
CREATE POLICY "Admins manage market data" ON v2.market_data FOR ALL USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE v2.document_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see events" ON v2.document_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM v2.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══ TRIGGER: auto-create profile on signup ═══
CREATE OR REPLACE FUNCTION v2.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO v2.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
CREATE TRIGGER on_auth_user_created_v2
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION v2.handle_new_user();

-- ═══ TRIGGER: update updated_at ═══
CREATE OR REPLACE FUNCTION v2.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON v2.profiles FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON v2.listings FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON v2.bookings FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON v2.documents FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON v2.leads FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON v2.tasks FOR EACH ROW EXECUTE FUNCTION v2.update_updated_at();

-- Done. 16 tables + indexes + RLS + triggers created in v2 schema.
```

After executing, VERIFY by running:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'v2' ORDER BY table_name;
```

Expected result: 16 tables. Report the count to me.

## STEP 1.3 — Initialize Monorepo

```
CURSOR INSTRUCTION:

Create a Turborepo monorepo structure. If the current project is a single Vite app,
restructure it into monorepo format. If starting fresh, create from scratch.

1. Initialize Turborepo:
   npx create-turbo@latest myuno-platform --example basic

2. Create this exact folder structure:

   apps/
     hub/          — myuno.app (React + Vite + Tailwind + shadcn/ui)
     stay/         — stay.myuno.app (StaySync)
     invest/       — invest.myuno.app (PropertySearch)
     transfer/     — transfer.myuno.app (TransferRu)
     yacht/        — yacht.myuno.app (YachtCharter)
     bloom/        — bloom.myuno.app (BloomPhuket)
     admin/        — admin.myuno.app (Admin Dashboard)
   packages/
     ui/           — shared components
     auth/         — shared auth hooks
     api/          — Supabase client + typed queries
     types/        — TypeScript types for v2 schema
     config/       — Tailwind config, constants

3. Each app in apps/ should be a Vite + React + TypeScript project with:
   - Tailwind CSS configured
   - shadcn/ui initialized
   - Shared packages imported from workspace

4. packages/api/ must contain:
   - supabase.ts — client initialization using env vars
   - A helper to query v2 schema:
     ```typescript
     import { createClient } from '@supabase/supabase-js';
     
     export const supabase = createClient(
       import.meta.env.VITE_SUPABASE_URL,
       import.meta.env.VITE_SUPABASE_ANON_KEY
     );
     
     // Helper for v2 schema queries
     export const v2 = supabase.schema('v2');
     ```

5. packages/types/ must contain TypeScript types matching EXACTLY
   the v2 database schema from STEP 1.2. Generate types for:
   - Profile, Organization, OrgMember
   - Listing, ListingPrice
   - Booking, Payment
   - Document, DocumentEvent
   - Conversation, Message, Notification
   - Review, Lead, MarketData, Task
   
   Include all enum types as TypeScript union types.

6. packages/auth/ must contain:
   - useAuth() hook — login, logout, signup, current user
   - useProfile() hook — get/update current user's v2.profiles record
   - AuthProvider context component
   - ProtectedRoute component (redirects to login if not authenticated)

7. packages/config/ must contain:
   - tailwind.config.ts with myUNO color palette:
     primary: '#0d6e4f', background: '#fafaf9', surface: '#ffffff',
     text-primary: '#1a1a19', text-secondary: '#57534e',
     border: '#e5e5e4', success: '#16a34a', error: '#dc2626'
   - routes.ts with all app routes as constants
   - constants.ts with zones, listing types, booking types

8. Create .env.example with all required variables:
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_STRIPE_PUBLISHABLE_KEY=
   VITE_GOOGLE_MAPS_API_KEY=

VERIFY: Run `npm run dev` from root — all apps should start without errors.
Report any issues.
```

## STEP 1.4 — Shared UI Components (packages/ui)

```
CURSOR INSTRUCTION:

Create the following shared components in packages/ui/ using shadcn/ui + Tailwind.
Follow the design system from CLAUDE.md section 9.

REQUIRED COMPONENTS:

1. AppShell — the layout wrapper for every micro-app:
   - Header: [← myUNO] [App Name] [RU|EN toggle] [Profile avatar/login]
   - Main content area (children)
   - Mobile: bottom nav bar (Home | Search | Bookings | Profile)
   - Language toggle stores preference in localStorage and v2.profiles.locale

2. ListingCard — universal card for any listing type:
   - Image carousel (swipeable on mobile)
   - Title (bilingual: title or title_ru based on locale)
   - Rating stars + review count
   - Price with unit (฿8,500/night)
   - Zone badge
   - Type-specific attributes (bedrooms for property, length for yacht, etc.)
   - Favorite button (heart)
   - CTA button (customizable: "Book" / "Request Viewing" / "Details")

3. SearchFilters — universal filter bar:
   - Adapts fields based on listing type
   - For properties: zone, price range, bedrooms, type (villa/condo)
   - For services: zone, category
   - For venues: cuisine, price range
   - Collapsible on mobile (bottom sheet)

4. BookingFlow — step-by-step booking component:
   - Step 1: Select dates/time + guests
   - Step 2: Review details + price breakdown
   - Step 3: Payment (Stripe Elements)
   - Step 4: Confirmation + WhatsApp notification option
   - Adapts steps based on booking type

5. LoginDialog — auth modal:
   - Email + password tab
   - Phone number tab (for WhatsApp users)
   - Google OAuth button
   - Bilingual labels

6. ProfileMenu — dropdown with user info:
   - Avatar + name
   - My Bookings link
   - My Favorites link
   - My Documents link (if any)
   - Settings
   - Logout

7. ReviewCard — single review display
8. PriceDisplay — formatted price with currency
9. ZoneBadge — colored badge for Phuket zones
10. StatusBadge — colored badge for booking/task status
11. EmptyState — "No results" placeholder with icon + message
12. LoadingSkeleton — skeleton loader matching card layout

Every component must:
- Support RU + EN via locale prop or context
- Work on mobile (375px width minimum)
- Use CSS variables from the design system
- Export from packages/ui/index.ts

VERIFY: Create a simple story/preview page showing all components.
```

---

# ═══════════════════════════════════════════
# STAGE 2: STAYSYNC (stay.myuno.app)
# ═══════════════════════════════════════════

## STEP 2.1 — StaySync: Property Catalog

```
CURSOR INSTRUCTION:

Build the guest-facing property catalog at apps/stay/.

PAGES TO CREATE:

1. HomePage (stay.myuno.app/)
   - Hero: "Аренда вилл и кондо на Пхукете" / "Villa & Condo Rentals in Phuket"
   - Search bar: dates, guests, zone dropdown
   - Featured properties grid (v2.listings WHERE featured = true AND type = 'property')
   - "View all" link to search page

2. SearchPage (stay.myuno.app/search)
   - Left sidebar (desktop) / bottom sheet (mobile): filters
     - Zone: multiselect (Bang Tao, Rawai, Patong, Kamala, Layan, Cherng Talay, Kata, Karon, All)
     - Price range: slider
     - Bedrooms: 1, 2, 3, 4, 5+
     - Amenities: pool, sea view, parking (checkboxes)
   - Map view / List view toggle
   - Sort: price low-high, price high-low, rating, newest
   - Results: ListingCard grid
   - Query: v2.listings WHERE type = 'property' AND status = 'active'
   - Pagination: 20 per page

3. ListingDetailPage (stay.myuno.app/listing/:id)
   - Photo gallery (full-width, swipeable)
   - Title, description (bilingual)
   - Attributes: bedrooms, bathrooms, area, pool, etc. from attributes jsonb
   - Location map (Google Maps embed)
   - Price calendar (showing seasonal prices from listing_prices)
   - Reviews section (v2.reviews WHERE listing_id = :id)
   - Booking widget (sticky on desktop, fixed bottom on mobile):
     - Date picker (check-in / check-out)
     - Guests selector
     - Price calculation (with seasonal pricing)
     - "Book Now" button → BookingFlow component
   - Similar listings carousel

DATA QUERIES (using packages/api v2 helper):

// Search with filters
const { data } = await v2.from('listings')
  .select('*, listing_prices(*), reviews(rating)')
  .eq('type', 'property')
  .eq('status', 'active')
  .in('zone', selectedZones)
  .gte('price', priceMin)
  .lte('price', priceMax)
  .order('rating', { ascending: false })
  .range(page * 20, (page + 1) * 20 - 1);

VERIFY: All three pages render. Search returns results. Mobile layout works.
Add 3-5 test listings via Supabase Table Editor for testing.
```

## STEP 2.2 — StaySync: Booking + Payment

```
CURSOR INSTRUCTION:

Implement the complete booking + payment flow in apps/stay/.

FLOW:
1. Guest selects dates + guests on ListingDetailPage
2. Clicks "Book Now" → BookingFlow opens
3. Step 1: Confirm dates, guests, calculate price
   - Check availability (no overlapping bookings for same listing)
   - Apply seasonal pricing from listing_prices
   - Show price breakdown: X nights × ฿Y = ฿Z + cleaning fee
4. Step 2: Guest enters name, email, phone (or logs in)
   - If not logged in → create auth account + v2.profiles record
5. Step 3: Payment via Stripe
   - Create Stripe Checkout Session via Edge Function
   - Redirect to Stripe → payment → redirect back with session_id
6. Step 4: Confirmation
   - Create v2.bookings record (status: 'confirmed')
   - Create v2.payments record (status: 'paid')
   - Show confirmation with booking ID
   - Option to "Add to WhatsApp" (deep link to save contact)

EDGE FUNCTION: supabase/functions/create-checkout-session/

```typescript
// Creates Stripe Checkout Session for a booking
// Input: listing_id, check_in, check_out, pax, customer_email
// Output: Stripe checkout URL

import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { listing_id, check_in, check_out, pax, customer_email, customer_name } = await req.json();
  
  // Fetch listing from v2
  // Calculate total price (with seasonal pricing)
  // Create Stripe Checkout Session
  // Return session URL
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email,
    line_items: [{
      price_data: {
        currency: 'thb',
        product_data: {
          name: listing.title,
          description: `${nights} nights, ${pax} guests`,
          images: [listing.media[0]?.url],
        },
        unit_amount: totalAmount * 100, // Stripe uses smallest currency unit
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/listing/${listing_id}`,
    metadata: { listing_id, check_in, check_out, pax: String(pax) },
  });
  
  return new Response(JSON.stringify({ url: session.url }));
});
```

EDGE FUNCTION: supabase/functions/stripe-webhook/

Handles Stripe webhook events:
- checkout.session.completed → create booking + payment in v2
- payment_intent.payment_failed → update status
- charge.refunded → update payment status

ASK ME FOR: 
- Stripe Secret Key (sk_live_... or sk_test_...)
- Stripe Webhook Secret (whsec_...)
If not available yet, use test keys and flag for later replacement.

VERIFY: Complete a test booking end-to-end. Booking appears in v2.bookings.
Payment appears in v2.payments. Stripe Dashboard shows the charge.
```

## STEP 2.3 — StaySync: Owner Dashboard (B2B side)

```
CURSOR INSTRUCTION:

Add owner/PM dashboard to apps/stay/ at route /dashboard.
Protected route — requires auth + role IN ('owner', 'admin').

PAGES:

1. DashboardHome (/dashboard)
   - KPI cards: Revenue (month), Bookings (month), Occupancy %, Average Rating
   - Query: v2.bookings WHERE listing_id IN (user's listings) AND starts_at in current month
   - Recent bookings list (last 10)
   - Upcoming check-ins (next 7 days)
   - Tasks requiring attention (overdue or urgent)

2. MyProperties (/dashboard/properties)
   - List of owner's properties (v2.listings WHERE owner_id = auth.uid())
   - Each card shows: title, status, occupancy %, revenue this month
   - Click → edit listing (update prices, description, photos, availability)

3. CalendarView (/dashboard/calendar)
   - Month view showing all bookings across all owner's properties
   - Color-coded by property
   - Click on date → see booking details or block dates
   - Data source: v2.bookings WHERE listing_id IN (owner's listings)

4. Bookings (/dashboard/bookings)
   - Table: guest name, property, dates, amount, status
   - Filter by property, status, date range
   - Click → booking detail (guest info, payment, notes)

5. Financials (/dashboard/financials)
   - Revenue by month (bar chart)
   - Expenses (from v2.tasks with cost field)
   - Net income = revenue - expenses - PM fee
   - Export to CSV

VERIFY: Owner can log in, see their properties, view bookings and revenue.
```

---

# ═══════════════════════════════════════════
# STAGE 3: PROPERTYSEARCH (invest.myuno.app)
# ═══════════════════════════════════════════

## STEP 3.1 — PropertySearch: Catalog + Filters

```
CURSOR INSTRUCTION:

Build the property investment catalog at apps/invest/.

PAGES:

1. HomePage (invest.myuno.app/)
   - Hero: "Новостройки Пхукета" / "Phuket New Developments"
   - Featured projects (v2.listings WHERE type = 'property' AND featured = true AND subtype IN ('new_development', 'condo', 'villa'))
   - Market stats bar: "200+ проектов · ROI 6-10% · от ฿3M"
   - Search CTA

2. SearchPage (invest.myuno.app/search)
   - Filters:
     - Type: Condo / Villa / Land
     - Zone: multiselect
     - Budget: range slider (฿1M - ฿50M)
     - ROI: minimum % (from attributes.estimated_roi)
     - Status: Under Construction / Ready / Resale
     - Title type: Freehold / Leasehold
     - Developer rating: minimum stars
   - Results: cards with project info
   - Sort: price, ROI, developer rating, completion date

3. ProjectDetailPage (invest.myuno.app/project/:id)
   - Photo gallery
   - Project description (bilingual)
   - Developer info (from v2.organizations WHERE type = 'developer')
   - Price range + floor plans (from listing_prices)
   - Key metrics: price/sqm, estimated ROI, completion date, % sold
   - Location map
   - Title type explanation (freehold vs leasehold)
   - **"Request Viewing" CTA button** → LeadCaptureForm

4. LeadCaptureForm (modal/bottom sheet):
   - Fields: name, phone (required), email, budget range, preferred zones, message
   - On submit:
     a. Create v2.profiles if new user (or link to existing)
     b. INSERT INTO v2.leads (source_app: 'property_search', type: 'purchase', ...)
     c. AI score the lead (use scoring algorithm from CLAUDE.md section 6)
     d. Send WhatsApp notification to admin (Pavel):
        "📈 New lead: {name}, budget {budget}, zone {zone}. Score: {score}. {phone}"
     e. Show confirmation: "We'll contact you within 24 hours"

CRITICAL: The "Request Viewing" → Lead → WhatsApp notification flow is the 
PRIMARY REVENUE GENERATOR for Ignatev Capital. This must work flawlessly.

VERIFY: 
- Add 5-10 test property listings (type='property', subtype='new_development')
- Complete a test lead submission
- Lead appears in v2.leads with correct score
- WhatsApp notification fires (or log it if WhatsApp not configured yet)
```

---

# ═══════════════════════════════════════════
# STAGE 4: CONCIERGE APPS
# ═══════════════════════════════════════════

## STEP 4.1 — TransferRu (transfer.myuno.app)

```
CURSOR INSTRUCTION:

Build airport transfer booking at apps/transfer/.
Reuse existing transfer module components if they exist in current codebase.

SINGLE PAGE APP with sections:

1. BookingForm (top of page):
   - Direction: Airport → Hotel / Hotel → Airport / Custom
   - Pickup address (Google Maps autocomplete)
   - Dropoff address (Google Maps autocomplete)  
   - Date + Time picker
   - Flight number (optional)
   - Passengers: 1-8
   - Vehicle type cards: Sedan (1-3 pax, ฿800) / Minivan (4-6, ฿1,200) / VIP (1-3, ฿2,500)
   - Price shown immediately based on selection
   - "Book Transfer" → Stripe checkout

2. On booking completion:
   - Create v2.bookings (type: 'transfer')
   - Create v2.payments  
   - details jsonb: { pickup, dropoff, flight_no, vehicle_type, direction }
   - Send WhatsApp to admin: "🚗 Transfer: {date} {time}, {pickup} → {dropoff}, {pax} pax, ฿{price}"

3. ConfirmationPage:
   - Booking details
   - Driver will be assigned (manual by admin for now)
   - WhatsApp contact for changes

DATA: Create 3 v2.listings records for vehicle types:
  - type='service', subtype='transfer_sedan', price=800
  - type='service', subtype='transfer_minivan', price=1200  
  - type='service', subtype='transfer_vip', price=2500

VERIFY: Complete test booking. Record in v2.bookings. Payment in v2.payments.
```

## STEP 4.2 — YachtCharter (yacht.myuno.app)

```
CURSOR INSTRUCTION:

Build yacht charter booking at apps/yacht/.
REUSE existing yacht module from current codebase — it's 92% ready.

Extract yacht-related components from current src/pages and src/components.
Adapt them to use v2 schema (v2.listings WHERE type = 'yacht').

Key features to preserve:
- Dual booking mode: instant book + request to book
- Deposit model (partial payment)
- Yacht detail page with specs from attributes jsonb
- Calendar availability

Adapt:
- Use packages/ui AppShell
- Use packages/api v2 queries
- Bilingual support

Add 3-5 test yacht listings to v2.listings with type='yacht' and attributes:
{ length_ft, cabins, crew, max_pax, engine, year_built }

VERIFY: Catalog shows yachts. Booking flow works. Payment creates records in v2.
```

## STEP 4.3 — BloomPhuket (bloom.myuno.app)

```
CURSOR INSTRUCTION:

Build flower delivery app at apps/bloom/.
REUSE existing flowers module — fix the checkout bug (doesn't create order in DB).

Pages:
1. Catalog — grid of bouquets/arrangements (v2.listings WHERE type = 'product' AND subtype = 'flowers')
2. Product detail — photos, description, price, size options
3. Cart — items, delivery address (Google Maps), delivery date/time, message card text
4. Checkout — Stripe payment
5. Confirmation — order summary, estimated delivery time

On order:
- v2.bookings (type: 'delivery')
- v2.payments
- details jsonb: { delivery_address, delivery_date, message_card, items: [...] }
- WhatsApp to florist: "💐 Order: {items}, deliver to {address} on {date}"

Add 5-8 test flower products to v2.listings.

VERIFY: Complete order end-to-end. Booking + payment created. 
Fix the existing checkout bug (creates order in v2.bookings, not old tables).
```

---

# ═══════════════════════════════════════════
# STAGE 5: ADMIN DASHBOARD
# ═══════════════════════════════════════════

## STEP 5.1 — Admin: Core Structure

```
CURSOR INSTRUCTION:

Build admin dashboard at apps/admin/.
Protected: requires auth + role = 'admin'.

Layout:
- Sidebar navigation (collapsible on mobile):
  📊 Home | 🏠 Listings | 📅 Bookings | 👥 CRM | 💰 Payments | 
  📈 Analytics | 📝 Tasks | 👤 Users | 💬 Messages | ⚙️ Settings

Pages — build in this order:

1. AdminHome (/admin)
   - KPI cards: today's revenue, bookings, new leads, occupancy %
   - Recent bookings (last 10, all types)
   - Hot leads (score > 80, status = 'new')
   - Overdue tasks
   - Queries: aggregate from v2.bookings, v2.leads, v2.tasks, v2.payments

2. ListingsManager (/admin/listings)
   - Table: all v2.listings with columns: title, type, zone, price, status, rating
   - Filter by type, status, zone
   - [+ Add Listing] button → Listing Editor
   - Inline status toggle (active/paused)
   - Bulk actions: activate, pause, delete

3. ListingEditor (/admin/listings/new and /admin/listings/:id/edit)
   - Dynamic form based on type + subtype (see CLAUDE.md ATTRIBUTE_SCHEMAS)
   - Fields: type, subtype, title (EN+RU), description (EN+RU), zone, address,
     price, price_unit, management_model, media (drag-drop upload to Supabase Storage),
     attributes (dynamic fields based on type), featured toggle
   - Seasonal prices section: add/remove listing_prices
   - Save as draft / Publish

4. BookingsManager (/admin/bookings)
   - Table: all v2.bookings with columns: guest, listing, type, dates, amount, status
   - Filter by type, status, date range
   - Click → detail view with full info
   - Actions: confirm, cancel, assign provider, add note
   - [+ Manual Booking] — create booking for walk-in / phone / offline payment

5. PaymentsManager (/admin/payments)
   - Table: all v2.payments
   - Filter by status, method, date
   - [+ Record Payment] — for cash/bank transfer payments:
     amount, method (cash/bank_transfer), link to booking, payer, notes
   - Refund button (triggers Stripe refund if method = stripe)

VERIFY: Admin can log in, see KPIs, view/add/edit listings, manage bookings,
record offline payments. All data comes from v2 schema.
```

## STEP 5.2 — Admin: CRM

```
CURSOR INSTRUCTION:

Build CRM section in admin dashboard at /admin/crm.

1. Pipeline View (default):
   - Kanban board with columns: NEW → CONTACTED → QUALIFIED → PROPOSAL → CLOSED WON / CLOSED LOST
   - Drag cards between columns to change status
   - Each card shows: name, budget, zone, score (color-coded), source, days in stage
   - Data: v2.leads with v2.profiles join

2. Lead Detail (modal or side panel on card click):
   - Profile: name, phone, email, nationality
   - Lead info: source, type, budget, preferences, score, created date
   - Timeline: all status changes + notes (stored in leads meta jsonb or separate events)
   - Platform activity: properties viewed (if tracked), calculator uses
   - Actions: [📞 Call] [💬 WhatsApp] [📧 Email] [Schedule Viewing] [Add Note]
   - Follow-up date picker + reminder
   - Move to next stage button

3. Add Lead (/admin/crm/new):
   - Manual lead entry from Capital contacts
   - Fields: name, phone, email, budget range, zones, type, source, notes
   - Auto-score on save

4. List View (table alternative to Kanban):
   - Sortable table with all lead fields
   - Export to CSV
   - Filter by status, source, score range, date

VERIFY: Create 5 test leads. Kanban renders. Drag between columns updates status.
Lead detail shows all info. Manual lead creation works.
```

## STEP 5.3 — Admin: Tasks

```
CURSOR INSTRUCTION:

Build Tasks section at /admin/tasks.

1. Task List:
   - Table/card view of all v2.tasks
   - Filter: by type (cleaning, maintenance, snagging...), status, priority, assigned_to, listing
   - Sort: by due_at, priority, status
   - Color-coded priority: urgent=red, high=orange, medium=yellow, low=gray

2. Task Detail:
   - Title, description, type, priority
   - Linked listing (click to view)
   - Linked booking (if applicable)
   - Assigned to (select from team members)
   - Status workflow: open → in_progress → done → verified
   - Media: upload photos (before/after for maintenance)
   - Cost field (for expense tracking)
   - Comments/notes

3. Create Task:
   - Quick-create from booking (auto-link listing + booking)
   - "Create cleaning task" shortcut on booking detail
   - Fields: type, title, listing, assigned_to, priority, due_at, description

This is Timothy's primary tool for day-to-day Estate operations.

VERIFY: Create test tasks. Assign to user. Change status. Upload photo.
```

---

# ═══════════════════════════════════════════
# STAGE 6: HUB + LAUNCH PREP
# ═══════════════════════════════════════════

## STEP 6.1 — Hub Landing Page (myuno.app)

```
CURSOR INSTRUCTION:

Build the hub landing page at apps/hub/.
This is NOT an app — it's a catalog that routes users to micro-apps.

Design: clean, premium, minimal. Not a tech startup. More like a luxury concierge directory.

Sections:

1. Hero:
   - "myUNO — Один аккаунт, весь Пхукет" / "myUNO — One Account, All of Phuket"
   - Subtitle: "Аренда, покупка, сервисы — всё для жизни на острове"
   - Search bar: "Что вы ищете?" → routes to appropriate micro-app
   - Language toggle (RU/EN)

2. Cluster Grid (6 cards):
   ✈️ Приехать — SIM, трансфер, обмен, авто, банк
   🌴 Жить — ремонт, яхты, цветы, рестораны, события
   ⚖️ Легально — визы, налоги, контракты
   📈 Купить — новостройки, ROI, аналитика
   🔧 Управлять — аренда, PM, StaySync
   🏗️ Девелоперам — sales, pricing, tracking
   
   Each card links to the corresponding app (or shows "Скоро" for Phase 2-3 apps)

3. Featured Properties carousel (from v2.listings WHERE featured = true AND type = 'property')

4. Featured New Developments (from v2.listings WHERE subtype = 'new_development' AND featured = true)

5. Stats bar: "300+ объектов · 6,000+ туристов в месяц · Русский + English"

6. Testimonial section (hardcoded for now, 2-3 quotes)

7. Footer:
   - All app links grouped by cluster
   - About myUNO / Ignatev Group
   - Contact: WhatsApp, Telegram, Email
   - Language: RU | EN

VERIFY: Hub renders beautifully on desktop and mobile. 
All links to live apps work. Coming soon apps show appropriate badge.
```

## STEP 6.2 — SEO + Analytics

```
CURSOR INSTRUCTION:

For each app (hub, stay, invest, transfer, yacht, bloom):

1. Add proper <head> meta tags:
   - <title> — bilingual, keyword-rich
   - <meta name="description"> — bilingual
   - <meta property="og:*"> — Open Graph for social sharing
   - <link rel="canonical"> — proper URL
   
   Example for stay.myuno.app:
   Title (RU): "Аренда вилл и кондо на Пхукете — myUNO"
   Title (EN): "Villa & Condo Rentals in Phuket — myUNO"
   Description: "300+ вилл и кондо для аренды на Пхукете. Прямое бронирование, без комиссии OTA."

2. Add PostHog analytics:
   - Install posthog-js
   - Initialize in app entry point
   - Track: page views, search queries, booking starts, booking completions, 
     lead submissions, listing views
   
   ASK ME FOR: PostHog API key (or create account at posthog.com)

3. Add Sentry error tracking:
   - Install @sentry/react
   - Initialize with DSN
   - Wrap app in ErrorBoundary
   
   ASK ME FOR: Sentry DSN (or create account at sentry.io)

4. Add sitemap.xml generation for each app
5. Add robots.txt

VERIFY: Meta tags render correctly (check with browser dev tools).
PostHog receives test events. Sentry catches a test error.
```

---

# ═══════════════════════════════════════════
# STAGE 7: OWNER DASHBOARD
# ═══════════════════════════════════════════

## STEP 7.1 — Owner Portal

```
CURSOR INSTRUCTION:

Add owner-facing dashboard. This can be:
- A section within apps/stay at /dashboard (already partially built in STEP 2.3)
- OR a separate app at apps/owner (owner.myuno.app)

Choose the simpler approach. The key requirement: property owners can log in
and see their properties' performance WITHOUT accessing admin dashboard.

Enhance the dashboard from STEP 2.3 with:

1. ROI Report page (/dashboard/reports):
   - Monthly summary: revenue, expenses (from tasks.cost), PM fee (20%), net income
   - Occupancy chart (12 months)
   - ADR (average daily rate) chart
   - Comparison with zone average (from v2.market_data)
   - Download as PDF button (generate with html-to-pdf or similar)

2. Documents page (/dashboard/documents):
   - List of documents linked to owner (v2.documents WHERE owner_id = auth.uid())
   - PM contract, monthly reports, invoices
   - Upload capability for owner's own documents

3. Maintenance page (/dashboard/maintenance):
   - Tasks related to owner's properties (v2.tasks WHERE listing_id IN owner's listings)
   - Status timeline
   - Photos of completed work

VERIFY: Owner logs in → sees only their properties.
Cannot see other owners' data (RLS enforced).
Revenue numbers match bookings data.
```

---

# ═══════════════════════════════════════════
# STAGE 8: POLISH + DEPLOY
# ═══════════════════════════════════════════

## STEP 8.1 — Mobile Optimization

```
CURSOR INSTRUCTION:

Test every page on 375px viewport width (iPhone SE). Fix all issues:

1. Touch targets: minimum 44px height for all buttons, links, inputs
2. Font sizes: minimum 14px for body text
3. No horizontal scroll — fix any overflow
4. Bottom navigation: visible and functional on all pages
5. Forms: inputs don't get hidden behind keyboard
6. Image galleries: swipeable with touch
7. Tables: horizontal scroll wrapper on mobile
8. Modals: full-screen bottom sheets on mobile
9. Price display: no text wrapping mid-number

Run through each app systematically. Report all fixes made.
```

## STEP 8.2 — Error Handling + Loading States

```
CURSOR INSTRUCTION:

Audit every page and component:

1. Every Supabase query must have error handling:
   - try/catch wrapper
   - User-friendly error message (bilingual)
   - Sentry capture for non-user errors

2. Every async operation must show loading state:
   - Skeleton loaders for list pages
   - Spinner for form submissions
   - Disabled buttons during processing

3. Empty states for all lists:
   - "No properties found" with illustration
   - "No bookings yet" with CTA
   - "No leads" with suggestion

4. 404 page for each app (bilingual)
5. Network error handling (offline/slow connection message)

VERIFY: Disconnect internet → app shows friendly offline message.
Submit form with invalid data → shows validation errors.
Navigate to non-existent page → shows 404.
```

## STEP 8.3 — Final Deployment Checklist

```
CURSOR INSTRUCTION:

Run through this checklist and fix anything failing:

□ All apps build without errors: `npm run build` from root
□ No TypeScript errors: `npx tsc --noEmit`
□ No console.log in production code (replace with Sentry/PostHog)
□ Environment variables: .env.example lists ALL required vars
□ Supabase v2 schema: all 16 tables exist with RLS policies
□ Auth works: signup, login, logout, protected routes
□ Stripe: test payment completes end-to-end
□ Mobile: all pages work on 375px
□ Bilingual: every string has RU + EN
□ SEO: every page has title, description, OG tags
□ Images: all use WebP, lazy loaded, proper alt text
□ Loading states: every page has skeleton/spinner
□ Error handling: every query has try/catch
□ 404 pages: every app has one
□ Favicon + PWA manifest for each app

ASK ME FOR any missing credentials:
□ Stripe live keys (if still on test)
□ Domain DNS configured in Cloudflare
□ Vercel projects created for each subdomain
□ PostHog API key
□ Sentry DSN
□ WhatsApp Cloud API credentials (or UltraMSG config)

After all checks pass → commit everything → `git push` → apps go live.

VERIFY: Visit each subdomain in browser. All pages load. Core flows work.
Report final status of each app.
```

---

# POST-LAUNCH: DATA ENTRY

```
CURSOR INSTRUCTION:

After all apps are deployed, help me enter initial data.
This is NOT a coding task — it's data population.

1. Create an admin user in v2.profiles with role = 'admin'
   (link to my auth.users account)

2. Guide me through adding listings via the Admin Dashboard:
   - 5 direct properties (management_model = 'full_pm')
   - 10-15 sample new developments for PropertySearch
   - 3 transfer vehicle types
   - 3-5 yacht listings
   - 5-8 flower products

3. Help me create a CSV template for bulk property import (300+ objects)
   with columns matching v2.listings schema

4. Set up Ignatev Estate as v2.organizations (type = 'pm_company')
   and link admin user as org_member (role = 'owner')

After data is entered → platform is ready for first real users.
```

---

## IMPORTANT RULES FOR CURSOR

Throughout ALL stages:

1. **Read CLAUDE.md before every task** — it has the full technical context
2. **Use v2 schema for ALL queries** — `supabase.schema('v2').from('table')`
3. **Never modify old public.* tables** — they are legacy, don't touch
4. **Every UI string must be bilingual** (RU + EN)
5. **Mobile-first** — test on 375px
6. **Report after each step** — what was done, what was created, any issues
7. **Ask me before**:
   - Creating new database tables (should not be needed)
   - Installing new major dependencies
   - Changing auth flow
   - Any external API integration (need credentials)
8. **Commit after each completed step** with descriptive message
9. **Build check after each step**: `npm run build` must pass
