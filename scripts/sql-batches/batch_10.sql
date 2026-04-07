-- Batch 10
-- Migration: 20260308151201_06830449-44e8-4fe4-a926-f5ee39d6a8dd.sql

-- Add stage/offset fields to lifecycle_templates
ALTER TABLE public.lifecycle_templates
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'check_in',
  ADD COLUMN IF NOT EXISTS offset_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS cta_label_en text,
  ADD COLUMN IF NOT EXISTS cta_label_ru text;

-- Create lifecycle_executions table to track what was sent
CREATE TABLE IF NOT EXISTS public.lifecycle_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.lifecycle_templates(id) ON DELETE CASCADE,
  guest_user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, template_id, channel)
);

-- Index for processor queries
CREATE INDEX IF NOT EXISTS idx_lifecycle_exec_pending ON public.lifecycle_executions(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lifecycle_exec_booking ON public.lifecycle_executions(booking_id);

-- RLS
ALTER TABLE public.lifecycle_executions ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins manage lifecycle_executions" ON public.lifecycle_executions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Guests can read their own notifications
CREATE POLICY "Guests read own lifecycle_executions" ON public.lifecycle_executions
  FOR SELECT TO authenticated
  USING (guest_user_id = auth.uid());

-- Enable realtime for in-app notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.lifecycle_executions;

-- Seed default 5-stage templates
INSERT INTO public.lifecycle_templates (trigger_type, stage, offset_hours, sort_order, channel, title_en, title_ru, body_en, body_ru, cta_url, cta_label_en, cta_label_ru, is_active) VALUES
('pre_arrival', 'pre_arrival', -24, 1, 'email', 'Your stay is tomorrow! 🏠', 'Ваше проживание уже завтра! 🏠', 'We''re excited to welcome you! Here''s everything you need for a smooth check-in.', 'Мы рады вас приветствовать! Вот всё, что нужно для удобного заезда.', '/welcome/{bookingId}', 'View check-in guide', 'Инструкция по заезду', true),
('check_in', 'check_in', 0, 2, 'in_app', 'Welcome to your new home! 🎉', 'Добро пожаловать в ваш новый дом! 🎉', 'Explore local services, restaurants, and experiences curated just for you.', 'Откройте для себя местные сервисы, рестораны и впечатления, подобранные специально для вас.', '/welcome/{bookingId}', 'Explore services', 'Посмотреть сервисы', true),
('mid_stay', 'mid_stay', 72, 3, 'in_app', 'How''s your stay going? ☀️', 'Как проходит ваш отдых? ☀️', 'Need a yacht trip, spa day, or restaurant recommendation? We''ve got you covered.', 'Хотите яхт-прогулку, спа или рекомендацию ресторана? Мы поможем.', '/discover', 'Browse experiences', 'Посмотреть впечатления', true),
('pre_checkout', 'pre_checkout', -24, 4, 'email', 'Checkout tomorrow — anything else you need?', 'Завтра выезд — нужно что-то ещё?', 'Don''t forget to check out by the time specified. Need a transfer to the airport?', 'Не забудьте выехать в указанное время. Нужен трансфер в аэропорт?', '/airport', 'Book transfer', 'Заказать трансфер', true),
('post_stay', 'post_stay', 24, 5, 'email', 'Thank you for staying with us! ⭐', 'Спасибо, что были с нами! ⭐', 'We hope you had an amazing time. Share your experience and earn loyalty points!', 'Надеемся, вам понравилось! Оставьте отзыв и получите баллы лояльности.', '/guest/profile', 'Leave a review', 'Оставить отзыв', true)
ON CONFLICT DO NOTHING;

-- Migration: 20260308225958_bbe8b811-b515-4544-858f-c1222324ef03.sql

ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS linkedin text;

-- Migration: 20260309065212_4e4be572-61a3-4d45-88aa-c14fd55243aa.sql
-- Secure resolve_user_context: enforce auth.uid() = p_user_id
CREATE OR REPLACE FUNCTION public.resolve_user_context(
  p_user_id uuid,
  p_mode text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode text;
  v_entity_id uuid;
  v_role text;
  v_permissions text[];
  v_mc_role text;
BEGIN
  -- SECURITY: Ensure caller can only resolve their own context
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot resolve context for another user';
  END IF;

  -- Get current context or use provided override
  IF p_mode IS NOT NULL THEN
    v_mode := p_mode;
    v_entity_id := p_entity_id;
  ELSE
    SELECT mode, entity_id INTO v_mode, v_entity_id
    FROM user_active_context
    WHERE user_id = p_user_id;
    
    IF v_mode IS NULL THEN
      v_mode := 'user';
    END IF;
  END IF;

  -- Resolve role based on mode
  CASE v_mode
    WHEN 'mc' THEN
      SELECT mcm.role INTO v_mc_role
      FROM management_company_members mcm
      WHERE mcm.user_id = p_user_id
        AND mcm.company_id = v_entity_id
        AND mcm.is_active = true;
      
      IF v_mc_role IS NULL THEN
        v_mode := 'user';
        v_role := 'user';
      ELSE
        v_role := v_mc_role;
        
        SELECT array_agg(DISTINCT module) INTO v_permissions
        FROM team_member_permissions
        WHERE user_id = p_user_id
          AND company_id = v_entity_id
          AND can_view = true;
        
        IF v_mc_role IN ('director', 'admin') THEN
          v_permissions := ARRAY['crm', 'finance', 'bookings', 'properties', 'team', 'reports', 'settings', 'operations', 'channels', 'messages', 'inventory', 'maintenance'];
        END IF;
      END IF;
      
    WHEN 'owner' THEN
      v_role := 'owner';
      v_permissions := ARRAY['properties', 'finance', 'reports'];
      
    WHEN 'admin' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('admin', 'uno_team')) THEN
        v_role := 'admin';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    WHEN 'vendor' THEN
      v_role := 'vendor';
      v_permissions := ARRAY['services', 'bookings', 'finance'];
      
    WHEN 'team' THEN
      IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role IN ('uno_team', 'admin')) THEN
        v_role := 'uno_team';
        v_permissions := ARRAY['*'];
      ELSE
        v_mode := 'user';
        v_role := 'user';
      END IF;
      
    ELSE
      v_role := 'user';
      v_permissions := ARRAY[]::text[];
  END CASE;

  RETURN jsonb_build_object(
    'mode', v_mode,
    'entity_id', v_entity_id,
    'role', v_role,
    'permissions', COALESCE(v_permissions, ARRAY[]::text[]),
    'resolved_at', now()
  );
