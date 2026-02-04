-- Category suggestions table for vendor-proposed categories
-- Follows Etsy/Amazon model where vendors can request new categories

CREATE TABLE public.category_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  suggestion_type TEXT NOT NULL DEFAULT 'product' CHECK (suggestion_type IN ('product', 'service')),
  category_name_en TEXT NOT NULL,
  category_name_ru TEXT,
  description TEXT,
  example_items TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  merged_to_category_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions"
  ON public.category_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create suggestions
CREATE POLICY "Users can create suggestions"
  ON public.category_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON public.category_suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
  ON public.category_suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_category_suggestions_status ON public.category_suggestions(status, created_at DESC);
CREATE INDEX idx_category_suggestions_user ON public.category_suggestions(user_id);

-- Update timestamp trigger
CREATE TRIGGER update_category_suggestions_updated_at
  BEFORE UPDATE ON public.category_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();