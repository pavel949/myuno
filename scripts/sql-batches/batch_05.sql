-- Batch 5
-- Migration: 20260201132846_3d34c61d-f38b-4c56-82d3-14cb93d1b9fc.sql
-- Sync lookup_values with propertyTaxonomy for consistency
-- This ensures admin panel edits are reflected in code and vice versa

-- Update property_type icons to match taxonomy
UPDATE lookup_values SET icon = '🏡' WHERE lookup_type = 'property_type' AND value_key = 'villa';
UPDATE lookup_values SET icon = '🏢' WHERE lookup_type = 'property_type' AND value_key = 'condo';
UPDATE lookup_values SET icon = '🏬', is_active = true WHERE lookup_type = 'property_type' AND value_key = 'apartment';
UPDATE lookup_values SET icon = '🏠' WHERE lookup_type = 'property_type' AND value_key = 'house';
UPDATE lookup_values SET icon = '🏘️' WHERE lookup_type = 'property_type' AND value_key = 'townhouse';
UPDATE lookup_values SET icon = '🌆' WHERE lookup_type = 'property_type' AND value_key = 'penthouse';
UPDATE lookup_values SET icon = '🛏️' WHERE lookup_type = 'property_type' AND value_key = 'studio';

-- Add missing property types
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES ('property_type', 'bungalow', 'Bungalow', 'Бунгало', '🌴', true, 8)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon, is_active = true;

-- Add missing districts with proper icons
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('district', 'laguna', 'Laguna', 'Лагуна', '🏌️', true, 7),
  ('district', 'kata-noi', 'Kata Noi', 'Ката Ной', '🏊', true, 11),
  ('district', 'cape-panwa', 'Cape Panwa', 'Мыс Панва', '🌊', true, 14),
  ('district', 'mai-khao', 'Mai Khao', 'Май Кхао', '✈️', true, 21),
  ('district', 'nai-yang', 'Nai Yang', 'Най Янг', '🛫', true, 22)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- Add included_services lookup type
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('included_service', 'wifi', 'WiFi', 'WiFi', '📶', true, 1),
  ('included_service', 'ac', 'Air Conditioning', 'Кондиционер', '❄️', true, 2),
  ('included_service', 'water', 'Water', 'Вода', '💧', true, 3),
  ('included_service', 'electricity', 'Electricity', 'Электричество', '⚡', true, 4),
  ('included_service', 'pool', 'Pool Access', 'Бассейн', '🏊', true, 5),
  ('included_service', 'gym', 'Gym Access', 'Тренажёрный зал', '🏋️', true, 6),
  ('included_service', 'parking', 'Parking', 'Парковка', '🅿️', true, 7),
  ('included_service', 'security', '24/7 Security', 'Охрана 24/7', '🛡️', true, 8),
  ('included_service', 'cleaning_weekly', 'Weekly Cleaning', 'Уборка еженедельно', '🧹', true, 9),
  ('included_service', 'cleaning_daily', 'Daily Cleaning', 'Уборка ежедневно', '🧹', true, 10),
  ('included_service', 'linen', 'Linen Change', 'Смена белья', '🛏️', true, 11),
  ('included_service', 'tv', 'Cable TV', 'Кабельное ТВ', '📺', true, 12),
  ('included_service', 'netflix', 'Netflix', 'Netflix', '🎬', true, 13)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;

-- Add extra_services lookup type  
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('extra_service', 'extra_cleaning', 'Extra Cleaning', 'Доп. уборка', '🧹', true, 1),
  ('extra_service', 'linen_change', 'Linen Change', 'Смена белья', '🛏️', true, 2),
  ('extra_service', 'airport_transfer', 'Airport Transfer', 'Трансфер аэропорт', '✈️', true, 3),
  ('extra_service', 'early_checkin', 'Early Check-in', 'Ранний заезд', '⏰', true, 4),
  ('extra_service', 'late_checkout', 'Late Check-out', 'Поздний выезд', '🌙', true, 5),
  ('extra_service', 'pool_heating', 'Pool Heating', 'Подогрев бассейна', '🔥', true, 6),
  ('extra_service', 'babysitter', 'Babysitter', 'Няня', '👶', true, 7),
  ('extra_service', 'chef', 'Private Chef', 'Личный повар', '👨‍🍳', true, 8),
  ('extra_service', 'massage', 'Massage', 'Массаж', '💆', true, 9),
  ('extra_service', 'driver', 'Personal Driver', 'Личный водитель', '🚗', true, 10),
  ('extra_service', 'bike_rental', 'Motorbike Rental', 'Аренда байка', '🏍️', true, 11),
  ('extra_service', 'car_rental', 'Car Rental', 'Аренда авто', '🚙', true, 12),
  ('extra_service', 'laundry', 'Laundry Service', 'Стирка', '🧺', true, 13)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;

-- Add property_highlight lookup type
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('property_highlight', 'beach_close', 'Near Beach', 'У пляжа', '🏖️', true, 1),
  ('property_highlight', 'beachfront', 'Beachfront', 'На пляже', '🌊', true, 2),
  ('property_highlight', 'sea_view', 'Sea View', 'Вид на море', '🌊', true, 3),
  ('property_highlight', 'ocean_view', 'Ocean View', 'Вид на океан', '🌅', true, 4),
  ('property_highlight', 'private_pool', 'Private Pool', 'Частный бассейн', '🏊', true, 5),
  ('property_highlight', 'infinity_pool', 'Infinity Pool', 'Инфинити бассейн', '♾️', true, 6),
  ('property_highlight', 'fast_wifi', 'Fast WiFi', 'Быстрый WiFi', '📶', true, 7),
  ('property_highlight', 'luxury', 'Luxury', 'Люкс', '✨', true, 8),
  ('property_highlight', 'superhost', 'Superhost', 'Суперхост', '🏆', true, 9),
  ('property_highlight', 'verified', 'Verified', 'Проверено', '✅', true, 10),
  ('property_highlight', 'instant_book', 'Instant Book', 'Мгновенное бронирование', '⚡', true, 11)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET icon = EXCLUDED.icon;
-- Migration: 20260201133725_f336d241-6daa-4114-90dc-40e77a0eb095.sql
-- ===========================================
-- Property Taxonomy Normalization Migration (Fixed)
-- ===========================================
-- Normalizes amenities and districts to canonical kebab-case format

-- STEP 1: Normalize amenities array in properties table
UPDATE properties 
SET amenities = (
  SELECT array_agg(
    DISTINCT CASE 
      WHEN a IN ('ac', 'AC', 'air_conditioning', 'Air Conditioning', 'aircon') THEN 'air-conditioning'
      WHEN a IN ('sea_view', 'seaview', 'Sea View') THEN 'sea-view'
      WHEN a IN ('ocean_view', 'oceanview', 'Ocean View') THEN 'ocean-view'
      WHEN a IN ('mountain_view', 'Mountain View') THEN 'mountain-view'
      WHEN a IN ('pool_view', 'Pool View') THEN 'pool-view'
      WHEN a IN ('garden_view', 'Garden View') THEN 'garden-view'
      WHEN a IN ('pets', 'pets_allowed', 'Pets Allowed') THEN 'pet-friendly'
      WHEN a IN ('beach', 'beach_access', 'Beach Access') THEN 'beach-access'
      WHEN a IN ('security', '24h_security', '24/7 Security') THEN 'security-24h'
      WHEN a IN ('smart_home', 'Smart Home') THEN 'smart-home'
      WHEN a IN ('kids_pool', 'Kids Pool') THEN 'kids-pool'
      WHEN a IN ('high_chair', 'High Chair') THEN 'high-chair'
      WHEN a IN ('bbq_area', 'BBQ') THEN 'bbq'
      WHEN a IN ('gated_community', 'Gated Community') THEN 'gated'
      WHEN a IN ('quiet_area', 'Quiet Area') THEN 'quiet-area'
      WHEN a IN ('city_center', 'City Center') THEN 'city-center'
      WHEN a IN ('Pool', 'POOL') THEN 'pool'
      WHEN a IN ('WiFi', 'Wifi', 'WIFI') THEN 'wifi'
      WHEN a IN ('Gym', 'GYM') THEN 'gym'
      WHEN a IN ('Parking', 'PARKING') THEN 'parking'
      WHEN a IN ('Kitchen', 'KITCHEN') THEN 'kitchen'
      WHEN a IN ('Balcony', 'BALCONY') THEN 'balcony'
      WHEN a IN ('Garden', 'GARDEN') THEN 'garden'
      ELSE LOWER(a)
    END
  )
  FROM unnest(amenities) AS a
  WHERE a IS NOT NULL AND a != ''
)
WHERE amenities IS NOT NULL AND array_length(amenities, 1) > 0;

-- STEP 2: Normalize district names to kebab-case IDs
UPDATE properties
SET district = CASE 
  WHEN district IN ('Patong', 'PATONG', 'patong') THEN 'patong'
  WHEN district IN ('Kata', 'KATA', 'kata') THEN 'kata'
  WHEN district IN ('Karon', 'KARON', 'karon') THEN 'karon'
  WHEN district IN ('Rawai', 'RAWAI', 'rawai') THEN 'rawai'
  WHEN district IN ('Chalong', 'CHALONG', 'chalong') THEN 'chalong'
  WHEN district IN ('Kamala', 'KAMALA', 'kamala') THEN 'kamala'
  WHEN district IN ('Surin', 'SURIN', 'surin') THEN 'surin'
  WHEN district IN ('Bang Tao', 'Bangtao', 'bang_tao', 'bang-tao') THEN 'bang-tao'
  WHEN district IN ('Laguna', 'LAGUNA', 'laguna') THEN 'laguna'
  WHEN district IN ('Cherngtalay', 'Cherng Talay', 'cherng_talay') THEN 'cherngtalay'
  WHEN district IN ('Phuket Town', 'phuket_town', 'phuket-town') THEN 'phuket-town'
  WHEN district IN ('Kathu', 'KATHU', 'kathu') THEN 'kathu'
  WHEN district IN ('Nai Harn', 'Naiharn', 'nai_harn', 'nai-harn') THEN 'nai-harn'
  WHEN district IN ('Mai Khao', 'Maikhao', 'mai_khao', 'mai-khao') THEN 'mai-khao'
  WHEN district IN ('Nai Yang', 'nai_yang', 'nai-yang') THEN 'nai-yang'
  WHEN district IN ('Nai Thon', 'Naithon', 'nai_thon', 'naithon') THEN 'naithon'
  WHEN district IN ('Kata Noi', 'kata_noi', 'kata-noi') THEN 'kata-noi'
  WHEN district IN ('Cape Panwa', 'cape_panwa', 'cape-panwa') THEN 'cape-panwa'
  WHEN district IN ('Ao Po', 'ao_po', 'ao-po') THEN 'ao-po'
  WHEN district IN ('Koh Kaew', 'koh_kaew', 'koh-kaew') THEN 'koh-kaew'
  WHEN district IN ('Thalang', 'THALANG', 'thalang') THEN 'thalang'
  WHEN district IN ('Layan', 'LAYAN', 'layan') THEN 'layan'
  ELSE LOWER(REPLACE(REPLACE(district, ' ', '-'), '_', '-'))
END
WHERE district IS NOT NULL;

-- STEP 3: Normalize property_type to lowercase
UPDATE properties
SET property_type = LOWER(property_type)
WHERE property_type IS NOT NULL AND property_type != LOWER(property_type);

-- STEP 4: Update lookup_values to ensure canonical keys
UPDATE lookup_values
SET value_key = CASE 
  WHEN value_key = 'ac' THEN 'air-conditioning'
  WHEN value_key = 'sea_view' THEN 'sea-view'
  WHEN value_key = 'ocean_view' THEN 'ocean-view'
  WHEN value_key = 'mountain_view' THEN 'mountain-view'
  WHEN value_key = 'pets' THEN 'pet-friendly'
  WHEN value_key = 'security' THEN 'security-24h'
  WHEN value_key = 'beach' THEN 'beach-access'
  ELSE value_key
END
WHERE lookup_type = 'amenity' AND value_key IN ('ac', 'sea_view', 'ocean_view', 'mountain_view', 'pets', 'security', 'beach');

-- STEP 5: Ensure all Phuket districts exist in lookup_values with correct IDs
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, is_active, sort_order)
VALUES 
  ('district', 'patong', 'Patong', 'Патонг', '🏖️', true, 1),
  ('district', 'kata', 'Kata', 'Ката', '🌴', true, 2),
  ('district', 'karon', 'Karon', 'Карон', '🌊', true, 3),
  ('district', 'kamala', 'Kamala', 'Камала', '🌅', true, 4),
  ('district', 'surin', 'Surin', 'Сурин', '🏝️', true, 5),
  ('district', 'bang-tao', 'Bang Tao', 'Банг Тао', '⛱️', true, 6),
  ('district', 'laguna', 'Laguna', 'Лагуна', '🏌️', true, 7),
  ('district', 'layan', 'Layan', 'Лаян', '🌿', true, 8),
  ('district', 'naithon', 'Nai Thon', 'Най Тон', '🐢', true, 9),
  ('district', 'nai-harn', 'Nai Harn', 'Най Харн', '⛵', true, 10),
  ('district', 'kata-noi', 'Kata Noi', 'Ката Ной', '🏊', true, 11),
  ('district', 'rawai', 'Rawai', 'Равай', '🐚', true, 12),
  ('district', 'chalong', 'Chalong', 'Чалонг', '⚓', true, 13),
  ('district', 'cape-panwa', 'Cape Panwa', 'Мыс Панва', '🌊', true, 14),
  ('district', 'phuket-town', 'Phuket Town', 'Пхукет Таун', '🏙️', true, 15),
  ('district', 'kathu', 'Kathu', 'Кату', '🏠', true, 16),
  ('district', 'cherngtalay', 'Cherngtalay', 'Чернгталай', '🌳', true, 17),
  ('district', 'thalang', 'Thalang', 'Таланг', '🏡', true, 18),
  ('district', 'koh-kaew', 'Koh Kaew', 'Ко Кео', '🏝️', true, 19),
  ('district', 'ao-po', 'Ao Po', 'Ао По', '🚤', true, 20),
  ('district', 'mai-khao', 'Mai Khao', 'Май Кхао', '✈️', true, 21),
  ('district', 'nai-yang', 'Nai Yang', 'Най Янг', '🛫', true, 22)
ON CONFLICT (lookup_type, value_key) 
DO UPDATE SET 
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
-- Migration: 20260201161002_f294fb19-c369-43c6-9cea-03183c191ca6.sql
-- =============================================
-- ФАЗА 1: ДВУНАПРАВЛЕННЫЕ ПРИГЛАШЕНИЯ
-- =============================================

-- Таблица для запросов на управление (Owner <-> УК)
CREATE TABLE public.property_management_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('owner', 'manager', 'agency')),
  target_email TEXT NOT NULL,
  target_user_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('add_property', 'request_management', 'transfer_ownership', 'invite_delegate')),
  proposed_terms JSONB DEFAULT '{}',
  proposed_role TEXT DEFAULT 'manager',
  proposed_permissions JSONB DEFAULT '{"view": true, "edit": false, "financial": false, "bookings": false}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для запросов
CREATE INDEX idx_mgmt_requests_requester ON public.property_management_requests(requester_id);
CREATE INDEX idx_mgmt_requests_target_email ON public.property_management_requests(target_email);
CREATE INDEX idx_mgmt_requests_status ON public.property_management_requests(status);
CREATE INDEX idx_mgmt_requests_property ON public.property_management_requests(property_id);

-- RLS для property_management_requests
ALTER TABLE public.property_management_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.property_management_requests FOR SELECT
USING (
  requester_id = auth.uid() 
  OR target_user_id = auth.uid()
  OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can create requests"
ON public.property_management_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their received requests"
ON public.property_management_requests FOR UPDATE
USING (
  target_user_id = auth.uid()
  OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR requester_id = auth.uid()
);

-- =============================================
-- ФАЗА 2: СИСТЕМА ОТЧЁТОВ
-- =============================================

-- Таблица отчётов
CREATE TABLE public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  generated_by UUID,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  summary_text TEXT,
  summary_text_ru TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('generating', 'draft', 'ready', 'sent', 'viewed', 'error')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  sent_to TEXT[],
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для отчётов
CREATE INDEX idx_reports_property ON public.property_reports(property_id);
CREATE INDEX idx_reports_owner ON public.property_reports(owner_id);
CREATE INDEX idx_reports_period ON public.property_reports(period_start, period_end);
CREATE INDEX idx_reports_status ON public.property_reports(status);

-- RLS для property_reports
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their reports"
ON public.property_reports FOR SELECT
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_reports.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'financial')::boolean = true
  )
);

CREATE POLICY "Users can create reports for their properties"
ON public.property_reports FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_reports.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'financial')::boolean = true
  )
);

CREATE POLICY "Users can update their reports"
ON public.property_reports FOR UPDATE
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
);