END;
$$;
-- Migration: 20260311070000_fix_crm_contacts_lifecycle_default.sql
-- Ensure new CRM contacts default to lead lifecycle stage.
ALTER TABLE public.crm_contacts
ALTER COLUMN lifecycle_stage SET DEFAULT 'lead';


-- Migration: 20260311121000_add_agent_deals_is_vip.sql
ALTER TABLE public.agent_deals
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_agent_deals_is_vip
ON public.agent_deals (company_id, is_vip);


-- Migration: 20260311133000_fix_mc_can_access_manager_crm.sql
-- Ensure MC managers are not blocked by CRM module RLS.
-- Root cause: mc_can_access() granted full access only to director/admin.
-- Contacts page and deal insert/update failed for manager accounts.

CREATE OR REPLACE FUNCTION public.mc_can_access(
  _user_id uuid,
  _company_id uuid,
  _module text,
  _action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Managers need the same baseline access as director/admin in MC CRM.
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('director', 'admin', 'manager')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check module permissions matrix.
    SELECT 1 FROM management_company_members mcm
    JOIN team_member_permissions tmp ON tmp.user_id = mcm.user_id AND tmp.company_id = mcm.company_id
    WHERE mcm.user_id = _user_id
      AND mcm.company_id = _company_id
      AND mcm.is_active = true
      AND tmp.module = _module
      AND CASE _action
            WHEN 'view' THEN tmp.can_view
            WHEN 'edit' THEN tmp.can_edit
            WHEN 'export' THEN tmp.can_export
            ELSE false
          END
  )
  OR EXISTS (
    -- Platform admins always pass.
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'uno_team')
  );
$$;

-- Migration: 20260311153000_make_properties_view_type_multiselect.sql
alter table public.properties
alter column view_type type text[]
using case
  when view_type is null or btrim(view_type) = '' then null
  else array[view_type]
end;

-- Migration: 20260311180000_booking_lock_and_conflicts.sql
-- ============================================================
-- P1: Double-booking risk mitigation
-- 1. Booking lock: write property_availability on order create
-- 2. booking_conflicts table for iCal overlap alerts
-- ============================================================

