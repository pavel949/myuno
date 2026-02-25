
CREATE TABLE public.platform_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  summary_en TEXT,
  summary_ru TEXT,
  cover_image TEXT,
  source_url TEXT,
  source_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.platform_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_news" ON public.platform_news FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_news" ON public.platform_news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);

CREATE TABLE public.platform_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  location TEXT,
  event_url TEXT,
  category TEXT NOT NULL DEFAULT 'social',
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_events" ON public.platform_events FOR SELECT USING (is_active = true);
CREATE POLICY "admins_manage_events" ON public.platform_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);

CREATE TABLE public.platform_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT,
  action_url TEXT,
  action_label_en TEXT,
  action_label_ru TEXT,
  target_roles TEXT[] DEFAULT '{owner}',
  category TEXT NOT NULL DEFAULT 'tip',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_active_recs" ON public.platform_recommendations FOR SELECT USING (
  is_active = true AND (valid_until IS NULL OR valid_until > now())
);
CREATE POLICY "admins_manage_recs" ON public.platform_recommendations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type IN ('admin', 'uno_team'))
);