CREATE POLICY "Owners can delete their reports"
ON public.property_reports FOR DELETE
USING (owner_id = auth.uid());

-- =============================================
-- ФАЗА 3: РАСШИРЕНИЕ ФИНАНСОВ (OCR)
-- =============================================

-- Добавить колонки для OCR в property_financials
ALTER TABLE public.property_financials 
ADD COLUMN IF NOT EXISTS receipt_metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Добавить notification_preferences в property_delegates
ALTER TABLE public.property_delegates
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "reports": true}';

-- =============================================
-- ТРИГГЕРЫ ДЛЯ UPDATED_AT
-- =============================================

CREATE TRIGGER update_management_requests_updated_at
  BEFORE UPDATE ON public.property_management_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.property_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STORAGE BUCKET ДЛЯ ОТЧЁТОВ
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-reports', 'property-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Политики хранилища для отчётов
CREATE POLICY "Users can upload their reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Migration: 20260201170515_33df04f0-4bed-4b71-98f2-668ead7fed69.sql
-- Create calendar_sync_logs table for tracking sync history
CREATE TABLE public.calendar_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES public.property_external_calendars(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  synced_at timestamptz DEFAULT now(),
  events_found integer DEFAULT 0,
  events_added integer DEFAULT 0,
  events_updated integer DEFAULT 0,
  events_removed integer DEFAULT 0,
  sync_duration_ms integer,
  sync_type text DEFAULT 'manual', -- 'manual', 'scheduled', 'webhook'
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_sync_logs
CREATE POLICY "Owners can view their sync logs"
ON public.calendar_sync_logs FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "System can insert sync logs"
ON public.calendar_sync_logs FOR INSERT
WITH CHECK (true);

-- Add new columns to property_bookings for conflict detection
ALTER TABLE public.property_bookings 
ADD COLUMN IF NOT EXISTS sync_priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conflict_detected_at timestamptz,
ADD COLUMN IF NOT EXISTS conflict_with_booking_id uuid;

-- Add new columns to property_external_calendars for auto-sync
ALTER TABLE public.property_external_calendars
ADD COLUMN IF NOT EXISTS sync_interval_minutes integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_sync boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'other'; -- 'airbnb', 'booking', 'vrbo', 'other'

-- Create function to detect booking conflicts for a property
CREATE OR REPLACE FUNCTION public.detect_booking_conflicts(p_property_id uuid)
RETURNS TABLE (
  booking_id_1 uuid,
  booking_id_2 uuid,
  guest_name_1 text,
  guest_name_2 text,
  source_1 text,
  source_2 text,
  check_in_1 date,
  check_out_1 date,
  check_in_2 date,
  check_out_2 date,
  overlap_days integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b1.id as booking_id_1,
    b2.id as booking_id_2,
    b1.guest_name as guest_name_1,
    b2.guest_name as guest_name_2,
    b1.source as source_1,
    b2.source as source_2,
    b1.check_in as check_in_1,
    b1.check_out as check_out_1,
    b2.check_in as check_in_2,
    b2.check_out as check_out_2,
    (LEAST(b1.check_out, b2.check_out) - GREATEST(b1.check_in, b2.check_in))::integer as overlap_days
  FROM property_bookings b1
  JOIN property_bookings b2 ON b1.property_id = b2.property_id
    AND b1.id < b2.id  -- Avoid duplicate pairs and self-join
    AND b1.check_in < b2.check_out 
    AND b2.check_in < b1.check_out
    AND b1.status != 'cancelled'
    AND b2.status != 'cancelled'
  WHERE b1.property_id = p_property_id;
END;
$$;

-- Create index for faster conflict detection
CREATE INDEX IF NOT EXISTS idx_property_bookings_dates 
ON public.property_bookings(property_id, check_in, check_out) 
WHERE status != 'cancelled';

-- Create index for sync logs queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_calendar 
ON public.calendar_sync_logs(calendar_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_owner 
ON public.calendar_sync_logs(owner_id, synced_at DESC);
-- Migration: 20260202021921_316f2567-7d66-4d17-950f-83ecd0fc7ea8.sql
-- Fix infinite recursion in RLS policies for orders/order_items
-- Problem: orders policy joins order_items, and order_items policy subqueries orders

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Owners view orders with owned resources" ON public.orders;

-- Create a safer version that doesn't cause recursion
-- Instead of joining through order_items, we check provider_org_id directly
-- (Owners see orders if they are members of the provider org)
CREATE POLICY "Owners view orders via org membership"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = orders.provider_org_id
    AND org_members.user_id = auth.uid()
  )
);

-- Note: "Vendors view org orders" policy already covers this case,
-- but keeping this for owners who may have different org roles
-- Migration: 20260202022759_ab25f6b4-73fd-4699-bcef-008f094fec51.sql
-- ============================================
-- Listing Applications: Unified submission tracking
-- Supports Property, Service, and Product applications
-- ============================================

-- Application status enum
CREATE TYPE public.listing_application_status AS ENUM (
  'draft',
  'pending',
  'under_review', 
  'approved',
  'rejected',
  'revision_requested'
);

-- Listing type enum
CREATE TYPE public.listing_type AS ENUM (
  'property',
  'service', 
  'product'
);

-- Main applications table
CREATE TABLE public.listing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant (null until auth)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_email TEXT,
  applicant_name TEXT,
  applicant_phone TEXT,
  
  -- Application type and status
  listing_type listing_type NOT NULL,
  status listing_application_status NOT NULL DEFAULT 'draft',
  
  -- Draft data (stored as JSON until converted to real listing)
  draft_data JSONB NOT NULL DEFAULT '{}',
  
  -- For property applications
  property_type TEXT,
  
  -- For service applications  
  service_category TEXT,
  
  -- For product applications
  product_category TEXT,
  
  -- Location
  city TEXT,
  district TEXT,
  address TEXT,
  
  -- Pricing preview
  estimated_price NUMERIC,
  currency TEXT DEFAULT 'THB',
  
  -- Cover image for preview
  cover_image TEXT,
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Resulting entity IDs after approval
  created_property_id UUID,
  created_provider_id UUID,
  created_vendor_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.listing_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users view own applications"
ON public.listing_applications FOR SELECT
USING (auth.uid() = user_id);

-- Users can create applications (even before assigning user_id)
CREATE POLICY "Anyone can create draft applications"
ON public.listing_applications FOR INSERT
WITH CHECK (true);

-- Users can update their own draft applications
CREATE POLICY "Users update own draft applications"
ON public.listing_applications FOR UPDATE
USING (auth.uid() = user_id AND status IN ('draft', 'revision_requested'));

-- Admin can view all applications
CREATE POLICY "Admin view all applications"
ON public.listing_applications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any application
CREATE POLICY "Admin update all applications"
ON public.listing_applications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Staff can view all applications
CREATE POLICY "Staff view all applications"
ON public.listing_applications FOR SELECT
USING (public.has_role(auth.uid(), 'staff'));

-- Updated_at trigger
CREATE TRIGGER update_listing_applications_updated_at
BEFORE UPDATE ON public.listing_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for admin queue
CREATE INDEX idx_listing_applications_status ON public.listing_applications(status);
CREATE INDEX idx_listing_applications_user ON public.listing_applications(user_id);
CREATE INDEX idx_listing_applications_type ON public.listing_applications(listing_type);

-- Function to assign role on approval
CREATE OR REPLACE FUNCTION public.process_listing_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.user_id IS NOT NULL THEN
    -- Assign appropriate role based on listing type
    IF NEW.listing_type = 'property' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'owner')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF NEW.listing_type IN ('service', 'product') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'vendor')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign roles on approval
CREATE TRIGGER trigger_listing_approval_role
AFTER UPDATE ON public.listing_applications
FOR EACH ROW
EXECUTE FUNCTION public.process_listing_approval();
-- Migration: 20260202022814_205989c4-f372-45ff-b738-72117f22f6b2.sql
-- Fix overly permissive INSERT policy for listing_applications
-- Replace WITH CHECK (true) with proper validation

DROP POLICY IF EXISTS "Anyone can create draft applications" ON public.listing_applications;

