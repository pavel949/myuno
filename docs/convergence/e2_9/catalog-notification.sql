-- E2.9 finite privacy boundary. No business-row writes or support grants.
CREATE VIEW public.public_provider_catalog WITH (security_barrier=true) AS
SELECT id,name,description_en,description_ru,logo_url,cover_image,website,
 NULL::text AS phone,NULL::text AS email,
 is_verified,trust_score,is_active,created_at,updated_at,business_category,rating,review_count,
 address,lat,lng,languages,has_machine_translation,provider_type,response_time_minutes,
 has_insurance,has_guarantee,service_domains,approval_status,booking_flow,coverage_areas,is_demo,city_id
FROM public.providers WHERE is_active=true AND approval_status='approved';
GRANT SELECT ON public.public_provider_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_provider_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_provider_catalog IS 'E2.9 read-only owner-executed allowlisted public projection; no provider contact/settlement/commission/owner identifiers. Base RLS is private.';

CREATE VIEW public.public_service_catalog WITH (security_barrier=true) AS
SELECT s.id,s.provider_id,s.category_id,s.location_id,s.name_en,s.name_ru,s.description_en,s.description_ru,
 s.price,s.currency,s.duration_minutes,s.images,s.tags,s.is_active,s.created_at,s.updated_at,
 s.approval_status,s.languages,s.is_verified,s.pricing_model,s.unit,s.lead_time_hours,s.availability_mode,s.booking_flow,
 c.slug AS category_slug,jsonb_build_object('name_en',c.name_en,'name_ru',c.name_ru,'slug',c.slug) AS category,
 CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('id',p.id,'name',p.name,'logo_url',p.logo_url,'is_verified',p.is_verified,
 'rating',p.rating,'is_active',p.is_active,'has_machine_translation',p.has_machine_translation) END AS provider
FROM public.services s LEFT JOIN public.public_provider_catalog p ON p.id=s.provider_id
LEFT JOIN public.categories c ON c.id=s.category_id
WHERE s.is_active=true AND s.approval_status='approved';
GRANT SELECT ON public.public_service_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_service_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_service_catalog IS 'E2.9 active approved service marketing with safe provider JSON; excludes commission/moderation/import fields; read only.';

CREATE VIEW public.public_salon_catalog WITH (security_barrier=true) AS
SELECT id,name_en,name_ru,description_en,description_ru,salon_type,cover_image,images,address,district,
 lat,lng,NULL::text AS phone,NULL::text AS email,website,working_hours,services,amenities,languages,
 price_from,currency,rating,review_count,is_featured,is_verified,is_active,provider_id,created_at,updated_at,
 approval_status,city_id FROM public.salons WHERE is_active=true AND approval_status='approved';
GRANT SELECT ON public.public_salon_catalog TO anon,authenticated,service_role;
REVOKE ALL ON public.public_salon_catalog FROM PUBLIC;
COMMENT ON VIEW public.public_salon_catalog IS 'E2.9 active approved salon marketing only; null contact compatibility slots, no review/rejection/creator fields.';

-- Restrict the proved public full-row leaks; preserve existing private owner/admin policies.
ALTER POLICY "Anyone can view active providers" ON public.providers USING (false);
ALTER POLICY "Anyone can view approved services or own content" ON public.services
 USING (EXISTS(SELECT 1 FROM public.providers p WHERE p.id=services.provider_id AND p.user_id=auth.uid()));
ALTER POLICY "Salons are viewable by everyone" ON public.salons USING (false);
ALTER POLICY "Anyone can view approved salons or own content" ON public.salons
 USING (EXISTS(SELECT 1 FROM public.providers p WHERE p.id=salons.provider_id AND p.user_id=auth.uid()));
ALTER POLICY "Providers can manage own salons" ON public.salons
 USING (EXISTS(SELECT 1 FROM public.providers p WHERE p.id=salons.provider_id AND p.user_id=auth.uid()))
 WITH CHECK (EXISTS(SELECT 1 FROM public.providers p WHERE p.id=salons.provider_id AND p.user_id=auth.uid()));
ALTER POLICY "Admins can view all salons" ON public.salons USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update salons" ON public.salons USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Proved unpublished-catalog employment bypasses only; shared content helper is not changed.
ALTER POLICY listings_admin_full ON public.listings USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins manage all complexes" ON public.property_complexes USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can manage all storefronts" ON public.company_storefronts USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update vendor_locations" ON public.vendor_locations USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins have full access to vendor locations" ON public.vendor_locations USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can view all cleaning_services" ON public.cleaning_services USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update cleaning_services" ON public.cleaning_services USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can view all education_providers" ON public.education_providers USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update education_providers" ON public.education_providers USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can view all events" ON public.events USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update events" ON public.events USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can view all gyms" ON public.gyms USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update gyms" ON public.gyms USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can view all water_activities" ON public.water_activities USING (public.has_role(auth.uid(),'admin'));
ALTER POLICY "Admins can update water_activities" ON public.water_activities USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER POLICY thai_businesses_select ON public.thai_businesses USING (is_active=true OR owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
ALTER POLICY thai_businesses_update ON public.thai_businesses USING (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
ALTER POLICY thai_businesses_delete ON public.thai_businesses USING (owner_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
ALTER POLICY thai_services_select ON public.thai_business_services USING (EXISTS(SELECT 1 FROM public.thai_businesses b WHERE b.id=business_id AND (b.is_active=true OR b.owner_id=auth.uid())) OR public.has_role(auth.uid(),'admin'));
ALTER POLICY thai_services_write ON public.thai_business_services USING (EXISTS(SELECT 1 FROM public.thai_businesses b WHERE b.id=business_id AND b.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin')) WITH CHECK (EXISTS(SELECT 1 FROM public.thai_businesses b WHERE b.id=business_id AND b.owner_id=auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- Object-bound moderation notification: actor has actual owner relationship or protected admin.
CREATE FUNCTION public.actor_can_notify_property_submission(p_property_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.properties p
 WHERE p.id=p_property_id AND p.approval_status='pending' AND p.deleted_at IS NULL
 AND (p.owner_id=auth.uid() OR public.actor_has_platform_admin()))
$$;
REVOKE ALL ON FUNCTION public.actor_can_notify_property_submission(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_notify_property_submission(uuid) TO authenticated,service_role;
