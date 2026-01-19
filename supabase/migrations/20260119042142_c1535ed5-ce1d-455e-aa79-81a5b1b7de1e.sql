-- =====================================================
-- UNO CLEAN CORE ARCHITECTURE - CANONICAL SCHEMA
-- =====================================================

-- 1️⃣ IDENTITY & ACCESS LAYER
-- =====================================================

-- Organizations table (vendors, owners, operators)
CREATE TABLE IF NOT EXISTS public.orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT,
  org_type TEXT NOT NULL CHECK (org_type IN ('vendor', 'owner', 'operator', 'platform')),
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization members (user-org relationship)
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- User active context (replaces localStorage role switching)
CREATE TABLE IF NOT EXISTS public.user_active_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  active_role TEXT NOT NULL DEFAULT 'user',
  active_org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ CANONICAL CATALOG LAYER
-- =====================================================

-- Products table (unified: services, tours, properties, yachts, transport)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id),
  product_type TEXT NOT NULL CHECK (product_type IN (
    'service', 'tour', 'property', 'yacht', 'vehicle', 
    'event', 'activity', 'beauty', 'cleaning', 'babysitter',
    'education', 'medical', 'legal', 'pet_service', 'flowers', 'food'
  )),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[],
  base_price NUMERIC(12,2),
  currency TEXT DEFAULT 'THB',
  duration_minutes INTEGER,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resources table (physical assets: villas, yachts, cars)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('property_unit', 'yacht', 'vehicle', 'room', 'equipment')),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  capacity INTEGER,
  location TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  is_available BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product-Resource links (which products use which resources)
CREATE TABLE IF NOT EXISTS public.product_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, resource_id)
);

-- Product availability
CREATE TABLE IF NOT EXISTS public.product_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  slots_available INTEGER DEFAULT 1,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ CANONICAL ORDER CORE (MOST IMPORTANT)
-- =====================================================

-- Order status enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'draft', 'pending', 'confirmed', 'in_progress', 
    'completed', 'cancelled', 'refunded', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order item status enum
DO $$ BEGIN
  CREATE TYPE order_item_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Canonical orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN (
    'service', 'tour', 'property', 'yacht', 'vehicle', 
    'event', 'activity', 'beauty', 'cleaning', 'babysitter',
    'education', 'medical', 'legal', 'pet_service', 'flowers', 'food', 'mixed'
  )),
  customer_user_id UUID NOT NULL,
  provider_org_id UUID REFERENCES public.orgs(id),
  status order_status DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items (line items for each product/service in order)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  resource_id UUID REFERENCES public.resources(id),
  provider_org_id UUID REFERENCES public.orgs(id),
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  qty INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status order_item_status DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order participants (guests, attendees)
CREATE TABLE IF NOT EXISTS public.order_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'guest', 'attendee', 'driver', 'guide')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order addresses (pickup, service location, dropoff)
CREATE TABLE IF NOT EXISTS public.order_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('pickup', 'service', 'dropoff', 'billing')),
  address_text TEXT NOT NULL,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  actor_user_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4️⃣ PAYMENTS & LEDGER
-- =====================================================

-- Payment method enum
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'wallet', 'stripe', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum  
DO $$ BEGIN
  CREATE TYPE intent_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment intents (connected to orders)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  method payment_method NOT NULL,
  status intent_status DEFAULT 'pending',
  provider_ref TEXT, -- Stripe payment intent ID
  provider_session_id TEXT, -- Stripe checkout session ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ledger accounts
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT NOT NULL CHECK (account_type IN ('user_wallet', 'vendor_balance', 'platform_revenue', 'escrow', 'refund_reserve')),
  owner_user_id UUID,
  owner_org_id UUID REFERENCES public.orgs(id),
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT owner_check CHECK (
    (owner_user_id IS NOT NULL AND owner_org_id IS NULL) OR
    (owner_user_id IS NULL AND owner_org_id IS NOT NULL) OR
    (owner_user_id IS NULL AND owner_org_id IS NULL AND account_type IN ('platform_revenue', 'escrow', 'refund_reserve'))
  )
);

