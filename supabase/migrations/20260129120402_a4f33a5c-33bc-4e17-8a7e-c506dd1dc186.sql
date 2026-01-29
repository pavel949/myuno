-- ================================================
-- MARKETPLACE OZON-PARITY FEATURES (FIXED)
-- ================================================

-- 1. REVIEWS SYSTEM
CREATE TABLE public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  pros TEXT,
  cons TEXT,
  photos TEXT[],
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_reviews_product ON public.marketplace_reviews(product_id);
CREATE INDEX idx_marketplace_reviews_user ON public.marketplace_reviews(user_id);
CREATE INDEX idx_marketplace_reviews_rating ON public.marketplace_reviews(rating);

-- 2. WISHLIST
CREATE TABLE public.marketplace_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_marketplace_wishlist_user ON public.marketplace_wishlist(user_id);

-- 3. PROMO CODES
CREATE TABLE public.marketplace_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_ru TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_promo_codes_code ON public.marketplace_promo_codes(code);

-- 4. ORDER STATUS HISTORY (for tracking) - using customer_user_id
CREATE TABLE public.marketplace_order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_ru TEXT,
  notes TEXT,
  location TEXT,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON public.marketplace_order_status_history(order_id);

-- 5. PROMO CODE USAGE TRACKING
CREATE TABLE public.marketplace_promo_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.marketplace_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_promo_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for REVIEWS
CREATE POLICY "Anyone can view approved reviews"
  ON public.marketplace_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create reviews"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.marketplace_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.marketplace_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for WISHLIST
CREATE POLICY "Users can view own wishlist"
  ON public.marketplace_wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
  ON public.marketplace_wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
  ON public.marketplace_wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for PROMO CODES (public read for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON public.marketplace_promo_codes FOR SELECT
  USING (is_active = true);

-- RLS Policies for ORDER STATUS HISTORY (using customer_user_id)
CREATE POLICY "Users can view own order history"
  ON public.marketplace_order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_id AND orders.customer_user_id = auth.uid()
    )
  );

-- RLS for PROMO USAGE
CREATE POLICY "Users can view own promo usage"
  ON public.marketplace_promo_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record promo usage"
  ON public.marketplace_promo_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed some promo codes
INSERT INTO public.marketplace_promo_codes (code, description_en, description_ru, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until) VALUES
('WELCOME10', '10% off your first order', '10% скидка на первый заказ', 'percentage', 10, 500, 500, now() + interval '1 year'),
('SAVE100', '฿100 off orders over ฿1000', '฿100 скидка на заказы от ฿1000', 'fixed', 100, 1000, NULL, now() + interval '6 months'),
('VIP20', '20% off for VIP customers', '20% скидка для VIP клиентов', 'percentage', 20, 2000, 1000, now() + interval '3 months'),
('FREESHIP', 'Free shipping on orders over ฿500', 'Бесплатная доставка от ฿500', 'fixed', 100, 500, 100, now() + interval '1 year');