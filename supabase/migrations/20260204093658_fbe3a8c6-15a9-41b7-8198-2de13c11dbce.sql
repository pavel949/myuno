-- ============================================
-- Phase 0: Configuration Tables for Dynamic Intake & Lead Management
-- ============================================

-- Table: sys_intake_configs
-- Stores AI Intake vertical configurations (migrated from intakeVerticals.ts)
CREATE TABLE public.sys_intake_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id TEXT UNIQUE NOT NULL,           -- 'yachts', 'properties', etc.
  target_table TEXT NOT NULL,                 -- target DB table name
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  icon TEXT,                                  -- emoji icon
  keywords TEXT[] NOT NULL DEFAULT '{}',      -- AI detection keywords
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  optional_fields TEXT[] NOT NULL DEFAULT '{}',
  field_labels JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {field: {en, ru, type, enumValues}}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: sys_lead_configs
-- Stores Universal Lead Form configurations (migrated from leadVerticalConfig.ts)
CREATE TABLE public.sys_lead_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id TEXT UNIQUE NOT NULL,           -- 'properties', 'yachts', 'legal'
  icon TEXT,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  short_desc_en TEXT,
  short_desc_ru TEXT,
  cta_text_en TEXT,
  cta_text_ru TEXT,
  popularity_score INTEGER DEFAULT 50,
  request_types JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{value, labelEn, labelRu}]
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,          -- [{key, type, labelEn, labelRu, options, required}]
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sys_intake_configs_vertical ON public.sys_intake_configs(vertical_id);
CREATE INDEX idx_sys_lead_configs_vertical ON public.sys_lead_configs(vertical_id);
CREATE INDEX idx_sys_intake_configs_active ON public.sys_intake_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_sys_lead_configs_active ON public.sys_lead_configs(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.sys_intake_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_lead_configs ENABLE ROW LEVEL SECURITY;

-- Public read policies (configs are public for Edge Functions and frontend)
CREATE POLICY "Anyone can read active intake configs"
  ON public.sys_intake_configs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can read active lead configs"
  ON public.sys_lead_configs
  FOR SELECT
  USING (is_active = true);

-- Admin write policies (admin or uno_team can modify)
CREATE POLICY "Admins can manage intake configs"
  ON public.sys_intake_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type::text IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Admins can manage lead configs"
  ON public.sys_lead_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type::text IN ('admin', 'uno_team')
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_sys_intake_configs_updated_at
  BEFORE UPDATE ON public.sys_intake_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sys_lead_configs_updated_at
  BEFORE UPDATE ON public.sys_lead_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();