-- Ledger entries (double-entry bookkeeping)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_account_id UUID NOT NULL REFERENCES public.ledger_accounts(id),
  credit_account_id UUID NOT NULL REFERENCES public.ledger_accounts(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  order_id UUID REFERENCES public.orders(id),
  payment_intent_id UUID REFERENCES public.payment_intents(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('payment', 'refund', 'payout', 'fee', 'adjustment', 'topup')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5️⃣ VERTICAL DETAIL TABLES (1:1 with order_items)
-- =====================================================

-- Property booking details
CREATE TABLE IF NOT EXISTS public.order_item_property_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  check_in_date DATE,
  check_out_date DATE,
  guests_count INTEGER,
  rooms_count INTEGER,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transport booking details
CREATE TABLE IF NOT EXISTS public.order_item_transport_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  vehicle_type TEXT,
  pickup_time TIMESTAMPTZ,
  flight_number TEXT,
  passenger_count INTEGER,
  luggage_count INTEGER,
  is_round_trip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Yacht charter details
CREATE TABLE IF NOT EXISTS public.order_item_yacht_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES public.order_items(id) ON DELETE CASCADE,
  charter_type TEXT CHECK (charter_type IN ('half_day', 'full_day', 'sunset', 'overnight')),
  guests_count INTEGER,
  crew_included BOOLEAN DEFAULT true,
  catering_included BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6️⃣ INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider_org_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON public.payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_context_user ON public.user_active_context(user_id);

-- 7️⃣ ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_transport_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_yacht_details ENABLE ROW LEVEL SECURITY;

-- 8️⃣ RLS POLICIES
-- =====================================================

-- Orgs: anyone can read active orgs, members can manage
CREATE POLICY "Anyone can view active orgs" ON public.orgs FOR SELECT USING (is_active = true);
CREATE POLICY "Org admins can update their org" ON public.orgs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orgs.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Org members: users can see their own memberships
CREATE POLICY "Users can view own memberships" ON public.org_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Org owners can manage members" ON public.org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid() AND om.role = 'owner')
);

-- User active context: users manage their own
CREATE POLICY "Users manage own context" ON public.user_active_context FOR ALL USING (user_id = auth.uid());

-- Products: anyone can read active, org members can manage
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Org members can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = products.org_id AND user_id = auth.uid())
);

-- Resources: org members can manage
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Org members can manage resources" ON public.resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = resources.org_id AND user_id = auth.uid())
);

-- Product resource links
CREATE POLICY "Anyone can view product links" ON public.product_resource_links FOR SELECT USING (true);

-- Product availability
CREATE POLICY "Anyone can view availability" ON public.product_availability FOR SELECT USING (true);

-- Orders: customers see own, vendors see orders for their org
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (customer_user_id = auth.uid());
CREATE POLICY "Vendors view org orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "Order owners can update" ON public.orders FOR UPDATE USING (
  customer_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())
);

-- Order items
CREATE POLICY "View order items via order" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (customer_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.org_members WHERE org_id = orders.provider_org_id AND user_id = auth.uid())))
);
CREATE POLICY "Create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_user_id = auth.uid())
);

-- Order participants
CREATE POLICY "View participants via order" ON public.order_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_participants.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create participants" ON public.order_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_participants.order_id AND customer_user_id = auth.uid())
);

-- Order addresses
CREATE POLICY "View addresses via order" ON public.order_addresses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addresses.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create addresses" ON public.order_addresses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_addresses.order_id AND customer_user_id = auth.uid())
);

-- Order status history
CREATE POLICY "View status history" ON public.order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_status_history.order_id AND customer_user_id = auth.uid())
);

-- Payment intents
CREATE POLICY "View own payment intents" ON public.payment_intents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payment_intents.order_id AND customer_user_id = auth.uid())
);
CREATE POLICY "Create payment intents" ON public.payment_intents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = payment_intents.order_id AND customer_user_id = auth.uid())
);

-- Ledger accounts: users see own wallet
CREATE POLICY "Users view own accounts" ON public.ledger_accounts FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Orgs view own accounts" ON public.ledger_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = ledger_accounts.owner_org_id AND user_id = auth.uid())
);

-- Ledger entries
CREATE POLICY "View entries for own accounts" ON public.ledger_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ledger_accounts WHERE (id = ledger_entries.debit_account_id OR id = ledger_entries.credit_account_id) AND owner_user_id = auth.uid())
);

-- Order item details
CREATE POLICY "View property details" ON public.order_item_property_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_property_details.order_item_id AND o.customer_user_id = auth.uid())
);
CREATE POLICY "View transport details" ON public.order_item_transport_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_transport_details.order_item_id AND o.customer_user_id = auth.uid())
);
CREATE POLICY "View yacht details" ON public.order_item_yacht_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id 
    WHERE oi.id = order_item_yacht_details.order_item_id AND o.customer_user_id = auth.uid())
);

-- 9️⃣ AUTO-GENERATE ORDER NUMBER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'UNO-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_order_number ON public.orders;
CREATE TRIGGER tr_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- 🔟 UPDATE TIMESTAMPS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_updated ON public.orders;
CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_orgs_updated ON public.orgs;
CREATE TRIGGER tr_orgs_updated BEFORE UPDATE ON public.orgs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_products_updated ON public.products;
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_resources_updated ON public.resources;
CREATE TRIGGER tr_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_payment_intents_updated ON public.payment_intents;
CREATE TRIGGER tr_payment_intents_updated BEFORE UPDATE ON public.payment_intents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_ledger_accounts_updated ON public.ledger_accounts;
CREATE TRIGGER tr_ledger_accounts_updated BEFORE UPDATE ON public.ledger_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();