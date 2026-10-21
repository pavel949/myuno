CREATE TABLE public.poi_claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source identifiers (one of)
  osm_type text,
  osm_id bigint,
  google_place_id text,
  -- Snapshot of the POI at claim time (for moderator context)
  poi_name text NOT NULL,
  poi_category text,
  lat numeric,
  lng numeric,
  -- Owner-provided
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  owner_phone text,
  business_name text,
  business_website text,
  target_vertical text,
  message text,
  -- Lifecycle
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  reviewer_notes text,
  resulting_provider_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poi_claim_status_chk CHECK (status IN ('pending','approved','rejected','duplicate')),
  CONSTRAINT poi_claim_source_chk CHECK (
    google_place_id IS NOT NULL OR (osm_type IS NOT NULL AND osm_id IS NOT NULL)
  )
);

GRANT SELECT, INSERT ON public.poi_claim_requests TO authenticated;
GRANT SELECT, INSERT ON public.poi_claim_requests TO anon;
GRANT ALL ON public.poi_claim_requests TO service_role;

ALTER TABLE public.poi_claim_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can submit a claim
CREATE POLICY "claims_insert_public" ON public.poi_claim_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Users can read their own claims; admins can read all
CREATE POLICY "claims_select_own_or_admin" ON public.poi_claim_requests
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Admin update/delete
CREATE POLICY "claims_admin_update" ON public.poi_claim_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "claims_admin_delete" ON public.poi_claim_requests
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX poi_claims_status_idx ON public.poi_claim_requests(status) WHERE status = 'pending';
CREATE INDEX poi_claims_owner_idx ON public.poi_claim_requests(owner_user_id);
CREATE INDEX poi_claims_osm_idx ON public.poi_claim_requests(osm_type, osm_id) WHERE osm_id IS NOT NULL;
CREATE INDEX poi_claims_google_idx ON public.poi_claim_requests(google_place_id) WHERE google_place_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.tg_poi_claims_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER poi_claims_set_updated_at BEFORE UPDATE ON public.poi_claim_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_poi_claims_updated_at();