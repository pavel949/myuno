-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ru TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor subscriptions table
CREATE TABLE public.vendor_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id)
);

-- Platform fees configuration
CREATE TABLE public.platform_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.subscription_plans(id),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed')),
  fee_value NUMERIC NOT NULL DEFAULT 0,
  min_fee NUMERIC,
  max_fee NUMERIC,
  applies_to TEXT[] DEFAULT ARRAY['booking']::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Featured listings table
CREATE TABLE public.featured_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('day', 'week', 'month')),
  price_paid NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vendor_subscriptions
CREATE POLICY "Vendors can view their own subscription"
ON public.vendor_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscriptions"
ON public.vendor_subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for platform_fees (public read for active)
CREATE POLICY "Anyone can view active platform fees"
ON public.platform_fees FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage platform fees"
ON public.platform_fees FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for featured_listings
CREATE POLICY "Vendors can view their own featured listings"
ON public.featured_listings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create featured listings for their entities"
ON public.featured_listings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers 
    WHERE id = provider_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all featured listings"
ON public.featured_listings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, name_ru, slug, description, description_ru, price_monthly, price_yearly, features, limits, sort_order, is_popular) VALUES
('Free', 'Бесплатный', 'free', 'Get started with basic features', 'Начните с базовых функций', 0, 0, 
  '["Up to 3 listings", "Basic analytics", "Email support"]'::jsonb,
  '{"max_listings": 3, "commission_percent": 15, "featured_allowed": false}'::jsonb,
  1, false),
('Pro', 'Про', 'pro', 'Everything you need to grow', 'Всё для роста вашего бизнеса', 49, 470,
  '["Up to 20 listings", "Advanced analytics", "Priority support", "Lower commission", "Featured listings"]'::jsonb,
  '{"max_listings": 20, "commission_percent": 10, "featured_allowed": true}'::jsonb,
  2, true),
('Business', 'Бизнес', 'business', 'For established businesses', 'Для крупного бизнеса', 149, 1430,
  '["Unlimited listings", "Full analytics suite", "Dedicated support", "Lowest commission", "Unlimited featured", "API access", "White-label options"]'::jsonb,
  '{"max_listings": -1, "commission_percent": 5, "featured_allowed": true, "api_access": true}'::jsonb,
  3, false);

-- Insert platform fees for each plan
INSERT INTO public.platform_fees (plan_id, fee_type, fee_value, applies_to)
SELECT id, 'percentage', (limits->>'commission_percent')::numeric, ARRAY['booking']
FROM public.subscription_plans;

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_subscriptions_updated_at
BEFORE UPDATE ON public.vendor_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();