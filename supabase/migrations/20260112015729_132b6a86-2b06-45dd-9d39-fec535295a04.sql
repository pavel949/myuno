-- Create a function to calculate distance using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R double precision := 6371; -- Earth radius in kilometers
  dlat double precision;
  dlng double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Create a generic function to find nearby items from any table with lat/lng
CREATE OR REPLACE FUNCTION public.find_nearby_salons(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    s.id,
    s.name_en,
    s.name_ru,
    s.lat,
    s.lng,
    public.calculate_distance_km(user_lat, user_lng, s.lat, s.lng) as distance_km
  FROM public.salons s
  WHERE s.is_active = true
    AND s.lat IS NOT NULL 
    AND s.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, s.lat, s.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Similar function for restaurants
CREATE OR REPLACE FUNCTION public.find_nearby_restaurants(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    r.id,
    r.name_en,
    r.name_ru,
    r.lat,
    r.lng,
    public.calculate_distance_km(user_lat, user_lng, r.lat, r.lng) as distance_km
  FROM public.restaurants r
  WHERE r.is_active = true
    AND r.lat IS NOT NULL 
    AND r.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, r.lat, r.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for clinics
CREATE OR REPLACE FUNCTION public.find_nearby_clinics(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    c.id,
    c.name_en,
    c.name_ru,
    c.lat,
    c.lng,
    public.calculate_distance_km(user_lat, user_lng, c.lat, c.lng) as distance_km
  FROM public.clinics c
  WHERE c.is_active = true
    AND c.lat IS NOT NULL 
    AND c.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, c.lat, c.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for gyms
CREATE OR REPLACE FUNCTION public.find_nearby_gyms(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    g.id,
    g.name_en,
    g.name_ru,
    g.lat,
    g.lng,
    public.calculate_distance_km(user_lat, user_lng, g.lat, g.lng) as distance_km
  FROM public.gyms g
  WHERE g.is_active = true
    AND g.lat IS NOT NULL 
    AND g.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, g.lat, g.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;

-- Function for flower shops
CREATE OR REPLACE FUNCTION public.find_nearby_flower_shops(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name_en text,
  name_ru text,
  lat double precision,
  lng double precision,
  distance_km double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    f.id,
    f.name_en,
    f.name_ru,
    f.lat,
    f.lng,
    public.calculate_distance_km(user_lat, user_lng, f.lat, f.lng) as distance_km
  FROM public.flower_shops f
  WHERE f.is_active = true
    AND f.lat IS NOT NULL 
    AND f.lng IS NOT NULL
    AND public.calculate_distance_km(user_lat, user_lng, f.lat, f.lng) <= radius_km
  ORDER BY distance_km ASC;
$$;