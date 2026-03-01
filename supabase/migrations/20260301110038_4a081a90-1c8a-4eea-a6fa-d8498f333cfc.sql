
-- Extend financial_categories with classification metadata
ALTER TABLE public.financial_categories
  ADD COLUMN IF NOT EXISTS category_class text DEFAULT 'variable',
  ADD COLUMN IF NOT EXISTS category_group text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS affects_net_profit boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_tax_deductible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allocation_method text DEFAULT 'direct';

-- Extend company_category_settings with override fields
ALTER TABLE public.company_category_settings
  ADD COLUMN IF NOT EXISTS category_class text,
  ADD COLUMN IF NOT EXISTS category_group text,
  ADD COLUMN IF NOT EXISTS affects_net_profit boolean,
  ADD COLUMN IF NOT EXISTS is_tax_deductible boolean,
  ADD COLUMN IF NOT EXISTS allocation_method text,
  ADD COLUMN IF NOT EXISTS custom_name_en text,
  ADD COLUMN IF NOT EXISTS custom_name_ru text;
