-- Batch 8
-- Migration: 20260220031331_f6d1f48a-23f4-44b5-b545-967b5d6bfa65.sql

-- Create lifecycle_templates table
CREATE TABLE public.lifecycle_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  title_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ru TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  promo_code TEXT,
  discount_percent INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lifecycle_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can manage lifecycle_templates"
  ON public.lifecycle_templates
  FOR ALL
  USING (public.is_admin_or_uno_team());

-- Trigger for updated_at
CREATE TRIGGER update_lifecycle_templates_updated_at
  BEFORE UPDATE ON public.lifecycle_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Seed default templates
INSERT INTO public.lifecycle_templates (trigger_type, channel, title_ru, title_en, body_ru, body_en, promo_code, discount_percent) VALUES
  ('welcome', 'email', 'Добро пожаловать в UNO!', 'Welcome to UNO!', 'Мы рады видеть вас! Откройте для себя лучшие услуги на Пхукете.', 'We are glad to see you! Discover the best services in Phuket.', NULL, NULL),
  ('welcome', 'push', 'Добро пожаловать! 🎉', 'Welcome! 🎉', 'Исследуйте услуги и получите скидку на первый заказ.', 'Explore services and get a discount on your first order.', NULL, NULL),
  ('at_risk_reactivation', 'email', 'Мы скучаем по вам!', 'We miss you!', 'Давно вас не видели. Специальное предложение ждёт вас!', 'Long time no see. A special offer awaits you!', 'COMEBACK10', 10),
  ('at_risk_reactivation', 'push', 'Вернитесь к нам! 💙', 'Come back! 💙', 'У нас для вас персональная скидка 10%.', 'We have a personal 10% discount for you.', 'COMEBACK10', 10),
  ('dormant_winback', 'email', 'Новые услуги ждут вас', 'New services await you', 'За время вашего отсутствия у нас появилось много нового. Посмотрите!', 'A lot has changed since your last visit. Check it out!', 'WINBACK15', 15),
  ('vip_reward', 'email', 'Спасибо за лояльность! 🌟', 'Thank you for your loyalty! 🌟', 'Вы наш VIP-клиент. Эксклюзивное предложение внутри.', 'You are our VIP client. Exclusive offer inside.', 'VIP20', 20),
  ('post_order_review', 'push', 'Как всё прошло? ⭐', 'How was it? ⭐', 'Оцените ваш последний заказ и помогите другим.', 'Rate your last order and help others.', NULL, NULL),
  ('cross_sell', 'push', 'Вам может понравиться 🎁', 'You might like 🎁', 'На основе вашего заказа мы подобрали рекомендации.', 'Based on your order, we have recommendations for you.', NULL, NULL);

-- Migration: 20260220092550_6a4ac9d0-b7b0-44f4-ac56-52161a488f3e.sql

-- ============================================
-- Agent Deals CRM for Management Companies
-- ============================================

-- Helper function to check membership in a management company (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND is_active = true
  )
$$;

-- Helper: get member role in company
CREATE OR REPLACE FUNCTION public.get_company_member_role(_user_id uuid, _company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.management_company_members
  WHERE user_id = _user_id
    AND company_id = _company_id
    AND is_active = true
  LIMIT 1
$$;

-- 1. agent_deals table
CREATE TABLE public.agent_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Client info
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  client_source text DEFAULT 'website',
  
  -- Pipeline
  stage text NOT NULL DEFAULT 'new',
  
  -- Client preferences
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'THB',
  preferred_districts text[],
  preferred_types text[],
  bedrooms_min integer,
  
  -- Agent notes
  notes text,
  next_action text,
  next_action_date timestamptz,
  
  -- Deal financials
  deal_value numeric,
  commission_percent numeric,
  commission_amount numeric,
  
  -- Closure
  closed_at timestamptz,
  lost_reason text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_deals_company ON public.agent_deals(company_id);
CREATE INDEX idx_agent_deals_agent ON public.agent_deals(agent_id);
CREATE INDEX idx_agent_deals_stage ON public.agent_deals(stage);
CREATE INDEX idx_agent_deals_next_action ON public.agent_deals(next_action_date) WHERE next_action_date IS NOT NULL;

-- Enable RLS
ALTER TABLE public.agent_deals ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view deals
-- owner/admin see all, member sees only own
CREATE POLICY "Company members can view deals"
ON public.agent_deals FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
    OR agent_id = auth.uid()
  )
);

CREATE POLICY "Company members can insert deals"
ON public.agent_deals FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Company members can update deals"
ON public.agent_deals FOR UPDATE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND (
    public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
    OR agent_id = auth.uid()
  )
);

CREATE POLICY "Company owner/admin can delete deals"
ON public.agent_deals FOR DELETE
TO authenticated
USING (
  public.is_company_member(auth.uid(), company_id)
  AND public.get_company_member_role(auth.uid(), company_id) IN ('owner', 'admin')
);

-- Updated_at trigger
CREATE TRIGGER update_agent_deals_updated_at
BEFORE UPDATE ON public.agent_deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. agent_deal_activities table
CREATE TABLE public.agent_deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note',
  description text,
  stage_from text,
  stage_to text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_activities_deal ON public.agent_deal_activities(deal_id);
CREATE INDEX idx_deal_activities_created ON public.agent_deal_activities(created_at DESC);

ALTER TABLE public.agent_deal_activities ENABLE ROW LEVEL SECURITY;

-- RLS: same company membership check via deal's company_id
CREATE POLICY "Company members can view activities"
ON public.agent_deal_activities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_deals d
    WHERE d.id = deal_id
      AND public.is_company_member(auth.uid(), d.company_id)
      AND (
        public.get_company_member_role(auth.uid(), d.company_id) IN ('owner', 'admin')
        OR d.agent_id = auth.uid()
      )
  )
);

CREATE POLICY "Company members can insert activities"
ON public.agent_deal_activities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agent_deals d
    WHERE d.id = deal_id
      AND public.is_company_member(auth.uid(), d.company_id)
  )
);

-- Migration: 20260220094905_9a1196ac-2239-45f9-ad47-2b3eedbe92e8.sql

-- Function to auto-create agent_deal from consultation_request
-- Triggers when a new consultation_request is created with request_type in ('property_tour', 'investment_advice', 'property_purchase')
-- and the linked property belongs to a management company

CREATE OR REPLACE FUNCTION public.auto_create_deal_from_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_property_id uuid;
BEGIN
  -- Only process property-related lead types
  IF NEW.request_type NOT IN ('property_tour', 'investment_advice', 'property_purchase') THEN
    RETURN NEW;
  END IF;

  -- Try to find company via owner_property_id
  IF NEW.owner_property_id IS NOT NULL THEN
    SELECT p.management_company_id, p.id
    INTO v_company_id, v_property_id
    FROM properties p
    WHERE p.id = NEW.owner_property_id
      AND p.management_company_id IS NOT NULL;
  END IF;

  -- Also try via property_ids array
  IF v_company_id IS NULL AND NEW.property_ids IS NOT NULL AND array_length(NEW.property_ids, 1) > 0 THEN
    SELECT p.management_company_id, p.id
    INTO v_company_id, v_property_id
    FROM properties p
    WHERE p.id = (NEW.property_ids[1])::uuid
      AND p.management_company_id IS NOT NULL
    LIMIT 1;
  END IF;

  -- No company found — skip
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find a default agent (company owner)
  DECLARE v_agent_id uuid;
  BEGIN
    SELECT user_id INTO v_agent_id
    FROM management_company_members
    WHERE company_id = v_company_id AND role = 'owner' AND is_active = true
    LIMIT 1;

    IF v_agent_id IS NULL THEN
      SELECT user_id INTO v_agent_id
      FROM management_company_members
      WHERE company_id = v_company_id AND is_active = true
      LIMIT 1;
    END IF;

    IF v_agent_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Create the deal
    INSERT INTO agent_deals (
      company_id, agent_id, property_id,
      client_name, client_phone, client_email, client_source,
      stage, budget_min, budget_max, currency,
      preferred_districts, preferred_types, bedrooms_min,
      notes
    ) VALUES (
      v_company_id, v_agent_id, v_property_id,
      NEW.name, NEW.phone, NEW.email,
      COALESCE(NEW.lead_source, NEW.entry_point, 'website'),
      'new',
      NEW.budget_min, NEW.budget_max, COALESCE(NEW.currency, 'THB'),
      NEW.districts, NEW.property_types, NEW.bedrooms_min,
      COALESCE(NEW.notes, '') || ' [Auto from lead: ' || NEW.request_type || ']'
    );
  END;

  RETURN NEW;
END;
$$;

-- Trigger on consultation_requests insert
CREATE TRIGGER trg_auto_create_deal_from_lead
  AFTER INSERT ON consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_deal_from_lead();

-- Migration: 20260220101128_79b58618-81a5-426d-993a-9b00a7357570.sql

-- CRM Contacts table
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text,
  phone2 text,
  email text,
  whatsapp text,
  telegram text,
  line_id text,
  nationality text,
  language text DEFAULT 'en',
  source text,
  contact_type text DEFAULT 'buyer',
  company_name text,
  budget_min numeric,
  budget_max numeric,
  currency text DEFAULT 'THB',
  preferred_districts text[],
  preferred_types text[],
  bedrooms_min integer,
  notes text,
  tags text[] DEFAULT '{}',
  avatar_url text,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one phone per company
CREATE UNIQUE INDEX idx_crm_contacts_company_phone ON public.crm_contacts(company_id, phone) WHERE phone IS NOT NULL AND phone != '';

-- Indexes
CREATE INDEX idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_search ON public.crm_contacts USING gin (
  to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(email,''))
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS: members of the management company can access contacts
CREATE POLICY "Company members can view contacts"
  ON public.crm_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert contacts"
  ON public.crm_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update contacts"
  ON public.crm_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can delete contacts"
  ON public.crm_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_contacts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Contact Notes table
CREATE TABLE public.crm_contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  note_type text NOT NULL DEFAULT 'note',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contact_notes_contact ON public.crm_contact_notes(contact_id);

ALTER TABLE public.crm_contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view contact notes"
  ON public.crm_contact_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_notes.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can insert contact notes"
  ON public.crm_contact_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.crm_contacts c
      JOIN public.management_company_members mcm ON mcm.company_id = c.company_id
      WHERE c.id = crm_contact_notes.contact_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own notes"
  ON public.crm_contact_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Add contact_id to agent_deals
ALTER TABLE public.agent_deals ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.crm_contacts(id);
CREATE INDEX IF NOT EXISTS idx_agent_deals_contact ON public.agent_deals(contact_id);

-- Migration: 20260220102439_68e9c5d1-ae5b-40ee-be77-ef251c038c15.sql
-- Fix infinite recursion in management_company_members RLS
-- The "Company admins can manage members" policy references itself, causing recursion

-- Drop the recursive policy
DROP POLICY IF EXISTS "Company admins can manage members" ON public.management_company_members;

-- Create a security definer function to check company admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM management_company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
  );
$$;

-- Recreate policy using the security definer function (avoids recursion)
CREATE POLICY "Company admins can manage members"
ON public.management_company_members
FOR ALL
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));
-- Migration: 20260220112707_4dc62613-5cb6-4ae9-87f8-0a1987dc4d4f.sql

-- ============================================
-- GAP 1: Invoice system
-- ============================================
CREATE TYPE public.invoice_type AS ENUM ('tenant_billing', 'owner_report', 'service_fee');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.owner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  invoice_type invoice_type NOT NULL DEFAULT 'tenant_billing',
  recipient_name text NOT NULL,
  recipient_email text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'THB',
  status invoice_status NOT NULL DEFAULT 'draft',
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  notes text,
  pdf_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_invoices ENABLE ROW LEVEL SECURITY;

-- Auto-increment invoice number per company
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num int;
  year_str text;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(invoice_number, '-', 3), '') AS int)
  ), 0) + 1 INTO next_num
  FROM owner_invoices
  WHERE company_id = NEW.company_id
    AND invoice_number LIKE 'INV-' || year_str || '-%';
  
  NEW.invoice_number := 'INV-' || year_str || '-' || lpad(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON public.owner_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number = '' OR NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- RLS: company members can manage invoices
CREATE POLICY "Company members can view invoices"
  ON public.owner_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create invoices"
  ON public.owner_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update invoices"
  ON public.owner_invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete draft invoices"
  ON public.owner_invoices FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = owner_invoices.company_id
        AND mcm.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_owner_invoices_updated_at
  BEFORE UPDATE ON public.owner_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GAP 5: CRM Tasks
-- ============================================
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.agent_deals(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'follow_up',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  reminder_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view crm_tasks"
  ON public.crm_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create crm_tasks"
  ON public.crm_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update crm_tasks"
  ON public.crm_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can delete crm_tasks"
  ON public.crm_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_tasks.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_crm_tasks_updated_at
  BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GAP 4: Vendor Performance Reviews
-- ============================================
CREATE TABLE public.vendor_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  task_id uuid,
  quality_score smallint NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  speed_score smallint NOT NULL CHECK (speed_score BETWEEN 1 AND 5),
  communication_score smallint NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  overall_score numeric GENERATED ALWAYS AS (
    round((quality_score + speed_score + communication_score)::numeric / 3, 1)
  ) STORED,
  notes text,
  reviewed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view vendor reviews"
  ON public.vendor_performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = vendor_performance_reviews.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can create vendor reviews"
  ON public.vendor_performance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = vendor_performance_reviews.company_id
        AND mcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can update own reviews"
  ON public.vendor_performance_reviews FOR UPDATE
  TO authenticated
  USING (reviewed_by = auth.uid());

CREATE POLICY "Company members can delete own reviews"
  ON public.vendor_performance_reviews FOR DELETE
  TO authenticated
  USING (reviewed_by = auth.uid());

-- ============================================
-- GAP 3: CRM Access Log (audit trail)
-- ============================================
CREATE TABLE public.crm_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT 'contact',
  entity_ids uuid[] DEFAULT '{}',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view access logs
CREATE POLICY "Company admins can view access logs"
  ON public.crm_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM management_company_members mcm
      WHERE mcm.company_id = crm_access_log.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
    )
  );

-- Anyone can insert (logging their own actions)
CREATE POLICY "Authenticated users can insert access logs"
  ON public.crm_access_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_owner_invoices_company ON public.owner_invoices(company_id);
CREATE INDEX idx_owner_invoices_status ON public.owner_invoices(status);
CREATE INDEX idx_crm_tasks_company ON public.crm_tasks(company_id);
CREATE INDEX idx_crm_tasks_due ON public.crm_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to) WHERE status = 'pending';
CREATE INDEX idx_vendor_reviews_vendor ON public.vendor_performance_reviews(vendor_id);
CREATE INDEX idx_crm_access_log_company ON public.crm_access_log(company_id, created_at DESC);

-- Migration: 20260220115329_a51a4870-4efe-464e-92ee-4dafeaf95785.sql
-- Add min_quantity to property_inventory_items for low-stock alerts
ALTER TABLE public.property_inventory_items 
ADD COLUMN IF NOT EXISTS min_quantity integer DEFAULT 0;

-- Add reorder_note column for reorder instructions
ALTER TABLE public.property_inventory_items 
ADD COLUMN IF NOT EXISTS reorder_note text;

-- Migration: 20260220121341_14cb2537-0303-4291-b9f1-6b2c06ac75fb.sql

-- Storage bucket for owner vault files
INSERT INTO storage.buckets (id, name, public) VALUES ('owner-vault', 'owner-vault', false)
ON CONFLICT (id) DO NOTHING;

-- Owner vault files table
CREATE TABLE public.owner_vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  doc_type TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  tags TEXT[],
  share_token UUID,
  share_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_vault_files ENABLE ROW LEVEL SECURITY;

-- Owner can manage own files
CREATE POLICY "Owners manage own vault files"
ON public.owner_vault_files FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Public read via share token (for sharing)
CREATE POLICY "Public read via share token"
ON public.owner_vault_files FOR SELECT
USING (
  share_token IS NOT NULL 
  AND (share_expires_at IS NULL OR share_expires_at > now())
);