-- Allow inserting only draft applications, and user_id must match if provided
CREATE POLICY "Create draft applications"
ON public.listing_applications FOR INSERT
WITH CHECK (
  status = 'draft' 
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Also need DELETE policy for users to remove their own drafts
CREATE POLICY "Users delete own draft applications"
ON public.listing_applications FOR DELETE
USING (auth.uid() = user_id AND status = 'draft');
-- Migration: 20260202024645_bf4a8841-86fb-4319-922e-b7da6dc0e8eb.sql
-- =====================================================
-- UNO TEAM MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. Helper function to check if user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role IN ('uno_team', 'admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Team specialization type
DO $$ BEGIN
  CREATE TYPE team_specialization AS ENUM (
    'content_manager',
    'support_operator', 
    'sales_manager',
    'moderation_officer',
    'team_lead'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Team Members table - profiles with specializations
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specializations TEXT[] DEFAULT '{}',
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  shift_schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMPTZ DEFAULT now(),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Helper function to check specialization
CREATE OR REPLACE FUNCTION public.has_specialization(check_user_id UUID, spec TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = check_user_id 
    AND spec = ANY(specializations)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Team Activity Log - for KPI tracking
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  points_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Team Gamification - points and levels
CREATE TABLE IF NOT EXISTS public.team_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges TEXT[] DEFAULT '{}',
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Team Achievements definitions
CREATE TABLE IF NOT EXISTS public.team_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'trophy',
  category TEXT DEFAULT 'general',
  points_required INTEGER DEFAULT 0,
  unlock_condition JSONB,
  is_secret BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Team User Achievements - unlocked achievements
CREATE TABLE IF NOT EXISTS public.team_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.team_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 9. Team Chat Messages
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.team_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  reactions JSONB DEFAULT '{}',
  mentioned_users UUID[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Team Entity Notes - notes attached to any object
CREATE TABLE IF NOT EXISTS public.team_entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Team Channels - chat channel definitions
CREATE TABLE IF NOT EXISTS public.team_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'hash',
  allowed_specializations TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  is_announcements_only BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_specializations ON public.team_members USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_user_id ON public.team_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_created_at ON public.team_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_action_type ON public.team_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_team_gamification_user_id ON public.team_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_team_gamification_points ON public.team_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_channel ON public.team_messages(channel);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON public.team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON public.team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_entity_notes_entity ON public.team_entity_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_team_entity_notes_user ON public.team_entity_notes(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_entity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;

-- Team Members policies
CREATE POLICY "Team members can view all team members"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Team members can update own profile"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Activity Log policies
CREATE POLICY "Team members can view own activity"
  ON public.team_activity_log FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Team members can insert own activity"
  ON public.team_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid()));

-- Gamification policies
CREATE POLICY "Anyone can view gamification leaderboard"
  ON public.team_gamification FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "System can update gamification"
  ON public.team_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert gamification"
  ON public.team_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements"
  ON public.team_achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.team_achievements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- User Achievements policies
CREATE POLICY "Team can view all user achievements"
  ON public.team_user_achievements FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "System can insert user achievements"
  ON public.team_user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Team members can view messages"
  ON public.team_messages FOR SELECT
  USING (public.is_team_member(auth.uid()) AND is_deleted = false);

CREATE POLICY "Team members can send messages"
  ON public.team_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_team_member(auth.uid()));

CREATE POLICY "Users can update own messages"
  ON public.team_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Entity Notes policies
CREATE POLICY "Team members can view notes"
  ON public.team_entity_notes FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Team members can create notes"
  ON public.team_entity_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid()));

CREATE POLICY "Users can update own notes"
  ON public.team_entity_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.team_entity_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Channels policies
CREATE POLICY "Team members can view channels"
  ON public.team_channels FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Admins can manage channels"
  ON public.team_channels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_gamification_updated_at
  BEFORE UPDATE ON public.team_gamification
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_messages_updated_at
  BEFORE UPDATE ON public.team_messages
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_entity_notes_updated_at
  BEFORE UPDATE ON public.team_entity_notes
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

-- =====================================================
-- FUNCTION: Add points and check achievements
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_team_points(
  p_user_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_current_level INTEGER;
BEGIN
  -- Log activity
  INSERT INTO public.team_activity_log (user_id, action_type, entity_type, entity_id, points_earned, metadata)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_points, p_metadata);

  -- Update or insert gamification record
  INSERT INTO public.team_gamification (user_id, total_points, weekly_points, monthly_points, last_activity_date)
  VALUES (p_user_id, p_points, p_points, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = team_gamification.total_points + p_points,
    weekly_points = team_gamification.weekly_points + p_points,
    monthly_points = team_gamification.monthly_points + p_points,
    last_activity_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN team_gamification.last_activity_date = CURRENT_DATE - 1 THEN team_gamification.streak_days + 1
      WHEN team_gamification.last_activity_date = CURRENT_DATE THEN team_gamification.streak_days
      ELSE 1
    END
  RETURNING total_points, level INTO v_new_total, v_current_level;

  -- Calculate new level
  v_new_level := CASE
    WHEN v_new_total >= 10000 THEN 5
    WHEN v_new_total >= 5000 THEN 4
    WHEN v_new_total >= 2000 THEN 3
    WHEN v_new_total >= 500 THEN 2
    ELSE 1
  END;

  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.team_gamification 
    SET level = v_new_level 
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- INITIAL DATA: Default achievements
-- =====================================================

INSERT INTO public.team_achievements (key, name_en, name_ru, description_en, description_ru, icon, category, points_required, sort_order) VALUES
  ('first_contact', 'First Contact', 'Первый контакт', 'Process your first lead', 'Обработайте первый лид', 'user-plus', 'sales', 0, 1),
  ('speed_demon', 'Speed Demon', 'Скорострел', 'Close 10 tickets in one day', 'Закройте 10 тикетов за день', 'zap', 'support', 0, 2),
  ('golden_hands', 'Golden Hands', 'Золотые руки', 'Add 100 listings', 'Добавьте 100 листингов', 'crown', 'content', 0, 3),
  ('converter', 'Converter', 'Конвертор', '50 successful conversions', '50 успешных конверсий', 'target', 'sales', 0, 4),
  ('marathon', 'Marathon Runner', 'Марафонец', '30-day streak', '30-дневная серия', 'flame', 'bonus', 0, 5),
  ('rising_star', 'Rising Star', 'Восходящая звезда', 'Reach Level 2', 'Достигните уровня 2', 'star', 'level', 500, 6),
  ('pro', 'Professional', 'Профессионал', 'Reach Level 3', 'Достигните уровня 3', 'award', 'level', 2000, 7),
  ('expert', 'Expert', 'Эксперт', 'Reach Level 4', 'Достигните уровня 4', 'medal', 'level', 5000, 8),
  ('legend', 'Legend', 'Легенда', 'Reach Level 5', 'Достигните уровня 5', 'trophy', 'level', 10000, 9),
  ('team_player', 'Team Player', 'Командный игрок', 'Send 100 messages', 'Отправьте 100 сообщений', 'users', 'chat', 0, 10),
  ('helper', 'Helper', 'Помощник', 'Add 50 notes', 'Добавьте 50 заметок', 'file-text', 'notes', 0, 11),
  ('early_bird', 'Early Bird', 'Ранняя пташка', 'Complete 5 tasks before 9 AM', 'Выполните 5 задач до 9 утра', 'sunrise', 'bonus', 0, 12)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INITIAL DATA: Default channels
-- =====================================================

INSERT INTO public.team_channels (slug, name_en, name_ru, description, icon, is_announcements_only) VALUES
  ('general', 'General', 'Общий', 'General team discussion', 'hash', false),
  ('support', 'Support', 'Поддержка', 'Support team channel', 'headphones', false),
  ('sales', 'Sales', 'Продажи', 'Sales team channel', 'trending-up', false),
  ('content', 'Content', 'Контент', 'Content team channel', 'edit-3', false),
  ('announcements', 'Announcements', 'Объявления', 'Important announcements', 'megaphone', true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ENABLE REALTIME for chat
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
-- Migration: 20260202041047_264ddff5-a82b-4f9a-bb92-0c599f0d5037.sql
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
-- Migration: 20260202042405_9fcc1dbf-28ba-4815-91ff-6ce222e30b4f.sql
-- Create storage bucket for property reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-reports', 'property-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their reports
CREATE POLICY "Users can read their own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports' AND 
  auth.uid() IS NOT NULL
);

-- Allow service role to upload reports
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-reports');

-- Allow service role to update reports
CREATE POLICY "Service role can update reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-reports');

-- Add role field to property_delegates for role-based views
-- (already exists, just verifying the structure supports role-based access)
-- Migration: 20260202044455_8f07d7f9-96cb-43d5-bd35-f5f9008af47f.sql
-- Add entity_type enum to education_providers for semantic clarity
-- This distinguishes between institutions (schools, centers) and individuals (tutors)

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE education_entity_type AS ENUM ('institution', 'individual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add entity_type column to education_providers
ALTER TABLE public.education_providers 
ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'individual';

-- Backfill existing data based on provider_type
UPDATE public.education_providers 
SET entity_type = CASE 
  WHEN provider_type IN ('school', 'center', 'academy', 'university', 'kindergarten', 'language_school') THEN 'institution'
  ELSE 'individual'
END
WHERE entity_type IS NULL OR entity_type = 'individual';

-- Add comment for documentation
COMMENT ON COLUMN public.education_providers.entity_type IS 'Semantic entity type: institution (schools, centers) or individual (tutors, coaches)';
-- Migration: 20260202045957_1364a7aa-996f-4ee5-9477-b6f2eb76be58.sql
-- Add seller_type enum for marketplace
DO $$ BEGIN
  CREATE TYPE public.marketplace_seller_type AS ENUM ('business', 'individual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add item condition enum
DO $$ BEGIN
  CREATE TYPE public.item_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'for_parts');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add seller_type and condition columns to marketplace_products
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS seller_type text DEFAULT 'business',
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_whatsapp text,
ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Create user_listings table for C2C marketplace
CREATE TABLE IF NOT EXISTS public.user_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  title_en text NOT NULL,
  title_ru text,
  description_en text,
  description_ru text,
  
  -- Categorization
  category_slug text,
  subcategory text,
  
  -- Pricing
  price numeric NOT NULL,
  original_price numeric,
  currency text DEFAULT 'THB',
  is_negotiable boolean DEFAULT true,
  
  -- Condition
  condition text DEFAULT 'good',
  
  -- Media
  cover_image text,
  images text[],
  
  -- Location & Contact
  location text,
  contact_phone text,
  contact_whatsapp text,
  show_phone boolean DEFAULT false,
  
  -- Status
  status text DEFAULT 'draft', -- draft, pending, active, sold, expired, removed
  moderation_status text DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason text,
  
  -- Metrics
  views_count integer DEFAULT 0,
  favorites_count integer DEFAULT 0,
  
  -- Timestamps
  published_at timestamptz,
  expires_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_listings_user_id ON public.user_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_listings_status ON public.user_listings(status);
CREATE INDEX IF NOT EXISTS idx_user_listings_category ON public.user_listings(category_slug);
CREATE INDEX IF NOT EXISTS idx_user_listings_created ON public.user_listings(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_listings
CREATE POLICY "Users can view active listings"
ON public.user_listings FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create their own listings"
ON public.user_listings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
ON public.user_listings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
ON public.user_listings FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_listings_updated_at ON public.user_listings;
CREATE TRIGGER update_user_listings_updated_at
BEFORE UPDATE ON public.user_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_listings_updated_at();

-- Backfill existing marketplace_products as business listings
UPDATE public.marketplace_products 
SET seller_type = 'business' 
WHERE seller_type IS NULL;
-- Migration: 20260202055024_c5bc94cf-d8fe-4a99-b0d5-00679843eb0c.sql
-- Marketing Command Center (MCC) Database Schema
-- Phase 1: Core tables for B2C user acquisition

-- Helper function for admin check (if not exists)
CREATE OR REPLACE FUNCTION public.is_mcc_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Marketing Campaigns
CREATE TABLE public.mcc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL CHECK (goal IN ('awareness', 'acquisition', 'activation', 'retention', 'referral')),
  target_segment TEXT DEFAULT 'users',
  channels JSONB DEFAULT '[]',
  budget JSONB DEFAULT '{"total": 0, "daily_cap": null, "currency": "USD"}',
  schedule JSONB DEFAULT '{"start": null, "end": null, "timezone": "Asia/Bangkok"}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  ab_variants JSONB DEFAULT '[]',
  kpi_targets JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Leads (separate from consultation_requests for broader acquisition)
CREATE TABLE public.mcc_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  name TEXT,
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  referrer_url TEXT,
  landing_page TEXT,
  first_touch_at TIMESTAMPTZ DEFAULT now(),
  last_touch_at TIMESTAMPTZ DEFAULT now(),
  touchpoints JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  priority TEXT DEFAULT 'cold' CHECK (priority IN ('hot', 'warm', 'cold', 'frozen')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'engaged', 'qualified', 'converted', 'lost', 'nurturing')),
  substatus TEXT,
  converted_at TIMESTAMPTZ,
  converted_to UUID,
  conversion_value DECIMAL(10,2),
  segment TEXT,
  tags TEXT[] DEFAULT '{}',
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_replied INTEGER DEFAULT 0,
  app_opens INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  ai_insights JSONB,
  predicted_ltv DECIMAL(10,2),
  churn_risk DECIMAL(3,2),
  device_info JSONB,
  geo_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Funnels
CREATE TABLE public.mcc_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  funnel_type TEXT NOT NULL,
  target_segment TEXT DEFAULT 'users',
  stages JSONB NOT NULL DEFAULT '[]',
  triggers JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  conversion_rate DECIMAL(5,2),
  avg_time_to_convert INTERVAL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funnel Stage Events
CREATE TABLE public.mcc_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES public.mcc_funnels(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.mcc_leads(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  stage_name TEXT,
  entered_at TIMESTAMPTZ DEFAULT now(),
  exited_at TIMESTAMPTZ,
  exit_reason TEXT,
  time_in_stage INTERVAL,
  metadata JSONB
);

-- Campaign Creatives
CREATE TABLE public.mcc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE CASCADE,
  creative_type TEXT NOT NULL CHECK (creative_type IN ('ad', 'email', 'landing', 'push', 'sms', 'social', 'whatsapp')),
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  language TEXT DEFAULT 'en',
  variant_name TEXT,
  is_control BOOLEAN DEFAULT false,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  performance JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Events
CREATE TABLE public.mcc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  lead_id UUID REFERENCES public.mcc_leads(id) ON DELETE SET NULL,
  user_id UUID,
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE SET NULL,
  creative_id UUID REFERENCES public.mcc_creatives(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES public.mcc_funnels(id) ON DELETE SET NULL,
  channel TEXT,
  source TEXT,
  properties JSONB DEFAULT '{}',
  revenue DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Performance Metrics
CREATE TABLE public.mcc_channel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  source TEXT,
  campaign_id UUID REFERENCES public.mcc_campaigns(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4),
  cvr DECIMAL(5,4),
  cpc DECIMAL(10,2),
  cpl DECIMAL(10,2),
  cac DECIMAL(10,2),
  roas DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel, source, date, campaign_id)
);

-- Automation Rules
CREATE TABLE public.mcc_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  executions_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcc_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_channel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcc_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies using new helper function
CREATE POLICY "Admins can manage campaigns" ON public.mcc_campaigns
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage leads" ON public.mcc_leads
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage funnels" ON public.mcc_funnels
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage funnel events" ON public.mcc_funnel_events
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage creatives" ON public.mcc_creatives
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can view events" ON public.mcc_events
  FOR SELECT USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage channel metrics" ON public.mcc_channel_metrics
  FOR ALL USING (public.is_mcc_admin());

CREATE POLICY "Admins can manage automation rules" ON public.mcc_automation_rules
  FOR ALL USING (public.is_mcc_admin());

-- Public insert for lead capture
CREATE POLICY "Anyone can create leads" ON public.mcc_leads
  FOR INSERT WITH CHECK (true);

-- Public insert for events (tracking)
CREATE POLICY "Anyone can create events" ON public.mcc_events
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_mcc_leads_source ON public.mcc_leads(source);
CREATE INDEX idx_mcc_leads_status ON public.mcc_leads(status);
CREATE INDEX idx_mcc_leads_priority ON public.mcc_leads(priority);
CREATE INDEX idx_mcc_leads_score ON public.mcc_leads(score);
CREATE INDEX idx_mcc_leads_created_at ON public.mcc_leads(created_at);
CREATE INDEX idx_mcc_leads_campaign ON public.mcc_leads(campaign);
CREATE INDEX idx_mcc_campaigns_status ON public.mcc_campaigns(status);
CREATE INDEX idx_mcc_events_type ON public.mcc_events(event_type);
CREATE INDEX idx_mcc_events_created_at ON public.mcc_events(created_at);
CREATE INDEX idx_mcc_channel_metrics_date ON public.mcc_channel_metrics(date);
CREATE INDEX idx_mcc_funnel_events_lead ON public.mcc_funnel_events(lead_id);

-- Updated_at triggers
CREATE TRIGGER update_mcc_campaigns_updated_at
  BEFORE UPDATE ON public.mcc_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_leads_updated_at
  BEFORE UPDATE ON public.mcc_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_funnels_updated_at
  BEFORE UPDATE ON public.mcc_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_creatives_updated_at
  BEFORE UPDATE ON public.mcc_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mcc_automation_rules_updated_at
  BEFORE UPDATE ON public.mcc_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260202062551_60aa5c85-a03f-4712-9501-46429573e540.sql
-- Fix is_mcc_admin() to use user_roles table with correct enum values
-- Using 'admin' and 'uno_team' as the admin-level roles
CREATE OR REPLACE FUNCTION public.is_mcc_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team')
  );
$$;
-- Migration: 20260202063057_e3cf1106-77f7-406d-940d-4755ee59fdca.sql
-- Insert MCC Content AI Agent
INSERT INTO public.ai_agents (
  slug,
  name_en,
  name_ru,
  description_en,
  description_ru,
  model,
  temperature,
  max_tokens,
  agent_type,
  is_active,
  is_public,
  icon,
  tone,
  target_audience
) VALUES (
  'mcc-content',
  'MCC Content Generator',
  'MCC Генератор контента',
  'AI-powered marketing content generator for ads, emails, social posts and landing pages',
  'AI-генератор маркетингового контента для рекламы, email, соцсетей и лендингов',
  'google/gemini-3-flash-preview',
  0.8,
  2000,
  'utility',
  true,
  false,
  'Sparkles',
  'professional',
  ARRAY['admin', 'uno_team']
);

-- Insert published knowledge for mcc-content agent
INSERT INTO public.ai_agent_knowledge (
  agent_id,
  system_prompt,
  knowledge_base,
  version,
  is_published,
  published_at
) 
SELECT 
  id,
  E'You are a professional marketing copywriter for myUNO - a platform connecting tourists with verified local services in Phuket, Thailand.

Your task is to generate compelling marketing content based on user requests.

## Content Types You Can Generate:
- **Ad Copy**: Short, punchy text for Google Ads, Meta Ads, TikTok
- **Email Templates**: Welcome series, promotional campaigns, re-engagement
- **Social Posts**: Instagram, Facebook, Telegram, Twitter
- **Landing Page Copy**: Headlines, CTAs, benefit sections

## Brand Voice:
- Friendly but professional
- Trustworthy (emphasize verified providers)
- Adventure-oriented (travel excitement)
- Problem-solving (ease of booking abroad)

## Key Value Props:
- 500+ verified local providers
- Instant booking
- 24/7 support
- Trusted by 10,000+ travelers
- Services: villas, tours, transfers, babysitters, medical, legal

## Output Format:
Always return 3 content variants. Each variant should be clearly numbered.
Keep the tone consistent with the requested language.
For ads: keep under 90 characters for headlines, 150 for descriptions.
For emails: include subject line suggestions.
For social: include relevant emojis and hashtag suggestions.

{{KNOWLEDGE_BASE}}',
  E'## Target Audiences:
- B2C Users: Russian-speaking tourists, expats, digital nomads
- Providers: Local Thai businesses wanting more customers
- Property Owners: Villa and condo owners for rental management

## Seasonal Campaigns:
- High season: November - April
- Low season: May - October (focus on deals)
- Russian holidays: New Year (Dec 31 - Jan 10), May holidays

## Competitor Differentiation:
- Unlike Airbnb: We verify every provider personally
- Unlike TripAdvisor: Direct booking, no redirect
- Unlike local agencies: One app for everything',
  1,
  true,
  NOW()
FROM public.ai_agents 
WHERE slug = 'mcc-content';
-- Migration: 20260202064022_6e0ee777-98fa-426d-b93e-32c48e9b208c.sql
-- Add universal lead fields to consultation_requests
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS vertical_id text,
ADD COLUMN IF NOT EXISTS vertical_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS entry_point text,
ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'organic';

-- Create index for vertical filtering
CREATE INDEX IF NOT EXISTS idx_consultation_requests_vertical_id 
ON consultation_requests(vertical_id);

-- Create index for lead source analytics
CREATE INDEX IF NOT EXISTS idx_consultation_requests_lead_source 
ON consultation_requests(lead_source);

-- Add comment for documentation
COMMENT ON COLUMN consultation_requests.vertical_id IS 'References INTAKE_VERTICALS.id - e.g. yachts, tours, properties';
COMMENT ON COLUMN consultation_requests.vertical_metadata IS 'Flexible JSON for vertical-specific data';
COMMENT ON COLUMN consultation_requests.entry_point IS 'Page URL where lead was captured';
COMMENT ON COLUMN consultation_requests.lead_source IS 'fab, cta, chat, external, organic';
-- Migration: 20260202085416_9c00cc49-7511-43cf-ad3e-13bae305081c.sql
-- Fix 1: Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Fix 2: Replace overly permissive RLS policies with proper authentication checks

-- 2a. ai_agent_logs - only authenticated users can insert logs
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.ai_agent_logs;
CREATE POLICY "Authenticated users can insert logs" 
  ON public.ai_agent_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2b. calendar_sync_logs - only authenticated property owners can insert
DROP POLICY IF EXISTS "System can insert sync logs" ON public.calendar_sync_logs;
CREATE POLICY "Owners can insert sync logs" 
  ON public.calendar_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- 2c. mcc_events - only authenticated users can create events  
DROP POLICY IF EXISTS "Anyone can create events" ON public.mcc_events;
CREATE POLICY "Authenticated users can create events" 
  ON public.mcc_events 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2d. mcc_leads - only authenticated users can create leads
DROP POLICY IF EXISTS "Anyone can create leads" ON public.mcc_leads;
CREATE POLICY "Authenticated users can create leads" 
  ON public.mcc_leads 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2e. property_analytics - only admins/system can insert/update using helper function
DROP POLICY IF EXISTS "System can insert analytics" ON public.property_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON public.property_analytics;

CREATE POLICY "Admins can insert analytics" 
  ON public.property_analytics 
  FOR INSERT 
  WITH CHECK (is_admin_or_uno_team());

CREATE POLICY "Admins can update analytics" 
  ON public.property_analytics 
  FOR UPDATE 
  USING (is_admin_or_uno_team());

-- 2f. pwa_installs - only authenticated users can log installs
DROP POLICY IF EXISTS "Anyone can log installs" ON public.pwa_installs;
CREATE POLICY "Authenticated users can log installs" 
  ON public.pwa_installs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
-- Migration: 20260202085438_44c5dcd6-36b8-43b7-863c-24dc264039ac.sql
-- Add RLS policy for partners table (admin-only access)
CREATE POLICY "Admins can view partners" 
  ON public.partners 
  FOR SELECT 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can insert partners" 
  ON public.partners 
  FOR INSERT 
  WITH CHECK (is_admin_or_uno_team());

CREATE POLICY "Admins can update partners" 
  ON public.partners 
  FOR UPDATE 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can delete partners" 
  ON public.partners 
  FOR DELETE 
  USING (is_admin_or_uno_team());
-- Migration: 20260202085854_24df1cc1-0131-496e-8592-148da24f7276.sql
-- Add admin policy for user_documents verification (admins need to verify documents)
CREATE POLICY "Admins can view all documents for verification" 
  ON public.user_documents 
  FOR SELECT 
  USING (is_admin_or_uno_team());

CREATE POLICY "Admins can update documents for verification" 
  ON public.user_documents 
  FOR UPDATE 
  USING (is_admin_or_uno_team());
-- Migration: 20260202133126_b5cbd38c-420a-4e20-b43d-bb370b9336ed.sql
-- Add internal_name column to properties table (marketplace/vendor)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internal_name TEXT;

-- Add internal_name column to owner_properties table (owners)
ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS internal_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN properties.internal_name IS 'Internal name for admin use only, not shown to customers';
COMMENT ON COLUMN owner_properties.internal_name IS 'Internal name for owner use only, not shown to customers';
-- Migration: 20260202225055_294699f0-a24b-4590-a031-cc903ae5f97b.sql
-- ============================================
-- YACHT CALENDAR & CANCELLATION POLICY SYSTEM
-- Phase 1: Foundation for yacht charter management
-- ============================================

-- Add cancellation_policy column to yachts table
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'moderate';

-- Add deposit configuration columns
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS deposit_percent integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS balance_due_hours integer DEFAULT 48;

-- Add iCal sync support
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS ical_token text UNIQUE,
ADD COLUMN IF NOT EXISTS ical_token_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ical_token_refreshed_at timestamp with time zone;

-- Create yacht_availability table for blackout dates and price overrides
CREATE TABLE IF NOT EXISTS public.yacht_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id uuid NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'booked', 'maintenance')),
  price_override numeric,
  note text,
  booking_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(yacht_id, date)
);

