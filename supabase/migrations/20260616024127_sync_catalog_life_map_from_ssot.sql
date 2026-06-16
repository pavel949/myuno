-- Sync catalog_life_map for `entity_type='service'` from the SSOT
-- `situationCodes` on each ServiceEntry in src/lib/catalog/taxonomy.ts.
--
-- Until this migration the service-level entries in catalog_life_map were
-- hand-rolled (admin INSERT per new service). The SSOT now declares every
-- (service.id, situation_code) pair via the `situationCodes?: string[]`
-- field, and this migration mirrors it to the DB.
--
-- Idempotent — UNIQUE (entity_type, entity_id, life_situation_id) gates
-- duplicates. Re-running after taxonomy edits will only insert net-new
-- pairs; deletions in the SSOT are NOT mirrored here (a follow-up DELETE
-- can run separately when needed).
--
-- weight defaulted to 60 for service entries (between the 80-primary and
-- 50-tangential bands used by the full-coverage seed). role_scope left
-- NULL = visible to guest / resident / owner / investor.

WITH pairs (entity_id, code) AS (
  VALUES
    -- Arrive cluster
    ('transfer','arrival'),('transfer','first_time'),('transfer','transit'),('transfer','tourist'),('transfer','emergency'),
    ('fast-track','arrival'),('fast-track','tourist'),('fast-track','transit'),
    ('vehicle','arrival'),('vehicle','tourist'),('vehicle','living'),('vehicle','resident'),('vehicle','leisure'),
    ('sim','arrival'),('sim','tourist'),('sim','first_time'),('sim','transit'),
    ('exchange','arrival'),('exchange','tourist'),('exchange','investing'),('exchange','investor'),
    ('experience','tourist'),('experience','leisure'),('experience','first_time'),('experience','transit'),
    ('tours','tourist'),('tours','leisure'),('tours','first_time'),
    ('water','tourist'),('water','leisure'),
    ('yacht','tourist'),('yacht','leisure'),('yacht','nightlife'),
    ('event','tourist'),('event','leisure'),('event','nightlife'),
    ('sos','emergency'),
    ('vip-concierge','emergency'),('vip-concierge','arrival'),('vip-concierge','tourist'),
    ('support','emergency'),('support','arrival'),('support','living'),('support','resident'),
    -- Live cluster
    ('cleaning','living'),('cleaning','resident'),('cleaning','managing'),('cleaning','property_owner'),('cleaning','departure'),
    ('laundry','living'),('laundry','resident'),('laundry','tourist'),
    ('pest-control','living'),('pest-control','resident'),('pest-control','managing'),
    ('handyman','living'),('handyman','resident'),('handyman','managing'),
    ('plumbing','living'),('plumbing','resident'),('plumbing','managing'),
    ('electrical','living'),('electrical','resident'),('electrical','managing'),
    ('ac-repair','living'),('ac-repair','resident'),('ac-repair','managing'),
    ('locksmith','living'),('locksmith','resident'),('locksmith','managing'),('locksmith','emergency'),
    ('gardening','living'),('gardening','resident'),('gardening','managing'),
    ('flowers','leisure'),('flowers','living'),('flowers','resident'),
    ('storage','living'),('storage','resident'),('storage','departure'),('storage','relocation'),
    ('services','living'),('services','resident'),('services','managing'),
    ('restaurant','food'),('restaurant','living'),('restaurant','resident'),('restaurant','tourist'),('restaurant','nightlife'),('restaurant','leisure'),
    ('delivery','food'),('delivery','living'),('delivery','resident'),
    ('market','food'),('market','living'),('market','resident'),
    ('medical','health'),('medical','family'),('medical','emergency'),('medical','living'),('medical','resident'),
    ('pharmacy','health'),('pharmacy','family'),('pharmacy','living'),('pharmacy','resident'),('pharmacy','emergency'),('pharmacy','settling'),
    ('beauty','health'),('beauty','leisure'),('beauty','living'),('beauty','resident'),
    ('fitness','health'),('fitness','living'),('fitness','resident'),('fitness','leisure'),
    ('insurance','health'),('insurance','settling'),('insurance','family'),('insurance','relocation'),('insurance','managing'),('insurance','departure'),
    ('babysitter','family'),('babysitter','living'),('babysitter','resident'),
    ('school-finder','family'),('school-finder','relocation'),('school-finder','settling'),
    ('education','family'),('education','living'),('education','resident'),('education','settling'),
    ('kids','family'),('kids','leisure'),('kids','living'),
    ('pets','pet_owner'),('pets','living'),('pets','resident'),
    ('veterinary','pet_owner'),('veterinary','emergency'),('veterinary','health'),
    ('event-live','leisure'),('event-live','living'),('event-live','resident'),('event-live','nightlife'),
    ('experience-live','leisure'),('experience-live','living'),('experience-live','resident'),
    ('water-live','leisure'),('water-live','living'),('water-live','resident'),
    ('community','living'),('community','resident'),('community','family'),
    ('wedding','family'),('wedding','leisure'),
    -- Invest cluster
    ('property','investing'),('property','investor'),('property','managing'),('property','property_owner'),('property','relocation'),('property','departure'),
    ('rent-short','tourist'),('rent-short','first_time'),('rent-short','transit'),('rent-short','relocation'),
    ('rent-long','relocation'),('rent-long','living'),('rent-long','resident'),('rent-long','family'),('rent-long','settling'),
    ('offplan','investing'),('offplan','investor'),('offplan','developer'),
    ('resale','investing'),('resale','investor'),('resale','departure'),
    ('developers','investing'),('developers','investor'),('developers','developer'),
    ('business-invest','business'),('business-invest','investing'),('business-invest','investor'),
    ('roi-hub','investing'),('roi-hub','investor'),('roi-hub','property_owner'),('roi-hub','managing'),
    ('due-diligence','investing'),('due-diligence','investor'),
    -- Legal cluster
    ('visa','settling'),('visa','visa_renewal'),('visa','relocation'),('visa','departure'),('visa','arrival'),
    ('legal','settling'),('legal','visa_renewal'),('legal','investing'),('legal','departure'),('legal','managing'),('legal','business'),('legal','emergency'),
    ('contract-ai','settling'),('contract-ai','investing'),('contract-ai','business'),('contract-ai','managing'),
    ('relocate','relocation'),('relocate','settling'),
    ('knowledge','settling'),('knowledge','visa_renewal'),('knowledge','investing'),('knowledge','managing'),
    ('banking','settling'),('banking','visa_renewal'),('banking','investing'),('banking','investor'),('banking','business'),('banking','managing'),('banking','departure'),
    ('tax','settling'),('tax','investing'),('tax','managing'),('tax','business'),('tax','property_owner'),
    ('halal-persona','arrival'),('halal-persona','tourist'),('halal-persona','first_time'),('halal-persona','settling'),
    ('halal-stay','arrival'),('halal-stay','tourist'),('halal-stay','living'),('halal-stay','resident'),
    ('halal-dining','tourist'),('halal-dining','living'),('halal-dining','resident'),('halal-dining','food'),
    ('halal-knowledge','arrival'),('halal-knowledge','first_time'),('halal-knowledge','settling'),
    -- Build cluster
    ('developer-portal','developer'),('developer-portal','business'),
    ('program','developer'),('program','business'),
    ('newbuilds','investing'),('newbuilds','investor'),('newbuilds','developer'),
    ('advisory','investing'),('advisory','investor'),('advisory','developer'),('advisory','departure')
)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope)
SELECT 'service', p.entity_id, s.id, 60, NULL
FROM pairs p
JOIN public.life_situations s ON s.code = p.code AND s.is_active = true
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;