-- Storage policies for owner-vault bucket
CREATE POLICY "Owner upload vault files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner read vault files"
ON storage.objects FOR SELECT
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete vault files"
ON storage.objects FOR DELETE
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner update vault files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index for fast lookups
CREATE INDEX idx_vault_files_owner ON public.owner_vault_files(owner_id);
CREATE INDEX idx_vault_files_property ON public.owner_vault_files(property_id);
CREATE INDEX idx_vault_files_share ON public.owner_vault_files(share_token) WHERE share_token IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_vault_files_updated_at
BEFORE UPDATE ON public.owner_vault_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260220123419_838df780-bdd4-4eb8-ac73-fd8d5e3a5805.sql

-- Create inventory_inspections table for check-in/check-out checklists
CREATE TABLE public.inventory_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('check_in', 'check_out')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_inspections ENABLE ROW LEVEL SECURITY;

-- RLS: owners can manage inspections for their own properties
CREATE POLICY "Owners can view their inspections"
ON public.inventory_inspections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can create inspections"
ON public.inventory_inspections
FOR INSERT
TO authenticated
WITH CHECK (
  inspector_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their inspections"
ON public.inventory_inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
);

-- Migration: 20260220124916_6ad483fd-ebb7-48a7-9fda-93101aebb46a.sql

-- Budget planning table: monthly budgets per property per category
CREATE TABLE public.property_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  budget_month DATE NOT NULL, -- first day of month, e.g. 2025-03-01
  category TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, budget_month, category, transaction_type)
);

-- Enable RLS
ALTER TABLE public.property_budgets ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own budgets
CREATE POLICY "Owners manage their budgets"
  ON public.property_budgets FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Delegates with financials permission can view budgets
CREATE POLICY "Delegates view budgets"
  ON public.property_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_delegates pd
      WHERE pd.property_id = property_budgets.property_id
        AND pd.user_id = auth.uid()
        AND pd.status = 'active'
        AND (pd.permissions->>'financials')::boolean = true
    )
  );

-- Update timestamp trigger
CREATE TRIGGER update_property_budgets_updated_at
  BEFORE UPDATE ON public.property_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260220125721_d5b3c31f-5bf2-4adf-8d19-18b3ee589c59.sql

-- Add shareable token and directions to property_guidebook
ALTER TABLE public.property_guidebook 
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_message TEXT,
ADD COLUMN IF NOT EXISTS welcome_message_ru TEXT,
ADD COLUMN IF NOT EXISTS directions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS property_photos TEXT[] DEFAULT '{}';

-- Create index on share_token for fast lookup
CREATE INDEX IF NOT EXISTS idx_property_guidebook_share_token ON public.property_guidebook(share_token) WHERE share_token IS NOT NULL;

-- Allow public access via share token (no auth required)
CREATE POLICY "Public guidebook access via share token"
ON public.property_guidebook
FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);

-- Migration: 20260220130911_f5674496-521f-46ef-bf2a-a2794bf7c58f.sql

-- Booking message automation rules (owner sets triggers per property)
CREATE TABLE public.booking_message_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'booking_confirmed', 'pre_check_in', 'check_in_day', 
    'post_check_in', 'pre_check_out', 'check_out_day', 
    'post_check_out', 'review_request'
  )),
  delay_hours INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'whatsapp')),
  custom_subject TEXT,
  custom_subject_ru TEXT,
  custom_body TEXT,
  custom_body_ru TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scheduled messages queue
CREATE TABLE public.booking_scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.booking_message_rules(id) ON DELETE SET NULL,
  booking_id UUID NOT NULL,
  property_id UUID NOT NULL,
  guest_user_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  subject TEXT,
  body TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bmr_owner ON public.booking_message_rules(owner_id);
CREATE INDEX idx_bmr_property ON public.booking_message_rules(property_id);
CREATE INDEX idx_bsm_scheduled ON public.booking_scheduled_messages(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_bsm_booking ON public.booking_scheduled_messages(booking_id);

-- RLS
ALTER TABLE public.booking_message_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their rules"
  ON public.booking_message_rules FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners view their scheduled messages"
  ON public.booking_scheduled_messages FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can cancel their messages"
  ON public.booking_scheduled_messages FOR UPDATE
  USING (auth.uid() = owner_id);

-- System can insert scheduled messages (via edge function)
CREATE POLICY "System insert scheduled messages"
  ON public.booking_scheduled_messages FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_bmr_updated_at
  BEFORE UPDATE ON public.booking_message_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260220130933_3ad3ad55-dbaf-43f2-807e-b7e063a19064.sql

-- Fix: Remove overly permissive INSERT policy, edge function uses service_role which bypasses RLS
DROP POLICY "System insert scheduled messages" ON public.booking_scheduled_messages;

-- Only owners can insert (for manual sends)
CREATE POLICY "Owners insert their scheduled messages"
  ON public.booking_scheduled_messages FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Migration: 20260220132704_3192df97-17f0-4ef9-ba63-6c181f1b8c69.sql
-- Fix storage policies: add foldername-based ownership validation

-- ============ booking-documents ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Property owners can upload booking documents" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can delete booking documents" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can view booking documents" ON storage.objects;

-- Recreate with ownership validation (files stored as {user_id}/...)
CREATE POLICY "Owners can upload booking documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can view booking documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete booking documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ property-care ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property photos" ON storage.objects;

-- Recreate with ownership (files stored as {user_id}/...)
CREATE POLICY "Users can upload property care photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update property care photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete property care photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ yacht-images ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated upload yacht images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update yacht images" ON storage.objects;

-- Recreate with ownership
CREATE POLICY "Users can upload own yacht images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'yacht-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own yacht images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'yacht-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ experience-images ============
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload experience images" ON storage.objects;

-- Recreate with ownership
CREATE POLICY "Users can upload own experience images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'experience-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ property-reports ============
-- Fix the overly permissive SELECT
DROP POLICY IF EXISTS "Users can read their own reports" ON storage.objects;

CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Migration: 20260220133045_13ba7e0a-b97a-4efa-b936-bc4b44ac5f5d.sql
-- Allow customer_user_id to be NULL for OTA/external bookings (iCal sync)
ALTER TABLE public.orders ALTER COLUMN customer_user_id DROP NOT NULL;

-- Add comment explaining the nullable field
COMMENT ON COLUMN public.orders.customer_user_id IS 'NULL for external OTA bookings imported via iCal sync';
-- Migration: 20260220154914_c392c243-a32a-4a81-8704-8b70539b1c38.sql

-- =====================================================
-- FIX: Tighten storage policies for project-images and bouquet-images
-- =====================================================

-- 1. project-images: Replace permissive INSERT with admin-only
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;

CREATE POLICY "Admins can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  )
);

-- 2. bouquet-images: Fix the mislabeled "admin" policy that allows any user
DROP POLICY IF EXISTS "Admins can upload bouquet images" ON storage.objects;

CREATE POLICY "Admins can upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bouquet-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  )
);

-- 3. bouquet-images: Fix service upload policy that has no auth check
DROP POLICY IF EXISTS "Service upload bouquet images" ON storage.objects;
-- Service role uploads are handled by edge functions using service_role key,
-- which bypasses RLS entirely — no policy needed.

-- Migration: 20260221001846_5c3a9650-be8c-460d-9a04-cf2e3f1ec5d7.sql

-- Activity log for management terms changes
CREATE TABLE public.management_terms_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terms_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'archived'
  field_name TEXT, -- which field changed
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.management_terms_activity ENABLE ROW LEVEL SECURITY;

-- Users can view activity for terms they manage
CREATE POLICY "Users can view own terms activity"
ON public.management_terms_activity FOR SELECT
USING (user_id = auth.uid());

-- Users can insert activity for their own actions
CREATE POLICY "Users can insert own activity"
ON public.management_terms_activity FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_terms_activity_terms_id ON public.management_terms_activity(terms_id);
CREATE INDEX idx_terms_activity_created ON public.management_terms_activity(created_at DESC);

-- Migration: 20260221002849_209b5bc5-82c8-4775-885a-56026b285653.sql

-- Create property_management_terms table
CREATE TABLE public.property_management_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  manager_user_id UUID NOT NULL,
  commission_rate NUMERIC,
  commission_type TEXT NOT NULL DEFAULT 'percent',
  commission_amount NUMERIC,
  commission_base TEXT NOT NULL DEFAULT 'gross',
  revenue_split_owner NUMERIC,
  revenue_split_manager NUMERIC,
  expense_responsibility JSONB NOT NULL DEFAULT '{}',
  payment_day INTEGER,
  payment_currency TEXT NOT NULL DEFAULT 'THB',
  valid_from DATE,
  valid_until DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_management_terms ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view terms they manage or own"
  ON public.property_management_terms FOR SELECT
  USING (
    manager_user_id = auth.uid()
    OR property_id IN (SELECT id FROM public.owner_properties WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert terms for properties they own or manage"
  ON public.property_management_terms FOR INSERT
  WITH CHECK (
    manager_user_id = auth.uid()
    OR property_id IN (SELECT id FROM public.owner_properties WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update terms they manage or own"
  ON public.property_management_terms FOR UPDATE
  USING (
    manager_user_id = auth.uid()
    OR property_id IN (SELECT id FROM public.owner_properties WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can delete terms they manage or own"
  ON public.property_management_terms FOR DELETE
  USING (
    manager_user_id = auth.uid()
    OR property_id IN (SELECT id FROM public.owner_properties WHERE owner_id = auth.uid())
  );

-- Add FK for management_terms_activity if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'management_terms_activity_terms_id_fkey'
  ) THEN
    ALTER TABLE public.management_terms_activity
      ADD CONSTRAINT management_terms_activity_terms_id_fkey
      FOREIGN KEY (terms_id) REFERENCES public.property_management_terms(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_property_management_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_property_management_terms_updated_at
  BEFORE UPDATE ON public.property_management_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_management_terms_updated_at();

-- Migration: 20260221004451_04565bf1-bbeb-4a83-9358-d9ed65837879.sql

-- 1. Add deal_type and deal_status to agent_deals
ALTER TABLE public.agent_deals 
  ADD COLUMN IF NOT EXISTS deal_type text NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS deal_status text NOT NULL DEFAULT 'active';

-- Add index for common filters
CREATE INDEX IF NOT EXISTS idx_agent_deals_type ON public.agent_deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_agent_deals_status ON public.agent_deals(deal_status);

-- 2. Custom pipeline stages per company
CREATE TABLE public.deal_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  deal_type text NOT NULL DEFAULT 'sale',
  stage_key text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  short_label text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#6366f1',
  probability numeric(3,2) NOT NULL DEFAULT 0.0,
  sort_order int NOT NULL DEFAULT 0,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, deal_type, stage_key)
);

ALTER TABLE public.deal_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Members of company can read stages
CREATE POLICY "Company members can view pipeline stages"
  ON public.deal_pipeline_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = deal_pipeline_stages.company_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- Owners/admins of company can manage stages  
CREATE POLICY "Company admins can manage pipeline stages"
  ON public.deal_pipeline_stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = deal_pipeline_stages.company_id
        AND user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin')
    )
  );

-- 3. Full field-level audit trail
CREATE TABLE public.deal_field_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_field_changes_deal ON public.deal_field_changes(deal_id, created_at DESC);

ALTER TABLE public.deal_field_changes ENABLE ROW LEVEL SECURITY;

-- Company members can view audit trail for their deals
CREATE POLICY "Company members can view deal changes"
  ON public.deal_field_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agent_deals d
      JOIN public.management_company_members m ON m.company_id = d.company_id
      WHERE d.id = deal_field_changes.deal_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
    )
  );

-- Authenticated users can insert changes for their deals
CREATE POLICY "Authenticated users can log field changes"
  ON public.deal_field_changes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on pipeline stages
CREATE TRIGGER update_deal_pipeline_stages_updated_at
  BEFORE UPDATE ON public.deal_pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260221013109_456f7a91-7699-4dc3-bf2f-f6517a5e928d.sql

-- Add tags and priority to agent_deals
ALTER TABLE public.agent_deals 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority smallint DEFAULT 0;

-- Scheduled activities table (ODOO-style planned actions)
CREATE TABLE public.deal_scheduled_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.agent_deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'call',
  summary text NOT NULL,
  note text,
  due_date date NOT NULL,
  due_time time,
  assigned_to uuid NOT NULL,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_scheduled_activities_deal ON public.deal_scheduled_activities(deal_id);
CREATE INDEX idx_deal_scheduled_activities_assigned ON public.deal_scheduled_activities(assigned_to, due_date);
CREATE INDEX idx_deal_scheduled_activities_company ON public.deal_scheduled_activities(company_id);

-- Enable RLS
ALTER TABLE public.deal_scheduled_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company members can view activities"
  ON public.deal_scheduled_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can create activities"
  ON public.deal_scheduled_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can update activities"
  ON public.deal_scheduled_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Company members can delete activities"
  ON public.deal_scheduled_activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = deal_scheduled_activities.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_deal_scheduled_activities_updated_at
  BEFORE UPDATE ON public.deal_scheduled_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260222034338_1ce18c47-76e8-4db8-a057-f9022b317d73.sql

-- Add missing fields for premium transport vertical
ALTER TABLE public.vehicles 
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS with_driver_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_label text;

-- Create index for class-based filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON public.vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_price_day ON public.vehicles(price_per_day);

-- Migration: 20260222051328_1d2a59ad-02f0-428e-8481-bcd4431c1d0e.sql
-- Allow assigned property managers to SELECT properties they manage
CREATE POLICY "manager_select_assigned"
ON public.properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = properties.id
      AND pma.manager_user_id = auth.uid()
      AND pma.is_active = true
  )
);

-- Allow assigned property managers to UPDATE properties they manage
CREATE POLICY "manager_update_assigned"
ON public.properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = properties.id
      AND pma.manager_user_id = auth.uid()
      AND pma.is_active = true
  )
);

-- Migration: 20260222052151_fd71c658-d60b-4051-a90a-9bb91593ebd0.sql
-- Fix infinite recursion: drop the recursive policies and use a security definer function

-- Create security definer function to check if user is assigned manager
CREATE OR REPLACE FUNCTION public.is_assigned_manager(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_manager_assignments
    WHERE manager_user_id = _user_id
      AND property_id = _property_id
      AND is_active = true
  )
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "manager_select_assigned" ON public.properties;
DROP POLICY IF EXISTS "manager_update_assigned" ON public.properties;

-- Recreate using security definer function (no recursion)
CREATE POLICY "manager_select_assigned"
ON public.properties FOR SELECT
USING (public.is_assigned_manager(auth.uid(), id));

CREATE POLICY "manager_update_assigned"
ON public.properties FOR UPDATE
USING (public.is_assigned_manager(auth.uid(), id));

-- Migration: 20260222113752_1f0828fc-6971-46f3-b47e-76dea6b139f2.sql

-- Table to log user acceptance of legal documents
CREATE TABLE public.terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'terms', 'privacy', 'cookies', 'vendor_terms'
  document_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
  ON public.terms_acceptances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances"
  ON public.terms_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_terms_acceptances_user ON public.terms_acceptances(user_id);
CREATE INDEX idx_terms_acceptances_doc ON public.terms_acceptances(document_type, document_version);

-- Migration: 20260223001431_d73c7a33-612e-4ae2-8e60-b9c0d0c3cafc.sql
-- Add UPDATE and DELETE policies for agent_deal_activities
CREATE POLICY "Company members can update their own activities"
ON public.agent_deal_activities
FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_deals d
    WHERE d.id = agent_deal_activities.deal_id
    AND is_company_member(auth.uid(), d.company_id)
  )
);

CREATE POLICY "Company members can delete their own activities"
ON public.agent_deal_activities
FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_deals d
    WHERE d.id = agent_deal_activities.deal_id
    AND is_company_member(auth.uid(), d.company_id)
  )
);
-- Migration: 20260223005356_11186410-4d2b-40f9-9f48-48ef10d77ccc.sql

-- Add personal & professional fields to crm_contacts
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS family_info text,
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS scoring integer DEFAULT 0;

COMMENT ON COLUMN public.crm_contacts.birthday IS 'Client birthday for personal touch';
COMMENT ON COLUMN public.crm_contacts.family_info IS 'Family details: spouse, children, etc.';
COMMENT ON COLUMN public.crm_contacts.interests IS 'Hobbies and interests array';
COMMENT ON COLUMN public.crm_contacts.job_title IS 'Position / job title';
COMMENT ON COLUMN public.crm_contacts.scoring IS 'Client scoring / priority rating 0-100';

-- Migration: 20260223233653_a00711a0-74a3-497d-be83-c08a6055183d.sql

