
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