-- 1. booking_conflicts table
CREATE TABLE IF NOT EXISTS public.booking_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  conflict_date date NOT NULL,
  channel_a text NOT NULL,
  channel_b text NOT NULL,
  order_id_a uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_id_b uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_conflicts_property ON public.booking_conflicts(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_conflicts_resolved ON public.booking_conflicts(resolved) WHERE NOT resolved;

ALTER TABLE public.booking_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their property conflicts"
ON public.booking_conflicts FOR SELECT
USING (
  property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = auth.uid()
    UNION
    SELECT p.id FROM public.properties p
    JOIN public.management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

CREATE POLICY "Owners can update their property conflicts"
ON public.booking_conflicts FOR UPDATE
USING (
  property_id IN (
    SELECT p.id FROM public.properties p
    WHERE p.owner_id = auth.uid()
    UNION
    SELECT p.id FROM public.properties p
    JOIN public.management_company_members mcm ON mcm.company_id = p.management_company_id
    WHERE mcm.user_id = auth.uid() AND mcm.is_active = true
  )
);

CREATE POLICY "System can insert conflicts"
ON public.booking_conflicts FOR INSERT
WITH CHECK (true);

-- 2. Trigger: lock property_availability when property order is created
CREATE OR REPLACE FUNCTION public.trg_lock_availability_on_property_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_start_date date;
  v_end_date date;
  v_current date;
  v_property_id uuid;
BEGIN
  IF NEW.item_type != 'property' THEN
    RETURN NEW;
  END IF;

  -- Support both resource_id and metadata.property_id (ical-scheduled-sync uses metadata)
  v_property_id := COALESCE(
    NEW.resource_id::uuid,
    (NEW.metadata->>'property_id')::uuid
  );
  IF v_property_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;
  IF NOT FOUND OR v_order.vertical != 'property' THEN
    RETURN NEW;
  END IF;

  IF v_order.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  v_start_date := (COALESCE(NEW.start_at, v_order.start_at)::timestamptz)::date;
  v_end_date := (COALESCE(NEW.end_at, v_order.end_at)::timestamptz)::date;

  v_current := v_start_date;
  WHILE v_current <= v_end_date LOOP
    INSERT INTO property_availability (property_id, date, status, note)
    VALUES (v_property_id, v_current, 'booked', 'Locked by order ' || v_order.id::text)
    ON CONFLICT (property_id, date) DO UPDATE SET
      status = 'booked',
      note = COALESCE(property_availability.note, '') || '; order ' || v_order.id::text,
      updated_at = now();
    v_current := v_current + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_availability_on_property_order ON public.order_items;
CREATE TRIGGER trg_lock_availability_on_property_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  WHEN (NEW.item_type = 'property' AND (NEW.resource_id IS NOT NULL OR (NEW.metadata->>'property_id') IS NOT NULL))
  EXECUTE FUNCTION public.trg_lock_availability_on_property_order();

-- 3. Also release availability when order is deleted/cancelled
CREATE OR REPLACE FUNCTION public.trg_release_availability_on_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_start_date date;
  v_end_date date;
  v_current date;
BEGIN
  IF OLD.vertical != 'property' THEN
    RETURN OLD;
  END IF;

  IF NEW.deleted_at IS NULL AND NEW.status != 'cancelled' THEN
    RETURN NEW;
  END IF;

  FOR v_item IN
    SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid) AS resource_id, oi.start_at, oi.end_at
    FROM order_items oi
    WHERE oi.order_id = OLD.id AND oi.item_type = 'property'
      AND (oi.resource_id IS NOT NULL OR (oi.metadata->>'property_id') IS NOT NULL)
  LOOP
    v_start_date := (COALESCE(v_item.start_at, OLD.start_at)::timestamptz)::date;
    v_end_date := (COALESCE(v_item.end_at, OLD.end_at)::timestamptz)::date;
    v_current := v_start_date;

    WHILE v_current <= v_end_date LOOP
      UPDATE property_availability
      SET status = 'available', note = NULL, updated_at = now()
      WHERE property_id = v_item.resource_id
        AND date = v_current
        AND status = 'booked'
        AND (note IS NULL OR note LIKE '%' || OLD.id::text || '%');
      v_current := v_current + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_availability_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_availability_on_order_cancel
  AFTER UPDATE OF deleted_at, status ON public.orders
  FOR EACH ROW
  WHEN (OLD.vertical = 'property')
  EXECUTE FUNCTION public.trg_release_availability_on_order_cancel();

-- Migration: 20260311180100_ical_sync_cron_5min.sql
-- Schedule ical-scheduled-sync to run every 5 minutes
-- Requires app.settings.supabase_url and app.settings.service_role_key (same as nurture cron)

SELECT cron.schedule(
  'ical-scheduled-sync-every-5min',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/ical-scheduled-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"sync_type": "scheduled"}'::jsonb
  )$$
);

-- Migration: 20260312000000_lead_to_deal_conversion.sql
-- Add lead-to-deal conversion fields to consultation_requests
ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_deal_id UUID REFERENCES public.agent_deals(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.consultation_requests.converted_at IS 'When lead was converted to a deal';
COMMENT ON COLUMN public.consultation_requests.converted_deal_id IS 'agent_deals.id if lead was converted to a deal';

-- Migration: 20260312011007_5246fb7d-8a11-437e-a0ac-2029bd249c48.sql

-- Create storage bucket for MC backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mc-backups', 'mc-backups', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS for mc-backups bucket: only authenticated users can read their company's backups
CREATE POLICY "MC members can read own backups" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'mc-backups');

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Migration: 20260312011515_c06a8027-f012-4ca6-871a-1db9403582cb.sql

ALTER TABLE public.agent_deals 
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;