-- ============================================================
-- Phase 1: Cross-Sell offers table
-- ============================================================
CREATE TABLE public.booking_cross_sell_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_id UUID,
  service_name TEXT NOT NULL,
  suggested_price NUMERIC(12,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','accepted','dismissed','converted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cross_sell_booking ON public.booking_cross_sell_offers(booking_id);
CREATE INDEX idx_cross_sell_status ON public.booking_cross_sell_offers(status);

ALTER TABLE public.booking_cross_sell_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view cross-sell offers"
ON public.booking_cross_sell_offers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.properties p ON p.id = pb.property_id
    WHERE pb.id = booking_cross_sell_offers.booking_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Guest can view own cross-sell offers"
ON public.booking_cross_sell_offers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

CREATE POLICY "Guest can update cross-sell status"
ON public.booking_cross_sell_offers FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

CREATE POLICY "Service can insert cross-sell offers"
ON public.booking_cross_sell_offers FOR INSERT TO authenticated
WITH CHECK (true);

CREATE TRIGGER update_cross_sell_updated_at
BEFORE UPDATE ON public.booking_cross_sell_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Phase 2: Pricing recommendations table
-- ============================================================
CREATE TABLE public.pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  current_price NUMERIC(12,2),
  recommended_price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  reasoning TEXT,
  factors JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','applied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rec_property ON public.pricing_recommendations(property_id);
CREATE INDEX idx_pricing_rec_status ON public.pricing_recommendations(status);

ALTER TABLE public.pricing_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view pricing recommendations"
ON public.pricing_recommendations FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);

CREATE POLICY "Owner can update pricing recommendations"
ON public.pricing_recommendations FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);

CREATE POLICY "Service can insert pricing recommendations"
ON public.pricing_recommendations FOR INSERT TO authenticated
WITH CHECK (true);

CREATE TRIGGER update_pricing_rec_updated_at
BEFORE UPDATE ON public.pricing_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Phase 3: Property Passport tables
-- ============================================================
CREATE TABLE public.property_passport_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passport_events_property ON public.property_passport_events(property_id);
CREATE INDEX idx_passport_events_date ON public.property_passport_events(event_date DESC);

ALTER TABLE public.property_passport_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage passport events"
ON public.property_passport_events FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_passport_events.property_id AND p.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_passport_events.property_id AND p.owner_id = auth.uid())
);

CREATE TABLE public.document_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_file_id UUID,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  document_name TEXT NOT NULL,
  expires_at DATE NOT NULL,
  reminder_days_before INTEGER[] DEFAULT '{30, 7, 1}',
  last_notified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_reminders_owner ON public.document_reminders(owner_id);
CREATE INDEX idx_doc_reminders_expires ON public.document_reminders(expires_at) WHERE is_active = true;

ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage document reminders"
ON public.document_reminders FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER update_doc_reminders_updated_at
BEFORE UPDATE ON public.document_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260223233713_40510ec0-73a1-40e9-af09-62067bf0b261.sql

-- Fix permissive INSERT policies: restrict to owner of the property
DROP POLICY "Service can insert cross-sell offers" ON public.booking_cross_sell_offers;
CREATE POLICY "Owner can insert cross-sell offers"
ON public.booking_cross_sell_offers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.properties p ON p.id = pb.property_id
    WHERE pb.id = booking_cross_sell_offers.booking_id AND p.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    WHERE pb.id = booking_cross_sell_offers.booking_id AND pb.guest_id = auth.uid()
  )
);

DROP POLICY "Service can insert pricing recommendations" ON public.pricing_recommendations;
CREATE POLICY "Owner can insert pricing recommendations"
ON public.pricing_recommendations FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = pricing_recommendations.property_id AND p.owner_id = auth.uid())
);

-- Migration: 20260224040637_90294fab-234e-4da7-a715-cd27d9cd3d9f.sql
-- Add complex_id FK to properties table
ALTER TABLE public.properties
ADD COLUMN complex_id UUID REFERENCES public.property_complexes(id) ON DELETE SET NULL;

-- Index for filtering by complex
CREATE INDEX idx_properties_complex_id ON public.properties(complex_id) WHERE complex_id IS NOT NULL;
-- Migration: 20260224060121_beb1e454-84d6-4f68-a5e8-f9e0ebe91a97.sql
ALTER TABLE public.property_management_companies
  ADD COLUMN IF NOT EXISTS director_name text;
-- Migration: 20260224062307_dfc47613-4fa4-4da0-8001-5c5a7625d952.sql

-- Step 1: Add missing columns from property_management_companies to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS default_commission_rate numeric DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS min_contract_months integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS has_24_7_support boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_emergency_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_districts text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS service_types text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS director_name text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS properties_managed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Step 2: Migrate data from property_management_companies into management_companies
-- Using name as name_en, keeping existing data intact
INSERT INTO public.management_companies (
  id, slug, name_en, name_ru, description_en, description_ru,
  logo, cover_image, phone, email, website, address,
  languages, services, founded_year, properties_count,
  rating, review_count, is_verified, is_active, is_featured,
  license_number, tax_id, default_commission_rate, min_contract_months,
  has_24_7_support, has_emergency_service, service_districts, service_types,
  director_name, verified_at, verified_by, properties_managed, created_by,
  created_at, updated_at
)
SELECT 
  pmc.id,
  lower(regexp_replace(pmc.name, '[^a-zA-Z0-9]+', '-', 'g')),
  pmc.name,
  COALESCE(pmc.name_ru, pmc.name),
  pmc.description,
  pmc.description_ru,
  pmc.logo_url,
  pmc.cover_image,
  pmc.phone,
  pmc.email,
  pmc.website,
  pmc.address,
  pmc.languages,
  pmc.service_types,
  pmc.established_year,
  pmc.properties_managed,
  pmc.rating,
  pmc.review_count,
  pmc.is_verified,
  pmc.is_active,
  false,
  pmc.license_number,
  pmc.tax_id,
  pmc.default_commission_rate,
  pmc.min_contract_months,
  pmc.has_24_7_support,
  pmc.has_emergency_service,
  pmc.service_districts,
  pmc.service_types,
  pmc.director_name,
  pmc.verified_at,
  pmc.verified_by,
  pmc.properties_managed,
  pmc.created_by,
  pmc.created_at,
  pmc.updated_at
FROM public.property_management_companies pmc
WHERE NOT EXISTS (
  SELECT 1 FROM public.management_companies mc WHERE mc.id = pmc.id
);

-- Step 3: Drop the old table
DROP TABLE IF EXISTS public.property_management_companies CASCADE;

-- Migration: 20260225001506_3efb1bbe-776e-4919-9f53-595f73b17534.sql

-- Add AI auto-reply flag to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_autoreply_enabled boolean NOT NULL DEFAULT false;

-- Add AI auto-reply custom instructions (optional owner customization)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_autoreply_instructions text;

COMMENT ON COLUMN public.properties.ai_autoreply_enabled IS 'Enable AI-generated auto-replies to guest messages';
COMMENT ON COLUMN public.properties.ai_autoreply_instructions IS 'Custom instructions for AI auto-reply tone/content';

-- Migration: 20260225003935_ed23eb67-167a-469c-b3d1-46d0cf429134.sql

-- Add owner_readonly role support and auto-activity-log triggers

-- 1. Trigger function to auto-log activity from property_bookings
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'booking_created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'guest_name', COALESCE(NEW.guest_name, ''),
        'check_in', NEW.check_in_date,
        'check_out', NEW.check_out_date,
        'total_price', NEW.total_price,
        'currency', COALESCE(NEW.currency, 'THB'),
        'status', COALESCE(NEW.status, 'confirmed')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'booking_status_changed',
        'booking',
        NEW.id,
        jsonb_build_object(
          'guest_name', COALESCE(NEW.guest_name, ''),
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_price', NEW.total_price
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_booking_activity
  AFTER INSERT OR UPDATE ON public.property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_activity();

-- 2. Trigger function to auto-log activity from property_financials
CREATE OR REPLACE FUNCTION public.log_financial_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      CASE WHEN NEW.type = 'income' THEN 'income_recorded' ELSE 'expense_recorded' END,
      'financial',
      NEW.id,
      jsonb_build_object(
        'type', NEW.type,
        'category', COALESCE(NEW.category, ''),
        'amount', NEW.amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'description', COALESCE(NEW.description, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_financial_activity
  AFTER INSERT ON public.property_financials
  FOR EACH ROW
  EXECUTE FUNCTION public.log_financial_activity();

-- 3. Trigger function to auto-log activity from property_operational_tasks
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'task_created',
      'task',
      NEW.id,
      jsonb_build_object(
        'title', COALESCE(NEW.title, ''),
        'task_type', COALESCE(NEW.task_type, ''),
        'priority', COALESCE(NEW.priority, 'medium'),
        'status', COALESCE(NEW.status, 'pending')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'task_status_changed',
        'task',
        NEW.id,
        jsonb_build_object(
          'title', COALESCE(NEW.title, ''),
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_activity
  AFTER INSERT OR UPDATE ON public.property_operational_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();

-- 4. Trigger for property_service_requests
CREATE OR REPLACE FUNCTION public.log_service_request_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      auth.uid(),
      'service_request_created',
      'service_request',
      NEW.id,
      jsonb_build_object(
        'request_type', COALESCE(NEW.request_type, ''),
        'description', COALESCE(NEW.description, ''),
        'status', COALESCE(NEW.status, 'pending')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        auth.uid(),
        'service_request_updated',
        'service_request',
        NEW.id,
        jsonb_build_object(
          'request_type', COALESCE(NEW.request_type, ''),
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_service_request_activity
  AFTER INSERT OR UPDATE ON public.property_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_service_request_activity();

-- 5. Enable realtime on activity log for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_activity_log;

-- Migration: 20260225005123_1dd54c34-1d32-4b74-85ee-7c0992a361e4.sql

-- ============================================================
-- Preventive Maintenance Schedules
-- ============================================================

CREATE TABLE public.property_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  category text NOT NULL, -- ac, plumbing, electrical, pool, pest, deep_clean, roof, garden, security, appliances
  title text NOT NULL,
  title_ru text,
  description text,
  frequency text NOT NULL DEFAULT 'quarterly', -- weekly, biweekly, monthly, quarterly, biannual, annual
  last_completed_at timestamptz,
  next_due_date date NOT NULL,
  assigned_provider_id uuid,
  estimated_cost numeric DEFAULT 0,
  currency text DEFAULT 'THB',
  is_active boolean DEFAULT true,
  priority text DEFAULT 'normal', -- low, normal, high
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_maint_sched_property ON public.property_maintenance_schedules(property_id);
CREATE INDEX idx_maint_sched_due ON public.property_maintenance_schedules(next_due_date) WHERE is_active = true;
CREATE INDEX idx_maint_sched_category ON public.property_maintenance_schedules(category);

-- RLS
ALTER TABLE public.property_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own schedules
CREATE POLICY "Owners manage own maintenance schedules"
  ON public.property_maintenance_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.owner_properties op
      WHERE op.id = property_id AND op.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.owner_properties op
      WHERE op.id = property_id AND op.owner_id = auth.uid()
    )
  );

-- Delegates with view permission can read
CREATE POLICY "Delegates can view maintenance schedules"
  ON public.property_maintenance_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_delegates pd
      WHERE pd.property_id = property_maintenance_schedules.property_id
        AND pd.user_id = auth.uid()
        AND pd.status = 'active'
        AND (pd.permissions->>'view')::boolean = true
    )
  );

-- Trigger: recalculate next_due_date when last_completed_at changes
CREATE OR REPLACE FUNCTION public.recalc_maintenance_next_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_completed_at IS DISTINCT FROM OLD.last_completed_at AND NEW.last_completed_at IS NOT NULL THEN
    NEW.next_due_date := CASE NEW.frequency
      WHEN 'weekly'    THEN (NEW.last_completed_at + interval '7 days')::date
      WHEN 'biweekly'  THEN (NEW.last_completed_at + interval '14 days')::date
      WHEN 'monthly'   THEN (NEW.last_completed_at + interval '1 month')::date
      WHEN 'quarterly' THEN (NEW.last_completed_at + interval '3 months')::date
      WHEN 'biannual'  THEN (NEW.last_completed_at + interval '6 months')::date
      WHEN 'annual'    THEN (NEW.last_completed_at + interval '1 year')::date
      ELSE NEW.next_due_date
    END;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_maintenance_due
  BEFORE UPDATE ON public.property_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.recalc_maintenance_next_due();

-- Updated_at trigger
CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.property_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_maintenance_schedules;

-- Migration: 20260225010858_e4cc4ac5-9ccc-49c7-903b-0041e35e4f03.sql

-- =============================================
-- 1. owner_service_vendors — personal vendor directory
-- =============================================
CREATE TABLE public.owner_service_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  name_ru text,
  category text DEFAULT 'other',
  contact_person text,
  phone text,
  email text,
  whatsapp text,
  line_id text,
  address text,
  photo_url text,
  notes text,
  source text DEFAULT 'own',
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  avg_rating numeric DEFAULT 0,
  total_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.owner_service_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own vendors"
  ON public.owner_service_vendors FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 2. vendor_documents — files attached to vendors
-- =============================================
CREATE TABLE public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.owner_service_vendors(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage vendor docs"
  ON public.vendor_documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 3. vendor_property_assignments — link vendors to properties
-- =============================================
CREATE TABLE public.vendor_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.owner_service_vendors(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  service_type text,
  rate numeric,
  rate_type text DEFAULT 'per_visit',
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage vendor assignments"
  ON public.vendor_property_assignments FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 4. staff_members — add photo_url
-- =============================================
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS photo_url text;

-- =============================================
-- 5. staff_documents — files attached to staff
-- =============================================
CREATE TABLE public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage staff docs"
  ON public.staff_documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_owner_vendors_owner ON public.owner_service_vendors(owner_id);
CREATE INDEX idx_owner_vendors_category ON public.owner_service_vendors(category);
CREATE INDEX idx_vendor_docs_vendor ON public.vendor_documents(vendor_id);
CREATE INDEX idx_vendor_assignments_vendor ON public.vendor_property_assignments(vendor_id);
CREATE INDEX idx_vendor_assignments_property ON public.vendor_property_assignments(property_id);
CREATE INDEX idx_staff_docs_staff ON public.staff_documents(staff_id);

-- Migration: 20260225011744_a689de1d-8694-4fbc-a7e7-80a00924f328.sql

-- Custom tags for CRM contacts (Odoo-style, per company)
CREATE TABLE public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_contact_tags_company_name ON public.contact_tags(company_id, lower(name));

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view tags"
  ON public.contact_tags FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can create tags"
  ON public.contact_tags FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can update tags"
  ON public.contact_tags FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Company members can delete tags"
  ON public.contact_tags FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Migration: 20260225012532_1ac28965-b73e-4688-ab7f-d97419e1e94f.sql

-- Unified CRM custom options per company
-- Categories: deal_stage, contact_type, lead_source, deal_type, task_type
CREATE TABLE public.crm_custom_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  category text NOT NULL, -- deal_stage | contact_type | lead_source | deal_type | task_type
  value text NOT NULL,     -- slug/key: 'new', 'contacted', 'buyer', etc.
  label_en text NOT NULL,
  label_ru text NOT NULL,
  short_en text,           -- short label for kanban headers
  short_ru text,
  color text,              -- hex color
  icon text,               -- lucide icon name or emoji
  probability numeric,     -- for deal_stage: 0.0 - 1.0
  is_system boolean NOT NULL DEFAULT false, -- system defaults can't be deleted
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique value per category per company
CREATE UNIQUE INDEX idx_crm_options_uniq ON public.crm_custom_options(company_id, category, lower(value));

-- Fast lookups by company + category
CREATE INDEX idx_crm_options_lookup ON public.crm_custom_options(company_id, category, sort_order);

ALTER TABLE public.crm_custom_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view CRM options"
  ON public.crm_custom_options FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can insert CRM options"
  ON public.crm_custom_options FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can update CRM options"
  ON public.crm_custom_options FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Company members can delete CRM options"
  ON public.crm_custom_options FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM public.management_company_members WHERE user_id = auth.uid() AND is_active = true
  ) AND is_system = false);

-- Migration: 20260225013744_18f6c3a0-c880-4cd3-b8d3-2a97388eacb8.sql

-- 1. Property Rate Seasons (Seasonal pricing / dynamic rates)
CREATE TABLE IF NOT EXISTS public.property_rate_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nightly_rate NUMERIC NOT NULL DEFAULT 0,
  weekly_rate NUMERIC,
  monthly_rate NUMERIC,
  min_stay_nights INT DEFAULT 1,
  currency TEXT DEFAULT 'THB',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_rate_seasons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_rate_seasons' AND policyname = 'Owners manage own rate seasons') THEN
    CREATE POLICY "Owners manage own rate seasons" ON public.property_rate_seasons FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 2. Property Reviews (OTA review aggregation)
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'manual',
  guest_name TEXT,
  rating NUMERIC,
  review_text TEXT,
  review_date DATE,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID,
  sentiment TEXT,
  language TEXT DEFAULT 'en',
  external_id TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'property_reviews' AND policyname = 'Owners manage own reviews') THEN
    CREATE POLICY "Owners manage own reviews" ON public.property_reviews FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 3. Add missing columns to existing property_documents if needed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'doc_type') THEN
    ALTER TABLE public.property_documents ADD COLUMN doc_type TEXT DEFAULT 'other';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'expiry_date') THEN
    ALTER TABLE public.property_documents ADD COLUMN expiry_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'reminder_days') THEN
    ALTER TABLE public.property_documents ADD COLUMN reminder_days INT DEFAULT 30;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'coverage_amount') THEN
    ALTER TABLE public.property_documents ADD COLUMN coverage_amount NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'provider_name') THEN
    ALTER TABLE public.property_documents ADD COLUMN provider_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'provider_contact') THEN
    ALTER TABLE public.property_documents ADD COLUMN provider_contact TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'policy_number') THEN
    ALTER TABLE public.property_documents ADD COLUMN policy_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'issue_date') THEN
    ALTER TABLE public.property_documents ADD COLUMN issue_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'status') THEN
    ALTER TABLE public.property_documents ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_documents' AND column_name = 'tags') THEN
    ALTER TABLE public.property_documents ADD COLUMN tags TEXT[];
  END IF;
