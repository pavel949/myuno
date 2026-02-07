
-- Phase 1: Add missing catalog_life_map mappings for 5 life situations
-- Per LIFE OS Governance: primary weight 70-85, secondary weight 40-60

-- arrival_first_day (3b1d64f4-c21c-4d95-8d45-be75718eb25b)
-- Add 3 clinics (primary, weight 80-85)
INSERT INTO catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules) VALUES
('clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 85, '{guest,resident}', '{"tag":"emergency"}'),
('clinic', '2f42319d-f24b-48ad-8ce8-bc810f4998d4', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 82, '{guest,resident}', '{"tag":"dental"}'),
('clinic', '3ffa41e2-70a1-4d6f-9c3b-b0a6416e5f10', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 80, '{guest,resident}', '{"tag":"specialist"}'),

-- Add 3 vehicles (primary, weight 75-80)
('vehicle', 'ae2fbb83-a67c-4036-81a6-7a9ff7e58388', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 80, '{guest,resident}', '{"tag":"taxi"}'),
('vehicle', '1e009016-791d-49ea-a372-bcdd2fd8615a', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 78, '{guest,resident}', '{"tag":"transfer"}'),
('vehicle', 'eb37f1d0-0db8-4866-824e-bb473a6aca94', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 75, '{guest,resident}', '{"tag":"suv"}'),

-- Add 2 experiences (secondary, weight 55-60)
('experience', '47c3edc6-d0f1-46b5-8ffc-966a8fcef086', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 58, '{guest,resident}', '{"tag":"orientation"}'),
('experience', 'ff755ab9-c9e7-4386-af0a-cf6c735a7406', '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 55, '{guest,resident}', '{"tag":"daytrip"}'),

-- pre_trip_planning (4fee1e79-81e7-482d-b07e-25aed74c6dd7)
-- Add 2 tours (secondary, weight 55-60)
('tour', '8aa354c9-58b3-4308-85f1-0280c995de02', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 58, '{guest,resident}', '{"tag":"sightseeing"}'),
('tour', '1773a914-663a-4cfa-b8e0-3f78ec73b38a', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 55, '{guest,resident}', '{"tag":"adventure"}'),

-- Add 2 experiences (secondary, weight 50-55)
('experience', '4010f503-b054-4dc4-83ff-5b97ad96786d', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 53, '{guest,resident}', '{"tag":"activity"}'),
('experience', '4e40c1ea-e059-4e80-a26c-01630d97d290', '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 50, '{guest,resident}', '{"tag":"outdoor"}'),

-- business_work (bcc6805a-556d-4b41-8db7-6312e25e632b)
-- Add 2 legal_services (primary, weight 70-75)
('legal_service', '4bd9620a-8fbf-449a-a270-5d09cf420689', 'bcc6805a-556d-4b41-8db7-6312e25e632b', 75, '{resident,owner,investor}', '{"tag":"legal_advisory"}'),
('legal_service', 'c9f46c11-58d9-4632-a421-a7edf6c67ee6', 'bcc6805a-556d-4b41-8db7-6312e25e632b', 72, '{resident,owner,investor}', '{"tag":"accounting"}'),

-- long_term_living (250717ac-da6a-4903-9296-917fb3923cc2)
-- Add 2 restaurants (secondary, weight 45-50)
('restaurant', '7984d20a-ca38-4589-ab68-bedaea24e61d', '250717ac-da6a-4903-9296-917fb3923cc2', 48, '{resident,owner}', '{"tag":"daily_dining"}'),
('restaurant', '9816d896-543a-41dc-b255-ba307c55d925', '250717ac-da6a-4903-9296-917fb3923cc2', 45, '{resident,owner}', '{"tag":"fine_dining"}'),

-- family_with_children (47dd9683-4648-4ccb-acdb-060551b8379d)
-- Add 2 properties (primary, weight 70-75)
('property', '1b3d43ab-e7f8-42d5-965c-c48a25416e5f', '47dd9683-4648-4ccb-acdb-060551b8379d', 75, '{guest,resident,owner}', '{"tag":"family_villa"}'),
('property', '9c63485c-5ff8-4660-b5e6-5ee527c714b8', '47dd9683-4648-4ccb-acdb-060551b8379d', 72, '{guest,resident,owner}', '{"tag":"family_apartment"}');