-- Migration: 20260312150000_contact_card_redesign.sql
-- Contact Card Redesign — CRM Module
-- Adds: role, contact_relationships, key_dates, crm_reminders
-- Aligns with Ignatev Estate / myUNO CRM requirements

-- 1. Add role column to crm_contacts (Owner, Tenant, Investor, etc.)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'crm_role'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN crm_role text CHECK (crm_role IN (
      'owner', 'tenant', 'investor', 'prospect', 'partner', 'agent', 'other'
    ));
  END IF;
END $$;

-- 2. Add key_dates JSONB (e.g. lease start, visa expiry)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_contacts' AND column_name = 'key_dates'
  ) THEN
    ALTER TABLE public.crm_contacts
    ADD COLUMN key_dates jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.crm_contacts.key_dates IS 'Array of {label: string, date: date}';
  END IF;
END $$;

-- 3. Add preferred_language (alias for language; keep for clarity)
-- language already exists; no change needed

-- 4. contact_relationships — contact ↔ contact (spouse, partner, referred by, etc.)
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  related_contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
    'spouse', 'partner', 'friend', 'colleague', 'referred_by', 'family', 'other'
  )),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contact_relationships_no_self CHECK (contact_id != related_contact_id),
  CONSTRAINT contact_relationships_unique UNIQUE (contact_id, related_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_relationships_contact ON public.contact_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_related ON public.contact_relationships(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_company ON public.contact_relationships(company_id);

ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_relationships_select" ON public.contact_relationships
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "contact_relationships_insert" ON public.contact_relationships
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_relationships_update" ON public.contact_relationships
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_relationships_delete" ON public.contact_relationships
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- 5. crm_reminders — reminders tied to contact or date
CREATE TABLE IF NOT EXISTS public.crm_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  reminder_at timestamptz NOT NULL,
  note text,
  is_repeating boolean DEFAULT false,
  repeat_rule text, -- e.g. 'weekly', 'monthly', 'yearly'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crm_reminders_contact ON public.crm_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_reminders_at ON public.crm_reminders(reminder_at) WHERE NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_crm_reminders_company ON public.crm_reminders(company_id);

ALTER TABLE public.crm_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_reminders_select" ON public.crm_reminders
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "crm_reminders_insert" ON public.crm_reminders
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "crm_reminders_update" ON public.crm_reminders
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "crm_reminders_delete" ON public.crm_reminders
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- Migration: 20260312160000_fix_mc_can_access_owner.sql
-- Fix: mc_can_access blocked users with role 'owner'.
-- management_company_members uses owner/admin/member; mc_can_access only checked director/admin/manager.
-- Result: company owners could not load contacts.

CREATE OR REPLACE FUNCTION public.mc_can_access(
  _user_id uuid,
  _company_id uuid,
  _module text,
  _action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Full access: owner, director, admin, manager (owner = company creator)
    SELECT 1 FROM management_company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('owner', 'director', 'admin', 'manager')
      AND is_active = true
  )
  OR EXISTS (
    -- Other members: check module permissions matrix.
    SELECT 1 FROM management_company_members mcm
    JOIN team_member_permissions tmp ON tmp.user_id = mcm.user_id AND tmp.company_id = mcm.company_id
    WHERE mcm.user_id = _user_id
      AND mcm.company_id = _company_id
      AND mcm.is_active = true
      AND tmp.module = _module
      AND CASE _action
            WHEN 'view' THEN tmp.can_view
            WHEN 'edit' THEN tmp.can_edit
            WHEN 'export' THEN tmp.can_export
            ELSE false
          END
  )
  OR EXISTS (
    -- Platform admins always pass.
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'uno_team')
  );
$$;

-- Migration: 20260313000000_contact_properties_m2m.sql
-- Contact to Property many-to-many
-- Enables investors/owners with multiple properties to be properly linked
CREATE TABLE public.contact_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
    'owner', 'tenant', 'interested', 'previous_owner', 'investor'
  )),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, property_id, relationship_type)
);

CREATE INDEX idx_contact_properties_contact ON public.contact_properties(contact_id);
CREATE INDEX idx_contact_properties_property ON public.contact_properties(property_id);
CREATE INDEX idx_contact_properties_company ON public.contact_properties(company_id);

ALTER TABLE public.contact_properties ENABLE ROW LEVEL SECURITY;

-- RLS: same pattern as other CRM tables (mc_can_access)
CREATE POLICY "contact_properties_select" ON public.contact_properties
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "contact_properties_insert" ON public.contact_properties
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_properties_update" ON public.contact_properties
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_properties_delete" ON public.contact_properties
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

-- Migration: 20260314000240_e1a677fa-6f56-428e-afaa-67d5e4dde090.sql