END $$;

-- 4. Owner Reports
CREATE TABLE IF NOT EXISTS public.owner_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.management_companies(id),
  report_type TEXT NOT NULL DEFAULT 'monthly',
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  status TEXT DEFAULT 'draft',
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.owner_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'owner_reports' AND policyname = 'Owners manage own reports') THEN
    CREATE POLICY "Owners manage own reports" ON public.owner_reports FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_rate_seasons_property ON public.property_rate_seasons(property_id);
CREATE INDEX IF NOT EXISTS idx_rate_seasons_dates ON public.property_rate_seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON public.property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON public.property_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.property_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_reports_owner ON public.owner_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON public.owner_reports(period_start, period_end);

-- Migration: 20260225030447_2f1bc8b9-51b2-4974-8e0b-99c2f2c36e54.sql

-- Add date_of_birth to staff_members for birthday tracking
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create personal_reminders table for visa, insurance, rent, etc.
CREATE TABLE public.personal_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reminder_type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  remind_days_before integer NOT NULL DEFAULT 14,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_interval text, -- 'monthly', 'quarterly', 'yearly'
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.personal_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON public.personal_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.personal_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.personal_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_reminders_updated_at
  BEFORE UPDATE ON public.personal_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_personal_reminders_user_due ON public.personal_reminders (user_id, due_date) WHERE status = 'active';

-- Migration: 20260225031243_d3532d4a-66cf-485b-8d90-9627a406a620.sql

CREATE TABLE public.platform_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  summary_en TEXT,
  summary_ru TEXT,
  cover_image TEXT,
  source_url TEXT,
  source_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.platform_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_news" ON public.platform_news FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_news" ON public.platform_news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);

CREATE TABLE public.platform_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  location TEXT,
  event_url TEXT,
  category TEXT NOT NULL DEFAULT 'social',
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_events" ON public.platform_events FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_events" ON public.platform_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);

CREATE TABLE public.platform_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  action_url TEXT,
  action_label_en TEXT,
  action_label_ru TEXT,
  target_roles TEXT[] DEFAULT '{owner}',
  category TEXT NOT NULL DEFAULT 'tip',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_recs" ON public.platform_recommendations FOR SELECT USING (
  is_active = true AND (valid_until IS NULL OR valid_until > now())
);
CREATE POLICY "admins_manage_recs" ON public.platform_recommendations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);

-- Migration: 20260225144021_bfb9f5d1-f20a-4f47-a6d4-70971cc08d8f.sql

-- Task 1.1: Normalize district trigger
CREATE OR REPLACE FUNCTION normalize_district()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.district IS NOT NULL THEN
    NEW.district = INITCAP(LOWER(TRIM(NEW.district)));
    -- Normalize hyphenated names: "Bang-Tao" -> "Bang Tao", "Nai-Harn" -> "Nai Harn" etc.
    NEW.district = REPLACE(NEW.district, '-', ' ');
    NEW.district = INITCAP(NEW.district);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_district_properties
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION normalize_district();

CREATE TRIGGER trg_normalize_district_owner_properties
BEFORE INSERT OR UPDATE ON owner_properties
FOR EACH ROW EXECUTE FUNCTION normalize_district();

-- Task 1.2: Constraint to prevent fee > total
-- Use a validation trigger instead of CHECK (more flexible)
CREATE OR REPLACE FUNCTION validate_order_fee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 
     AND NEW.platform_fee_amount IS NOT NULL 
     AND NEW.platform_fee_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'platform_fee_amount (%) cannot exceed total_amount (%)', 
      NEW.platform_fee_amount, NEW.total_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_order_fee
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION validate_order_fee();

-- Migration: 20260225144034_a1c23795-a16d-4bf9-9a3e-6c4b7489d764.sql

-- Fix search_path for security
ALTER FUNCTION normalize_district() SET search_path = public;
ALTER FUNCTION validate_order_fee() SET search_path = public;

-- Migration: 20260225151030_0ed97e09-0b73-49dc-8af8-deb6a244bce3.sql

-- ============================================
-- PART 2: Booking Pipeline & MC Activation
-- ============================================

-- 2.1a: Add order_id column to property_bookings for linking
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_property_bookings_order_id 
ON public.property_bookings(order_id) WHERE order_id IS NOT NULL;

-- 2.1b: Trigger to auto-create property_booking when a property order is confirmed
CREATE OR REPLACE FUNCTION public.create_property_booking_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_owner_id uuid;
  v_guest_name text;
  v_guest_phone text;
  v_guest_email text;
  v_check_in date;
  v_check_out date;
  v_source text;
  v_source_calendar_id uuid;
