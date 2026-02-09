-- Expand entity_type check constraint to include all platform verticals
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;

ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY[
  'property', 'service', 'experience', 'transport', 'restaurant', 
  'yacht', 'tour', 'vehicle', 'clinic', 'babysitter', 
  'legal_service', 'bank', 'salon', 'event', 'gym', 
  'airport_service', 'page', 'cleaning', 'pet_service', 
  'insurance', 'education', 'flower_shop', 'water_activity',
  'pharmacy', 'coworking', 'marketplace_product'
]));