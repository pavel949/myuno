
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
