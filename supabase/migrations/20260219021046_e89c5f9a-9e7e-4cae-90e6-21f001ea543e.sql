
-- =====================================================
-- 1. PROPERTY COMPLEXES (Группировка объектов по комплексам)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_complexes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,  -- УК / владелец создающий комплекс
  name text NOT NULL,
  name_ru text,
  description text,
  address text,
  district text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_complexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own complexes"
  ON public.property_complexes
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Add complex_id to owner_properties
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS complex_id uuid REFERENCES public.property_complexes(id) ON DELETE SET NULL;

-- =====================================================
-- 2. STAFF MEMBERS (Реестр сотрудников УК)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,  -- УК / владелец, которому принадлежит сотрудник
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',  -- cleaner | maintenance | manager | admin | staff
  phone text,
  email text,
  notes text,
  hourly_rate numeric(10,2),
  daily_rate numeric(10,2),
  monthly_salary numeric(10,2),
  pay_type text NOT NULL DEFAULT 'salary',  -- salary | hourly | daily | per_task
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own staff"
  ON public.staff_members
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Staff assignments to properties
CREATE TABLE IF NOT EXISTS public.staff_property_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,  -- references owner_properties.id
  owner_id uuid NOT NULL,
  role_at_property text,  -- specific role for this property (may differ from general role)
  is_primary boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their staff assignments"
  ON public.staff_property_assignments
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- 3. COST SOURCE (Своих vs внешние — поле в финансах)
-- =====================================================
-- Add cost_source column to existing property_financials table
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS cost_source text DEFAULT 'external' CHECK (cost_source IN ('internal', 'external', 'mixed'));

-- Add staff_member_id link for internal costs
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL;

-- =====================================================
-- 4. AUTO-UPDATED timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_complexes_updated_at
  BEFORE UPDATE ON public.property_complexes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