BEGIN
  -- Only for property vertical orders that become confirmed
  IF NEW.vertical != 'property' THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;
  
  -- Skip if already confirmed before (update case)
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get property_id from order_items metadata
  SELECT (oi.metadata->>'property_id')::uuid
  INTO v_property_id
  FROM order_items oi 
  WHERE oi.order_id = NEW.id AND oi.item_type = 'property'
  LIMIT 1;

  IF v_property_id IS NULL THEN
    RETURN NEW; -- no property linked, skip
  END IF;

  -- Get owner_id from owner_properties
  SELECT op.owner_id INTO v_owner_id
  FROM owner_properties op WHERE op.id = v_property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW; -- property not found in owner_properties, skip
  END IF;

  -- Get guest info from order_participants
  SELECT p.name, p.phone, p.email
  INTO v_guest_name, v_guest_phone, v_guest_email
  FROM order_participants p
  WHERE p.order_id = NEW.id AND p.role = 'guest'
  LIMIT 1;

  -- Fallback to metadata
  IF v_guest_name IS NULL THEN
    v_guest_name := NEW.metadata->>'guest_name';
  END IF;

  -- Dates from order
  v_check_in := (NEW.start_at AT TIME ZONE 'Asia/Bangkok')::date;
  v_check_out := (NEW.end_at AT TIME ZONE 'Asia/Bangkok')::date;

  IF v_check_in IS NULL OR v_check_out IS NULL THEN
    RETURN NEW;
  END IF;

  -- Source info
  v_source := COALESCE(NEW.metadata->>'source', 'manual');
  v_source_calendar_id := (NEW.metadata->>'source_calendar_id')::uuid;

  -- Insert booking, skip if already exists for this order
  INSERT INTO property_bookings (
    property_id, owner_id, guest_name, guest_phone, guest_email,
    check_in, check_out, total_amount, currency, source,
    source_calendar_id, status, order_id, guest_id
  ) VALUES (
    v_property_id, v_owner_id, v_guest_name, v_guest_phone, v_guest_email,
    v_check_in, v_check_out, NEW.total_amount, COALESCE(NEW.currency, 'THB'), v_source,
    v_source_calendar_id, 'confirmed', NEW.id, NEW.customer_user_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_property_booking ON public.orders;
CREATE TRIGGER trg_create_property_booking
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_property_booking_from_order();

-- 2.2: Comment on unused products table
COMMENT ON TABLE public.products IS 'LEGACY: Unused table (0 records, 0 code references). marketplace_products is the active table. Safe to drop after verification.';

-- Migration: 20260225151104_13948247-447c-4345-ac02-f314577a4f57.sql

-- Remove the blocking trigger so we can backfill and use the auto-create trigger
DROP TRIGGER IF EXISTS block_property_bookings_insert ON public.property_bookings;
DROP FUNCTION IF EXISTS public.block_deprecated_property_bookings();

-- Migration: 20260225151132_0ada6f04-7b03-4782-8013-118bacc3cd0e.sql

-- Fix: the generate_booking_operational_tasks trigger references a non-existent table
-- Disable it until property_tasks table is created in a future migration
DROP TRIGGER IF EXISTS auto_generate_booking_tasks ON public.property_bookings;

-- Migration: 20260225151210_05c5c90b-7b17-4049-8056-44d2732b025d.sql

-- Fix create_financial_from_booking: uses wrong column names (check_in_date → check_in, check_out_date → check_out)
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties WHERE id = NEW.property_id;
    
    IF v_property_owner_id IS NULL THEN RETURN NEW; END IF;
    
    v_nights := GREATEST(1, NEW.check_out::date - NEW.check_in::date);
    v_total_rent := COALESCE(NEW.total_amount, 0);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status, payment_method
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'rent', v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || COALESCE(NEW.guest_name, 'Guest') || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || COALESCE(NEW.guest_name, 'Гость') || ' (' || v_nights || ' ночей)',
        'booking', NEW.id::text, NEW.check_in, 'paid',
        COALESCE(NEW.deposit_payment_method, 'platform')
      );
    END IF;
    
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'cleaning_fee', v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Плата за уборку: ' || COALESCE(NEW.guest_name, 'Гость'),
        'booking', NEW.id::text, NEW.check_in, 'paid'
      );
    END IF;
    
    INSERT INTO property_activity_log (property_id, actor_id, actor_role, action, details)
    VALUES (
      v_property_id, v_property_owner_id, 'system', 'booking_confirmed',
      jsonb_build_object(
        'booking_id', NEW.id, 'guest_name', NEW.guest_name,
        'check_in', NEW.check_in, 'check_out', NEW.check_out,
        'total_amount', v_total_rent, 'cleaning_fee', v_cleaning_fee
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Migration: 20260225151243_38a83508-b901-4d34-97e5-4b5866663e36.sql

-- Fix: reference_id is uuid, not text. Cast properly.
CREATE OR REPLACE FUNCTION public.create_financial_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_owner_id UUID;
  v_property_id UUID;
  v_nights INTEGER;
  v_total_rent NUMERIC;
  v_cleaning_fee NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    SELECT owner_id, id INTO v_property_owner_id, v_property_id
    FROM owner_properties WHERE id = NEW.property_id;
    IF v_property_owner_id IS NULL THEN RETURN NEW; END IF;
    
    v_nights := GREATEST(1, NEW.check_out::date - NEW.check_in::date);
    v_total_rent := COALESCE(NEW.total_amount, 0);
    v_cleaning_fee := COALESCE(NEW.cleaning_fee, 0);
    
    IF v_total_rent > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status, payment_method
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'rent', v_total_rent,
        COALESCE(NEW.currency, 'THB'),
        'Rental income: ' || COALESCE(NEW.guest_name, 'Guest') || ' (' || v_nights || ' nights)',
        'Доход от аренды: ' || COALESCE(NEW.guest_name, 'Гость') || ' (' || v_nights || ' ночей)',
        'booking', NEW.id, NEW.check_in, 'paid',
        COALESCE(NEW.deposit_payment_method, 'platform')
      );
    END IF;
    
    IF v_cleaning_fee > 0 THEN
      INSERT INTO property_financials (
        property_id, owner_id, transaction_type, category, amount, currency,
        description, description_ru, reference_type, reference_id, transaction_date, status
      ) VALUES (
        v_property_id, v_property_owner_id, 'income', 'cleaning_fee', v_cleaning_fee,
        COALESCE(NEW.currency, 'THB'),
        'Cleaning fee: ' || COALESCE(NEW.guest_name, 'Guest'),
        'Плата за уборку: ' || COALESCE(NEW.guest_name, 'Гость'),
        'booking', NEW.id, NEW.check_in, 'paid'
      );
    END IF;
    
    INSERT INTO property_activity_log (property_id, actor_id, actor_role, action, details)
    VALUES (
      v_property_id, v_property_owner_id, 'system', 'booking_confirmed',
      jsonb_build_object('booking_id', NEW.id, 'guest_name', NEW.guest_name,
        'check_in', NEW.check_in, 'check_out', NEW.check_out,
        'total_amount', v_total_rent, 'cleaning_fee', v_cleaning_fee)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Migration: 20260225151321_3564d8cf-cc19-4c64-aa7a-d4042b0bd18f.sql

-- Fix log_financial_activity: column is transaction_type, not type
CREATE OR REPLACE FUNCTION public.log_financial_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      COALESCE(auth.uid(), NEW.owner_id),
      CASE WHEN NEW.transaction_type = 'income' THEN 'income_recorded' ELSE 'expense_recorded' END,
      'financial',
      NEW.id,
      jsonb_build_object(
        'type', NEW.transaction_type,
        'category', COALESCE(NEW.category, ''),
        'amount', NEW.amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'description', COALESCE(NEW.description, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Migration: 20260225151344_29a655e0-c1ba-412d-a1fe-dec9d98830b9.sql

-- Fix log_booking_activity: wrong column names (check_in_date→check_in, check_out_date→check_out, total_price→total_amount)
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      COALESCE(auth.uid(), NEW.owner_id),
      'booking_created',
      'booking',
      NEW.id,
      jsonb_build_object(
        'guest_name', COALESCE(NEW.guest_name, ''),
        'check_in', NEW.check_in,
        'check_out', NEW.check_out,
        'total_amount', NEW.total_amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'status', COALESCE(NEW.status, 'confirmed')
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.property_id,
        COALESCE(auth.uid(), NEW.owner_id),
        'booking_status_changed',
        'booking',
        NEW.id,
        jsonb_build_object(
          'guest_name', COALESCE(NEW.guest_name, ''),
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_amount', NEW.total_amount
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Migration: 20260225151629_b6a6762b-aee0-4364-92e3-03ee9a17f9fe.sql

-- Part 3: Payment pipeline fixes

-- 3.1: Add paid_at column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 3.2: Create record_ledger_entries RPC for reuse
CREATE OR REPLACE FUNCTION public.record_ledger_entries(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_platform_account_id uuid;
  v_customer_account_id uuid;
  v_vendor_account_id uuid;
  v_platform_fee numeric;
  v_vendor_amount numeric;
BEGIN
  -- Get order details
  SELECT id, total_amount, platform_fee_amount, customer_user_id, provider_org_id, currency
  INTO v_order
  FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Skip if ledger entries already exist
  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_platform_fee := COALESCE(v_order.platform_fee_amount, ROUND(v_order.total_amount * 0.10, 2));
  v_vendor_amount := v_order.total_amount - v_platform_fee;

  -- Get or create platform revenue account
  SELECT id INTO v_platform_account_id FROM ledger_accounts WHERE account_type = 'platform_revenue' LIMIT 1;
  IF v_platform_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency) VALUES ('platform_revenue', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_platform_account_id;
  END IF;

  -- Get or create customer account
  SELECT id INTO v_customer_account_id FROM ledger_accounts 
  WHERE owner_user_id = v_order.customer_user_id AND account_type = 'customer' LIMIT 1;
  IF v_customer_account_id IS NULL AND v_order.customer_user_id IS NOT NULL THEN
    INSERT INTO ledger_accounts (owner_user_id, account_type, currency) 
    VALUES (v_order.customer_user_id, 'customer', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_customer_account_id;
  END IF;

  -- Get or create vendor account
  IF v_order.provider_org_id IS NOT NULL THEN
    SELECT id INTO v_vendor_account_id FROM ledger_accounts
    WHERE owner_org_id = v_order.provider_org_id AND account_type = 'vendor_balance' LIMIT 1;
    IF v_vendor_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_org_id, account_type, currency)
      VALUES (v_order.provider_org_id, 'vendor_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_vendor_account_id;
    END IF;
  END IF;

  -- Use platform account as fallback for vendor if no provider
  IF v_vendor_account_id IS NULL THEN
    v_vendor_account_id := v_platform_account_id;
  END IF;

  -- Entry 1: Platform fee (debit customer → credit platform)
  IF v_customer_account_id IS NOT NULL AND v_platform_fee > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_platform_account_id, v_platform_fee, 
            COALESCE(v_order.currency, 'THB'), p_order_id, 'platform_fee',
            'Platform fee for order ' || p_order_id::text);
  END IF;

  -- Entry 2: Vendor payment (debit customer → credit vendor)
  IF v_customer_account_id IS NOT NULL AND v_vendor_amount > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_vendor_account_id, v_vendor_amount,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'vendor_payment',
            'Vendor payment for order ' || p_order_id::text);
  END IF;
END;
$$;

-- Migration: 20260226031241_311cff06-c140-4d96-96de-95d023fa54b4.sql

-- 1. owner_notifications table
CREATE TABLE public.owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_owner_notifications_owner ON public.owner_notifications(owner_id, is_read, created_at DESC);
CREATE INDEX idx_owner_notifications_property ON public.owner_notifications(property_id);

ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own notifications"
  ON public.owner_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own notifications"
  ON public.owner_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_notifications;

-- 2. Add approval_threshold to property_management_terms
ALTER TABLE public.property_management_terms
  ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC DEFAULT NULL;

-- 3. Add approval_status to property_financials
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'auto_approved';

-- 4. Trigger: auto-create owner_notification on critical activity_log events
CREATE OR REPLACE FUNCTION public.notify_owner_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_critical_actions TEXT[] := ARRAY[
    'booking_created', 'expense_recorded', 'income_recorded',
    'service_request_created', 'inspection_completed'
  ];
BEGIN
  -- Only notify on critical actions
  IF NOT (NEW.action = ANY(v_critical_actions)) THEN
    RETURN NEW;
  END IF;

  -- Get property owner
  SELECT owner_id INTO v_owner_id
  FROM owner_properties
  WHERE id = NEW.property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't notify owner about their own actions
  IF v_owner_id = NEW.actor_id THEN
    RETURN NEW;
  END IF;

  -- Build title
  v_title := CASE NEW.action
    WHEN 'booking_created' THEN 'Новое бронирование'
    WHEN 'expense_recorded' THEN 'Новый расход'
    WHEN 'income_recorded' THEN 'Доход записан'
    WHEN 'service_request_created' THEN 'Запрос на обслуживание'
    WHEN 'inspection_completed' THEN 'Осмотр завершён'
    ELSE NEW.action
  END;

  INSERT INTO owner_notifications (owner_id, property_id, type, title, body, metadata)
  VALUES (
    v_owner_id,
    NEW.property_id,
    NEW.action,
    v_title,
    COALESCE(NEW.details->>'description', NEW.details->>'guest_name', ''),
    NEW.details
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_owner_on_activity
  AFTER INSERT ON public.property_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_activity();

-- 5. Trigger: auto-set approval_status for large expenses
CREATE OR REPLACE FUNCTION public.check_expense_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold NUMERIC;
BEGIN
  IF NEW.transaction_type != 'expense' THEN
    NEW.approval_status := 'auto_approved';
    RETURN NEW;
  END IF;

  SELECT approval_threshold INTO v_threshold
  FROM property_management_terms
  WHERE property_id = NEW.property_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_threshold IS NOT NULL AND NEW.amount >= v_threshold THEN
    NEW.approval_status := 'pending';
  ELSE
    NEW.approval_status := 'auto_approved';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_expense_approval
  BEFORE INSERT ON public.property_financials
  FOR EACH ROW
  EXECUTE FUNCTION public.check_expense_approval();

-- Migration: 20260226031804_244f29f0-b9fd-4138-b9a2-257e80303421.sql

-- Add notification defaults to management terms (MC configures per property)
ALTER TABLE public.property_management_terms
  ADD COLUMN IF NOT EXISTS owner_notification_defaults JSONB DEFAULT '{
    "booking_created": true,
    "expense_recorded": true,
    "income_recorded": true,
    "service_request_created": true,
    "inspection_completed": true,
    "monthly_report": true
  }'::jsonb;

-- Update trigger to respect notification defaults
CREATE OR REPLACE FUNCTION public.notify_owner_on_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_title TEXT;
  v_defaults JSONB;
  v_critical_actions TEXT[] := ARRAY[
    'booking_created', 'expense_recorded', 'income_recorded',
    'service_request_created', 'inspection_completed'
  ];
BEGIN
  -- Only process critical actions
  IF NOT (NEW.action = ANY(v_critical_actions)) THEN
    RETURN NEW;
  END IF;

  -- Get property owner
  SELECT owner_id INTO v_owner_id
  FROM owner_properties
  WHERE id = NEW.property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't notify owner about their own actions
  IF v_owner_id = NEW.actor_id THEN
    RETURN NEW;
  END IF;

  -- Check MC notification defaults
  SELECT owner_notification_defaults INTO v_defaults
  FROM property_management_terms
  WHERE property_id = NEW.property_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If defaults exist and this action type is disabled, skip
  IF v_defaults IS NOT NULL AND (v_defaults->>NEW.action)::boolean IS FALSE THEN
    RETURN NEW;
  END IF;

  -- Build title
  v_title := CASE NEW.action
    WHEN 'booking_created' THEN 'Новое бронирование'
    WHEN 'expense_recorded' THEN 'Новый расход'
    WHEN 'income_recorded' THEN 'Доход записан'
    WHEN 'service_request_created' THEN 'Запрос на обслуживание'
    WHEN 'inspection_completed' THEN 'Осмотр завершён'
    ELSE NEW.action
  END;

  INSERT INTO owner_notifications (owner_id, property_id, type, title, body, metadata)
  VALUES (
    v_owner_id,
    NEW.property_id,
    NEW.action,
    v_title,
    COALESCE(NEW.details->>'description', NEW.details->>'guest_name', ''),
    NEW.details
  );

  RETURN NEW;
END;
$$;

-- Migration: 20260226034859_e3fd30c9-235d-4bfb-8806-7e60de04ecd6.sql

-- Auto-sync management_companies.properties_count
CREATE OR REPLACE FUNCTION public.update_mc_properties_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update old company count
  IF TG_OP = 'UPDATE' AND OLD.management_company_id IS DISTINCT FROM NEW.management_company_id THEN
    IF OLD.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = OLD.management_company_id)
        WHERE id = OLD.management_company_id;
    END IF;
  END IF;

  -- Update new/current company count
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = NEW.management_company_id)
        WHERE id = NEW.management_company_id;
    END IF;
  END IF;

  -- On delete update old company
  IF TG_OP = 'DELETE' THEN
    IF OLD.management_company_id IS NOT NULL THEN
      UPDATE management_companies
        SET properties_count = (SELECT count(*) FROM properties WHERE management_company_id = OLD.management_company_id)
        WHERE id = OLD.management_company_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mc_properties_count
  AFTER INSERT OR UPDATE OF management_company_id OR DELETE
  ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mc_properties_count();

-- Migration: 20260226053637_1e2a4a69-10a6-4006-8a71-aaf12b89823e.sql

-- Document types enum
CREATE TYPE public.crm_document_type AS ENUM (
  'passport', 'id_card', 'visa', 
  'rental_contract', 'sale_contract', 'agency_contract', 'power_of_attorney',
  'invoice', 'receipt', 'act', 'payment_confirmation',
  'correspondence', 'photo', 'screenshot', 'other'
);

-- CRM Documents table — links files to contacts and/or properties
CREATE TABLE public.crm_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.agent_deals(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.crm_document_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_crm_documents_company ON public.crm_documents(company_id);
CREATE INDEX idx_crm_documents_contact ON public.crm_documents(contact_id);
CREATE INDEX idx_crm_documents_property ON public.crm_documents(property_id);
CREATE INDEX idx_crm_documents_deal ON public.crm_documents(deal_id);
CREATE INDEX idx_crm_documents_type ON public.crm_documents(document_type);

-- RLS
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;

-- Members of the company can view documents
CREATE POLICY "Company members can view documents"
  ON public.crm_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Members can insert documents for their company
CREATE POLICY "Company members can insert documents"
  ON public.crm_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Members can update their own documents or admins/directors can update any
CREATE POLICY "Company members can update documents"
  ON public.crm_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND (crm_documents.uploaded_by = auth.uid() OR mcm.role IN ('director', 'admin', 'owner'))
    )
  );

-- Only directors/admins or uploaders can delete
CREATE POLICY "Uploaders or admins can delete documents"
  ON public.crm_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND (crm_documents.uploaded_by = auth.uid() OR mcm.role IN ('director', 'admin', 'owner'))
    )
  );

-- Storage bucket for CRM documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('crm-documents', 'crm-documents', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: company members can upload
CREATE POLICY "Company members can upload crm docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] IS NOT NULL);

-- Storage RLS: company members can view
CREATE POLICY "Company members can view crm docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'crm-documents');

-- Storage RLS: company members can delete their own
CREATE POLICY "Uploaders can delete crm docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'crm-documents' AND (select auth.uid()::text) = owner_id::text);

-- Migration: 20260226063850_70b3f0bc-e094-44db-8bdc-a5d1212726d2.sql

-- Property internal notes for management companies
CREATE TABLE public.property_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_notes ENABLE ROW LEVEL SECURITY;

-- RLS: only the author or property owner can see notes
CREATE POLICY "Users can manage their own notes"
  ON public.property_notes
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Index for fast lookup
CREATE INDEX idx_property_notes_property ON public.property_notes(property_id, created_at DESC);

-- Migration: 20260226072628_e0c74d35-4281-4aad-b700-f89f10dc00ca.sql

-- Create team_member_permissions table
CREATE TABLE public.team_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  granted_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id, module)
);

-- Enable RLS
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function: check if user is director/admin in a company
CREATE OR REPLACE FUNCTION public.is_mc_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin')
      AND is_active = true
  )
$$;

-- Directors/admins can manage permissions for their company
CREATE POLICY "MC admins can manage permissions"
ON public.team_member_permissions
FOR ALL
TO authenticated
USING (public.is_mc_admin(auth.uid(), company_id))
WITH CHECK (public.is_mc_admin(auth.uid(), company_id));

-- Members can read their own permissions
CREATE POLICY "Members can read own permissions"
ON public.team_member_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_team_member_permissions_user ON public.team_member_permissions(user_id, company_id);

-- Migration: 20260226084111_bd19f654-753f-415f-91b8-51f4e1b3efc3.sql

DROP POLICY "Team members can view own activity" ON team_activity_log;

CREATE POLICY "View team activity"
ON team_activity_log FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['admin'::app_role, 'staff'::app_role])
  )
  OR EXISTS (
    SELECT 1 FROM management_company_members AS mgr
    JOIN management_company_members AS mem
      ON mgr.company_id = mem.company_id
    WHERE mgr.user_id = auth.uid()
      AND mgr.role IN ('director', 'admin')
      AND mem.user_id = team_activity_log.user_id
  )
);

-- Migration: 20260226102040_fc4f357d-3a81-44fb-8ec8-1aaaef6f8cf7.sql
-- Phase 1+2: MC company-scoped access improvements

-- 1. Add company_id to staff_members for MC-level staff visibility
ALTER TABLE public.staff_members 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.management_companies(id);

CREATE INDEX IF NOT EXISTS idx_staff_members_company 
  ON public.staff_members(company_id);

-- 2. Backfill company_id from owner's MC membership
UPDATE public.staff_members sm
SET company_id = mcm.company_id
FROM public.management_company_members mcm
WHERE mcm.user_id = sm.owner_id
  AND mcm.is_active = true
  AND sm.company_id IS NULL;

