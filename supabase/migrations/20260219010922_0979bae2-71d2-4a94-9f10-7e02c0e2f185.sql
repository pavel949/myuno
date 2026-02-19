
-- Module 6: vertical_subscriptions table
CREATE TABLE IF NOT EXISTS public.vertical_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vertical_slug TEXT NOT NULL,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, vertical_slug)
);

ALTER TABLE public.vertical_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vertical subscriptions"
  ON public.vertical_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vertical subscriptions"
  ON public.vertical_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vertical subscriptions"
  ON public.vertical_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vertical subscriptions"
  ON public.vertical_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vertical subscriptions"
  ON public.vertical_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_vertical_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vertical_subscriptions_updated_at
  BEFORE UPDATE ON public.vertical_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vertical_subscriptions_updated_at();

-- Ensure user_segments has is_vip and is_at_risk columns (add if missing)
ALTER TABLE public.user_segments
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_at_risk BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
