-- Insert rules bound to the caller
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.ai_agent_logs;
CREATE POLICY "Users insert own logs" ON public.ai_agent_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create check-in data" ON public.guest_check_in_data;
CREATE POLICY "Users create own check-in data" ON public.guest_check_in_data FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can log installs" ON public.pwa_installs;
CREATE POLICY "Users log own installs" ON public.pwa_installs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Public forms: still open, but cannot impersonate a user or preset workflow status
DROP POLICY IF EXISTS "Anyone can create help requests" ON public.help_requests;
CREATE POLICY "Anyone can create own help requests" ON public.help_requests FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND COALESCE(status,'new') = 'new');

DROP POLICY IF EXISTS "Anyone can submit a magnet form" ON public.lead_magnet_submissions;
CREATE POLICY "Anyone can submit own magnet form" ON public.lead_magnet_submissions FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND COALESCE(status,'new') = 'new');

DROP POLICY IF EXISTS "claims_insert_public" ON public.poi_claim_requests;
CREATE POLICY "claims_insert_own_pending" ON public.poi_claim_requests FOR INSERT TO anon, authenticated
  WITH CHECK ((owner_user_id IS NULL OR owner_user_id = auth.uid()) AND COALESCE(status,'pending') = 'pending'
              AND reviewed_by IS NULL AND reviewed_at IS NULL AND resulting_provider_id IS NULL);

DROP POLICY IF EXISTS "Anyone can submit a partner lead" ON public.thai_partner_leads;
CREATE POLICY "Anyone can submit a new partner lead" ON public.thai_partner_leads FOR INSERT TO anon, authenticated
  WITH CHECK (COALESCE(status,'new') = 'new');

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscriptions;
CREATE POLICY "Anyone can subscribe with a valid email" ON public.email_subscriptions FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

DROP POLICY IF EXISTS "Anyone can insert events" ON public.mcc_landing_events;
CREATE POLICY "Anyone can insert own events" ON public.mcc_landing_events FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND length(event_name) <= 100);

-- Public reads narrowed to what is meant to be public
DROP POLICY IF EXISTS "Education providers are viewable by everyone" ON public.education_providers;

DROP POLICY IF EXISTS "Public read access" ON public.service_promotions;
CREATE POLICY "Public reads active promotions" ON public.service_promotions FOR SELECT
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

DROP POLICY IF EXISTS "input_rules_read" ON public.provider_input_rules;
CREATE POLICY "input_rules_read_active" ON public.provider_input_rules FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "taxonomy_normalization_read" ON public.taxonomy_normalization;
CREATE POLICY "taxonomy_normalization_read_active" ON public.taxonomy_normalization FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view achievements" ON public.team_achievements;
CREATE POLICY "Signed-in users view active achievements" ON public.team_achievements FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view development units" ON public.development_units;
CREATE POLICY "Anyone can view listed development units" ON public.development_units FOR SELECT
  USING (status IN ('available','limited','sold_out'));

DROP POLICY IF EXISTS "Project updates are publicly viewable" ON public.nb_project_updates;
CREATE POLICY "Published project updates are public" ON public.nb_project_updates FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

DROP POLICY IF EXISTS "Anyone can read listing scores" ON public.property_listing_scores;
CREATE POLICY "Managers read own listing scores" ON public.property_listing_scores FOR SELECT TO authenticated
  USING (public.can_manage_property(property_id));

DROP POLICY IF EXISTS "Anyone can view helpful votes" ON public.review_helpful;
CREATE POLICY "Users view own helpful votes" ON public.review_helpful FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Storage uploads bound to the uploader / company membership
DROP POLICY IF EXISTS "property-videos owner upload" ON storage.objects;
CREATE POLICY "property-videos owner upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Company members can upload crm docs" ON storage.objects;
CREATE POLICY "Company members can upload crm docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] IN (
    SELECT m.company_id::text FROM public.management_company_members m
    WHERE m.user_id = auth.uid() AND m.is_active = true));