-- 3. RLS: Allow MC members to view company staff
DROP POLICY IF EXISTS "mc_members_view_company_staff" ON public.staff_members;
CREATE POLICY "mc_members_view_company_staff" ON public.staff_members
  FOR SELECT USING (
    owner_id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (
        SELECT company_id FROM public.management_company_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- 4. RLS: Allow MC members to read financials for MC properties
DROP POLICY IF EXISTS "mc_members_view_property_financials" ON public.property_financials;
CREATE POLICY "mc_members_view_property_financials" ON public.property_financials
  FOR SELECT USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.management_company_members mcm 
        ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- 5. RLS: Allow MC members to read property_bookings for MC properties
DROP POLICY IF EXISTS "mc_members_view_property_bookings" ON public.property_bookings;
CREATE POLICY "mc_members_view_property_bookings" ON public.property_bookings
  FOR SELECT USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM public.properties p
      JOIN public.management_company_members mcm 
        ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- Migration: 20260226103054_5037a0e9-9888-47e2-bfa5-34a807e1bdf0.sql

-- Phase 3: MC Commission Integration into Ledger

-- 1. Add management_company_id to ledger_accounts
ALTER TABLE public.ledger_accounts 
  ADD COLUMN IF NOT EXISTS management_company_id UUID REFERENCES public.management_companies(id);

-- 2. Update CHECK constraint to allow mc_balance account_type
ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS ledger_accounts_account_type_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT ledger_accounts_account_type_check
  CHECK (account_type IN ('user_wallet', 'vendor_balance', 'platform_revenue', 'escrow', 'refund_reserve', 'customer', 'platform_cashback', 'mc_balance'));

-- 3. Update owner_check to allow management_company_id as owner dimension
ALTER TABLE public.ledger_accounts DROP CONSTRAINT IF EXISTS owner_check;
ALTER TABLE public.ledger_accounts ADD CONSTRAINT owner_check CHECK (
  (owner_user_id IS NOT NULL AND owner_org_id IS NULL AND management_company_id IS NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NOT NULL AND management_company_id IS NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NULL AND management_company_id IS NOT NULL) OR
  (owner_user_id IS NULL AND owner_org_id IS NULL AND management_company_id IS NULL 
   AND account_type IN ('platform_revenue', 'escrow', 'refund_reserve', 'platform_cashback'))
);

-- 4. Add mc_commission to ledger_entries entry_type
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_entry_type_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_entry_type_check
  CHECK (entry_type IN ('payment', 'refund', 'payout', 'fee', 'adjustment', 'topup', 'platform_fee', 'vendor_payment', 'mc_commission', 'cashback'));

-- 5. Index for MC lookups
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_mc ON public.ledger_accounts(management_company_id) WHERE management_company_id IS NOT NULL;

-- 6. Updated record_ledger_entries with MC commission split
CREATE OR REPLACE FUNCTION public.record_ledger_entries(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_platform_account_id uuid;
  v_customer_account_id uuid;
  v_vendor_account_id uuid;
  v_mc_account_id uuid;
  v_platform_fee numeric;
  v_vendor_amount numeric;
  v_mc_commission numeric := 0;
  v_owner_amount numeric;
  v_property_id uuid;
  v_mc_id uuid;
  v_commission_rate numeric;
  v_commission_type text;
  v_commission_base text;
BEGIN
  -- Get order details
  SELECT id, total_amount, platform_fee_amount, customer_user_id, provider_org_id, currency
  INTO v_order
  FROM orders WHERE id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Skip if ledger entries already exist (idempotent)
  IF EXISTS (SELECT 1 FROM ledger_entries WHERE order_id = p_order_id LIMIT 1) THEN
    RETURN;
  END IF;

  v_platform_fee := COALESCE(v_order.platform_fee_amount, ROUND(v_order.total_amount * 0.10, 2));
  v_vendor_amount := v_order.total_amount - v_platform_fee;

  -- Try to find property_id from order_items (for property orders)
  SELECT (oi.metadata->>'property_id')::uuid INTO v_property_id
  FROM order_items oi
  WHERE oi.order_id = p_order_id AND oi.item_type = 'property'
  LIMIT 1;

  -- If property found, look up MC and commission terms
  IF v_property_id IS NOT NULL THEN
    SELECT p.management_company_id INTO v_mc_id
    FROM properties p WHERE p.id = v_property_id;

    IF v_mc_id IS NOT NULL THEN
      -- Look up active management terms for this property
      SELECT pmt.commission_rate, pmt.commission_type, pmt.commission_base
      INTO v_commission_rate, v_commission_type, v_commission_base
      FROM property_management_terms pmt
      WHERE pmt.property_id = v_property_id
        AND pmt.status = 'active'
        AND (pmt.valid_from IS NULL OR pmt.valid_from <= CURRENT_DATE)
        AND (pmt.valid_until IS NULL OR pmt.valid_until >= CURRENT_DATE)
      ORDER BY pmt.created_at DESC
      LIMIT 1;

      -- Fallback to MC default commission if no property-level terms
      IF v_commission_rate IS NULL THEN
        SELECT mc.default_commission_rate INTO v_commission_rate
        FROM management_companies mc WHERE mc.id = v_mc_id;
        v_commission_type := 'percent';
        v_commission_base := 'net'; -- default: % of net (after platform fee)
      END IF;

      -- Calculate MC commission
      IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 THEN
        IF v_commission_type = 'fixed' THEN
          v_mc_commission := LEAST(v_commission_rate, v_vendor_amount);
        ELSE
          -- percent type
          IF v_commission_base = 'gross' THEN
            v_mc_commission := ROUND(v_order.total_amount * (v_commission_rate / 100), 2);
          ELSE
            -- net (after platform fee)
            v_mc_commission := ROUND(v_vendor_amount * (v_commission_rate / 100), 2);
          END IF;
          v_mc_commission := LEAST(v_mc_commission, v_vendor_amount);
        END IF;
      END IF;
    END IF;
  END IF;

  v_owner_amount := v_vendor_amount - v_mc_commission;

  -- Get or create platform revenue account
  SELECT id INTO v_platform_account_id FROM ledger_accounts WHERE account_type = 'platform_revenue' LIMIT 1;
  IF v_platform_account_id IS NULL THEN
    INSERT INTO ledger_accounts (account_type, currency) VALUES ('platform_revenue', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_platform_account_id;
  END IF;

  -- Get or create customer account
  SELECT id INTO v_customer_account_id FROM ledger_accounts 
  WHERE owner_user_id = v_order.customer_user_id AND account_type = 'customer' LIMIT 1;
  IF v_customer_account_id IS NULL AND v_order.customer_user_id IS NOT NULL THEN
    INSERT INTO ledger_accounts (owner_user_id, account_type, currency) 
    VALUES (v_order.customer_user_id, 'customer', COALESCE(v_order.currency, 'THB'))
    RETURNING id INTO v_customer_account_id;
  END IF;

  -- Get or create vendor (owner) account
  IF v_order.provider_org_id IS NOT NULL THEN
    SELECT id INTO v_vendor_account_id FROM ledger_accounts
    WHERE owner_org_id = v_order.provider_org_id AND account_type = 'vendor_balance' LIMIT 1;
    IF v_vendor_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_org_id, account_type, currency)
      VALUES (v_order.provider_org_id, 'vendor_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_vendor_account_id;
    END IF;
  END IF;

  -- Use platform account as fallback for vendor if no provider
  IF v_vendor_account_id IS NULL THEN
    v_vendor_account_id := v_platform_account_id;
  END IF;

  -- Get or create MC balance account (if MC commission applies)
  IF v_mc_commission > 0 AND v_mc_id IS NOT NULL THEN
    SELECT id INTO v_mc_account_id FROM ledger_accounts
    WHERE management_company_id = v_mc_id AND account_type = 'mc_balance' LIMIT 1;
    IF v_mc_account_id IS NULL THEN
      INSERT INTO ledger_accounts (management_company_id, account_type, currency)
      VALUES (v_mc_id, 'mc_balance', COALESCE(v_order.currency, 'THB'))
      RETURNING id INTO v_mc_account_id;
    END IF;
  END IF;

  -- Entry 1: Platform fee (debit customer → credit platform)
  IF v_customer_account_id IS NOT NULL AND v_platform_fee > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_platform_account_id, v_platform_fee, 
            COALESCE(v_order.currency, 'THB'), p_order_id, 'platform_fee',
            'Platform fee for order ' || p_order_id::text);
  END IF;

  -- Entry 2: Owner payment (debit customer → credit vendor/owner)
  IF v_customer_account_id IS NOT NULL AND v_owner_amount > 0 THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_vendor_account_id, v_owner_amount,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'vendor_payment',
            'Owner payment for order ' || p_order_id::text);
  END IF;

  -- Entry 3: MC commission (debit customer → credit MC) — only if MC has terms
  IF v_customer_account_id IS NOT NULL AND v_mc_commission > 0 AND v_mc_account_id IS NOT NULL THEN
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, order_id, entry_type, description)
    VALUES (v_customer_account_id, v_mc_account_id, v_mc_commission,
            COALESCE(v_order.currency, 'THB'), p_order_id, 'mc_commission',
            'MC commission for order ' || p_order_id::text);
  END IF;
END;
$$;

-- 7. RLS: MC members can see their MC's ledger accounts
DROP POLICY IF EXISTS "MC members can view MC ledger accounts" ON public.ledger_accounts;
CREATE POLICY "MC members can view MC ledger accounts"
  ON public.ledger_accounts FOR SELECT
  TO authenticated
  USING (
    management_company_id IS NOT NULL
    AND management_company_id IN (
      SELECT mcm.company_id FROM management_company_members mcm
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- 8. RLS: MC members can view ledger entries for their MC accounts
DROP POLICY IF EXISTS "MC members can view MC ledger entries" ON public.ledger_entries;
CREATE POLICY "MC members can view MC ledger entries"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (
    credit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      WHERE la.management_company_id IN (
        SELECT mcm.company_id FROM management_company_members mcm
        WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
      )
    )
    OR debit_account_id IN (
      SELECT la.id FROM ledger_accounts la
      WHERE la.management_company_id IN (
        SELECT mcm.company_id FROM management_company_members mcm
        WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
      )
    )
  );

-- Migration: 20260226110730_a96989a5-7086-4163-8aaa-298f13d8a72a.sql

-- Add missing PMS columns to unified properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS chat_delegated_to_platform boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_report_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS report_frequency text,
  ADD COLUMN IF NOT EXISTS report_recipients text[];

-- Migration: 20260227222125_ce18cbeb-8dda-4999-abcb-93303fdabdc1.sql

-- ============================================================
-- 1) legal_documents — versioned legal documents
-- ============================================================
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key text NOT NULL,
  version text NOT NULL DEFAULT 'v1.0',
  title_en text NOT NULL DEFAULT '',
  title_ru text NOT NULL DEFAULT '',
  applies_to text[] NOT NULL DEFAULT '{}',
  content_md text NOT NULL DEFAULT '',
  content_hash text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doc_key, version)
);

CREATE INDEX idx_legal_documents_active ON public.legal_documents (doc_key) WHERE is_active = true;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated can read active docs
CREATE POLICY "Anyone can read active legal documents"
  ON public.legal_documents FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL
  TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- ============================================================
-- 2) legal_acceptances — who accepted what, when, auditable
-- ============================================================
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NULL REFERENCES public.management_companies(id) ON DELETE SET NULL,
  doc_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  doc_key text NOT NULL,
  version text NOT NULL,
  content_hash text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet NULL,
  user_agent text NULL,
  acceptance_source text NOT NULL DEFAULT 'unknown',
  session_id uuid NULL,
  UNIQUE(user_id, doc_key, version)
);

CREATE INDEX idx_legal_acceptances_company ON public.legal_acceptances (company_id);
CREATE INDEX idx_legal_acceptances_doc ON public.legal_acceptances (doc_key, version);
CREATE INDEX idx_legal_acceptances_date ON public.legal_acceptances (accepted_at DESC);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances"
  ON public.legal_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (public.is_admin_or_uno_team());

CREATE POLICY "MC admins can read company acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = legal_acceptances.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  );

-- ============================================================
-- 3) company_storefronts — private storefront for MC
-- ============================================================
CREATE TABLE public.company_storefronts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'private',
  allow_cross_sell boolean NOT NULL DEFAULT false,
  allowed_company_ids uuid[] NULL,
  brand jsonb NULL,
  domain text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_storefronts_company ON public.company_storefronts (company_id);

CREATE OR REPLACE FUNCTION public.validate_storefront_mode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mode NOT IN ('private', 'marketplace', 'hybrid') THEN
    RAISE EXCEPTION 'Invalid storefront mode: %. Must be private, marketplace, or hybrid.', NEW.mode;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_storefront_mode
  BEFORE INSERT OR UPDATE ON public.company_storefronts
  FOR EACH ROW EXECUTE FUNCTION public.validate_storefront_mode();

ALTER TABLE public.company_storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active storefronts"
  ON public.company_storefronts FOR SELECT
  USING (is_active = true);

CREATE POLICY "MC members can manage own storefronts"
  ON public.company_storefronts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = company_storefronts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = company_storefronts.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('director', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage all storefronts"
  ON public.company_storefronts FOR ALL
  TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- ============================================================
-- 4) Extend orders with source attribution fields
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source_storefront_id uuid NULL REFERENCES public.company_storefronts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_company_id uuid NULL REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_source_company ON public.orders (source_company_id) WHERE source_company_id IS NOT NULL;
CREATE INDEX idx_orders_source_storefront ON public.orders (source_storefront_id) WHERE source_storefront_id IS NOT NULL;

-- ============================================================
-- 5) Seed initial legal documents
-- ============================================================
INSERT INTO public.legal_documents (doc_key, version, title_en, title_ru, applies_to, content_md, content_hash, is_active)
VALUES
  ('terms_of_use', 'v1.0', 'Terms of Use', 'Условия использования',
   '{guest,owner,mc_admin,mc_staff}',
   '# Terms of Use

By using myUNO platform, you agree to these terms.

## 1. Acceptance
By accessing the platform, you accept these terms in full.

## 2. User Accounts
You are responsible for maintaining the confidentiality of your account.

## 3. Prohibited Use
You may not use the platform for any illegal purposes.

## 4. Limitation of Liability
The platform is provided "as is" without warranties.

## 5. Changes
We reserve the right to modify these terms at any time.',
   md5('terms_of_use_v1.0'),
   true),

  ('privacy_policy', 'v1.0', 'Privacy Policy', 'Политика конфиденциальности',
   '{guest,owner,mc_admin,mc_staff}',
   '# Privacy Policy

Your privacy is important to us.

## 1. Data Collection
We collect personal data necessary for providing our services.

## 2. Data Usage
Your data is used to personalize your experience and process bookings.

## 3. Data Protection
We implement industry-standard security measures.

## 4. Third Parties
We do not sell your personal data to third parties.

## 5. Your Rights
You have the right to access, correct, and delete your data.',
   md5('privacy_policy_v1.0'),
   true),

  ('mc_commercial_terms', 'v1.0', 'Commercial Terms for Management Companies', 'Коммерческие условия для УК',
   '{mc_admin,mc_staff}',
   '# Commercial Terms

These terms govern the relationship between myUNO and Management Companies.

## 1. Commission
Commission rates are determined by individual agreements.

## 2. Storefront
Management Companies may operate private storefronts.

## 3. Data Ownership
Property and booking data belongs to the Management Company.

## 4. Termination
Either party may terminate with 30 days notice.',
   md5('mc_commercial_terms_v1.0'),
   true);

-- ============================================================
-- 6) Seed storefront for Show Property Phuket
-- ============================================================
INSERT INTO public.company_storefronts (company_id, slug, mode, brand)
VALUES (
  '017c9759-af23-4233-8bba-f379c819736a',
  'show-property-phuket',
  'private',
  '{"primary_color": "#2563eb", "company_name": "Show Property Phuket"}'::jsonb
);

-- Migration: 20260227224512_0669d8d2-037d-4e63-a259-acaea61e715b.sql

-- ============================================
-- Property Key Assignments
-- ============================================
CREATE TABLE public.property_key_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  key_set_label text NOT NULL DEFAULT 'Main',
  assigned_to_name text NOT NULL,
  assigned_to_phone text,
  assigned_to_type text NOT NULL DEFAULT 'staff',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expected_return timestamptz,
  returned_at timestamptz,
  notes text,
  photo_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_key_assigned_to_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.assigned_to_type NOT IN ('staff','guest','owner','lockbox','security') THEN
    RAISE EXCEPTION 'Invalid assigned_to_type: %', NEW.assigned_to_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_key_type
  BEFORE INSERT OR UPDATE ON public.property_key_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_key_assigned_to_type();

CREATE INDEX idx_key_assignments_property ON public.property_key_assignments(property_id);
CREATE INDEX idx_key_assignments_active ON public.property_key_assignments(property_id) WHERE returned_at IS NULL;

ALTER TABLE public.property_key_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage keys for their properties"
  ON public.property_key_assignments
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  );

-- ============================================
-- Property Utility Schedules
-- ============================================
CREATE TABLE public.property_utility_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  provider_name text,
  account_number text,
  due_day integer,
  amount_estimate numeric,
  currency text NOT NULL DEFAULT 'THB',
  last_paid_date date,
  last_paid_amount numeric,
  auto_remind_days integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_utility_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.utility_type NOT IN ('electricity','water','internet','cam','insurance','gas','other') THEN
    RAISE EXCEPTION 'Invalid utility_type: %', NEW.utility_type;
  END IF;
  IF NEW.due_day IS NOT NULL AND (NEW.due_day < 1 OR NEW.due_day > 31) THEN
    RAISE EXCEPTION 'due_day must be between 1 and 31';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_utility
  BEFORE INSERT OR UPDATE ON public.property_utility_schedules
  FOR EACH ROW EXECUTE FUNCTION public.validate_utility_type();

CREATE INDEX idx_utility_schedules_property ON public.property_utility_schedules(property_id);
CREATE INDEX idx_utility_schedules_active ON public.property_utility_schedules(property_id) WHERE is_active = true;

ALTER TABLE public.property_utility_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage utility schedules for their properties"
  ON public.property_utility_schedules
  FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
      UNION
      SELECT property_id FROM public.property_manager_assignments WHERE manager_user_id = auth.uid()
    )
  );

-- Migration: 20260227224540_e3c3b3d6-9168-4f37-a5bd-843707bc74a4.sql

ALTER FUNCTION public.validate_key_assigned_to_type() SET search_path = public;
ALTER FUNCTION public.validate_utility_type() SET search_path = public;

-- Migration: 20260227230322_665e5704-6876-47a9-ac16-bdb110d960ec.sql

-- P0: Checklist templates
CREATE TABLE public.property_checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Validation trigger for checklist_type
CREATE OR REPLACE FUNCTION public.validate_checklist_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.checklist_type NOT IN ('check_in','check_out','cleaning','inspection') THEN
    RAISE EXCEPTION 'Invalid checklist_type: %', NEW.checklist_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_checklist_type BEFORE INSERT OR UPDATE ON public.property_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_checklist_type();

ALTER TABLE public.property_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view checklist templates"
  ON public.property_checklist_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
  ));

CREATE POLICY "Directors can manage checklist templates"
  ON public.property_checklist_templates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director','admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members mcm
    WHERE mcm.company_id = property_checklist_templates.company_id
      AND mcm.user_id = auth.uid()
      AND mcm.role IN ('director','admin')
  ));

-- Checklist completions
CREATE TABLE public.checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.property_checklist_templates(id) ON DELETE SET NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid,
  task_id uuid,
  completed_by uuid REFERENCES auth.users(id),
  items jsonb NOT NULL DEFAULT '[]',
  photos text[] DEFAULT '{}',
  notes text,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage completions"
  ON public.checklist_completions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Task comments
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  task_source text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_task_source() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.task_source NOT IN ('crm','ops') THEN
    RAISE EXCEPTION 'Invalid task_source: %', NEW.task_source;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_task_source BEFORE INSERT OR UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_source();

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage task comments"
  ON public.task_comments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Photo proof on operational tasks
ALTER TABLE public.property_operational_tasks
  ADD COLUMN IF NOT EXISTS photo_proof text[] DEFAULT '{}';