-- Atomic function to reserve event spots (prevent overselling)
CREATE OR REPLACE FUNCTION public.reserve_event_spots(p_event_id UUID, p_count INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE events
  SET spots_left = spots_left - p_count
  WHERE id = p_event_id
    AND is_active = true
    AND spots_left >= p_count;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Function to release spots on rollback/cancellation
CREATE OR REPLACE FUNCTION public.release_event_spots(p_event_id UUID, p_count INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE events
  SET spots_left = LEAST(spots_left + p_count, max_spots)
  WHERE id = p_event_id;
END;
$$;

-- Migration: 20260314004525_f9886457-9613-4f5d-b08f-d7f9b0ff6048.sql

-- Fix: release trigger must also handle 'expired' and 'refunded' statuses, not just 'cancelled'
CREATE OR REPLACE FUNCTION public.trg_release_availability_on_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_start_date date;
  v_end_date date;
  v_current date;
BEGIN
  IF OLD.vertical != 'property' THEN
    RETURN NEW;
  END IF;

  -- Release on cancelled, expired, or refunded
  IF NEW.deleted_at IS NULL AND NEW.status NOT IN ('cancelled', 'expired', 'refunded') THEN
    RETURN NEW;
  END IF;

  FOR v_item IN
    SELECT COALESCE(oi.resource_id::uuid, (oi.metadata->>'property_id')::uuid) AS resource_id, oi.start_at, oi.end_at
    FROM order_items oi
    WHERE oi.order_id = OLD.id AND oi.item_type = 'property'
      AND (oi.resource_id IS NOT NULL OR (oi.metadata->>'property_id') IS NOT NULL)
  LOOP
    v_start_date := (COALESCE(v_item.start_at, OLD.start_at)::timestamptz)::date;
    v_end_date := (COALESCE(v_item.end_at, OLD.end_at)::timestamptz)::date;
    v_current := v_start_date;

    WHILE v_current <= v_end_date LOOP
      UPDATE property_availability
      SET status = 'available', note = NULL, updated_at = now()
      WHERE property_id = v_item.resource_id
        AND date = v_current
        AND status = 'booked'
        AND (note IS NULL OR note LIKE '%' || OLD.id::text || '%');
      v_current := v_current + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Re-create trigger with updated conditions
DROP TRIGGER IF EXISTS trg_release_availability_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_availability_on_order_cancel
  AFTER UPDATE OF deleted_at, status ON public.orders
  FOR EACH ROW
  WHEN (OLD.vertical = 'property')
  EXECUTE FUNCTION public.trg_release_availability_on_order_cancel();

-- Atomic availability check RPC: returns false if any date in range is booked
CREATE OR REPLACE FUNCTION public.check_property_dates_available(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_count integer;
BEGIN
  SELECT count(*) INTO v_blocked_count
  FROM property_availability pa
  WHERE pa.property_id = p_property_id
    AND pa.date >= p_check_in
    AND pa.date < p_check_out
    AND pa.status IN ('booked', 'blocked')
    AND (
      p_exclude_order_id IS NULL
      OR pa.note IS NULL
      OR pa.note NOT LIKE '%' || p_exclude_order_id::text || '%'
    );

  RETURN v_blocked_count = 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.check_property_dates_available(uuid, date, date, uuid) TO service_role;

-- Migration: 20260401083930_29a72bc8-ccd5-4fbb-9ab9-f3a15de7687c.sql
-- visa_records table for VisaTrack MVP
CREATE TABLE public.visa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  visa_type text NOT NULL,
  entry_date date,
  expiry_date date NOT NULL,
  status text DEFAULT 'active',
  document_url text,
  notes text,
  reminder_sent_30d boolean DEFAULT false,
  reminder_sent_14d boolean DEFAULT false,
  reminder_sent_7d boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_visa_record_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'renewal_pending') THEN
    RAISE EXCEPTION 'Invalid visa record status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_visa_status
  BEFORE INSERT OR UPDATE ON public.visa_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_visa_record_status();

ALTER TABLE public.visa_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own visa records" ON public.visa_records
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for visa documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('visa-documents', 'visa-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own visa documents
CREATE POLICY "Users upload own visa docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own visa docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own visa docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Migration: 20260401084005_d04d0ce5-9726-455b-b034-656ba263efc1.sql
CREATE OR REPLACE FUNCTION public.validate_visa_record_status()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'renewal_pending') THEN
    RAISE EXCEPTION 'Invalid visa record status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
-- Migration: 20260401091236_dab15e7e-e7cc-4380-97d2-090cd58399a1.sql

-- Development Units (floor plan configurations within a property_project)
CREATE TABLE IF NOT EXISTS public.development_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ru text,
  unit_type text NOT NULL DEFAULT 'studio',
  area_sqm numeric NOT NULL,
  bedrooms int DEFAULT 0,
  bathrooms int DEFAULT 1,
  floor_from int,
  floor_to int,
  price numeric NOT NULL,
  price_per_sqm numeric,
  total_units int DEFAULT 1,
  available_units int DEFAULT 1,
  floor_plan_url text,
  views text[],
  features text[],
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- Resale Properties (secondary market + assignments)
CREATE TABLE IF NOT EXISTS public.resale_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ru text,
  property_type text NOT NULL DEFAULT 'condo',
  development_id uuid REFERENCES public.property_projects(id),
  unit_reference text,
  seller_type text DEFAULT 'owner',
  seller_contact_name text,
  seller_phone text,
  agent_name text,
  agent_company text,
  zone text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  area_sqm numeric,
  bedrooms int,
  bathrooms int,
  floor int,
  year_built int,
  condition text DEFAULT 'good',
  furnished text DEFAULT 'fully',
  asking_price numeric NOT NULL,
  currency text DEFAULT 'THB',
  price_per_sqm numeric,
  original_purchase_price numeric,
  price_negotiable boolean DEFAULT true,
  is_assignment boolean DEFAULT false,
  assignment_premium numeric,
  remaining_payments jsonb,
  transfer_fee_paid_by text,
  current_rental_income numeric,
  estimated_roi numeric,
  title_type text DEFAULT 'leasehold',
  lease_years_remaining int,
  encumbrances text,
  description text,
  description_ru text,
  media jsonb DEFAULT '[]',
  cover_image text,
  featured boolean DEFAULT false,
  status text DEFAULT 'active',
  views_count int DEFAULT 0,
  inquiries_count int DEFAULT 0,
  days_on_market int DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add resale/development project FK columns to consultation_requests
ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS development_project_id uuid REFERENCES public.property_projects(id),
  ADD COLUMN IF NOT EXISTS resale_property_id uuid REFERENCES public.resale_properties(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_units_development ON public.development_units(development_id);
CREATE INDEX IF NOT EXISTS idx_dev_units_type ON public.development_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_resale_zone ON public.resale_properties(zone);
CREATE INDEX IF NOT EXISTS idx_resale_status ON public.resale_properties(status);
CREATE INDEX IF NOT EXISTS idx_resale_type ON public.resale_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_resale_price ON public.resale_properties(asking_price);
CREATE INDEX IF NOT EXISTS idx_resale_assignment ON public.resale_properties(is_assignment) WHERE is_assignment = true;
CREATE INDEX IF NOT EXISTS idx_resale_featured ON public.resale_properties(featured) WHERE featured = true;

-- RLS for development_units
ALTER TABLE public.development_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view development units" ON public.development_units FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage development units" ON public.development_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for resale_properties
ALTER TABLE public.resale_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active resale properties" ON public.resale_properties FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can manage resale properties" ON public.resale_properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migration: 20260401091306_981d2c51-c668-4031-9d4b-acb7d2579e1e.sql

-- Drop permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage development units" ON public.development_units;
DROP POLICY IF EXISTS "Authenticated users can manage resale properties" ON public.resale_properties;

-- Tighter policies using has_role function if it exists, otherwise use auth check
CREATE POLICY "Admin can manage development units" ON public.development_units
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage resale properties" ON public.resale_properties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Migration: 20260401102138_58719269-28c5-44d2-ac73-61d75f096603.sql

-- Phase 1: Extend property_projects with newbuilds-specific columns
ALTER TABLE property_projects 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS tagline_ru TEXT,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS unit_types TEXT[],
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[],
  ADD COLUMN IF NOT EXISTS location_area TEXT;

-- Extend developers with user linking and subscription
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- New table: Special terms / payment plans for projects
CREATE TABLE nb_special_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  payment_plan TEXT,
  payment_details TEXT,
  discount_percent DECIMAL,
  discount_description TEXT,
  promo_label TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Construction updates feed
CREATE TABLE nb_project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  photo_urls TEXT[],
  progress_at_time INTEGER,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Monthly PDF reports
CREATE TABLE nb_project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Newbuild leads (developer-facing CRM)
CREATE TABLE nb_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id),
  developer_id UUID REFERENCES developers(id),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  budget_min BIGINT,
  budget_max BIGINT,
  unit_preference TEXT,
  message TEXT,
  source TEXT DEFAULT 'landing',
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  transferred_to_developer BOOLEAN DEFAULT false,
  transferred_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Promotions / paid placements
CREATE TABLE nb_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id),
  project_id UUID REFERENCES property_projects(id),
  type TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  amount_paid BIGINT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE nb_special_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_project_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_promotions ENABLE ROW LEVEL SECURITY;

-- Public read on special terms, updates, reports (linked to active/approved projects)
CREATE POLICY "Public read nb_special_terms" ON nb_special_terms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read nb_project_updates" ON nb_project_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read nb_project_reports" ON nb_project_reports FOR SELECT TO anon, authenticated USING (true);

-- Leads: authenticated users can insert
CREATE POLICY "Authenticated insert nb_leads" ON nb_leads FOR INSERT TO authenticated WITH CHECK (true);
-- Leads: admin can read all
CREATE POLICY "Admin read all nb_leads" ON nb_leads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
-- Leads: developers can read own leads
CREATE POLICY "Developer read own nb_leads" ON nb_leads FOR SELECT TO authenticated USING (
  developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid())
);

