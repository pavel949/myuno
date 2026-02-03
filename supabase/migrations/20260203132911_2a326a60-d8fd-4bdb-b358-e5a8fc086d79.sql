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