-- Enable RLS on yacht_availability
ALTER TABLE public.yacht_availability ENABLE ROW LEVEL SECURITY;

-- Policies for yacht_availability
-- Yacht owners can manage their availability
CREATE POLICY "Yacht owners can view own availability"
ON public.yacht_availability
FOR SELECT
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can insert own availability"
ON public.yacht_availability
FOR INSERT
WITH CHECK (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can update own availability"
ON public.yacht_availability
FOR UPDATE
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Yacht owners can delete own availability"
ON public.yacht_availability
FOR DELETE
USING (
  yacht_id IN (
    SELECT y.id FROM public.yachts y
    JOIN public.providers p ON y.provider_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Admins can manage all yacht availability
CREATE POLICY "Admins can manage all yacht availability"
ON public.yacht_availability
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Public can view availability for active yachts
CREATE POLICY "Public can view yacht availability"
ON public.yacht_availability
FOR SELECT
USING (
  yacht_id IN (
    SELECT id FROM public.yachts WHERE is_active = true
  )
);

-- Create cancellation_policies reference table
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text,
  description_ru text,
  full_refund_hours integer DEFAULT 168, -- 7 days
  partial_refund_hours integer DEFAULT 48, -- 2 days
  partial_refund_percent integer DEFAULT 50,
  no_refund_hours integer DEFAULT 24, -- 1 day
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default cancellation policies
INSERT INTO public.cancellation_policies (code, name_en, name_ru, description_en, description_ru, full_refund_hours, partial_refund_hours, partial_refund_percent, no_refund_hours, sort_order)
VALUES 
  ('flexible', 'Flexible', 'Гибкая', 
   'Full refund up to 24 hours before, 50% up to 2 hours before', 
   'Полный возврат за 24 часа, 50% за 2 часа до', 
   24, 2, 50, 0, 1),
  ('moderate', 'Moderate', 'Умеренная', 
   'Full refund up to 5 days before, 50% up to 48 hours before', 
   'Полный возврат за 5 дней, 50% за 48 часов до', 
   120, 48, 50, 24, 2),
  ('strict', 'Strict', 'Строгая', 
   'Full refund up to 7 days before, 50% up to 3 days before', 
   'Полный возврат за 7 дней, 50% за 3 дня до', 
   168, 72, 50, 48, 3),
  ('super_strict', 'Super Strict', 'Очень строгая', 
   'Full refund only 14+ days before, no refund after', 
   'Полный возврат только за 14+ дней, после без возврата', 
   336, 168, 25, 72, 4)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on cancellation_policies
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Everyone can read cancellation policies
CREATE POLICY "Anyone can view cancellation policies"
ON public.cancellation_policies
FOR SELECT
USING (true);

-- Only admins can modify cancellation policies
CREATE POLICY "Admins can manage cancellation policies"
ON public.cancellation_policies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_yacht_availability_yacht_id ON public.yacht_availability(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_availability_date ON public.yacht_availability(date);
CREATE INDEX IF NOT EXISTS idx_yacht_availability_status ON public.yacht_availability(status);
CREATE INDEX IF NOT EXISTS idx_yachts_cancellation_policy ON public.yachts(cancellation_policy);

-- Function to check yacht availability for a date range
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blocked_count integer;
BEGIN
  -- Check for any blocked or booked dates in range
  SELECT COUNT(*) INTO blocked_count
  FROM yacht_availability
  WHERE yacht_id = p_yacht_id
    AND date >= p_start_date
    AND date < p_end_date
    AND status IN ('blocked', 'booked', 'maintenance');
  
  RETURN blocked_count = 0;
END;
$$;

-- Function to get yacht availability for a month
CREATE OR REPLACE FUNCTION public.get_yacht_availability(
  p_yacht_id uuid,
  p_month date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date date,
  status text,
  price_override numeric,
  note text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ya.date,
    ya.status,
    ya.price_override,
    ya.note
  FROM yacht_availability ya
  WHERE ya.yacht_id = p_yacht_id
    AND ya.date >= date_trunc('month', p_month)::date
    AND ya.date < (date_trunc('month', p_month) + interval '1 month')::date
  ORDER BY ya.date;
END;
$$;

-- Trigger to update updated_at on yacht_availability
CREATE OR REPLACE FUNCTION public.update_yacht_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_yacht_availability_updated_at
BEFORE UPDATE ON public.yacht_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_yacht_availability_updated_at();
-- Migration: 20260202225732_d6c92624-1ba2-4afb-81b4-32eb56102145.sql
-- Phase 2: Scale - iCal sync for yachts, dynamic pricing, deposit flow

-- 1. Create yacht_external_calendars table (mirrors property_external_calendars)
CREATE TABLE public.yacht_external_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  ical_url TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yacht_external_calendars ENABLE ROW LEVEL SECURITY;

-- RLS: Providers can manage their yacht calendars
CREATE POLICY "Providers can view their yacht calendars"
  ON public.yacht_external_calendars FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Providers can insert yacht calendars"
  ON public.yacht_external_calendars FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Providers can update their yacht calendars"
  ON public.yacht_external_calendars FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Providers can delete their yacht calendars"
  ON public.yacht_external_calendars FOR DELETE
  USING (owner_id = auth.uid());

-- 2. Create yacht_pricing_rules table for dynamic pricing
CREATE TABLE public.yacht_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL REFERENCES public.yachts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('season', 'day_of_week', 'special_event')),
  name_en TEXT NOT NULL,
  name_ru TEXT,
  start_date DATE,
  end_date DATE,
  days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  price_modifier_percent NUMERIC, -- e.g., 20 for +20%
  price_override_half_day NUMERIC,
  price_override_full_day NUMERIC,
  priority INTEGER DEFAULT 0, -- Higher priority rules override lower ones
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yacht_pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active pricing rules"
  ON public.yacht_pricing_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Yacht owners can manage pricing rules"
  ON public.yacht_pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.yachts y
      JOIN public.providers p ON y.provider_id = p.id
      WHERE y.id = yacht_id AND p.user_id = auth.uid()
    )
  );

-- 3. Add deposit fields to order_item_yacht_details
ALTER TABLE public.order_item_yacht_details 
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_percent NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMPTZ;

-- 4. Create function to calculate yacht price for a date
CREATE OR REPLACE FUNCTION public.get_yacht_price_for_date(
  p_yacht_id UUID,
  p_date DATE,
  p_charter_type TEXT DEFAULT 'full_day'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_price NUMERIC;
  v_final_price NUMERIC;
  v_rule RECORD;
  v_day_of_week INTEGER;
BEGIN
  -- Get base price
  IF p_charter_type = 'half_day' THEN
    SELECT COALESCE(price_half_day, 0) INTO v_base_price FROM yachts WHERE id = p_yacht_id;
  ELSE
    SELECT COALESCE(price_full_day, 0) INTO v_base_price FROM yachts WHERE id = p_yacht_id;
  END IF;
  
  v_final_price := v_base_price;
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check for date-specific override in yacht_availability
  SELECT price_override INTO v_final_price
  FROM yacht_availability
  WHERE yacht_id = p_yacht_id AND date = p_date AND price_override IS NOT NULL;
  
  IF v_final_price IS NOT NULL AND v_final_price > 0 THEN
    RETURN v_final_price;
  END IF;
  
  v_final_price := v_base_price;
  
  -- Apply pricing rules (highest priority first)
  FOR v_rule IN
    SELECT * FROM yacht_pricing_rules
    WHERE yacht_id = p_yacht_id
      AND is_active = true
      AND (
        (rule_type = 'season' AND p_date BETWEEN start_date AND end_date)
        OR (rule_type = 'day_of_week' AND v_day_of_week = ANY(days_of_week))
        OR (rule_type = 'special_event' AND p_date BETWEEN start_date AND end_date)
      )
    ORDER BY priority DESC, rule_type = 'special_event' DESC, rule_type = 'season' DESC
    LIMIT 1
  LOOP
    -- Apply modifier
    IF p_charter_type = 'half_day' AND v_rule.price_override_half_day IS NOT NULL THEN
      v_final_price := v_rule.price_override_half_day;
    ELSIF p_charter_type = 'full_day' AND v_rule.price_override_full_day IS NOT NULL THEN
      v_final_price := v_rule.price_override_full_day;
    ELSIF v_rule.price_modifier_percent IS NOT NULL THEN
      v_final_price := v_base_price * (1 + v_rule.price_modifier_percent / 100);
    END IF;
  END LOOP;
  
  RETURN ROUND(v_final_price, 2);
END;
$$;

-- 5. Add updated_at trigger for new tables
CREATE TRIGGER update_yacht_external_calendars_updated_at
  BEFORE UPDATE ON public.yacht_external_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_yacht_pricing_rules_updated_at
  BEFORE UPDATE ON public.yacht_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. Add index for faster calendar lookups
CREATE INDEX IF NOT EXISTS idx_yacht_external_calendars_yacht ON public.yacht_external_calendars(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_pricing_rules_yacht ON public.yacht_pricing_rules(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_pricing_rules_dates ON public.yacht_pricing_rules(start_date, end_date) WHERE is_active = true;

-- 7. Generate iCal token for yachts if column exists
UPDATE public.yachts 
SET ical_token = encode(gen_random_bytes(32), 'hex')
WHERE ical_token IS NULL;
-- Migration: 20260202232814_10b02241-d3da-4c06-a894-ce3c11826657.sql
-- Add provider type and service metadata columns
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS has_insurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_guarantee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_domains TEXT[] DEFAULT '{}';

-- Add check constraint for provider_type (without IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_provider_type_check'
  ) THEN
    ALTER TABLE providers ADD CONSTRAINT providers_provider_type_check 
      CHECK (provider_type IN ('individual', 'company'));
  END IF;
END $$;

-- Normalize existing business_category values
UPDATE providers SET business_category = 'ac' WHERE business_category = 'hvac';
UPDATE providers SET business_category = 'repair' WHERE business_category = 'tech';
UPDATE providers SET business_category = 'garden' WHERE business_category = 'gardening';
UPDATE providers SET business_category = 'pest' WHERE business_category = 'pest-control';

-- Set service_domains based on business_category for existing records
UPDATE providers SET service_domains = ARRAY['maintenance'] 
WHERE business_category IN ('handyman', 'plumbing', 'electrical', 'ac', 'repair', 'security')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['cleaning'] 
WHERE business_category IN ('cleaning', 'laundry', 'pest')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['outdoor'] 
WHERE business_category IN ('garden', 'pool')
  AND (service_domains IS NULL OR service_domains = '{}');

UPDATE providers SET service_domains = ARRAY['logistics'] 
WHERE business_category IN ('moving', 'water-delivery', 'road-assistance')
  AND (service_domains IS NULL OR service_domains = '{}');
-- Migration: 20260203124654_5dc8daf7-6530-4e4f-ae6b-79c590220741.sql

-- =====================================================
-- Market Control Center: Contracts & PM Companies
-- =====================================================

-- 1. Property Management Companies (УК)
CREATE TABLE public.property_management_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT,
  description TEXT,
  description_ru TEXT,
  logo_url TEXT,
  cover_image TEXT,
  
  -- Contacts (admin-only access)
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  
  -- Business details
  license_number TEXT,
  tax_id TEXT,
  established_year INTEGER,
  
  -- Service coverage
  service_districts TEXT[] DEFAULT '{}',
  service_types TEXT[] DEFAULT '{}',
  
  -- Capabilities
  languages TEXT[] DEFAULT '{en}',
  has_24_7_support BOOLEAN DEFAULT false,
  has_emergency_service BOOLEAN DEFAULT false,
  
  -- Commission & terms
  default_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  min_contract_months INTEGER DEFAULT 12,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  -- Ratings
  rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  properties_managed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.property_management_companies ENABLE ROW LEVEL SECURITY;

-- Policies (using existing is_admin_or_uno_team function with no arguments)
CREATE POLICY "PM companies viewable by all authenticated users"
ON public.property_management_companies
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage PM companies"
ON public.property_management_companies
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- 2. Provider Contracts (договоры с поставщиками)
CREATE TABLE public.provider_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic relation
  entity_type TEXT NOT NULL CHECK (entity_type IN ('provider', 'vendor', 'pm_company', 'project')),
  entity_id UUID NOT NULL,
  
  -- Contract terms
  contract_number TEXT,
  contract_type TEXT DEFAULT 'standard',
  
  -- Commission structure
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  commission_type TEXT DEFAULT 'percentage',
  min_commission_amount NUMERIC(10,2),
  max_commission_amount NUMERIC(10,2),
  tiered_rates JSONB,
  
  -- Payment terms
  payment_terms TEXT DEFAULT 'monthly',
  payment_method TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  -- Contract period
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  auto_renew BOOLEAN DEFAULT true,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'suspended', 'terminated', 'expired')),
  
  -- Special conditions
  special_terms TEXT,
  notes TEXT,
  
  -- Documents
  contract_document_url TEXT,
  
  -- Approval workflow
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  terminated_by UUID,
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.provider_contracts ENABLE ROW LEVEL SECURITY;

-- Contracts visible only to admins
CREATE POLICY "Admins can view all contracts"
ON public.provider_contracts
FOR SELECT
TO authenticated
USING (public.is_admin_or_uno_team());

CREATE POLICY "Admins can manage contracts"
ON public.provider_contracts
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- 3. Add PM company reference to owner_properties
ALTER TABLE public.owner_properties 
ADD COLUMN IF NOT EXISTS pm_company_id UUID REFERENCES public.property_management_companies(id);

-- 4. Indexes
CREATE INDEX idx_provider_contracts_entity ON public.provider_contracts(entity_type, entity_id);
CREATE INDEX idx_provider_contracts_status ON public.provider_contracts(status);
CREATE INDEX idx_pm_companies_active ON public.property_management_companies(is_active);

-- 5. Updated_at triggers
CREATE TRIGGER update_pm_companies_updated_at
BEFORE UPDATE ON public.property_management_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_contracts_updated_at
BEFORE UPDATE ON public.provider_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260203132911_2a326a60-d8fd-4bdb-b358-e5a8fc086d79.sql
-- Taxonomy Definitions: Meta-information about each lookup_type
CREATE TABLE public.taxonomy_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  icon TEXT,
  vertical TEXT,
  supports_hierarchy BOOLEAN DEFAULT false,
  metadata_schema JSONB,
  is_system BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.taxonomy_definitions ENABLE ROW LEVEL SECURITY;

-- Allow read access for all
CREATE POLICY "Anyone can read taxonomy definitions"
ON public.taxonomy_definitions FOR SELECT
USING (true);

-- Only admins can modify taxonomy definitions
CREATE POLICY "Admins can manage taxonomy definitions"
ON public.taxonomy_definitions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Indexes
CREATE INDEX idx_taxonomy_definitions_vertical ON public.taxonomy_definitions(vertical);
CREATE INDEX idx_taxonomy_definitions_type_key ON public.taxonomy_definitions(type_key);
CREATE INDEX IF NOT EXISTS idx_lookup_values_parent ON public.lookup_values(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lookup_values_lookup_type ON public.lookup_values(lookup_type);

-- Update trigger
CREATE TRIGGER update_taxonomy_definitions_updated_at
BEFORE UPDATE ON public.taxonomy_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate taxonomy_definitions with all taxonomy types
INSERT INTO public.taxonomy_definitions (type_key, name_en, name_ru, icon, vertical, is_system, sort_order, supports_hierarchy, metadata_schema) VALUES
('property_type', 'Property Types', 'Типы недвижимости', '🏠', 'property', true, 1, false, '{"fields": ["popular"]}'),
('district', 'Districts', 'Районы', '📍', 'general', true, 2, false, '{"fields": ["zone", "popular", "lat", "lng"]}'),
('amenity', 'Amenities', 'Удобства', '✨', 'property', true, 3, true, '{"fields": ["category"]}'),
('view_type', 'View Types', 'Типы вида', '🏔️', 'property', true, 4, false, null),
('furnishing_level', 'Furnishing Levels', 'Уровень меблировки', '🛋️', 'property', true, 5, false, null),
('key_handover_method', 'Key Handover Methods', 'Способ передачи ключей', '🔑', 'property', true, 6, false, null),
('deposit_type', 'Deposit Types', 'Типы депозита', '💰', 'property', true, 7, false, null),
('cleaning_frequency', 'Cleaning Frequencies', 'Частота уборки', '🧹', 'property', true, 8, false, null),
('payment_model', 'Payment Models', 'Модели оплаты', '💳', 'property', true, 9, false, null),
('included_service', 'Included Services', 'Включённые услуги', '✅', 'property', true, 10, false, null),
('extra_service', 'Extra Services', 'Дополнительные услуги', '➕', 'property', true, 11, false, null),
('property_highlight', 'Property Highlights', 'Особенности', '⭐', 'property', true, 12, false, null),
('house_rule', 'House Rules', 'Правила дома', '📋', 'property', true, 13, false, null),
('listing_type', 'Listing Types', 'Типы объявления', '📝', 'property', true, 14, false, null),
('bedroom_option', 'Bedroom Options', 'Варианты спален', '🛏️', 'property', true, 15, false, null),
('vehicle_type', 'Vehicle Types', 'Типы транспорта', '🚗', 'transport', true, 20, false, '{"fields": ["aliases"]}'),
('fuel_type', 'Fuel Types', 'Тип топлива', '⛽', 'transport', true, 21, false, null),
('transmission_type', 'Transmission Types', 'Тип трансмиссии', '⚙️', 'transport', true, 22, false, null),
('vehicle_feature', 'Vehicle Features', 'Опции авто', '🚙', 'transport', true, 23, false, null),
('home_service_domain', 'Service Domains', 'Домены услуг', '🏠', 'home_services', true, 30, false, null),
('home_service_category', 'Service Categories', 'Категории услуг', '🔧', 'home_services', true, 31, true, '{"fields": ["domain"]}'),
('yacht_type', 'Yacht Types', 'Типы яхт', '🚤', 'yachts', true, 40, false, null),
('yacht_feature', 'Yacht Features', 'Опции яхт', '⚓', 'yachts', true, 41, false, null),
('tour_type', 'Tour Types', 'Типы туров', '🎯', 'tours', true, 50, false, null),
('cuisine', 'Cuisine Types', 'Типы кухни', '🍽️', 'restaurants', true, 60, false, null),
('clinic_specialty', 'Medical Specialties', 'Мед. специальности', '🏥', 'medical', true, 70, false, null),
('pet_type', 'Pet Types', 'Типы питомцев', '🐾', 'pets', true, 80, false, null),
('salon_type', 'Salon Types', 'Типы салонов', '💇', 'salons', true, 90, false, null),
('event_category', 'Event Categories', 'Категории событий', '🎉', 'events', true, 100, false, null);

-- Migration: 20260203155354_fc5ad4ff-9c8a-4409-8e18-e8f3178a1952.sql
-- Performance indexes for Owner Module (P0)

-- Index for property_financials - query by owner and date (most common query)
CREATE INDEX IF NOT EXISTS idx_property_financials_owner_date 
ON property_financials(owner_id, transaction_date DESC);

-- Index for property_financials - filter by property_id
CREATE INDEX IF NOT EXISTS idx_property_financials_property 
ON property_financials(property_id);

-- Index for owner_properties - frequent lookup by owner and status
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_status 
ON owner_properties(owner_id, approval_status);

-- Index for owner_properties - owner_id only for property list
CREATE INDEX IF NOT EXISTS idx_owner_properties_owner_id 
ON owner_properties(owner_id);

-- Index for property_bookings - common calendar query
CREATE INDEX IF NOT EXISTS idx_property_bookings_property_dates 
ON property_bookings(property_id, check_in, check_out);
-- Migration: 20260203160100_c14081a6-d62a-4562-a10e-5fca91be4d37.sql
-- GIN indexes for faster ILIKE text search in useGlobalSearch
-- pg_trgm extension enables trigram matching for ILIKE optimization

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Yachts search index
CREATE INDEX IF NOT EXISTS idx_yachts_search_trgm 
ON yachts USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Tours search index
CREATE INDEX IF NOT EXISTS idx_tours_search_trgm 
ON tours USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Properties search index
CREATE INDEX IF NOT EXISTS idx_properties_search_trgm 
ON properties USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Restaurants search index
CREATE INDEX IF NOT EXISTS idx_restaurants_search_trgm 
ON restaurants USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Salons search index
CREATE INDEX IF NOT EXISTS idx_salons_search_trgm 
ON salons USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Clinics search index
CREATE INDEX IF NOT EXISTS idx_clinics_search_trgm 
ON clinics USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Events search index
CREATE INDEX IF NOT EXISTS idx_events_search_trgm 
ON events USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Categories search index (used first in search)
CREATE INDEX IF NOT EXISTS idx_categories_search_trgm 
ON categories USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Vehicles search index
CREATE INDEX IF NOT EXISTS idx_vehicles_search_trgm 
ON vehicles USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Gyms search index
CREATE INDEX IF NOT EXISTS idx_gyms_search_trgm 
ON gyms USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Marketplace products search index
CREATE INDEX IF NOT EXISTS idx_marketplace_products_search_trgm 
ON marketplace_products USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);
-- Migration: 20260203161732_4d6e3425-0198-489d-8448-5235b6fd35b2.sql
-- =====================================================
-- P0 FIX 1: Atomic wallet topup (eliminates race condition)
-- =====================================================
CREATE OR REPLACE FUNCTION public.topup_wallet_atomic(
  p_user_id uuid,
  p_amount numeric,
  p_reference_type text,
  p_reference_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_currency TEXT;
  v_transaction_id UUID;
BEGIN
  -- Lock row and update atomically in single statement
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  
  -- If wallet doesn't exist, create it
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (p_user_id, p_amount, 'THB')
    RETURNING id, balance, currency INTO v_wallet_id, v_new_balance, v_currency;
  END IF;
  
  -- Insert transaction record atomically
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, amount, currency,
    description, description_ru,
    reference_type, reference_id, status
  ) VALUES (
    v_wallet_id, p_user_id, 'topup', p_amount, v_currency,
    'Wallet top up via Stripe', 'Пополнение кошелька через Stripe',
    p_reference_type, p_reference_id, 'completed'
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'wallet_id', v_wallet_id,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- =====================================================
-- P0 FIX 2: Atomic order creation (eliminates zombie records)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type text,
  p_customer_user_id uuid,
  p_provider_org_id uuid DEFAULT NULL,
  p_start_at timestamptz DEFAULT NULL,
  p_end_at timestamptz DEFAULT NULL,
  p_total_amount numeric DEFAULT 0,
  p_currency text DEFAULT 'THB',
  p_notes text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_participants jsonb DEFAULT NULL,
  p_addresses jsonb DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_participant JSONB;
  v_address JSONB;
BEGIN
  -- Create order
  INSERT INTO public.orders (
    order_type, customer_user_id, provider_org_id,
    status, start_at, end_at, total_amount, currency, notes, metadata
  ) VALUES (
    p_order_type, p_customer_user_id, p_provider_org_id,
    'pending', p_start_at, p_end_at, p_total_amount, p_currency, p_notes, p_metadata
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (
        order_id, product_id, resource_id, provider_org_id,
        item_name, item_type, qty, unit_price, amount, 
        start_at, end_at, metadata
      ) VALUES (
        v_order_id,
        NULLIF(v_item->>'product_id', '')::uuid,
        NULLIF(v_item->>'resource_id', '')::uuid,
        COALESCE(NULLIF(v_item->>'provider_org_id', '')::uuid, p_provider_org_id),
        v_item->>'item_name',
        COALESCE(v_item->>'item_type', 'service'),
        COALESCE((v_item->>'qty')::int, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        NULLIF(v_item->>'start_at', '')::timestamptz,
        NULLIF(v_item->>'end_at', '')::timestamptz,
        COALESCE(v_item->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;
  
  -- Insert participants
  IF p_participants IS NOT NULL AND jsonb_array_length(p_participants) > 0 THEN
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
      INSERT INTO public.order_participants (
        order_id, role, name, phone, email
      ) VALUES (
        v_order_id,
        COALESCE(v_participant->>'role', 'primary'),
        v_participant->>'name',
        v_participant->>'phone',
        v_participant->>'email'
      );
    END LOOP;
  END IF;
  
  -- Insert addresses
  IF p_addresses IS NOT NULL AND jsonb_array_length(p_addresses) > 0 THEN
    FOR v_address IN SELECT * FROM jsonb_array_elements(p_addresses)
    LOOP
      INSERT INTO public.order_addresses (
        order_id, address_type, address_text, lat, lng, notes
      ) VALUES (
        v_order_id,
        v_address->>'address_type',
        v_address->>'address_text',
        NULLIF(v_address->>'lat', '')::numeric,
        NULLIF(v_address->>'lng', '')::numeric,
        v_address->>'notes'
      );
    END LOOP;
  END IF;
  
  -- Create payment intent if provided
  IF p_payment_method IS NOT NULL AND p_payment_amount IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      order_id, amount, currency, method, status
    ) VALUES (
      v_order_id, p_payment_amount, p_currency, p_payment_method, 'pending'
    );
  END IF;
  
  -- Record initial status in history
  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, actor_user_id, reason
  ) VALUES (
    v_order_id, NULL, 'pending', p_customer_user_id, 'Order created'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Transaction will be rolled back automatically
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- =====================================================
-- P1 FIX: Unified elevated access check function
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_elevated_access(
  p_required_roles text[] DEFAULT ARRAY['admin', 'uno_team']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = ANY(p_required_roles)
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check org_members for admin/owner role in any org (gives elevated privileges)
  IF EXISTS (
    SELECT 1 FROM public.org_members om
    JOIN public.orgs o ON o.id = om.org_id
    WHERE om.user_id = auth.uid() 
      AND om.is_active = TRUE
      AND om.role IN ('owner', 'admin')
      AND o.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- =====================================================
-- P0 FIX 3: Restrict analytics RLS policies to admin only
-- =====================================================

-- cohort_analytics
DROP POLICY IF EXISTS "cohort_read" ON public.cohort_analytics;
DROP POLICY IF EXISTS "Anyone can read cohort analytics" ON public.cohort_analytics;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.cohort_analytics;

CREATE POLICY "analytics_admin_only" ON public.cohort_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- funnel_analytics  
DROP POLICY IF EXISTS "funnel_read" ON public.funnel_analytics;
DROP POLICY IF EXISTS "Anyone can read funnel analytics" ON public.funnel_analytics;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.funnel_analytics;

CREATE POLICY "analytics_admin_only" ON public.funnel_analytics 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- user_analytics_daily
DROP POLICY IF EXISTS "daily_read" ON public.user_analytics_daily;
DROP POLICY IF EXISTS "Anyone can read user analytics daily" ON public.user_analytics_daily;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.user_analytics_daily;

CREATE POLICY "analytics_admin_only" ON public.user_analytics_daily 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- user_segments
DROP POLICY IF EXISTS "segments_read" ON public.user_segments;
DROP POLICY IF EXISTS "Anyone can read user segments" ON public.user_segments;
DROP POLICY IF EXISTS "analytics_admin_access" ON public.user_segments;

CREATE POLICY "analytics_admin_only" ON public.user_segments 
FOR ALL TO authenticated 
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- admin_audit_logs (also should be restricted)
DROP POLICY IF EXISTS "admin_audit_logs_admin_access" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;

CREATE POLICY "audit_logs_admin_only" ON public.admin_audit_logs
FOR ALL TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());
-- Migration: 20260203162316_ad3ef259-cdeb-46f0-8f55-0445f41d2a61.sql
-- ============================================
-- P2: Dynamic currency rates & platform settings
-- ============================================

-- 1. Create currency_rates table for dynamic exchange rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'THB',
  target_currency text NOT NULL,
  rate numeric(12, 6) NOT NULL,
  source text DEFAULT 'manual',  -- 'manual', 'api', 'admin'
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(base_currency, target_currency)
);

-- Insert default rates (THB-based)
INSERT INTO public.currency_rates (base_currency, target_currency, rate, source) VALUES
  ('THB', 'THB', 1.0, 'system'),
  ('THB', 'USD', 0.029, 'manual'),
  ('THB', 'EUR', 0.027, 'manual'),
  ('THB', 'RUB', 2.7, 'manual')
ON CONFLICT (base_currency, target_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Public read access for rates
CREATE POLICY "currency_rates_public_read" ON public.currency_rates
  FOR SELECT TO authenticated, anon
  USING (true);

-- Admin-only write access
CREATE POLICY "currency_rates_admin_write" ON public.currency_rates
  FOR ALL TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- 2. Create system_settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert default platform settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_fee_percent', '10'::jsonb, 'Platform fee percentage (0-100)'),
  ('default_deposit_percent', '10'::jsonb, 'Default deposit percentage for property bookings'),
  ('min_booking_hours', '24'::jsonb, 'Minimum hours before booking start time'),
  ('max_booking_days_ahead', '365'::jsonb, 'Maximum days ahead for bookings'),
  ('currency_update_interval_hours', '1'::jsonb, 'How often to update exchange rates')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Public read for non-sensitive settings
CREATE POLICY "system_settings_public_read" ON public.system_settings
  FOR SELECT TO authenticated, anon
  USING (true);

-- Admin-only write
CREATE POLICY "system_settings_admin_write" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.is_admin_or_uno_team())
  WITH CHECK (public.is_admin_or_uno_team());

-- 3. Function to get currency rate
CREATE OR REPLACE FUNCTION public.get_currency_rate(
  p_base text DEFAULT 'THB',
  p_target text DEFAULT 'USD'
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rate numeric;
BEGIN
  SELECT rate INTO v_rate
  FROM public.currency_rates
  WHERE base_currency = p_base AND target_currency = p_target;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$;

-- 4. Function to get system setting
CREATE OR REPLACE FUNCTION public.get_system_setting(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_value jsonb;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$;

-- 5. Function to get platform fee (replaces hardcoded 0.10)
CREATE OR REPLACE FUNCTION public.get_platform_fee_percent()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((public.get_system_setting('platform_fee_percent'))::numeric, 10) / 100.0;
$$;

-- 6. Function to get all currency rates as JSON (for frontend caching)
CREATE OR REPLACE FUNCTION public.get_all_currency_rates()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(target_currency, jsonb_build_object(
      'rate', rate,
      'updated_at', updated_at
    ))
    FROM public.currency_rates
    WHERE base_currency = 'THB'
  );
END;
$$;
-- Migration: 20260203171618_38405798-6009-4845-bbd2-79da8932b681.sql
-- Move pg_trgm extension from public to extensions schema
-- This is a best practice to keep public schema clean for application tables

-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to postgres and authenticated roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Drop and recreate pg_trgm in extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Ensure the extension functions are accessible
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
-- Migration: 20260203180647_c0419fd3-aee8-425e-afb4-582a95c3fd71.sql
-- Create storage bucket for booking documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('booking-documents', 'booking-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for booking-documents bucket
-- Property owners can upload documents
CREATE POLICY "Property owners can upload booking documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);

-- Property owners can view their documents
CREATE POLICY "Property owners can view booking documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);

-- Property owners can delete their documents
CREATE POLICY "Property owners can delete booking documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);
-- Migration: 20260204001012_a5e49455-4cb7-46cc-ac7e-2fa632b3589a.sql
-- Add missing approval and tracking columns for admin-created content

-- Providers table: add approval_status and uno_team tracking
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Services table: add missing columns
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Marketplace products: add approval and tracking columns
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Marketplace vendors: add approval and tracking columns  
ALTER TABLE public.marketplace_vendors 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Bouquets: add approval and tracking columns
ALTER TABLE public.bouquets 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_uno_team boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uno_team_creator_id uuid REFERENCES auth.users(id);

-- Create indexes for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_providers_approval_status ON public.providers(approval_status);
CREATE INDEX IF NOT EXISTS idx_services_approval_status ON public.services(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_approval_status ON public.marketplace_products(approval_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_vendors_approval_status ON public.marketplace_vendors(approval_status);
CREATE INDEX IF NOT EXISTS idx_bouquets_approval_status ON public.bouquets(approval_status);
-- Migration: 20260204001748_551b57c9-0464-406a-a261-f08dd5c1e2c6.sql
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
-- Migration: 20260204015554_8e51db58-feaa-4b88-97e9-6fd4b2a9007c.sql
-- Phase 1: Add highlights column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN properties.highlights IS 'Property feature tags like sea_view, pet_friendly, designer_interior etc.';

-- Phase 2: Insert new property_highlight values for quick filters
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active, metadata)
VALUES 
  ('property_highlight', 'instant_book', 'Instant Book', 'Мгновенное бронирование', '⚡', 1, true, '{"type": "boolean", "field": "instant_booking"}'::jsonb),
  ('property_highlight', 'walking_to_beach', 'Walk to Beach', 'Пешком до пляжа', '🏖️', 2, true, '{"type": "highlight"}'::jsonb),
  ('property_highlight', 'sea_view', 'Sea View', 'Вид на море', '🌊', 3, true, '{"type": "highlight"}'::jsonb),
  ('property_highlight', 'pet_friendly', 'Pet Friendly', 'Можно с питомцами', '🐕', 4, true, '{"type": "amenity", "value": "pet-friendly"}'::jsonb),
  ('property_highlight', 'new_listing', 'New Listing', 'Новый объект', '✨', 5, true, '{"type": "computed", "days": 30}'::jsonb),
  ('property_highlight', 'full_service', 'Full Service', 'Полное обслуживание', '🧹', 6, true, '{"type": "highlight"}'::jsonb),
  ('property_highlight', 'designer_interior', 'Designer Interior', 'Дизайнерский ремонт', '💎', 7, true, '{"type": "highlight"}'::jsonb),
  ('property_highlight', 'special_offer', 'Special Offer', 'Акция', '🏷️', 8, true, '{"type": "computed", "field": "monthly_discount"}'::jsonb),
  ('property_highlight', 'verified', 'Verified', 'Проверено', '✅', 9, true, '{"type": "boolean", "field": "is_verified"}'::jsonb),
  ('property_highlight', 'featured', 'Featured', 'Популярное', '⭐', 10, true, '{"type": "boolean", "field": "is_featured"}'::jsonb),
  ('property_highlight', 'pool', 'Pool', 'Бассейн', '🏊', 11, true, '{"type": "amenity", "value": "pool"}'::jsonb),
  ('property_highlight', 'gym', 'Gym', 'Спортзал', '🏋️', 12, true, '{"type": "amenity", "value": "gym"}'::jsonb)
ON CONFLICT (lookup_type, value_key) DO UPDATE SET
  value_en = EXCLUDED.value_en,
  value_ru = EXCLUDED.value_ru,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata;

-- Create index for faster filtering on highlights array
CREATE INDEX IF NOT EXISTS idx_properties_highlights ON properties USING GIN (highlights);
-- Migration: 20260204040323_d98be598-0de9-434e-a642-fa2478bc2168.sql
-- =============================================
-- Investment Hub Database Schema
-- =============================================

-- Add investor role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'investor' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'investor';
  END IF;
END $$;

-- =============================================
-- 1. Investment Projects - Core table
-- =============================================
CREATE TABLE public.investment_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  slug TEXT UNIQUE,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Classification
  project_type TEXT NOT NULL DEFAULT 'real_estate_offplan', -- real_estate_offplan, hospitality, restaurant, etc.
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, funded, closed
  
  -- Financial info
  currency TEXT NOT NULL DEFAULT 'USD',
  funding_goal NUMERIC,
  amount_raised NUMERIC DEFAULT 0,
  min_investment NUMERIC,
  max_investment NUMERIC,
  
  -- ROI & Terms
  roi_projected NUMERIC, -- Annual ROI percentage
  investment_term_months INTEGER,
  exit_strategy TEXT,
  
  -- muUNO Scoring
  muuno_score INTEGER CHECK (muuno_score >= 0 AND muuno_score <= 100),
  risk_level TEXT DEFAULT 'medium', -- low, medium, elevated, high
  score_breakdown JSONB DEFAULT '{}', -- {location: 80, developer: 90, financial: 85, market: 75}
  risk_factors TEXT[] DEFAULT '{}',
  
  -- Relations
  property_project_id UUID REFERENCES public.property_projects(id) ON DELETE SET NULL,
  founder_id UUID,
  developer_id UUID,
  
  -- Location (for non-property projects)
  district TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  
  -- Metadata
  investors_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  funded_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_investment_projects_type ON public.investment_projects(project_type);
CREATE INDEX idx_investment_projects_status ON public.investment_projects(status);
CREATE INDEX idx_investment_projects_score ON public.investment_projects(muuno_score DESC);
CREATE INDEX idx_investment_projects_featured ON public.investment_projects(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.investment_projects ENABLE ROW LEVEL SECURITY;

-- Public read access for active projects
CREATE POLICY "Anyone can view active investment projects" 
ON public.investment_projects 
FOR SELECT 
USING (status = 'active' OR status = 'funded');

-- Admins can manage all projects
CREATE POLICY "Admins can manage investment projects"
ON public.investment_projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 2. Investment Interests - Lead tracking
-- =============================================
CREATE TABLE public.investment_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Interest details
  interest_type TEXT NOT NULL DEFAULT 'learn_more', -- 'invest', 'learn_more', 'call_request'
  preferred_amount NUMERIC,
  preferred_currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, converted, declined
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Contact info (optional override)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  
  -- Tracking
  source TEXT, -- web, referral, agent
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_investment_interests_project ON public.investment_interests(project_id);
CREATE INDEX idx_investment_interests_user ON public.investment_interests(user_id);
CREATE INDEX idx_investment_interests_status ON public.investment_interests(status);

-- Enable RLS
ALTER TABLE public.investment_interests ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own interests
CREATE POLICY "Users can create interest"
ON public.investment_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interests"
ON public.investment_interests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all interests
CREATE POLICY "Admins can manage interests"
ON public.investment_interests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 3. Investment Team Members
-- =============================================
CREATE TABLE public.investment_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  
  -- Member info
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- CEO, CFO, CTO, Developer Director, etc.
  bio_en TEXT,
  bio_ru TEXT,
  photo TEXT,
  
  -- Links
  linkedin_url TEXT,
  website_url TEXT,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_team_project ON public.investment_team_members(project_id);

-- Enable RLS
ALTER TABLE public.investment_team_members ENABLE ROW LEVEL SECURITY;

-- Public read for team members of active projects
CREATE POLICY "Anyone can view team of active projects"
ON public.investment_team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investment_projects 
    WHERE id = project_id 
    AND (status = 'active' OR status = 'funded')
  )
);

-- Admins can manage team members
CREATE POLICY "Admins can manage team members"
ON public.investment_team_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 4. Investment Documents
-- =============================================
CREATE TABLE public.investment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  
  -- Document info
  name_en TEXT NOT NULL,
  name_ru TEXT,
  document_type TEXT NOT NULL DEFAULT 'other', -- pitch_deck, financials, legal, marketing, other
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  requires_nda BOOLEAN DEFAULT false,
  requires_interest BOOLEAN DEFAULT false, -- Only visible after expressing interest
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  
  -- Tracking
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_docs_project ON public.investment_documents(project_id);

-- Enable RLS
ALTER TABLE public.investment_documents ENABLE ROW LEVEL SECURITY;

-- Public documents visible to all
CREATE POLICY "Anyone can view public documents"
ON public.investment_documents
FOR SELECT
USING (
  is_public = true 
  AND EXISTS (
    SELECT 1 FROM public.investment_projects 
    WHERE id = project_id 
    AND (status = 'active' OR status = 'funded')
  )
);

-- Authenticated users can view after expressing interest
CREATE POLICY "Users with interest can view restricted documents"
ON public.investment_documents
FOR SELECT
USING (
  requires_interest = true
  AND requires_nda = false
  AND EXISTS (
    SELECT 1 FROM public.investment_interests 
    WHERE project_id = investment_documents.project_id 
    AND user_id = auth.uid()
  )
);

-- Admins can manage documents
CREATE POLICY "Admins can manage documents"
ON public.investment_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 5. Add investment fields to property_projects
-- =============================================
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS investment_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS funding_goal NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS min_investment NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS roi_projected NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS muuno_score INTEGER;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS risk_level TEXT;

-- =============================================
-- 6. Add investment categories to lookup_values
-- =============================================
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES 
  ('investment_category', 'real_estate_offplan', 'Off-Plan Property', 'Новостройки', '🏗️', 1, true),
  ('investment_category', 'real_estate_rental', 'Rental Business', 'Арендный бизнес', '🏠', 2, true),
  ('investment_category', 'hospitality', 'Hospitality', 'Гостиничный бизнес', '🏨', 3, true),
  ('investment_category', 'restaurant', 'Restaurant & F&B', 'Рестораны и HoReCa', '🍽️', 4, true),
  ('investment_category', 'retail', 'Retail', 'Ритейл', '🛍️', 5, true),
  ('investment_category', 'yacht_charter', 'Yacht Charter', 'Яхтенный чартер', '⛵', 6, true),
  ('investment_category', 'marine_tourism', 'Marine Tourism', 'Морской туризм', '🌊', 7, true),
  ('investment_category', 'wellness', 'Wellness & Spa', 'Велнес и СПА', '💆', 8, true),
  ('investment_category', 'tech_startup', 'Tech Startup', 'Технологии', '💻', 9, true),
  ('investment_category', 'franchise', 'Franchise', 'Франшиза', '🏪', 10, true),
  ('investment_category', 'agriculture', 'Agriculture', 'Агро', '🌴', 11, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- =============================================
-- 7. Trigger for updated_at
-- =============================================
CREATE TRIGGER update_investment_projects_updated_at
  BEFORE UPDATE ON public.investment_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_interests_updated_at
  BEFORE UPDATE ON public.investment_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_documents_updated_at
  BEFORE UPDATE ON public.investment_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260204041937_936607e7-db2b-42cf-a13e-8d5633ce1d52.sql
-- =============================================
-- PHASE 1: Developers table + property_projects extension
-- =============================================

-- 1. Create developers table
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  cover_image TEXT,
  description_en TEXT,
  description_ru TEXT,
  founded_year INTEGER,
  projects_completed INTEGER DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1) DEFAULT 0,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  muuno_score INTEGER CHECK (muuno_score BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on developers
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for developers (public read)
CREATE POLICY "Developers are viewable by everyone"
  ON public.developers FOR SELECT
  USING (is_active = true);

-- Admin policy using user_roles table with only valid enum values
CREATE POLICY "Admins can manage developers"
  ON public.developers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 4. Migrate existing developers from property_projects
INSERT INTO public.developers (name_en, name_ru, slug, is_verified, muuno_score)
SELECT DISTINCT 
  developer_name,
  developer_name,
  lower(regexp_replace(developer_name, '[^a-zA-Z0-9]+', '-', 'g')),
  true,
  CASE 
    WHEN developer_name LIKE '%Premier%' THEN 85
    WHEN developer_name LIKE '%Laguna%' THEN 92
    WHEN developer_name LIKE '%Andaman%' THEN 88
    WHEN developer_name LIKE '%Southern%' THEN 78
    WHEN developer_name LIKE '%Tropical%' THEN 82
    ELSE 75
  END
FROM public.property_projects 
WHERE developer_name IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 5. Add new columns to property_projects
ALTER TABLE public.property_projects 
ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.developers(id),
ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'offplan' 
  CHECK (project_status IN ('offplan', 'under_construction', 'completed')),
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS construction_progress INTEGER DEFAULT 0 
  CHECK (construction_progress BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS price_from NUMERIC,
ADD COLUMN IF NOT EXISTS price_to NUMERIC,
ADD COLUMN IF NOT EXISTS units_available INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0;

-- 6. Link existing projects to developers
UPDATE public.property_projects pp
SET developer_id = d.id
FROM public.developers d
WHERE pp.developer_name = d.name_en
AND pp.developer_id IS NULL;

-- 7. Set sample data for existing projects
UPDATE public.property_projects
SET 
  project_status = CASE 
    WHEN name_en LIKE '%Residence%' THEN 'offplan'
    WHEN name_en LIKE '%Park%' THEN 'under_construction'
    ELSE 'completed'
  END,
  construction_progress = CASE 
    WHEN name_en LIKE '%Residence%' THEN 35
    WHEN name_en LIKE '%Park%' THEN 65
    ELSE 100
  END,
  completion_date = CASE 
    WHEN name_en LIKE '%Residence%' THEN '2025-06-30'::DATE
    WHEN name_en LIKE '%Park%' THEN '2025-03-31'::DATE
    ELSE '2024-01-01'::DATE
  END,
  price_from = COALESCE(min_investment, 4500000),
  units_available = floor(random() * 20 + 5)::INTEGER,
  units_sold = floor(random() * 30 + 10)::INTEGER
WHERE project_status IS NULL OR construction_progress = 0;

-- 8. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_projects_developer_id 
  ON public.property_projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_property_projects_project_status 
  ON public.property_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_developers_slug 
  ON public.developers(slug);

-- 9. Updated_at trigger for developers
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Migration: 20260204043306_7027b1b7-93f2-4d2f-8c04-52a62655443f.sql
-- Add investment vertical to lookup_values for lead generation
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES ('vertical', 'investment', 'Investment', 'Инвестиции', '📈', 15, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
-- Migration: 20260204045035_c3c557f9-b439-47f6-ada3-392c7ca78917.sql
-- Add new order statuses for concierge advance payment flow
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_advance';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_client_payment';

-- Add concierge fee column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS concierge_fee_amount NUMERIC(10,2) DEFAULT 0;

-- Add vertical for concierge advance in lookup_values
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES ('vertical', 'concierge_advance', 'Concierge Advance', 'Аванс через консьержа', '💸', 50, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
-- Migration: 20260204072548_20cedf82-fdd1-4be1-8ebb-b13fdf11877b.sql
-- Add investment analysis fields to owner_properties
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_costs NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS renovation_costs NUMERIC DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN owner_properties.purchase_price IS 'Property purchase price for ROI calculations';
COMMENT ON COLUMN owner_properties.purchase_date IS 'Date of property acquisition';
COMMENT ON COLUMN owner_properties.acquisition_costs IS 'Additional costs (taxes, legal fees, furnishing)';
COMMENT ON COLUMN owner_properties.renovation_costs IS 'Renovation and improvement costs';
-- Migration: 20260204093658_fbe3a8c6-15a9-41b7-8198-2de13c11dbce.sql
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
-- Migration: 20260204160750_f70f37cc-8af0-46e4-9ff3-03b666159c8f.sql
-- Add flash deals and purchase tracking fields to marketplace_products
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_deal_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;

-- Create promotions table for dynamic promo banners
CREATE TABLE IF NOT EXISTS marketplace_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  badge_en TEXT,
  badge_ru TEXT,
  image_url TEXT,
  gradient TEXT DEFAULT 'from-primary/80 to-primary/60',
  icon TEXT DEFAULT 'Truck',
  link_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_promotions ENABLE ROW LEVEL SECURITY;

-- Public read policy for promotions
CREATE POLICY "Promotions are publicly readable"
ON marketplace_promotions
FOR SELECT
USING (is_active = true);

-- Insert default promotional banners
INSERT INTO marketplace_promotions (title_en, title_ru, subtitle_en, subtitle_ru, badge_en, badge_ru, gradient, icon, link_path, sort_order)
VALUES 
  ('Free Delivery', 'Бесплатная доставка', 'On orders over ฿1,500', 'При заказе от ฿1,500', 'Limited Time', 'Ограничено', 'from-emerald-500 via-emerald-600 to-teal-600', 'Truck', '/market/category/deals', 1),
  ('Flash Deals', 'Молниеносные скидки', 'Up to 50% off selected items', 'Скидки до 50% на избранные товары', 'Hot', 'Горячо', 'from-orange-500 via-red-500 to-pink-500', 'Zap', '/market/category/deals', 2),
  ('Quality Guaranteed', 'Гарантия качества', 'Fresh products from verified vendors', 'Свежие продукты от проверенных продавцов', 'Trust', 'Доверие', 'from-blue-500 via-indigo-500 to-purple-500', 'Shield', '/market/vendors', 3);

-- Mark some products as flash deals for demo (using subquery for LIMIT)
UPDATE marketplace_products 
SET is_flash_deal = true, 
    flash_deal_ends_at = NOW() + INTERVAL '1 day'
WHERE id IN (
  SELECT id FROM marketplace_products 
  WHERE original_price IS NOT NULL 
    AND original_price > price 
    AND in_stock = true
  ORDER BY sort_order
  LIMIT 10
);
-- Migration: 20260204163430_55ebb7bc-bc79-4a8a-9f6b-5594f5253f82.sql
-- Create service_promotions table for promo banners
CREATE TABLE service_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  subtitle_en TEXT,
  subtitle_ru TEXT,
  image_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-amber-500/80 to-orange-500/60',
  link_path TEXT NOT NULL,
  category_slug TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;

-- Public read access (promotions are public)
CREATE POLICY "Public read access" ON service_promotions 
  FOR SELECT USING (true);

-- Insert sample promotions for services
INSERT INTO service_promotions (title_en, title_ru, subtitle_en, subtitle_ru, image_url, link_path, gradient, sort_order) VALUES
('Deep Cleaning -30%', 'Генуборка -30%', 'Professional home cleaning', 'Профессиональная уборка', 
 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', '/cleaning', 'from-emerald-500/80 to-teal-500/60', 1),
('AC Service ฿500', 'Сервис кондиционеров ฿500', 'Beat the heat this summer', 'Подготовка к жаркому сезону', 
 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', '/services?category=ac-repair', 'from-blue-500/80 to-cyan-500/60', 2),
('Pool Care from ฿800', 'Бассейн от ฿800/нед', 'Weekly pool maintenance', 'Еженедельное обслуживание', 
 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800', '/services?category=pool', 'from-sky-500/80 to-blue-500/60', 3),
('Plumbing 24/7', 'Сантехник 24/7', 'Emergency repairs anytime', 'Срочный ремонт в любое время', 
 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', '/services?category=plumbing', 'from-orange-500/80 to-amber-500/60', 4);
-- Migration: 20260204231832_ddb97a78-8f05-4517-aaf9-eab3a7510185.sql
-- Add listing_modes column to support both rent AND sale on same property
-- This allows properties to be listed for rent, sale, or both simultaneously

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_modes text[] DEFAULT ARRAY['rent']::text[];

-- Migrate existing data from listing_type to listing_modes
UPDATE properties 
SET listing_modes = ARRAY[COALESCE(listing_type, 'rent')]::text[]
WHERE listing_modes IS NULL OR listing_modes = '{}';

-- Also add to owner_properties for consistency
ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS listing_modes text[] DEFAULT ARRAY['rent']::text[];

-- Add comment for documentation
COMMENT ON COLUMN properties.listing_modes IS 'Array of listing modes: rent, sale, or both';
COMMENT ON COLUMN owner_properties.listing_modes IS 'Array of listing modes: rent, sale, or both';
-- Migration: 20260204232007_d1abbb2e-72e2-4f26-b701-bea811ef2cf8.sql
-- Add sale_price column for properties that can be sold
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sale_price numeric;

ALTER TABLE owner_properties
ADD COLUMN IF NOT EXISTS sale_price numeric;

COMMENT ON COLUMN properties.sale_price IS 'Sale price for properties listed for sale';
COMMENT ON COLUMN owner_properties.sale_price IS 'Sale price for properties listed for sale';
-- Migration: 20260205072645_dca62c21-f20a-49a4-976d-dcac6636c23f.sql
-- P1 FIX: Add missing indexes for scalability

-- Index for marketplace_products - high sequential scan ratio (77%)
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active 
ON public.marketplace_products (is_active, vendor_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_category_slug 
ON public.marketplace_products (category_slug, is_active);

-- Index for lookup_values - frequently queried
CREATE INDEX IF NOT EXISTS idx_lookup_values_type 
ON public.lookup_values (lookup_type, is_active);

-- Index for property_analytics - frequent filtering (correct column: property_id)
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_date 
ON public.property_analytics (property_id, date);

-- Composite index for orders - common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_status 
ON public.orders (customer_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_vertical 
ON public.orders (vertical, status) WHERE deleted_at IS NULL;

-- Index for consultation_requests - admin panel queries
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status_created 
ON public.consultation_requests (status, created_at DESC);

-- Index for notifications - user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, is_read, created_at DESC);
-- Migration: 20260205073755_ebe613d9-b47b-4239-8a15-59a1141f8114.sql
-- Extend order_status ENUM with property-specific statuses
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'checked_in';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'checked_out';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_deposit';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'deposit_paid';
-- Migration: 20260205110922_dc2ec29e-04bb-42c7-8b5e-e45d4c5c5c1d.sql
-- ============================================================
-- STEP 1: Extend properties table with owner_properties fields
-- ============================================================

-- Ownership fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS management_type text DEFAULT 'full';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_type text;

-- Title fields (map from owner_properties.title)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS title text;

-- Rental status
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_rented boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rental_platform text;

-- Property status (owner workflow)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS notes text;

-- Rental pricing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_night numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_amount numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'fixed';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weekly_discount integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_discount integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seasonal_pricing jsonb DEFAULT '[]'::jsonb;

-- Check-in/out
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '14:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '12:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules_ru text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible';

-- Utilities - Electricity
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_included boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_unit_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_provider text DEFAULT 'PEA';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_metering text DEFAULT 'meter';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_notes text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_notes_ru text;

-- Utilities - Water
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_unit_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_notes text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_notes_ru text;

-- Services
ALTER TABLE properties ADD COLUMN IF NOT EXISTS included_services jsonb DEFAULT '["wifi", "ac"]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS extra_services jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_frequency text DEFAULT 'weekly';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS extra_cleaning_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS linen_change_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS linen_change_frequency text DEFAULT 'weekly';

-- iCal integration
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_token text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_export_enabled boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ical_last_sync timestamptz;

-- Financial (owner-only, hidden from marketplace)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_price numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_date date;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS purchase_currency text DEFAULT 'THB';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS acquisition_costs numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_amount numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_bank text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_interest_rate numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_monthly_payment numeric;

-- Documents
ALTER TABLE properties ADD COLUMN IF NOT EXISTS chanote_number text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tabien_baan text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS juristic_office_contact text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_management_contact text;

-- Room configuration (structured)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms jsonb DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS beds jsonb DEFAULT '[]'::jsonb;

-- Extra fields from owner_properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool_size text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces integer DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_policy text DEFAULT 'not_allowed';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_deposit numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_monthly_fee numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS smoking_policy text DEFAULT 'not_allowed';

-- Meters for utility tracking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_meter_id text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_meter_id text;

-- Internet
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_included boolean DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_speed text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_provider text;

-- Building info
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_name text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_year integer;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors integer;

-- Legacy reference (for migration tracking)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legacy_owner_property_id uuid;

-- Create index on owner_id for fast owner queries
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_modes ON properties USING GIN(listing_modes);
-- Migration: 20260205111023_e2c43b2a-7a2f-4de7-9ef0-449536274880.sql
-- ============================================================
-- STEP 2: Migrate data from owner_properties to properties
-- ============================================================

-- First, update existing properties that have matching owner_properties
UPDATE properties p
SET 
  owner_id = op.owner_id,
  title = op.title,
  management_type = op.management_type,
  is_rented = op.is_rented,
  rental_platform = op.rental_platform,
  status = op.status,
  verified_at = op.verified_at,
  verified_by = op.verified_by,
  notes = op.notes,
  price_per_night = op.price_per_night,
  deposit_amount = op.deposit_amount,
  deposit_currency = op.deposit_currency,
  deposit_type = op.deposit_type,
  weekly_discount = op.weekly_discount,
  monthly_discount = op.monthly_discount,
  seasonal_pricing = op.seasonal_pricing,
  check_in_time = op.check_in_time,
  check_out_time = op.check_out_time,
  house_rules = op.house_rules,
  house_rules_ru = op.house_rules_ru,
  cancellation_policy = op.cancellation_policy,
  electricity_included = op.electricity_included,
  electricity_unit_price = op.electricity_unit_price,
  electricity_provider = op.electricity_provider,
  electricity_metering = op.electricity_metering,
  electricity_notes = op.electricity_notes,
  electricity_notes_ru = op.electricity_notes_ru,
  water_included = op.water_included,
  water_unit_price = op.water_unit_price,
  water_notes = op.water_notes,
  water_notes_ru = op.water_notes_ru,
  included_services = op.included_services,
  extra_services = op.extra_services,
  cleaning_included = op.cleaning_included,
  cleaning_frequency = op.cleaning_frequency,
  extra_cleaning_price = op.extra_cleaning_price,
  linen_change_price = op.linen_change_price,
  linen_change_frequency = op.linen_change_frequency,
  ical_token = op.ical_token::text,
  purchase_price = op.purchase_price,
  purchase_date = op.purchase_date,
  rooms = op.rooms,
  parking_spaces = op.parking_spaces,
  parking_type = op.parking_type,
  pet_deposit = op.pet_deposit,
  total_floors = op.total_floors,
  legacy_owner_property_id = op.id
FROM owner_properties op
WHERE op.marketplace_property_id = p.id;

-- Insert owner_properties that don't have marketplace listing yet
INSERT INTO properties (
  id,
  owner_id,
  title,
  title_en,
  title_ru,
  description_en,
  description_ru,
  address,
  district,
  property_type,
  bedrooms,
  bathrooms,
  area_sqm,
  cover_image,
  images,
  max_guests,
  management_type,
  is_rented,
  rental_platform,
  status,
  verified_at,
  verified_by,
  notes,
  price_per_night,
  min_stay_nights,
  deposit_amount,
  deposit_currency,
  deposit_type,
  weekly_discount,
  monthly_discount,
  seasonal_pricing,
  check_in_time,
  check_out_time,
  house_rules,
  house_rules_ru,
  cancellation_policy,
  instant_booking,
  electricity_included,
  electricity_unit_price,
  electricity_provider,
  electricity_metering,
  electricity_notes,
  electricity_notes_ru,
  water_included,
  water_unit_price,
  water_notes,
  water_notes_ru,
  included_services,
  extra_services,
  cleaning_included,
  cleaning_frequency,
  extra_cleaning_price,
  linen_change_price,
  linen_change_frequency,
  ical_token,
  purchase_price,
  purchase_date,
  rooms,
  parking_spaces,
  parking_type,
  pet_deposit,
  total_floors,
  legacy_owner_property_id,
  listing_modes,
  is_active,
  listing_type,
  currency,
  lat,
  lng,
  floor,
  unit_number,
  view_type,
  furnishing_level,
  equipment,
  highlights
)
SELECT 
  gen_random_uuid(),
  op.owner_id,
  op.title,
  COALESCE(op.title, op.address),
  op.title_ru,
  op.description,
  op.description_ru,
  op.address,
  op.district,
  op.property_type,
  op.bedrooms,
  op.bathrooms,
  op.area_sqm,
  op.cover_image,
  op.images,
  op.max_guests,
  op.management_type,
  op.is_rented,
  op.rental_platform,
  op.status,
  op.verified_at,
  op.verified_by,
  op.notes,
  op.price_per_night,
  op.min_stay_nights,
  op.deposit_amount,
  op.deposit_currency,
  op.deposit_type,
  op.weekly_discount,
  op.monthly_discount,
  op.seasonal_pricing,
  op.check_in_time,
  op.check_out_time,
  op.house_rules,
  op.house_rules_ru,
  op.cancellation_policy,
  op.instant_booking,
  op.electricity_included,
  op.electricity_unit_price,
  op.electricity_provider,
  op.electricity_metering,
  op.electricity_notes,
  op.electricity_notes_ru,
  op.water_included,
  op.water_unit_price,
  op.water_notes,
  op.water_notes_ru,
  op.included_services,
  op.extra_services,
  op.cleaning_included,
  op.cleaning_frequency,
  op.extra_cleaning_price,
  op.linen_change_price,
  op.linen_change_frequency,
  op.ical_token::text,
  op.purchase_price,
  op.purchase_date,
  op.rooms,
  op.parking_spaces,
  op.parking_type,
  op.pet_deposit,
  op.total_floors,
  op.id,
  op.listing_modes,
  true,
  'rent',
  'THB',
  op.lat,
  op.lng,
  op.floor,
  op.unit_number,
  op.view_type,
  op.furnishing_level,
  op.equipment,
  op.highlights
FROM owner_properties op
WHERE op.marketplace_property_id IS NULL;
-- Migration: 20260205111048_c571471b-a01c-4107-86f6-048ff7cb33e3.sql
-- ============================================================
-- STEP 3: Create Views and Update RLS Policies
-- ============================================================

-- Drop existing views if any
DROP VIEW IF EXISTS v_owner_properties CASCADE;
DROP VIEW IF EXISTS v_marketplace_listings CASCADE;

-- View for property owners (all fields including financial)
CREATE VIEW v_owner_properties AS
SELECT 
  p.*
FROM properties p
WHERE p.owner_id IS NOT NULL;

-- View for marketplace (public fields only, no financial data)
CREATE VIEW v_marketplace_listings AS
SELECT 
  p.id,
  p.provider_id,
  p.owner_id,
  p.title,
  p.title_en,
  p.title_ru,
  p.description_en,
  p.description_ru,
  p.address,
  p.district,
  p.property_type,
  p.listing_type,
  p.listing_modes,
  p.price,
  p.price_per_night,
  p.sale_price,
  p.price_period,
  p.currency,
  p.bedrooms,
  p.bathrooms,
  p.area_sqm,
  p.max_guests,
  p.amenities,
  p.images,
  p.cover_image,
  p.lat,
  p.lng,
  p.is_active,
  p.is_featured,
  p.is_verified,
  p.available_from,
  p.min_stay_nights,
  p.rating,
  p.review_count,
  p.instant_booking,
  p.floor,
  p.unit_number,
  p.view_type,
  p.furnishing_level,
  p.equipment,
  p.highlights,
  p.project_id,
  p.approval_status,
  p.created_at,
  p.updated_at,
  -- Rental terms (public)
  p.check_in_time,
  p.check_out_time,
  p.house_rules,
  p.house_rules_ru,
  p.cancellation_policy,
  p.deposit_amount,
  p.deposit_currency,
  -- Excluded: purchase_price, acquisition_costs, mortgage_*, ical_token, etc.
  p.weekly_discount,
  p.monthly_discount,
  p.seasonal_pricing
FROM properties p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

-- Update RLS policies on properties table
-- First drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "owner_select" ON properties;
DROP POLICY IF EXISTS "public_select" ON properties;
DROP POLICY IF EXISTS "owner_update" ON properties;
DROP POLICY IF EXISTS "owner_insert" ON properties;
DROP POLICY IF EXISTS "owner_delete" ON properties;
DROP POLICY IF EXISTS "provider_select" ON properties;
DROP POLICY IF EXISTS "provider_update" ON properties;
DROP POLICY IF EXISTS "provider_insert" ON properties;
DROP POLICY IF EXISTS "provider_delete" ON properties;

-- Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their own properties
CREATE POLICY "owner_select_own" ON properties
  FOR SELECT USING (owner_id = auth.uid());

-- Policy: Providers/Vendors can view their own properties
CREATE POLICY "provider_select_own" ON properties
  FOR SELECT USING (provider_id = auth.uid());

-- Policy: Public can view active approved listings
CREATE POLICY "public_view_active" ON properties
  FOR SELECT USING (
    is_active = true 
    AND approval_status = 'approved'
  );

-- Policy: Owners can insert their own properties
CREATE POLICY "owner_insert_own" ON properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Policy: Providers can insert their own properties
CREATE POLICY "provider_insert_own" ON properties
  FOR INSERT WITH CHECK (provider_id = auth.uid());

-- Policy: Owners can update their own properties
CREATE POLICY "owner_update_own" ON properties
  FOR UPDATE USING (owner_id = auth.uid());

-- Policy: Providers can update their own properties
CREATE POLICY "provider_update_own" ON properties
  FOR UPDATE USING (provider_id = auth.uid());

-- Policy: Owners can delete their own properties
CREATE POLICY "owner_delete_own" ON properties
  FOR DELETE USING (owner_id = auth.uid());

-- Policy: Providers can delete their own properties  
CREATE POLICY "provider_delete_own" ON properties
  FOR DELETE USING (provider_id = auth.uid());

-- Grant access to views
GRANT SELECT ON v_owner_properties TO authenticated;
GRANT SELECT ON v_marketplace_listings TO anon, authenticated;
-- Migration: 20260205111106_12ca5336-77b0-40c3-aa97-6ead6aafbf1b.sql
-- ============================================================
-- FIX: Recreate views with SECURITY INVOKER
-- ============================================================

-- Drop and recreate views with proper security settings
DROP VIEW IF EXISTS v_owner_properties CASCADE;
DROP VIEW IF EXISTS v_marketplace_listings CASCADE;

-- View for property owners with SECURITY INVOKER (respects RLS of querying user)
CREATE VIEW v_owner_properties 
WITH (security_invoker = true)
AS
SELECT 
  p.*
FROM properties p
WHERE p.owner_id IS NOT NULL;

-- View for marketplace with SECURITY INVOKER
CREATE VIEW v_marketplace_listings 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.provider_id,
  p.owner_id,
  p.title,
  p.title_en,
  p.title_ru,
  p.description_en,
  p.description_ru,
  p.address,
  p.district,
  p.property_type,
  p.listing_type,
  p.listing_modes,
  p.price,
  p.price_per_night,
  p.sale_price,
  p.price_period,
  p.currency,
  p.bedrooms,
  p.bathrooms,
  p.area_sqm,
  p.max_guests,
  p.amenities,
  p.images,
  p.cover_image,
  p.lat,
  p.lng,
  p.is_active,
  p.is_featured,
  p.is_verified,
  p.available_from,
  p.min_stay_nights,
  p.rating,
  p.review_count,
  p.instant_booking,
  p.floor,
  p.unit_number,
  p.view_type,
  p.furnishing_level,
  p.equipment,
  p.highlights,
  p.project_id,
  p.approval_status,
  p.created_at,
  p.updated_at,
  p.check_in_time,
  p.check_out_time,
  p.house_rules,
  p.house_rules_ru,
  p.cancellation_policy,
  p.deposit_amount,
  p.deposit_currency,
  p.weekly_discount,
  p.monthly_discount,
  p.seasonal_pricing
FROM properties p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

-- Grant access to views
GRANT SELECT ON v_owner_properties TO authenticated;
GRANT SELECT ON v_marketplace_listings TO anon, authenticated;
-- Migration: 20260205123905_9b68e546-b2cf-4207-a823-3428e5889515.sql
-- =============================================
-- LIFE SITUATIONS META-LAYER (ADD-ONLY, NON-DESTRUCTIVE)
-- =============================================

-- 1. Life Situations table - core definitions
CREATE TABLE public.life_situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'Compass',
  color TEXT DEFAULT '#3B82F6',
  priority INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Catalog Life Map - entity-to-situation mapping (loose coupling)
CREATE TABLE public.catalog_life_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property', 'service', 'experience', 'transport', 'restaurant', 'yacht', 'tour')),
  entity_id UUID NOT NULL,
  life_situation_id UUID REFERENCES public.life_situations(id) ON DELETE CASCADE,
  weight INT DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entity_type, entity_id, life_situation_id)
);

-- 3. Enable RLS on new tables
ALTER TABLE public.life_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_life_map ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for life_situations (public read, admin write)
CREATE POLICY "Life situations are viewable by everyone"
ON public.life_situations FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage life situations"
ON public.life_situations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. RLS Policies for catalog_life_map (public read, admin write)
CREATE POLICY "Catalog mappings are viewable by everyone"
ON public.catalog_life_map FOR SELECT
USING (true);

CREATE POLICY "Admins can manage catalog mappings"
ON public.catalog_life_map FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Indexes for performance
CREATE INDEX idx_life_situations_code ON public.life_situations(code);
CREATE INDEX idx_life_situations_active ON public.life_situations(is_active, priority);
CREATE INDEX idx_catalog_life_map_entity ON public.catalog_life_map(entity_type, entity_id);
CREATE INDEX idx_catalog_life_map_situation ON public.catalog_life_map(life_situation_id);
CREATE INDEX idx_catalog_life_map_weight ON public.catalog_life_map(weight DESC);

-- 7. Updated_at trigger
CREATE TRIGGER update_life_situations_updated_at
  BEFORE UPDATE ON public.life_situations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_life_map_updated_at
  BEFORE UPDATE ON public.catalog_life_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Seed initial life situations
INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority) VALUES
  ('arrival_first_day', 'Just Arrived', 'Только приехал', 'First day essentials: transport, SIM, accommodation', 'Всё для первого дня: трансфер, SIM-карта, жильё', 'Plane', '#3B82F6', 10),
  ('long_term_living', 'Long-term Stay', 'Длительное проживание', 'Settling in: rentals, banking, insurance', 'Обустройство: аренда, банки, страховка', 'Home', '#10B981', 20),
  ('family_with_children', 'Family with Kids', 'Семья с детьми', 'Family-friendly services and activities', 'Услуги и развлечения для семьи', 'Users', '#F59E0B', 30),
  ('emergency_medical', 'Medical Help', 'Медицинская помощь', 'Urgent medical care and pharmacies', 'Срочная медицинская помощь и аптеки', 'Heart', '#EF4444', 5),
  ('investment_property', 'Property Investment', 'Инвестиции в недвижимость', 'Buy, invest, or manage property', 'Покупка, инвестиции, управление недвижимостью', 'Building', '#8B5CF6', 40),
  ('vacation_leisure', 'Vacation & Leisure', 'Отдых и развлечения', 'Tours, yachts, restaurants, experiences', 'Туры, яхты, рестораны, впечатления', 'Palmtree', '#06B6D4', 25),
  ('business_work', 'Business & Work', 'Бизнес и работа', 'Coworking, legal, banking for business', 'Коворкинги, юристы, банки для бизнеса', 'Briefcase', '#6366F1', 35),
  ('relocation_visa', 'Relocation & Visa', 'Релокация и визы', 'Visa services, documentation, legalization', 'Визовые услуги, документы, легализация', 'FileText', '#EC4899', 15);

-- 9. Function to resolve catalog by life situation
CREATE OR REPLACE FUNCTION public.resolve_catalog_by_life_situation(
  p_life_code TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  weight INT,
  rules JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    clm.entity_type,
    clm.entity_id,
    clm.weight,
    clm.rules
  FROM catalog_life_map clm
  JOIN life_situations ls ON ls.id = clm.life_situation_id
  WHERE ls.code = p_life_code
    AND ls.is_active = true
  ORDER BY clm.weight DESC
  LIMIT p_limit;
END;
$$;
-- Migration: 20260205123924_d02ec726-641c-4b11-b56e-f72454223407.sql
-- Fix security warning: Replace overly permissive RLS policy on catalog_life_map
-- The SELECT USING(true) is intentional for public read access (linter excludes SELECT)
-- But we need to ensure INSERT/UPDATE/DELETE are properly restricted

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Catalog mappings are viewable by everyone" ON public.catalog_life_map;

-- Create separate policies for read vs write
CREATE POLICY "Catalog mappings are publicly readable"
ON public.catalog_life_map FOR SELECT
USING (true);

-- Ensure admin-only write is explicit for each operation
DROP POLICY IF EXISTS "Admins can manage catalog mappings" ON public.catalog_life_map;

CREATE POLICY "Admins can insert catalog mappings"
ON public.catalog_life_map FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update catalog mappings"
ON public.catalog_life_map FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete catalog mappings"
ON public.catalog_life_map FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
-- Migration: 20260205130100_1fb48a64-5020-483d-93b4-7c3cd3510a45.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- LIFE OS ENHANCEMENT - Phase 1: Backend Upgrades (Non-Destructive)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add role_scope to catalog_life_map (supports guest/resident/owner/investor filtering)
ALTER TABLE public.catalog_life_map 
ADD COLUMN IF NOT EXISTS role_scope text[] DEFAULT ARRAY['guest', 'resident', 'owner', 'investor'];

-- 2. Create unified read-only catalog view (life_os_catalog)
-- This VIEW aggregates all entity types for Life OS resolution
CREATE OR REPLACE VIEW public.life_os_catalog AS
-- Properties (uses title, title_ru - no title_en)
SELECT 
  'property' as entity_type,
  id as entity_id,
  COALESCE(title, title_ru) as title,
  title as title_en,
  title_ru,
  NULL::numeric as price,
  'THB' as currency,
  NULL::text as location,
  owner_id as provider_id,
  'verified'::text as trust_level,
  true as is_active
FROM public.owner_properties

UNION ALL

-- Services
SELECT 
  'service' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.services
WHERE is_active = true

UNION ALL

-- Yachts
SELECT 
  'yacht' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  NULL::numeric as price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.yachts
WHERE is_active = true

UNION ALL

-- Vehicles (Transport)
SELECT 
  'transport' as entity_type,
  id as entity_id,
  COALESCE(name_en, name_ru) as title,
  name_en as title_en,
  name_ru as title_ru,
  price_per_day as price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level,
  is_active
FROM public.vehicles
WHERE is_active = true

UNION ALL

-- Tours
SELECT 
  'tour' as entity_type,
  id as entity_id,
  COALESCE(title_en, title_ru) as title,
  title_en,
  title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  'verified'::text as trust_level,
  is_active
FROM public.tours
WHERE is_active = true

UNION ALL

-- Experiences
SELECT 
  'experience' as entity_type,
  id as entity_id,
  COALESCE(title_en, title_ru) as title,
  title_en,
  title_ru,
  price,
  COALESCE(currency, 'THB') as currency,
  NULL as location,
  provider_id,
  'verified'::text as trust_level,
  is_active
FROM public.experiences
WHERE is_active = true;

-- 3. Create enhanced LIFE OS resolver RPC with role and locale support
CREATE OR REPLACE FUNCTION public.resolve_life_os_context(
  p_life_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit int DEFAULT 50
)
RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id uuid,
  trust_level text,
  weight int,
  role_scope text[],
  rules jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    clm.entity_type,
    clm.entity_id,
    loc.title,
    CASE 
      WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title_en, loc.title)
      ELSE COALESCE(loc.title_en, loc.title_ru, loc.title)
    END as title_localized,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    clm.weight,
    clm.role_scope,
    clm.rules
  FROM catalog_life_map clm
  INNER JOIN life_situations ls ON ls.id = clm.life_situation_id
  LEFT JOIN life_os_catalog loc ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id
  WHERE ls.code = p_life_code
    AND ls.is_active = true
    AND (clm.role_scope IS NULL OR p_user_role = ANY(clm.role_scope))
    AND (loc.is_active = true OR loc.entity_id IS NULL)
  ORDER BY 
    clm.weight DESC,
    CASE WHEN loc.trust_level = 'verified' THEN 0 ELSE 1 END,
    loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- 4. Grant permissions
GRANT SELECT ON public.life_os_catalog TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_life_os_context TO anon, authenticated;

-- 5. Add documentation comments
COMMENT ON VIEW public.life_os_catalog IS 'LIFE OS: Unified read-only catalog aggregating all platform entities for contextual resolution. DO NOT MODIFY - this is a meta-layer view.';
COMMENT ON FUNCTION public.resolve_life_os_context IS 'LIFE OS: Resolver function returning ranked catalog items based on life situation context, user role, and locale. Supports AI orchestration.';
COMMENT ON COLUMN public.catalog_life_map.role_scope IS 'LIFE OS: Array of user roles (guest/resident/owner/investor) for which this mapping applies';
-- Migration: 20260205132743_9781ca50-65b2-42ad-8c80-8858cb00db0f.sql

-- Update entity_type check constraint to include all catalog entity types
ALTER TABLE catalog_life_map DROP CONSTRAINT IF EXISTS catalog_life_map_entity_type_check;

ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY[
  'property'::text, 
  'service'::text, 
  'experience'::text, 
  'transport'::text, 
  'restaurant'::text, 
  'yacht'::text, 
  'tour'::text,
  'vehicle'::text,
  'clinic'::text,
  'babysitter'::text,
  'legal_service'::text,
  'bank'::text,
  'salon'::text,
  'event'::text
]));

-- Migration: 20260205132954_f3772f33-7ce6-475f-9621-a79ef6422af4.sql

-- Update life_os_catalog view to include all mapped entity types
DROP VIEW IF EXISTS life_os_catalog;

CREATE OR REPLACE VIEW life_os_catalog AS
-- Properties
SELECT 
  'property'::text as entity_type,
  id::text as entity_id,
  title_en as title,
  title_ru,
  price::numeric as price,
  currency,
  district as location,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END as trust_level
FROM properties
WHERE is_active = true

UNION ALL

-- Services  
SELECT 
  'service'::text,
  id::text,
  name_en,
  name_ru,
  price,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM services
WHERE is_active = true

UNION ALL

-- Yachts
SELECT 
  'yacht'::text,
  id::text,
  name_en,
  name_ru,
  price_full_day::numeric,
  currency,
  location_name,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM yachts
WHERE is_active = true

UNION ALL

-- Vehicles
SELECT 
  'vehicle'::text,
  id::text,
  name_en,
  name_ru,
  price_per_day::numeric,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM vehicles
WHERE is_active = true

UNION ALL

-- Tours
SELECT 
  'tour'::text,
  id::text,
  title_en,
  title_ru,
  price,
  currency,
  meeting_point,
  provider_id::text,
  CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END
FROM tours
WHERE is_active = true

UNION ALL

-- Experiences
SELECT 
  'experience'::text,
  id::text,
  title_en,
  title_ru,
  price,
  currency,
  meeting_point,
  provider_id::text,
  CASE WHEN approval_status = 'approved' THEN 'verified' ELSE 'pending' END
FROM experiences
WHERE is_active = true

UNION ALL

-- Restaurants
SELECT 
  'restaurant'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric, -- price range is not numeric
  'THB'::text,
  district,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM restaurants
WHERE is_active = true

UNION ALL

-- Clinics
SELECT 
  'clinic'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric,
  'THB'::text,
  district,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM clinics
WHERE is_active = true

UNION ALL

-- Babysitters
SELECT 
  'babysitter'::text,
  id::text,
  name_en,
  name_ru,
  price_per_hour::numeric,
  currency,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM babysitters
WHERE is_active = true

UNION ALL

-- Legal Services
SELECT 
  'legal_service'::text,
  id::text,
  name_en,
  name_ru,
  NULL::numeric,
  'THB'::text,
  NULL,
  provider_id::text,
  CASE WHEN is_verified THEN 'verified' ELSE 'pending' END
FROM legal_services
WHERE is_active = true;

-- Migration: 20260205133050_c8cb3fc8-d00a-430f-bc36-8a495da34177.sql

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS resolve_life_os_context(text, text, text, integer);

CREATE FUNCTION public.resolve_life_os_context(
  p_life_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  entity_type text,
  entity_id text,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id text,
  trust_level text,
  weight integer,
  role_scope text[],
  rules jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    clm.entity_type,
    clm.entity_id::text,
    loc.title,
    CASE 
      WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title)
      ELSE COALESCE(loc.title, loc.title_ru)
    END as title_localized,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    clm.weight,
    clm.role_scope,
    clm.rules
  FROM catalog_life_map clm
  INNER JOIN life_situations ls ON ls.id = clm.life_situation_id
  LEFT JOIN life_os_catalog loc ON loc.entity_type = clm.entity_type AND loc.entity_id = clm.entity_id::text
  WHERE ls.code = p_life_code
    AND ls.is_active = true
    AND (clm.role_scope IS NULL OR p_user_role = ANY(clm.role_scope))
  ORDER BY 
    clm.weight DESC,
    CASE WHEN loc.trust_level = 'verified' THEN 0 ELSE 1 END,
    loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Migration: 20260205133325_9234d185-4958-4d3d-8b4d-9dfd0df333a1.sql
-- ============================================================
-- LIFEOS GOVERNANCE TABLE
-- Central configuration for LifeOS rules (admin only)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lifeos_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_readonly BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.lifeos_governance ENABLE ROW LEVEL SECURITY;

-- Only admin can read/write governance config
CREATE POLICY "Admins can view governance config"
ON public.lifeos_governance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update governance config"
ON public.lifeos_governance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Insert default governance rules
INSERT INTO public.lifeos_governance (key, value, description, is_readonly) VALUES
  ('MAX_SCENARIOS_PER_ENTITY', '3', 'Maximum number of life situations an entity can be mapped to', false),
  ('PRIMARY_WEIGHT_MIN', '70', 'Minimum weight for primary entities', false),
  ('PRIMARY_WEIGHT_MAX', '85', 'Maximum weight for primary entities', false),
  ('SECONDARY_WEIGHT_MIN', '40', 'Minimum weight for secondary entities', false),
  ('SECONDARY_WEIGHT_MAX', '60', 'Maximum weight for secondary entities', false),
  ('MAX_PRIMARY_BLOCKS', '2', 'Maximum primary entity types per scenario', false),
  ('MAX_SECONDARY_BLOCKS', '3', 'Maximum secondary entity types per scenario', false),
  ('MIN_ENTITIES_PER_SCENARIO', '3', 'Minimum entities required per scenario', false),
  ('MIN_PRIMARY_PER_SCENARIO', '1', 'Minimum primary entities per scenario', false),
  ('DISALLOW_RAW_JSON_EDIT', 'true', 'Disallow raw JSON editing in rules field', true),
  ('AI_MODE', '"OFF"', 'AI mode status (OFF/LIMITED/FULL)', true),
  ('AUTO_MAPPING', '"OFF"', 'Auto-mapping status (OFF/ON)', true),
  ('LIFEOS_MODE', '"MANUAL"', 'Current LifeOS operational mode', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- LIFEOS HEALTH VIEW (READ-ONLY COMPUTED METRICS)
-- ============================================================

CREATE OR REPLACE VIEW public.lifeos_health_view AS
WITH mapping_stats AS (
  SELECT 
    ls.id AS situation_id,
    ls.code AS situation_code,
    ls.title_en,
    ls.title_ru,
    ls.is_active,
    COUNT(clm.id) AS total_entities,
    COUNT(CASE WHEN (clm.rules->>'priority_type') = 'primary' THEN 1 END) AS primary_count,
    COUNT(CASE WHEN (clm.rules->>'priority_type') = 'secondary' THEN 1 END) AS secondary_count,
    COALESCE(AVG(clm.weight), 0) AS avg_weight,
    MIN(clm.weight) AS min_weight,
    MAX(clm.weight) AS max_weight,
    MAX(clm.updated_at) AS last_updated_at,
    COUNT(DISTINCT clm.entity_type) AS entity_type_count
  FROM life_situations ls
  LEFT JOIN catalog_life_map clm ON clm.life_situation_id = ls.id
  GROUP BY ls.id, ls.code, ls.title_en, ls.title_ru, ls.is_active
),
entity_overuse AS (
  SELECT 
    entity_type,
    entity_id,
    COUNT(*) AS scenario_count
  FROM catalog_life_map
  GROUP BY entity_type, entity_id
  HAVING COUNT(*) > 3
)
SELECT 
  ms.*,
  -- Computed flags
  CASE WHEN ms.primary_count = 0 AND ms.is_active THEN true ELSE false END AS flag_no_primary,
  CASE WHEN ms.total_entities < 3 AND ms.is_active THEN true ELSE false END AS flag_low_coverage,
  CASE WHEN ms.primary_count > 2 THEN true ELSE false END AS flag_primary_overload,
  CASE WHEN ms.min_weight < 40 OR ms.max_weight > 85 THEN true ELSE false END AS flag_weight_out_of_range,
  (SELECT COUNT(*) FROM entity_overuse) AS entity_overuse_count,
  -- Health score (0-100)
  CASE 
    WHEN ms.total_entities = 0 THEN 0
    WHEN ms.primary_count = 0 THEN 25
    WHEN ms.total_entities < 3 THEN 50
    WHEN ms.primary_count > 2 THEN 60
    ELSE LEAST(100, 70 + (ms.total_entities * 2))
  END AS health_score
FROM mapping_stats ms
ORDER BY ms.is_active DESC, ms.total_entities DESC;