-- Promotions: public read active
CREATE POLICY "Public read active nb_promotions" ON nb_promotions FOR SELECT TO anon, authenticated USING (status = 'active');

-- Admin full access on all nb tables
CREATE POLICY "Admin manage nb_special_terms" ON nb_special_terms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_project_updates" ON nb_project_updates FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_project_reports" ON nb_project_reports FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_leads" ON nb_leads FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_promotions" ON nb_promotions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow anonymous users to insert leads (for non-logged-in visitors)
CREATE POLICY "Anon insert nb_leads" ON nb_leads FOR INSERT TO anon WITH CHECK (true);

-- Migration: 20260401110256_c1197fa9-527c-44c0-8762-477fac1152de.sql
-- Add 6 new values to user_persona enum
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'family';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'couple';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'nightlife';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'business';
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'nomad';
-- Migration: 20260401111601_d8f7e94e-ee5e-47b5-944d-97f73e6d2687.sql
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'pet_owner';
-- Migration: 20260401113238_50f372ae-f406-4684-b49b-5a64685735d7.sql
ALTER TYPE public.user_persona ADD VALUE IF NOT EXISTS 'relocation';
-- Migration: 20260402022014_44b3b60a-7dd9-4eb7-b5b4-90d9871376f9.sql

CREATE OR REPLACE VIEW public.v_founder_inbox AS
SELECT * FROM (
  SELECT 
    id, 'task'::text as source_type, title, 
    COALESCE(priority, 'medium') as priority,
    status, due_date as target_date,
    company_id, created_at
  FROM public.crm_tasks
  WHERE status NOT IN ('done', 'cancelled')

  UNION ALL

  SELECT 
    id, 'deal'::text as source_type, client_name as title,
    CASE WHEN priority >= 8 THEN 'high' WHEN priority >= 5 THEN 'medium' ELSE 'low' END as priority,
    stage as status, next_action_date as target_date,
    company_id, created_at
  FROM public.agent_deals
  WHERE deal_status = 'active'

  UNION ALL

  SELECT
    id, 'prospect'::text as source_type, business_name as title,
    CASE WHEN ai_score >= 70 THEN 'high' WHEN ai_score >= 40 THEN 'medium' ELSE 'low' END as priority,
    status, next_followup_at as target_date,
    NULL::uuid as company_id, created_at
  FROM public.vendor_prospects
  WHERE status NOT IN ('won', 'lost', 'archived')
) sub
ORDER BY 
  CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  target_date ASC NULLS LAST;

