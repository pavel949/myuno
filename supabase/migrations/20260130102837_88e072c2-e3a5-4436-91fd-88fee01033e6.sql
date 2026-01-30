-- Create provider payout methods table
CREATE TABLE public.provider_payout_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'bank_account',
  bank_code TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_holder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_payout_methods ENABLE ROW LEVEL SECURITY;

-- Providers can view their own payout methods
CREATE POLICY "Providers can view own payout methods"
ON public.provider_payout_methods
FOR SELECT
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can create their own payout methods
CREATE POLICY "Providers can create own payout methods"
ON public.provider_payout_methods
FOR INSERT
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can update their own payout methods
CREATE POLICY "Providers can update own payout methods"
ON public.provider_payout_methods
FOR UPDATE
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Providers can delete their own payout methods
CREATE POLICY "Providers can delete own payout methods"
ON public.provider_payout_methods
FOR DELETE
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

-- Admin access
CREATE POLICY "Admins can manage payout methods"
ON public.provider_payout_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_provider_payout_methods_updated_at
BEFORE UPDATE ON public.provider_payout_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_provider_payout_methods_provider ON public.provider_payout_methods(provider_id);