-- ===================================
-- Property Analytics & Marketing Tables
-- ===================================

-- Property analytics for tracking views, impressions, conversions
CREATE TABLE public.property_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  search_impressions INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  source TEXT, -- 'organic', 'search', 'featured', 'external'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, date, source)
);

-- Property promotions for boost campaigns
CREATE TABLE public.property_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('featured', 'boost', 'highlight', 'top_search')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  impressions_delivered INTEGER DEFAULT 0,
  clicks_delivered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing health scores (cached calculations)
CREATE TABLE public.property_listing_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER DEFAULT 0,
  photos_score INTEGER DEFAULT 0,
  description_score INTEGER DEFAULT 0,
  pricing_score INTEGER DEFAULT 0,
  amenities_score INTEGER DEFAULT 0,
  response_score INTEGER DEFAULT 0,
  reviews_score INTEGER DEFAULT 0,
  missing_fields TEXT[] DEFAULT '{}',
  improvement_tips JSONB DEFAULT '[]',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add report settings to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS report_recipients TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_report_enabled BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_listing_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_analytics (using user_id column in property_delegates)
CREATE POLICY "Owners can view analytics for their properties"
ON public.property_analytics FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.owner_properties WHERE owner_id = auth.uid()
  )
  OR
  property_id IN (
    SELECT property_id FROM public.property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "System can insert analytics"
ON public.property_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update analytics"
ON public.property_analytics FOR UPDATE
USING (true);

-- RLS Policies for property_promotions
CREATE POLICY "Owners can view their promotions"
ON public.property_promotions FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can create promotions"
ON public.property_promotions FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their promotions"
ON public.property_promotions FOR UPDATE
USING (owner_id = auth.uid());

-- RLS Policies for property_listing_scores
CREATE POLICY "Owners can view listing scores"
ON public.property_listing_scores FOR SELECT
USING (
  property_id IN (
    SELECT id FROM public.owner_properties WHERE owner_id = auth.uid()
  )
  OR
  property_id IN (
    SELECT property_id FROM public.property_delegates 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "System can manage listing scores"
ON public.property_listing_scores FOR ALL
USING (true);

-- Indexes for performance
CREATE INDEX idx_property_analytics_property_date ON public.property_analytics(property_id, date DESC);
CREATE INDEX idx_property_promotions_property ON public.property_promotions(property_id);
CREATE INDEX idx_property_promotions_status ON public.property_promotions(status);
CREATE INDEX idx_property_listing_scores_property ON public.property_listing_scores(property_id);

-- Function to update timestamps
CREATE TRIGGER update_property_promotions_updated_at
BEFORE UPDATE ON public.property_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_listing_scores_updated_at
BEFORE UPDATE ON public.property_listing_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();