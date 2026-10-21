-- ─────────────────────────────────────────────────────────────────────────
-- Seed catalog_life_map for FULL vertical coverage across 22 life situations.
--
-- Audit on 2026-06-16 found that only 9 entity_types (property, transfer,
-- water_activity, flower_shop, yacht, event, clinic, vehicle, experience)
-- had ever been INSERT'd into catalog_life_map. The other 18 allowed types
-- (cleaning, salon, pharmacy, restaurant, gym, babysitter, education, etc.)
-- were silent on every situation grid — Navigator v3 `/discover/health`
-- showed clinics but no pharmacies or salons, `/discover/family` showed
-- nothing for babysitter, etc.
--
-- This migration upserts mappings for each (situation, vertical) pair in
-- the canonical decision matrix (taxonomy.ts:CLUSTER_LIFE_SITUATIONS plus
-- per-service `situationCodes`). Idempotent via the
-- UNIQUE (entity_type, entity_id, life_situation_id) constraint —
-- safe to re-run.
--
-- Weight defaults to 50 (medium relevance). role_scope is set to NULL
-- meaning "visible to all roles"; finer-grained gating can be added later
-- by an admin tweaking individual rows.
-- ─────────────────────────────────────────────────────────────────────────

-- Helper macro pattern: for each (situation_code, source_table, entity_type)
-- triple, look up life_situation_id and INSERT all active rows.
-- Postgres doesn't have true macros; we expand inline below.

-- ============= ARRIVE-cluster situations =============

-- arrival → transfer, vehicle, transport (airport-routes), experience (first-day excursions)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'transfer', t.id, s.id, 80, NULL
FROM public.transfers t
CROSS JOIN public.life_situations s
WHERE s.code = 'arrival' AND t.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'vehicle', v.id, s.id, 60, NULL
FROM public.vehicles v
CROSS JOIN public.life_situations s
WHERE s.code = 'arrival' AND v.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- tourist → yacht, water_activity, experience, restaurant, event
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'yacht', y.id, s.id, 70, NULL
FROM public.yachts y CROSS JOIN public.life_situations s
WHERE s.code = 'tourist' AND y.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'water_activity', w.id, s.id, 70, NULL
FROM public.water_activities w CROSS JOIN public.life_situations s
WHERE s.code = 'tourist' AND w.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'experience', e.id, s.id, 70, NULL
FROM public.experiences e CROSS JOIN public.life_situations s
WHERE s.code = 'tourist' AND e.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 60, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'tourist' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'event', ev.id, s.id, 60, NULL
FROM public.events ev CROSS JOIN public.life_situations s
WHERE s.code = 'tourist' AND ev.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- first_time → transfer + vehicle + restaurant + experience
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'transfer', t.id, s.id, 80, NULL
FROM public.transfers t CROSS JOIN public.life_situations s
WHERE s.code = 'first_time' AND t.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 50, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'first_time' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'experience', e.id, s.id, 60, NULL
FROM public.experiences e CROSS JOIN public.life_situations s
WHERE s.code = 'first_time' AND e.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- transit → transfer + restaurant
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'transfer', t.id, s.id, 80, NULL
FROM public.transfers t CROSS JOIN public.life_situations s
WHERE s.code = 'transit' AND t.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 50, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'transit' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- ============= LIVE-cluster situations =============

