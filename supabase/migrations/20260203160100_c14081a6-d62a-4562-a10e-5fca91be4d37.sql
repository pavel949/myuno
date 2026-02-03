-- GIN indexes for faster ILIKE text search in useGlobalSearch
-- pg_trgm extension enables trigram matching for ILIKE optimization

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Yachts search index
CREATE INDEX IF NOT EXISTS idx_yachts_search_trgm 
ON yachts USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Tours search index
CREATE INDEX IF NOT EXISTS idx_tours_search_trgm 
ON tours USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Properties search index
CREATE INDEX IF NOT EXISTS idx_properties_search_trgm 
ON properties USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Restaurants search index
CREATE INDEX IF NOT EXISTS idx_restaurants_search_trgm 
ON restaurants USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Salons search index
CREATE INDEX IF NOT EXISTS idx_salons_search_trgm 
ON salons USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Clinics search index
CREATE INDEX IF NOT EXISTS idx_clinics_search_trgm 
ON clinics USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Events search index
CREATE INDEX IF NOT EXISTS idx_events_search_trgm 
ON events USING gin((coalesce(title_en, '') || ' ' || coalesce(title_ru, '')) gin_trgm_ops);

-- Categories search index (used first in search)
CREATE INDEX IF NOT EXISTS idx_categories_search_trgm 
ON categories USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Vehicles search index
CREATE INDEX IF NOT EXISTS idx_vehicles_search_trgm 
ON vehicles USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Gyms search index
CREATE INDEX IF NOT EXISTS idx_gyms_search_trgm 
ON gyms USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);

-- Marketplace products search index
CREATE INDEX IF NOT EXISTS idx_marketplace_products_search_trgm 
ON marketplace_products USING gin((coalesce(name_en, '') || ' ' || coalesce(name_ru, '')) gin_trgm_ops);