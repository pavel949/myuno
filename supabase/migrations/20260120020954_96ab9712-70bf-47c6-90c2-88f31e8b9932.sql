-- Create universal lookup_values table for managing all reference data
CREATE TABLE public.lookup_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lookup_type TEXT NOT NULL, -- 'district', 'cuisine', 'tour_type', 'amenity', 'property_type', etc.
  value_key TEXT NOT NULL, -- slug/key for code usage
  value_en TEXT NOT NULL, -- English display name
  value_ru TEXT, -- Russian display name
  icon TEXT, -- optional icon name from lucide
  color TEXT, -- optional color
  parent_id UUID REFERENCES public.lookup_values(id), -- for hierarchical data
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}', -- extra data per type
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lookup_type, value_key)
);

-- Enable RLS
ALTER TABLE public.lookup_values ENABLE ROW LEVEL SECURITY;

-- Everyone can read lookup values (public reference data)
CREATE POLICY "Anyone can read lookup values"
ON public.lookup_values
FOR SELECT
USING (true);

-- Only admins can manage lookup values
CREATE POLICY "Admins can manage lookup values"
ON public.lookup_values
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_lookup_values_updated_at
BEFORE UPDATE ON public.lookup_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for fast lookup by type
CREATE INDEX idx_lookup_values_type ON public.lookup_values(lookup_type);
CREATE INDEX idx_lookup_values_active ON public.lookup_values(is_active, lookup_type);

-- Seed initial data from existing values

-- Districts (from properties)
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('district', 'patong', 'Patong', 'Патонг', 1),
('district', 'karon', 'Karon', 'Карон', 2),
('district', 'kata', 'Kata', 'Ката', 3),
('district', 'kamala', 'Kamala', 'Камала', 4),
('district', 'surin', 'Surin', 'Сурин', 5),
('district', 'bang-tao', 'Bang Tao', 'Банг Тао', 6),
('district', 'layan', 'Layan', 'Лаян', 7),
('district', 'nai-harn', 'Nai Harn', 'Най Харн', 8),
('district', 'rawai', 'Rawai', 'Равай', 9),
('district', 'chalong', 'Chalong', 'Чалонг', 10),
('district', 'phuket-town', 'Phuket Town', 'Пхукет Таун', 11),
('district', 'cherngtalay', 'Cherngtalay', 'Чернгталай', 12),
('district', 'thalang', 'Thalang', 'Таланг', 13),
('district', 'kathu', 'Kathu', 'Кату', 14),
('district', 'naithon', 'Naithon', 'Найтон', 15),
('district', 'ao-po', 'Ao Po', 'Ао По', 16),
('district', 'koh-kaew', 'Koh Kaew', 'Ко Кео', 17);

-- Cuisines
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('cuisine', 'thai', 'Thai', 'Тайская', 1),
('cuisine', 'italian', 'Italian', 'Итальянская', 2),
('cuisine', 'japanese', 'Japanese', 'Японская', 3),
('cuisine', 'indian', 'Indian', 'Индийская', 4),
('cuisine', 'seafood', 'Seafood', 'Морепродукты', 5),
('cuisine', 'chinese', 'Chinese', 'Китайская', 6),
('cuisine', 'french', 'French', 'Французская', 7),
('cuisine', 'korean', 'Korean', 'Корейская', 8),
('cuisine', 'mexican', 'Mexican', 'Мексиканская', 9),
('cuisine', 'mediterranean', 'Mediterranean', 'Средиземноморская', 10),
('cuisine', 'international', 'International', 'Интернациональная', 11),
('cuisine', 'russian', 'Russian', 'Русская', 12),
('cuisine', 'american', 'American', 'Американская', 13),
('cuisine', 'vegetarian', 'Vegetarian', 'Вегетарианская', 14);

-- Tour types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('tour_type', 'island-hopping', 'Island Hopping', 'По островам', 1),
('tour_type', 'snorkeling', 'Snorkeling', 'Снорклинг', 2),
('tour_type', 'diving', 'Diving', 'Дайвинг', 3),
('tour_type', 'cultural', 'Cultural', 'Культурный', 4),
('tour_type', 'adventure', 'Adventure', 'Приключенческий', 5),
('tour_type', 'city-tour', 'City Tour', 'Городской тур', 6),
('tour_type', 'sunset-cruise', 'Sunset Cruise', 'Закатный круиз', 7),
('tour_type', 'fishing', 'Fishing', 'Рыбалка', 8),
('tour_type', 'elephant-sanctuary', 'Elephant Sanctuary', 'Слоновий заповедник', 9),
('tour_type', 'temple-tour', 'Temple Tour', 'Храмовый тур', 10),
('tour_type', 'cooking-class', 'Cooking Class', 'Кулинарный мастер-класс', 11),
('tour_type', 'kayaking', 'Kayaking', 'Каякинг', 12);

-- Property amenities
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('amenity', 'pool', 'Swimming Pool', 'Бассейн', 1),
('amenity', 'wifi', 'WiFi', 'WiFi', 2),
('amenity', 'parking', 'Parking', 'Парковка', 3),
('amenity', 'gym', 'Gym', 'Тренажерный зал', 4),
('amenity', 'air-conditioning', 'Air Conditioning', 'Кондиционер', 5),
('amenity', 'kitchen', 'Kitchen', 'Кухня', 6),
('amenity', 'washer', 'Washer', 'Стиральная машина', 7),
('amenity', 'sea-view', 'Sea View', 'Вид на море', 8),
('amenity', 'balcony', 'Balcony', 'Балкон', 9),
('amenity', 'security', '24h Security', 'Охрана 24ч', 10),
('amenity', 'pet-friendly', 'Pet Friendly', 'Можно с питомцами', 11),
('amenity', 'beach-access', 'Beach Access', 'Выход к пляжу', 12);

-- Property types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('property_type', 'apartment', 'Apartment', 'Квартира', 1),
('property_type', 'villa', 'Villa', 'Вилла', 2),
('property_type', 'condo', 'Condo', 'Кондо', 3),
('property_type', 'house', 'House', 'Дом', 4),
('property_type', 'penthouse', 'Penthouse', 'Пентхаус', 5),
('property_type', 'studio', 'Studio', 'Студия', 6),
('property_type', 'townhouse', 'Townhouse', 'Таунхаус', 7);

-- Yacht types
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('yacht_type', 'catamaran', 'Catamaran', 'Катамаран', 1),
('yacht_type', 'speedboat', 'Speedboat', 'Скоростной катер', 2),
('yacht_type', 'sailing', 'Sailing Yacht', 'Парусная яхта', 3),
('yacht_type', 'motor-yacht', 'Motor Yacht', 'Моторная яхта', 4),
('yacht_type', 'luxury-yacht', 'Luxury Yacht', 'Люксовая яхта', 5),
('yacht_type', 'fishing-boat', 'Fishing Boat', 'Рыболовное судно', 6);

-- Event categories
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, sort_order) VALUES
('event_category', 'concert', 'Concert', 'Концерт', 1),
('event_category', 'party', 'Party', 'Вечеринка', 2),
('event_category', 'festival', 'Festival', 'Фестиваль', 3),
('event_category', 'sports', 'Sports', 'Спорт', 4),
('event_category', 'exhibition', 'Exhibition', 'Выставка', 5),
('event_category', 'workshop', 'Workshop', 'Мастер-класс', 6),
('event_category', 'networking', 'Networking', 'Нетворкинг', 7);