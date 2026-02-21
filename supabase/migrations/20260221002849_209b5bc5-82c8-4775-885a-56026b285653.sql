
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
