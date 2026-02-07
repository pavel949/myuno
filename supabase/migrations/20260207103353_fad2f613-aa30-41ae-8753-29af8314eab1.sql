-- Add 'gym' to the entity_type check constraint
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;
ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY['property','service','experience','transport','restaurant','yacht','tour','vehicle','clinic','babysitter','legal_service','bank','salon','event','gym']));