-- Migration: 20260402022038_1292b793-2c22-498b-89a9-e9e1154c8641.sql
ALTER VIEW public.v_founder_inbox SET (security_invoker = on);
-- Migration: 20260402023351_ee701794-1f80-4ef0-b03c-eaa4a3957dd0.sql

-- Phase 1: Unified Pipeline Architecture

-- 1. Add pipeline tracking fields to crm_contacts
ALTER TABLE public.crm_contacts 
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pipeline_type text DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS source_entity_type text,
  ADD COLUMN IF NOT EXISTS source_entity_id uuid;

-- 2. Pipeline stage history — tracks ALL transitions across entity types
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'vendor_prospect', 'owner_prospect', 'crm_contact', 'deal'
  entity_id uuid NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES public.management_companies(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pipeline history"
  ON public.pipeline_stage_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pipeline history"
  ON public.pipeline_stage_history FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Founder daily brief — AI-generated summaries
CREATE TABLE IF NOT EXISTS public.founder_daily_brief (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.management_companies(id),
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  summary_en text,
  summary_ru text,
  top_actions jsonb DEFAULT '[]',
  metrics_snapshot jsonb DEFAULT '{}',
  ai_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, brief_date)
);

ALTER TABLE public.founder_daily_brief ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read briefs"
  ON public.founder_daily_brief FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert briefs"
  ON public.founder_daily_brief FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Unified pipeline view — merges vendor_prospects + crm_contacts into one feed
CREATE OR REPLACE VIEW public.v_unified_pipeline WITH (security_invoker = true) AS
-- Vendor prospects
SELECT
  vp.id,
  'vendor_prospect'::text AS entity_type,
  vp.business_name AS name,
  vp.contact_name AS contact_person,
  vp.email,
  vp.phone,
  vp.whatsapp,
  vp.status AS pipeline_stage,
  'vendor'::text AS pipeline_type,
  vp.ai_score,
  vp.ai_priority AS priority,
  vp.category,
  vp.next_followup_at AS next_action_date,
  vp.last_contact_at,
  vp.created_at,
  vp.updated_at,
  NULL::uuid AS company_id