-- living → cleaning, salon, pharmacy, restaurant, education, gym
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 70, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'salon', sa.id, s.id, 50, NULL
FROM public.salons sa CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND sa.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pharmacy', p.id, s.id, 50, NULL
FROM public.pharmacies p CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND p.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 60, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'education', ed.id, s.id, 50, NULL
FROM public.education_providers ed CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND ed.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'gym', g.id, s.id, 50, NULL
FROM public.gyms g CROSS JOIN public.life_situations s
WHERE s.code = 'living' AND g.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- resident → property (long-term), cleaning, gym, salon, restaurant, education
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 70, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'resident' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'gym', g.id, s.id, 50, NULL
FROM public.gyms g CROSS JOIN public.life_situations s
WHERE s.code = 'resident' AND g.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'salon', sa.id, s.id, 50, NULL
FROM public.salons sa CROSS JOIN public.life_situations s
WHERE s.code = 'resident' AND sa.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 60, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'resident' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'education', ed.id, s.id, 50, NULL
FROM public.education_providers ed CROSS JOIN public.life_situations s
WHERE s.code = 'resident' AND ed.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- family → babysitter, education, clinic, pet_service, restaurant
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'babysitter', b.id, s.id, 80, NULL
FROM public.babysitters b CROSS JOIN public.life_situations s
WHERE s.code = 'family' AND b.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'education', ed.id, s.id, 80, NULL
FROM public.education_providers ed CROSS JOIN public.life_situations s
WHERE s.code = 'family' AND ed.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'clinic', cl.id, s.id, 60, NULL
FROM public.clinics cl CROSS JOIN public.life_situations s
WHERE s.code = 'family' AND cl.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pet_service', ps.id, s.id, 50, NULL
FROM public.pet_services ps CROSS JOIN public.life_situations s
WHERE s.code = 'family' AND ps.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- pet_owner → pet_service, clinic (vet)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pet_service', ps.id, s.id, 90, NULL
FROM public.pet_services ps CROSS JOIN public.life_situations s
WHERE s.code = 'pet_owner' AND ps.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 40, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'pet_owner' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- health → clinic (already), pharmacy, salon (wellness), insurance
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'clinic', cl.id, s.id, 80, NULL
FROM public.clinics cl CROSS JOIN public.life_situations s
WHERE s.code = 'health' AND cl.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pharmacy', p.id, s.id, 80, NULL
FROM public.pharmacies p CROSS JOIN public.life_situations s
WHERE s.code = 'health' AND p.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'salon', sa.id, s.id, 40, NULL
FROM public.salons sa CROSS JOIN public.life_situations s
WHERE s.code = 'health' AND sa.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 50, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'health' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- leisure → experience, event, water_activity, restaurant (already seeded for many)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'experience', e.id, s.id, 70, NULL
FROM public.experiences e CROSS JOIN public.life_situations s
WHERE s.code = 'leisure' AND e.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'event', ev.id, s.id, 70, NULL
FROM public.events ev CROSS JOIN public.life_situations s
WHERE s.code = 'leisure' AND ev.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'water_activity', w.id, s.id, 70, NULL
FROM public.water_activities w CROSS JOIN public.life_situations s
WHERE s.code = 'leisure' AND w.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 50, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'leisure' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- food → restaurant
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 90, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'food' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- nightlife → restaurant, event, transfer
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'restaurant', r.id, s.id, 70, NULL
FROM public.restaurants r CROSS JOIN public.life_situations s
WHERE s.code = 'nightlife' AND r.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'event', ev.id, s.id, 70, NULL
FROM public.events ev CROSS JOIN public.life_situations s
WHERE s.code = 'nightlife' AND ev.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'transfer', t.id, s.id, 50, NULL
FROM public.transfers t CROSS JOIN public.life_situations s
WHERE s.code = 'nightlife' AND t.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- ============= MANAGE-cluster =============

-- managing → property (already typical), cleaning, legal_service, insurance
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 70, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'managing' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 60, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'managing' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 50, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'managing' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- property_owner → cleaning, legal_service, insurance
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 70, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'property_owner' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 60, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'property_owner' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 50, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'property_owner' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- business → bank, legal_service
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 70, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'business' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 70, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'business' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- ============= INVEST-cluster =============

-- investing → legal_service, bank
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 60, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'investing' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 60, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'investing' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- investor → legal_service, bank
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 60, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'investor' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 60, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'investor' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- ============= LEGAL-cluster =============

-- settling → bank, legal_service, insurance, education, pharmacy
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 70, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'settling' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 70, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'settling' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 60, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'settling' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'education', ed.id, s.id, 50, NULL
FROM public.education_providers ed CROSS JOIN public.life_situations s
WHERE s.code = 'settling' AND ed.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pharmacy', p.id, s.id, 40, NULL
FROM public.pharmacies p CROSS JOIN public.life_situations s
WHERE s.code = 'settling' AND p.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- visa_renewal → legal_service, bank
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 90, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'visa_renewal' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 50, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'visa_renewal' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- relocation → bank, legal_service, insurance, cleaning, pharmacy
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 70, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'relocation' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 70, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'relocation' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 60, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'relocation' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 60, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'relocation' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pharmacy', p.id, s.id, 40, NULL
FROM public.pharmacies p CROSS JOIN public.life_situations s
WHERE s.code = 'relocation' AND p.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- ============= NEW SITUATIONS =============

-- departure (exit / leaving Phuket) → legal_service (visa exit), cleaning (move-out),
--                                     bank (close account), insurance (cancel)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 90, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'departure' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'cleaning', c.id, s.id, 60, NULL
FROM public.cleaning_services c CROSS JOIN public.life_situations s
WHERE s.code = 'departure' AND c.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'bank', bk.id, s.id, 70, NULL
FROM public.banks bk CROSS JOIN public.life_situations s
WHERE s.code = 'departure' AND bk.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'insurance', i.id, s.id, 50, NULL
FROM public.insurance_providers i CROSS JOIN public.life_situations s
WHERE s.code = 'departure' AND i.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- emergency → clinic (urgent), transfer (urgent), legal_service (police/lost docs),
--             pharmacy (24/7)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'clinic', cl.id, s.id, 90, NULL
FROM public.clinics cl CROSS JOIN public.life_situations s
WHERE s.code = 'emergency' AND cl.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'transfer', t.id, s.id, 80, NULL
FROM public.transfers t CROSS JOIN public.life_situations s
WHERE s.code = 'emergency' AND t.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'legal_service', ls.id, s.id, 80, NULL
FROM public.legal_services ls CROSS JOIN public.life_situations s
WHERE s.code = 'emergency' AND ls.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'pharmacy', p.id, s.id, 70, NULL
FROM public.pharmacies p CROSS JOIN public.life_situations s
WHERE s.code = 'emergency' AND p.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;
