# Rollback for 0010_tighten_rls_warnings

Each policy in `drizzle/migrations/0010_tighten_rls_warnings.sql` replaced exactly one earlier policy.
To roll back a single table, drop the new policy and recreate the old one with the same name:

- ai_agent_logs / guest_check_in_data / pwa_installs: old INSERT check was `auth.uid() IS NOT NULL`.
- help_requests, lead_magnet_submissions, poi_claim_requests (`claims_insert_public`), thai_partner_leads, email_subscriptions, mcc_landing_events: old INSERT check was `true`.
- education_providers "Education providers are viewable by everyone", service_promotions "Public read access", provider_input_rules "input_rules_read", taxonomy_normalization "taxonomy_normalization_read", team_achievements "Anyone can view achievements", development_units "Anyone can view development units", nb_project_updates "Project updates are publicly viewable", property_listing_scores "Anyone can read listing scores", review_helpful "Anyone can view helpful votes": old SELECT was `USING (true)`.
- storage "property-videos owner upload": old check `bucket_id='property-videos' AND auth.uid() IS NOT NULL`.
- storage "Company members can upload crm docs": old check `bucket_id='crm-documents' AND (storage.foldername(name))[1] IS NOT NULL`.
