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