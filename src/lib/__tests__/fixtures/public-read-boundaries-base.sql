-- Synthetic RLS fixture. Never connect to a hosted database.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA auth,storage TO anon,authenticated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
CREATE TYPE public.app_role AS ENUM('admin','uno_team');
CREATE TABLE public.fixture_roles(user_id uuid, role app_role, active boolean);
CREATE FUNCTION public.has_role(p_user uuid,p_role app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.fixture_roles WHERE user_id=p_user AND role=p_role)
$$;
CREATE FUNCTION public.actor_has_active_platform_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM public.fixture_roles WHERE user_id=auth.uid() AND role='admin' AND active)
$$;
CREATE TABLE public.providers(id uuid PRIMARY KEY,user_id uuid);
GRANT SELECT ON public.providers TO anon,authenticated;
CREATE TABLE public.gyms(id uuid PRIMARY KEY,provider_id uuid,is_active boolean,approval_status text);
CREATE TABLE public.legal_services(LIKE public.gyms INCLUDING ALL);
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.gyms,public.legal_services TO anon,authenticated;
CREATE POLICY "Gyms are viewable by everyone" ON public.gyms FOR SELECT USING(true);
CREATE POLICY "Legal services are viewable by everyone" ON public.legal_services FOR SELECT USING(true);
CREATE POLICY "Anyone can view approved gyms or own content" ON public.gyms FOR SELECT USING(
 (is_active=true AND approval_status='approved') OR EXISTS(SELECT 1 FROM public.providers WHERE providers.id=gyms.provider_id AND providers.user_id=auth.uid())
);
CREATE POLICY "Anyone can view approved legal services or own content" ON public.legal_services FOR SELECT USING(
 (is_active=true AND approval_status='approved') OR EXISTS(SELECT 1 FROM public.providers WHERE providers.id=legal_services.provider_id AND providers.user_id=auth.uid())
);
CREATE POLICY "Admins can view all gyms" ON public.gyms FOR SELECT USING(public.has_role(auth.uid(),'admin'));
CREATE TABLE storage.buckets(id text PRIMARY KEY,public boolean);
CREATE TABLE storage.objects(bucket_id text REFERENCES storage.buckets(id),name text NOT NULL,owner_id text,PRIMARY KEY(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON storage.objects TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
CREATE POLICY fixture_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid()::text);
CREATE POLICY fixture_owner_update ON storage.objects FOR UPDATE TO authenticated USING(owner_id=auth.uid()::text) WITH CHECK(owner_id=auth.uid()::text);
CREATE POLICY fixture_owner_delete ON storage.objects FOR DELETE TO authenticated USING(owner_id=auth.uid()::text);
CREATE POLICY fixture_private_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='fixture-private' AND owner_id=auth.uid()::text);
INSERT INTO storage.buckets VALUES
('bouquet-images',true),
('company-assets',true),
('company-logos',true),
('complex-media',true),
('experience-images',true),
('magnet-landings',true),
('project-images',true),
('property-images',true),
('property-videos',true),
('tour-media',true),
('vendor-uploads',true),
('yacht-images',true),
('intake-uploads',true),
('property-care',true),
('fixture-private',false);
CREATE POLICY "Public read bouquet-images (no list)" ON storage.objects FOR SELECT USING(bucket_id='bouquet-images' AND name IS NOT NULL);
CREATE POLICY "Public read company-assets (no list)" ON storage.objects FOR SELECT USING(bucket_id='company-assets' AND name IS NOT NULL);
CREATE POLICY "Public read company-logos (no list)" ON storage.objects FOR SELECT USING(bucket_id='company-logos' AND name IS NOT NULL);
CREATE POLICY "complex_media_public_read" ON storage.objects FOR SELECT USING(bucket_id='complex-media');
CREATE POLICY "Public read experience-images (no list)" ON storage.objects FOR SELECT USING(bucket_id='experience-images' AND name IS NOT NULL);
CREATE POLICY "Public read magnet-landings" ON storage.objects FOR SELECT USING(bucket_id='magnet-landings');
CREATE POLICY "Public read project-images (no list)" ON storage.objects FOR SELECT USING(bucket_id='project-images' AND name IS NOT NULL);
CREATE POLICY "Public read property-images (no list)" ON storage.objects FOR SELECT USING(bucket_id='property-images' AND name IS NOT NULL);
CREATE POLICY "property-videos public read" ON storage.objects FOR SELECT USING(bucket_id='property-videos');
CREATE POLICY "Public read tour-media (no list)" ON storage.objects FOR SELECT USING(bucket_id='tour-media' AND name IS NOT NULL);
CREATE POLICY "Public read vendor-uploads (no list)" ON storage.objects FOR SELECT USING(bucket_id='vendor-uploads' AND name IS NOT NULL);
CREATE POLICY "Public read yacht-images (no list)" ON storage.objects FOR SELECT USING(bucket_id='yacht-images' AND name IS NOT NULL);