-- Export permission on team_member_permissions
ALTER TABLE public.team_member_permissions
  ADD COLUMN IF NOT EXISTS can_export boolean DEFAULT false;

-- Migration: 20260227230357_f1e0018d-fa64-4efb-b121-60efca869cac.sql

-- Fix function search paths
ALTER FUNCTION public.validate_checklist_type() SET search_path = public;
ALTER FUNCTION public.validate_task_source() SET search_path = public;

-- Fix overly permissive RLS on checklist_completions
DROP POLICY IF EXISTS "Authenticated users can manage completions" ON public.checklist_completions;

CREATE POLICY "Users can view completions for accessible properties"
  ON public.checklist_completions FOR SELECT TO authenticated
  USING (completed_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = checklist_completions.property_id
      AND p.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert completions"
  ON public.checklist_completions FOR INSERT TO authenticated
  WITH CHECK (completed_by = auth.uid());

CREATE POLICY "Users can update own completions"
  ON public.checklist_completions FOR UPDATE TO authenticated
  USING (completed_by = auth.uid());

-- Fix overly permissive RLS on task_comments
DROP POLICY IF EXISTS "Authenticated users can manage task comments" ON public.task_comments;

CREATE POLICY "Users can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Migration: 20260227233450_bea959b6-ee92-470f-8d68-472c844bc934.sql

-- ====================================================
-- P0 BLOCKER 1: Auto-task trigger on property_bookings
-- ====================================================

CREATE OR REPLACE FUNCTION public.auto_create_booking_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title text;
  v_cleaning_date date;
BEGIN
  -- Only fire on confirmed bookings (insert or status change to confirmed)
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Skip if old row was already confirmed (avoid duplicates on update)
  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get property title for task descriptions
  SELECT COALESCE(op.title, p.title_en, 'Property')
  INTO v_property_title
  FROM properties p
  LEFT JOIN owner_properties op ON op.id = p.id
  WHERE p.id = NEW.property_id
  LIMIT 1;

  -- 1. Cleaning task: day before check-in (or check-in day if tomorrow)
  v_cleaning_date := GREATEST(NEW.check_in - 1, CURRENT_DATE);

  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'cleaning',
     'Pre-arrival cleaning: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Уборка перед заездом: ' || COALESCE(NEW.guest_name, 'Гость'),
     v_cleaning_date, 'high', 'pending')
  ON CONFLICT DO NOTHING;

  -- 2. Check-in task
  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'check_in',
     'Check-in: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Заезд: ' || COALESCE(NEW.guest_name, 'Гость'),
     NEW.check_in, 'high', 'pending')
  ON CONFLICT DO NOTHING;

  -- 3. Check-out task
  INSERT INTO property_operational_tasks
    (property_id, booking_id, task_type, title, title_ru, scheduled_date, priority, status)
  VALUES
    (NEW.property_id, NEW.id, 'check_out',
     'Check-out: ' || COALESCE(NEW.guest_name, 'Guest'),
     'Выезд: ' || COALESCE(NEW.guest_name, 'Гость'),
     NEW.check_out, 'normal', 'pending')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_auto_create_booking_tasks ON property_bookings;
CREATE TRIGGER trg_auto_create_booking_tasks
  AFTER INSERT OR UPDATE ON property_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking_tasks();


-- ====================================================
-- P0 BLOCKER 2: Deposit liability account in ledger
-- ====================================================

-- Update record_ledger_entries to handle deposit_liability
-- We add a standalone function to record deposit entries
CREATE OR REPLACE FUNCTION public.record_deposit_ledger_entry(
  p_booking_id uuid,
  p_property_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'THB',
  p_entry_type text DEFAULT 'deposit_received'  -- deposit_received | deposit_returned | deposit_deducted
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit_account_id uuid;
  v_guest_account_id uuid;
  v_owner_id uuid;
  v_guest_id uuid;
  v_mc_id uuid;
BEGIN
  -- Get booking context
  SELECT pb.owner_id, pb.guest_id, p.management_company_id
  INTO v_owner_id, v_guest_id, v_mc_id
  FROM property_bookings pb
  JOIN properties p ON p.id = pb.property_id
  WHERE pb.id = p_booking_id;

  -- Get or create deposit_liability account for this MC or owner
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_deposit_account_id FROM ledger_accounts
    WHERE management_company_id = v_mc_id AND account_type = 'deposit_liability' LIMIT 1;
    IF v_deposit_account_id IS NULL THEN
      INSERT INTO ledger_accounts (management_company_id, account_type, currency)
      VALUES (v_mc_id, 'deposit_liability', p_currency)
      RETURNING id INTO v_deposit_account_id;
    END IF;
  ELSE
    SELECT id INTO v_deposit_account_id FROM ledger_accounts
    WHERE owner_user_id = v_owner_id AND account_type = 'deposit_liability' LIMIT 1;
    IF v_deposit_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_user_id, account_type, currency)
      VALUES (v_owner_id, 'deposit_liability', p_currency)
      RETURNING id INTO v_deposit_account_id;
    END IF;
  END IF;

  -- Get or create guest account
  IF v_guest_id IS NOT NULL THEN
    SELECT id INTO v_guest_account_id FROM ledger_accounts
    WHERE owner_user_id = v_guest_id AND account_type = 'customer' LIMIT 1;
    IF v_guest_account_id IS NULL THEN
      INSERT INTO ledger_accounts (owner_user_id, account_type, currency)
      VALUES (v_guest_id, 'customer', p_currency)
      RETURNING id INTO v_guest_account_id;
    END IF;
  END IF;

  -- Skip if no guest account
  IF v_guest_account_id IS NULL THEN
    RETURN;
  END IF;

  IF p_entry_type = 'deposit_received' THEN
    -- Debit guest, credit deposit liability (we hold their money)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_guest_account_id, v_deposit_account_id, p_amount, p_currency, 'deposit_received',
            'Security deposit received for booking ' || p_booking_id::text);
  ELSIF p_entry_type = 'deposit_returned' THEN
    -- Debit deposit liability, credit guest (return money)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_deposit_account_id, v_guest_account_id, p_amount, p_currency, 'deposit_returned',
            'Security deposit returned for booking ' || p_booking_id::text);
  ELSIF p_entry_type = 'deposit_deducted' THEN
    -- Debit deposit liability, credit platform/owner (damage deduction)
    INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
    VALUES (v_deposit_account_id, v_deposit_account_id, p_amount, p_currency, 'deposit_deducted',
            'Deposit deduction for damages - booking ' || p_booking_id::text);
  END IF;
END;
$$;


-- ====================================================
-- P0 BLOCKER 3: RLS hardening for MC manager access
-- ====================================================

-- Fix property_financials: MC members need INSERT/UPDATE too, not just SELECT
-- First drop the duplicate SELECT policy
DROP POLICY IF EXISTS "Owners can view their financials" ON property_financials;

-- Add UPDATE policy for owners
CREATE POLICY "Owners can update financials"
  ON property_financials FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Add full CRUD for MC members on their managed properties
DROP POLICY IF EXISTS "mc_members_view_property_financials" ON property_financials;
CREATE POLICY "mc_members_crud_property_financials"
  ON property_financials FOR ALL
  USING (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );

-- Fix property_operational_tasks: MC members need access too
DROP POLICY IF EXISTS "Owners can manage operational tasks" ON property_operational_tasks;
CREATE POLICY "owners_and_mc_manage_operational_tasks"
  ON property_operational_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owner_properties
      WHERE owner_properties.id = property_operational_tasks.property_id
        AND owner_properties.owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM owner_properties
      WHERE owner_properties.id = property_operational_tasks.property_id
        AND owner_properties.owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
  );


-- ====================================================
-- P0 BLOCKER 5: Add property_reports auto_send columns
-- ====================================================

-- Add columns for automated monthly statement scheduling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'property_reports' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE property_reports ADD COLUMN auto_generated boolean DEFAULT false;
  END IF;
END$$;

-- Migration: 20260227234941_034495c5-3d78-4e46-aa06-ba7d253ceb86.sql

-- Add owner_contact_id FK to properties to link with CRM contacts
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS owner_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_properties_owner_contact_id ON public.properties(owner_contact_id);

-- Add emergency_contact and special_notes fields to crm_contacts for owner account management
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS special_notes text;

-- Migration: 20260228002108_5aff29be-5959-4ab6-b49e-6d3fe559f642.sql

-- =====================================================
-- FIX 1: Auto-expense on maintenance task completion
-- =====================================================

-- 1a. Add cost columns to operational tasks
ALTER TABLE public.property_operational_tasks
  ADD COLUMN IF NOT EXISTS estimated_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS expense_created boolean DEFAULT false;

-- 1b. Trigger function: auto-create expense when task done with cost
CREATE OR REPLACE FUNCTION public.fn_auto_expense_on_task_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_financial_id uuid;
  v_expense_account_id uuid;
  v_revenue_account_id uuid;
BEGIN
  -- Only fire when status changes TO 'done' and there's a cost
  IF NEW.status = 'done'
     AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0
     AND NEW.expense_created IS NOT TRUE
  THEN
    -- Get owner_id from property
    SELECT owner_id INTO v_owner_id
    FROM properties
    WHERE id = NEW.property_id;

    IF v_owner_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Insert into property_financials
    INSERT INTO property_financials (
      property_id, owner_id, transaction_type, category,
      amount, currency, description, reference_type, reference_id,
      transaction_date, status, cost_source
    ) VALUES (
      NEW.property_id,
      v_owner_id,
      'expense',
      CASE NEW.task_type
        WHEN 'maintenance' THEN 'maintenance'
        WHEN 'cleaning' THEN 'cleaning'
        ELSE 'operations'
      END,
      NEW.actual_cost,
      COALESCE(NEW.cost_currency, 'THB'),
      COALESCE(NEW.title, 'Operational task expense'),
      'operational_task',
      NEW.id,
      COALESCE(NEW.completed_at::date, CURRENT_DATE),
      'recorded',
      'auto_task'
    )
    RETURNING id INTO v_financial_id;

    -- Mark as created to prevent duplicates
    NEW.expense_created := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 1c. Attach trigger
DROP TRIGGER IF EXISTS trg_auto_expense_on_task_done ON property_operational_tasks;
CREATE TRIGGER trg_auto_expense_on_task_done
  BEFORE UPDATE ON property_operational_tasks
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_expense_on_task_done();


-- =====================================================
-- FIX 2: RLS hardening for MC isolation
-- =====================================================

-- 2a. Helper function: check if user is MC member for a property
CREATE OR REPLACE FUNCTION public.is_mc_member_for_property(p_user_id uuid, p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties p
    JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE p.id = p_property_id
      AND mcm.user_id = p_user_id
      AND mcm.is_active = true
  );
$$;

-- 2b. Add MC-scoped SELECT policy on properties (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'mc_member_select_company_properties'
  ) THEN
    CREATE POLICY mc_member_select_company_properties ON public.properties
      FOR SELECT TO authenticated
      USING (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      );
  END IF;
END $$;

-- 2c. Add MC-scoped UPDATE policy on properties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'mc_member_update_company_properties'
  ) THEN
    CREATE POLICY mc_member_update_company_properties ON public.properties
      FOR UPDATE TO authenticated
      USING (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      )
      WITH CHECK (
        management_company_id IN (
          SELECT mcm.company_id
          FROM management_company_members mcm
          WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
        )
      );
  END IF;
END $$;

-- 2d. Fix operational_tasks RLS: replace owner_properties reference with properties
DROP POLICY IF EXISTS owners_and_mc_manage_operational_tasks ON property_operational_tasks;
CREATE POLICY owners_and_mc_manage_operational_tasks ON property_operational_tasks
  FOR ALL TO authenticated
  USING (
    -- Owner access
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR
    -- MC member access
    property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    -- Assigned staff
    assigned_to = auth.uid()
  )
  WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR
    property_id IN (
      SELECT p.id FROM properties p
      JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    assigned_to = auth.uid()
  );


-- =====================================================
-- FIX 3: Financial reconciliation trigger
-- property_financials → ledger_entries auto-sync
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_sync_financial_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mc_id uuid;
  v_expense_account_id uuid;
  v_owner_account_id uuid;