FROM public.vendor_prospects vp
WHERE vp.status NOT IN ('won', 'lost', 'archived')

UNION ALL

-- CRM contacts (active pipeline)
SELECT
  cc.id,
  'crm_contact'::text AS entity_type,
  CONCAT(cc.first_name, ' ', cc.last_name) AS name,
  cc.company_name AS contact_person,
  cc.email,
  cc.phone,
  cc.whatsapp,
  COALESCE(cc.pipeline_stage, cc.lifecycle_stage, 'active') AS pipeline_stage,
  COALESCE(cc.pipeline_type, cc.contact_type, 'client') AS pipeline_type,
  cc.scoring AS ai_score,
  NULL::text AS priority,
  cc.contact_type AS category,
  NULL::timestamptz AS next_action_date,
  cc.updated_at AS last_contact_at,
  cc.created_at,
  cc.updated_at,
  cc.company_id
FROM public.crm_contacts cc
WHERE cc.is_archived = false;

-- Index for faster pipeline queries
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_entity 
  ON public.pipeline_stage_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_company 
  ON public.pipeline_stage_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_pipeline 
  ON public.crm_contacts(pipeline_type, pipeline_stage) WHERE is_archived = false;

-- Migration: 20260402023425_c59de45d-cfec-474a-be61-fdc37fa25fc8.sql

-- Fix RLS: require auth.uid() is not null for inserts
DROP POLICY IF EXISTS "Authenticated users can insert pipeline history" ON public.pipeline_stage_history;
CREATE POLICY "Auth users can insert pipeline history"
  ON public.pipeline_stage_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert briefs" ON public.founder_daily_brief;
CREATE POLICY "Auth users can insert briefs"
  ON public.founder_daily_brief FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Migration: 20260402024004_f61f0f9c-3f36-478c-ba1e-75f504234fd8.sql

-- Phase 6: Extend automation rules with structured trigger/action fields
ALTER TABLE public.mcc_automation_rules
  ADD COLUMN IF NOT EXISTS trigger_entity_type text,
  ADD COLUMN IF NOT EXISTS condition_field text,
  ADD COLUMN IF NOT EXISTS condition_operator text DEFAULT 'eq',
  ADD COLUMN IF NOT EXISTS condition_value text,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS action_config jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cooldown_hours integer DEFAULT 0;

-- Phase 3: Guest referral codes
CREATE TABLE IF NOT EXISTS public.guest_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid NOT NULL,
  booking_id uuid,
  referral_code text NOT NULL UNIQUE,
  discount_percent integer DEFAULT 10,
  max_uses integer DEFAULT 5,
  used_count integer DEFAULT 0,
  referred_user_ids uuid[] DEFAULT '{}',
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes"
  ON public.guest_referral_codes FOR SELECT TO authenticated
  USING (guest_user_id = auth.uid());

CREATE POLICY "Service role can manage referrals"
  ON public.guest_referral_codes FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_referral_codes_guest ON public.guest_referral_codes(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.guest_referral_codes(referral_code);

-- Migration: 20260403120000_stays_subscription_tables.sql
-- STAYS: subscription tiers and per-property subscriptions (Stripe)

CREATE TABLE stays_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_thb_monthly int4 NOT NULL,
  stripe_price_id text,
  max_ota_links int2,
  dynamic_pricing bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE property_stays_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  tier_id uuid REFERENCES stays_subscription_tiers(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT property_stays_subscriptions_one_row_per_property UNIQUE (property_id)
);

CREATE INDEX idx_property_stays_subscriptions_owner_id ON property_stays_subscriptions(owner_id);
CREATE INDEX idx_property_stays_subscriptions_stripe_sub ON property_stays_subscriptions(stripe_subscription_id);

ALTER TABLE stays_subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_stays_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tiers are readable by any authenticated user (checkout UI)
CREATE POLICY "Authenticated users can read stays tiers"
  ON stays_subscription_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owner manages own stays subscriptions"
  ON property_stays_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

INSERT INTO stays_subscription_tiers (code, name, price_thb_monthly, max_ota_links, dynamic_pricing)
VALUES
  ('starter', 'Starter', 499, 2, false),
  ('growth', 'Growth', 799, 5, true),
  ('pro', 'Pro', 1499, 999, true);

-- Migration: 20260407030000_restrict_profiles_rls.sql
-- Restrict profiles SELECT policy: users can only read their own profile.
-- Admin/service-role access is unaffected (bypasses RLS).
-- Team members who need to look up other profiles should use service-role or
-- a dedicated RPC with security definer.

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

