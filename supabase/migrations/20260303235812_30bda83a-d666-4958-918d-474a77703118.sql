-- Fix orphaned property references in catalog_life_map
-- Replace fake entity_ids with real existing property IDs

-- Real property IDs (active, approved)
-- 1: 3142e7a2-5356-4061-9fce-b0d4b8a6010f
-- 2: 440792d3-bd20-40a0-b5d1-e3fc91faafc5
-- 3: 0cc6452f-e0b0-4c33-8d71-908f099d6b0f
-- 4: cbc715aa-37ea-470c-bcb7-1f21affec471
-- 5: 7241a78d-0d4a-4e60-b08a-42336e37d199
-- 6: 5ac36fff-b6aa-45d8-9239-370d671108ab
-- 7: 6575e9bc-444f-4f4d-8029-7c8beca56ef2
-- 8: f483d239-2dca-4223-bf1e-0f1644689a53
-- 9: d0a4b492-4874-4167-93ef-ae9cd8ad6078
-- 10: e3b34a14-e246-4d5a-bf95-90e3e264fe36
-- 11: 623a3d27-a3a8-4820-9ddf-b0eb7ac928e2
-- 12: 095ac53f-accc-4f1a-8d9e-5fbeb3d8c4ab

-- Step 1: Delete all orphaned property entries
DELETE FROM catalog_life_map WHERE entity_type = 'property';

-- Step 2: Re-insert with real property IDs for each life situation
-- Get life situation IDs
DO $$
DECLARE
  v_business_id uuid;
  v_family_id uuid;
  v_leisure_id uuid;
  v_living_id uuid;
  v_planning_id uuid;
  v_property_id uuid;
  v_relocation_id uuid;
  v_retirement_id uuid;
BEGIN
  SELECT id INTO v_business_id FROM life_situations WHERE code = 'business';
  SELECT id INTO v_family_id FROM life_situations WHERE code = 'family';
  SELECT id INTO v_leisure_id FROM life_situations WHERE code = 'leisure';
  SELECT id INTO v_living_id FROM life_situations WHERE code = 'living';
  SELECT id INTO v_planning_id FROM life_situations WHERE code = 'planning';
  SELECT id INTO v_property_id FROM life_situations WHERE code = 'property';
  SELECT id INTO v_relocation_id FROM life_situations WHERE code = 'relocation';
  SELECT id INTO v_retirement_id FROM life_situations WHERE code = 'retirement_living';

  -- Business: 4 properties
  IF v_business_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_business_id, 80),
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_business_id, 75),
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_business_id, 70),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_business_id, 65);
  END IF;

  -- Family: 3 properties
  IF v_family_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_family_id, 80),
      ('property', '7241a78d-0d4a-4e60-b08a-42336e37d199', v_family_id, 75),
      ('property', '5ac36fff-b6aa-45d8-9239-370d671108ab', v_family_id, 70);
  END IF;

  -- Leisure: 3 properties
  IF v_leisure_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_leisure_id, 75),
      ('property', '6575e9bc-444f-4f4d-8029-7c8beca56ef2', v_leisure_id, 70),
      ('property', 'f483d239-2dca-4223-bf1e-0f1644689a53', v_leisure_id, 65);
  END IF;

  -- Living: 4 properties
  IF v_living_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_living_id, 80),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_living_id, 75),
      ('property', 'd0a4b492-4874-4167-93ef-ae9cd8ad6078', v_living_id, 70),
      ('property', 'e3b34a14-e246-4d5a-bf95-90e3e264fe36', v_living_id, 65);
  END IF;

  -- Planning: 3 properties
  IF v_planning_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_planning_id, 80),
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_planning_id, 75),
      ('property', '7241a78d-0d4a-4e60-b08a-42336e37d199', v_planning_id, 70);
  END IF;

  -- Property: 4 properties
  IF v_property_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_property_id, 85),
      ('property', '0cc6452f-e0b0-4c33-8d71-908f099d6b0f', v_property_id, 80),
      ('property', 'cbc715aa-37ea-470c-bcb7-1f21affec471', v_property_id, 75),
      ('property', '5ac36fff-b6aa-45d8-9239-370d671108ab', v_property_id, 70);
  END IF;

  -- Relocation: 2 properties
  IF v_relocation_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '440792d3-bd20-40a0-b5d1-e3fc91faafc5', v_relocation_id, 75),
      ('property', '623a3d27-a3a8-4820-9ddf-b0eb7ac928e2', v_relocation_id, 70);
  END IF;

  -- Retirement: 3 properties
  IF v_retirement_id IS NOT NULL THEN
    INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight) VALUES
      ('property', '3142e7a2-5356-4061-9fce-b0d4b8a6010f', v_retirement_id, 80),
      ('property', '095ac53f-accc-4f1a-8d9e-5fbeb3d8c4ab', v_retirement_id, 75),
      ('property', 'd0a4b492-4874-4167-93ef-ae9cd8ad6078', v_retirement_id, 70);
  END IF;
END $$;