BEGIN
  -- Only process expense/income records that don't already have a ledger link
  IF NEW.reference_type = 'ledger_synced' THEN
    RETURN NEW;
  END IF;

  -- Get MC from property
  SELECT management_company_id INTO v_mc_id
  FROM properties WHERE id = NEW.property_id;

  -- Find or create expense account for this MC
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_expense_account_id
    FROM ledger_accounts
    WHERE management_company_id = v_mc_id
      AND account_type = 'expense'
      AND is_active = true
    LIMIT 1;

    -- Create if missing
    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency)
      VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_expense_account_id;
    END IF;

    -- Find owner payout account
    SELECT id INTO v_owner_account_id
    FROM ledger_accounts
    WHERE owner_user_id = NEW.owner_id
      AND account_type = 'owner_payout'
      AND is_active = true
    LIMIT 1;

    IF v_owner_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, owner_user_id, currency)
      VALUES ('owner_payout', NEW.owner_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_owner_account_id;
    END IF;

    -- Create double-entry ledger record
    IF NEW.transaction_type = 'expense' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_expense_account_id,
        v_owner_account_id,
        NEW.amount,
        COALESCE(NEW.currency, 'THB'),
        'property_expense',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_owner_account_id,
        v_expense_account_id,
        NEW.amount,
        COALESCE(NEW.currency, 'THB'),
        'property_income',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_financial_to_ledger ON property_financials;
CREATE TRIGGER trg_sync_financial_to_ledger
  AFTER INSERT ON property_financials
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_financial_to_ledger();

-- Migration: 20260228002512_594b444c-014b-4f71-8a43-cb7f257f34f3.sql

-- =====================================================
-- HOTFIX: Correct triggers & RLS that wrongly reference 
-- 'properties' instead of 'owner_properties'
-- =====================================================

-- 1. Add management_company_id to owner_properties for MC scoping
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS management_company_id uuid REFERENCES management_companies(id);

-- Create index for MC lookup
CREATE INDEX IF NOT EXISTS idx_owner_properties_mc_id 
  ON owner_properties(management_company_id);

-- 2. Fix auto-expense trigger: reference owner_properties instead of properties
CREATE OR REPLACE FUNCTION public.fn_auto_expense_on_task_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_financial_id uuid;
BEGIN
  -- Only fire when status changes TO 'done' and there's a cost
  IF NEW.status = 'done'
     AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0
     AND NEW.expense_created IS NOT TRUE
  THEN
    -- Get owner_id from owner_properties (correct FK target)
    SELECT owner_id INTO v_owner_id
    FROM owner_properties
    WHERE id = NEW.property_id;

    IF v_owner_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Insert into property_financials
    INSERT INTO property_financials (
      property_id, owner_id, transaction_type, category,
      amount, currency, description, reference_type, reference_id,
      transaction_date, status, cost_source
    ) VALUES (
      NEW.property_id,
      v_owner_id,
      'expense',
      CASE NEW.task_type
        WHEN 'maintenance' THEN 'maintenance'
        WHEN 'cleaning' THEN 'cleaning'
        ELSE 'operations'
      END,
      NEW.actual_cost,
      COALESCE(NEW.cost_currency, 'THB'),
      COALESCE(NEW.title, 'Operational task expense'),
      'operational_task',
      NEW.id,
      COALESCE(NEW.completed_at::date, CURRENT_DATE),
      'recorded',
      'auto_task'
    )
    RETURNING id INTO v_financial_id;

    -- Mark as created to prevent duplicates
    NEW.expense_created := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Fix RLS policy on operational_tasks: use owner_properties instead of properties
DROP POLICY IF EXISTS owners_and_mc_manage_operational_tasks ON property_operational_tasks;
CREATE POLICY owners_and_mc_manage_operational_tasks ON property_operational_tasks
  FOR ALL TO authenticated
  USING (
    -- Owner access via owner_properties
    property_id IN (SELECT id FROM owner_properties WHERE owner_id = auth.uid())
    OR
    -- MC member access via owner_properties.management_company_id
    property_id IN (
      SELECT op.id FROM owner_properties op
      JOIN management_company_members mcm ON mcm.company_id = op.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    -- Assigned staff
    assigned_to = auth.uid()
  )
  WITH CHECK (
    property_id IN (SELECT id FROM owner_properties WHERE owner_id = auth.uid())
    OR
    property_id IN (
      SELECT op.id FROM owner_properties op
      JOIN management_company_members mcm ON mcm.company_id = op.management_company_id
      WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
    )
    OR
    assigned_to = auth.uid()
  );

-- 4. Fix financial reconciliation trigger: handle both tables
CREATE OR REPLACE FUNCTION public.fn_sync_financial_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mc_id uuid;
  v_expense_account_id uuid;
  v_owner_account_id uuid;
BEGIN
  -- Skip if already synced
  IF NEW.reference_type = 'ledger_synced' THEN
    RETURN NEW;
  END IF;

  -- Try owner_properties first (PMS context), then properties (marketplace)
  SELECT management_company_id INTO v_mc_id
  FROM owner_properties WHERE id = NEW.property_id;

  IF v_mc_id IS NULL THEN
    SELECT management_company_id INTO v_mc_id
    FROM properties WHERE id = NEW.property_id;
  END IF;

  -- Create ledger entries only if MC is found
  IF v_mc_id IS NOT NULL THEN
    -- Find or create expense account for this MC
    SELECT id INTO v_expense_account_id
    FROM ledger_accounts
    WHERE management_company_id = v_mc_id
      AND account_type = 'expense'
      AND is_active = true
    LIMIT 1;

    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency)
      VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_expense_account_id;
    END IF;

    -- Find or create owner payout account
    SELECT id INTO v_owner_account_id
    FROM ledger_accounts
    WHERE owner_user_id = NEW.owner_id
      AND account_type = 'owner_payout'
      AND is_active = true
    LIMIT 1;

    IF v_owner_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, owner_user_id, currency)
      VALUES ('owner_payout', NEW.owner_id, COALESCE(NEW.currency, 'THB'))
      RETURNING id INTO v_owner_account_id;
    END IF;

    -- Create double-entry ledger record
    IF NEW.transaction_type = 'expense' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_expense_account_id, v_owner_account_id,
        NEW.amount, COALESCE(NEW.currency, 'THB'),
        'property_expense',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (
        debit_account_id, credit_account_id, amount, currency,
        entry_type, description
      ) VALUES (
        v_owner_account_id, v_expense_account_id,
        NEW.amount, COALESCE(NEW.currency, 'THB'),
        'property_income',
        COALESCE(NEW.description, 'Auto-synced from property financials')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Sync management_company_id from properties to owner_properties where IDs match
UPDATE owner_properties op
SET management_company_id = p.management_company_id
FROM properties p
WHERE op.id = p.id
  AND p.management_company_id IS NOT NULL
  AND op.management_company_id IS NULL;

-- Migration: 20260228003243_22bd8cd0-c874-465c-9032-65ef34ed77fd.sql

-- Fix: Drop and recreate is_mc_member_for_property with correct param names
DROP FUNCTION IF EXISTS is_mc_member_for_property(uuid, uuid);

CREATE FUNCTION is_mc_member_for_property(p_property_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties p
    JOIN management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE p.id = p_property_id
      AND mcm.user_id = p_user_id
      AND mcm.is_active = true
  );
$$;

-- Update RLS on property_operational_tasks to use properties
DROP POLICY IF EXISTS "mc_members_manage_tasks" ON property_operational_tasks;
CREATE POLICY "mc_members_manage_tasks" ON property_operational_tasks
  FOR ALL
  USING (
    is_mc_member_for_property(property_id, auth.uid())
  )
  WITH CHECK (
    is_mc_member_for_property(property_id, auth.uid())
  );

-- Migration: 20260228003351_afbbacc8-2a87-4ade-b22e-c28e7761268d.sql

-- Phase 1A: Add columns and migrate data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS marketplace_property_id uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS managed_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_size_sqm numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_elevator boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS garden_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS instant_booking_enabled_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit_collection text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pm_company_id uuid;

-- Migrate 5 PMS-only rows
INSERT INTO properties (
  id, owner_id, title_en, title_ru, address, district, property_type,
  bedrooms, bathrooms, area_sqm, description_en, description_ru,
  cover_image, images, management_type, is_rented, rental_platform,
  status, verified_at, verified_by, notes, created_at, updated_at,
  price_per_night, min_stay_nights, max_guests, deposit_amount,
  deposit_currency, check_in_time, check_out_time, house_rules,
  house_rules_ru, cancellation_policy, instant_booking,
  seasonal_pricing, weekly_discount, monthly_discount, deposit_type,
  electricity_included, electricity_unit_price, electricity_provider,
  electricity_metering, electricity_notes, electricity_notes_ru,
  water_included, water_unit_price, water_notes, water_notes_ru,
  included_services, extra_services, cleaning_included,
  cleaning_frequency, extra_cleaning_price, linen_change_price,
  linen_change_frequency, marketplace_property_id, listing_type,
  title, management_company_id
)
SELECT
  op.id, op.owner_id, op.title, op.title_ru, op.address, op.district, op.property_type,
  op.bedrooms, op.bathrooms, op.area_sqm, op.description, op.description_ru,
  op.cover_image, op.images, op.management_type, op.is_rented, op.rental_platform,
  op.status, op.verified_at, op.verified_by, op.notes, op.created_at, op.updated_at,
  op.price_per_night, op.min_stay_nights, op.max_guests, op.deposit_amount,
  op.deposit_currency, op.check_in_time, op.check_out_time, op.house_rules,
  op.house_rules_ru, op.cancellation_policy, op.instant_booking,
  op.seasonal_pricing, op.weekly_discount, op.monthly_discount, op.deposit_type,
  op.electricity_included, op.electricity_unit_price, op.electricity_provider,
  op.electricity_metering, op.electricity_notes, op.electricity_notes_ru,
  op.water_included, op.water_unit_price, op.water_notes, op.water_notes_ru,
  op.included_services, op.extra_services, op.cleaning_included,
  op.cleaning_frequency, op.extra_cleaning_price, op.linen_change_price,
  op.linen_change_frequency, op.marketplace_property_id, 'rent',
  op.title, op.management_company_id
FROM owner_properties op
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = op.id)
ON CONFLICT (id) DO NOTHING;

-- Re-point ALL 32 foreign keys
ALTER TABLE property_guidebook DROP CONSTRAINT IF EXISTS property_guidebook_property_id_fkey;
ALTER TABLE property_guidebook ADD CONSTRAINT property_guidebook_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_service_requests DROP CONSTRAINT IF EXISTS property_service_requests_property_id_fkey;
ALTER TABLE property_service_requests ADD CONSTRAINT property_service_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_financials DROP CONSTRAINT IF EXISTS property_financials_property_id_fkey;
ALTER TABLE property_financials ADD CONSTRAINT property_financials_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_bookings DROP CONSTRAINT IF EXISTS property_bookings_property_id_fkey;
ALTER TABLE property_bookings ADD CONSTRAINT property_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_chat_messages DROP CONSTRAINT IF EXISTS property_chat_messages_property_id_fkey;
ALTER TABLE property_chat_messages ADD CONSTRAINT property_chat_messages_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_external_calendars DROP CONSTRAINT IF EXISTS property_external_calendars_property_id_fkey;
ALTER TABLE property_external_calendars ADD CONSTRAINT property_external_calendars_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_property_id_fkey;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE juristic_contacts DROP CONSTRAINT IF EXISTS juristic_contacts_property_id_fkey;
ALTER TABLE juristic_contacts ADD CONSTRAINT juristic_contacts_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE juristic_requests DROP CONSTRAINT IF EXISTS juristic_requests_property_id_fkey;
ALTER TABLE juristic_requests ADD CONSTRAINT juristic_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_availability DROP CONSTRAINT IF EXISTS property_availability_property_id_fkey;
ALTER TABLE property_availability ADD CONSTRAINT property_availability_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_delegates DROP CONSTRAINT IF EXISTS property_delegates_property_id_fkey;
ALTER TABLE property_delegates ADD CONSTRAINT property_delegates_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_activity_log DROP CONSTRAINT IF EXISTS property_activity_log_property_id_fkey;
ALTER TABLE property_activity_log ADD CONSTRAINT property_activity_log_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_meters DROP CONSTRAINT IF EXISTS property_meters_property_id_fkey;
ALTER TABLE property_meters ADD CONSTRAINT property_meters_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_ownership_invites DROP CONSTRAINT IF EXISTS property_ownership_invites_property_id_fkey;
ALTER TABLE property_ownership_invites ADD CONSTRAINT property_ownership_invites_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE owner_notifications DROP CONSTRAINT IF EXISTS owner_notifications_property_id_fkey;
ALTER TABLE owner_notifications ADD CONSTRAINT owner_notifications_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_deposits DROP CONSTRAINT IF EXISTS property_deposits_property_id_fkey;
ALTER TABLE property_deposits ADD CONSTRAINT property_deposits_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE meter_readings DROP CONSTRAINT IF EXISTS meter_readings_property_id_fkey;
ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_inventory_items DROP CONSTRAINT IF EXISTS property_inventory_items_property_id_fkey;
ALTER TABLE property_inventory_items ADD CONSTRAINT property_inventory_items_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE damage_reports DROP CONSTRAINT IF EXISTS damage_reports_property_id_fkey;
ALTER TABLE damage_reports ADD CONSTRAINT damage_reports_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_operational_tasks DROP CONSTRAINT IF EXISTS property_operational_tasks_property_id_fkey;
ALTER TABLE property_operational_tasks ADD CONSTRAINT property_operational_tasks_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_management_terms DROP CONSTRAINT IF EXISTS property_management_terms_property_id_fkey;
ALTER TABLE property_management_terms ADD CONSTRAINT property_management_terms_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE chat_message_flags DROP CONSTRAINT IF EXISTS chat_message_flags_property_id_fkey;
ALTER TABLE chat_message_flags ADD CONSTRAINT chat_message_flags_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE inventory_inspections DROP CONSTRAINT IF EXISTS inventory_inspections_property_id_fkey;
ALTER TABLE inventory_inspections ADD CONSTRAINT inventory_inspections_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE ota_listing_connections DROP CONSTRAINT IF EXISTS ota_listing_connections_property_id_fkey;
ALTER TABLE ota_listing_connections ADD CONSTRAINT ota_listing_connections_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_management_requests DROP CONSTRAINT IF EXISTS property_management_requests_property_id_fkey;
ALTER TABLE property_management_requests ADD CONSTRAINT property_management_requests_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_reports DROP CONSTRAINT IF EXISTS property_reports_property_id_fkey;
ALTER TABLE property_reports ADD CONSTRAINT property_reports_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE calendar_sync_logs DROP CONSTRAINT IF EXISTS calendar_sync_logs_property_id_fkey;
ALTER TABLE calendar_sync_logs ADD CONSTRAINT calendar_sync_logs_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_analytics DROP CONSTRAINT IF EXISTS property_analytics_property_id_fkey;
ALTER TABLE property_analytics ADD CONSTRAINT property_analytics_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_promotions DROP CONSTRAINT IF EXISTS property_promotions_property_id_fkey;
ALTER TABLE property_promotions ADD CONSTRAINT property_promotions_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_listing_scores DROP CONSTRAINT IF EXISTS property_listing_scores_property_id_fkey;
ALTER TABLE property_listing_scores ADD CONSTRAINT property_listing_scores_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_budgets DROP CONSTRAINT IF EXISTS property_budgets_property_id_fkey;
ALTER TABLE property_budgets ADD CONSTRAINT property_budgets_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE property_maintenance_schedules DROP CONSTRAINT IF EXISTS property_maintenance_schedules_property_id_fkey;
ALTER TABLE property_maintenance_schedules ADD CONSTRAINT property_maintenance_schedules_property_id_fkey FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Update triggers to query only properties
CREATE OR REPLACE FUNCTION fn_auto_expense_on_task_done()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner_id uuid; v_financial_id uuid;
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done')
     AND COALESCE(NEW.actual_cost, 0) > 0 AND NEW.expense_created IS NOT TRUE THEN
    SELECT owner_id INTO v_owner_id FROM properties WHERE id = NEW.property_id;
    IF v_owner_id IS NULL THEN RETURN NEW; END IF;
    INSERT INTO property_financials (property_id, owner_id, transaction_type, category, amount, currency, description, reference_type, reference_id, transaction_date, status, cost_source)
    VALUES (NEW.property_id, v_owner_id, 'expense',
      CASE NEW.task_type WHEN 'maintenance' THEN 'maintenance' WHEN 'cleaning' THEN 'cleaning' ELSE 'operations' END,
      NEW.actual_cost, COALESCE(NEW.cost_currency, 'THB'), COALESCE(NEW.title, 'Operational task expense'),
      'operational_task', NEW.id, COALESCE(NEW.completed_at::date, CURRENT_DATE), 'recorded', 'auto_task')
    RETURNING id INTO v_financial_id;
    NEW.expense_created := true;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION fn_sync_financial_to_ledger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mc_id uuid; v_expense_account_id uuid; v_owner_account_id uuid;
BEGIN
  IF NEW.reference_type = 'ledger_synced' THEN RETURN NEW; END IF;
  SELECT management_company_id INTO v_mc_id FROM properties WHERE id = NEW.property_id;
  IF v_mc_id IS NOT NULL THEN
    SELECT id INTO v_expense_account_id FROM ledger_accounts WHERE management_company_id = v_mc_id AND account_type = 'expense' AND is_active = true LIMIT 1;
    IF v_expense_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, management_company_id, currency) VALUES ('expense', v_mc_id, COALESCE(NEW.currency, 'THB')) RETURNING id INTO v_expense_account_id;
    END IF;
    SELECT id INTO v_owner_account_id FROM ledger_accounts WHERE owner_user_id = NEW.owner_id AND account_type = 'owner_payout' AND is_active = true LIMIT 1;
    IF v_owner_account_id IS NULL THEN
      INSERT INTO ledger_accounts (account_type, owner_user_id, currency) VALUES ('owner_payout', NEW.owner_id, COALESCE(NEW.currency, 'THB')) RETURNING id INTO v_owner_account_id;
    END IF;
    IF NEW.transaction_type = 'expense' THEN
      INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
      VALUES (v_expense_account_id, v_owner_account_id, NEW.amount, COALESCE(NEW.currency, 'THB'), 'property_expense', COALESCE(NEW.description, 'Auto-synced'));
    ELSIF NEW.transaction_type = 'income' THEN
      INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount, currency, entry_type, description)
      VALUES (v_owner_account_id, v_expense_account_id, NEW.amount, COALESCE(NEW.currency, 'THB'), 'property_income', COALESCE(NEW.description, 'Auto-synced'));
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- Create v_owner_properties compatibility view
CREATE OR REPLACE VIEW v_owner_properties AS SELECT * FROM properties WHERE owner_id IS NOT NULL;

-- Migration: 20260228003413_6454ad03-daad-4266-bebd-58b51a452023.sql

-- Fix security definer view warning
ALTER VIEW v_owner_properties SET (security_invoker = true);

-- Migration: 20260228004612_68f2b648-54a1-42eb-b220-53ed6e68698b.sql

-- ============================================================
-- Phase 1: Create unified LISTINGS table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL,
  category TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  description_en TEXT,
  description_ru TEXT,
  slug TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  address TEXT,
  district TEXT,
  lat NUMERIC,
  lng NUMERIC,
  price NUMERIC,
  price_period TEXT,
  currency TEXT DEFAULT 'THB',
  phone TEXT,
  email TEXT,
  website TEXT,
  working_hours JSONB,
  provider_id UUID REFERENCES public.providers(id),
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_by_uno_team BOOLEAN DEFAULT false,
  uno_team_creator_id UUID,
  attributes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_vertical ON public.listings(vertical);
CREATE INDEX IF NOT EXISTS idx_listings_vertical_active ON public.listings(vertical, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_provider_id ON public.listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_listings_approval ON public.listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_district ON public.listings(district);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON public.listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_attributes ON public.listings USING gin(attributes);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read" ON public.listings
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND (approval_status = 'approved' OR approval_status IS NULL));

CREATE POLICY "listings_provider_manage" ON public.listings
  FOR ALL TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "listings_admin_full" ON public.listings
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'uno_team'::app_role))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'uno_team'::app_role))
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.fn_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.fn_listings_updated_at();

-- Migration: 20260228004628_4b2672a7-434d-460e-ba24-2cfd39388e66.sql

-- Fix search_path security warning
CREATE OR REPLACE FUNCTION public.fn_listings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

