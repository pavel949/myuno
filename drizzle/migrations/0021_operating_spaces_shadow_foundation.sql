-- E1 operating spaces shadow foundation: additive, unconsumed by runtime.
ALTER TABLE public.properties
  ADD CONSTRAINT properties_id_management_company_key UNIQUE (id, management_company_id);
ALTER TABLE public.management_company_members
  ADD CONSTRAINT management_company_members_id_company_key UNIQUE (id, company_id);

CREATE TABLE public.operating_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  management_company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE RESTRICT,
  key text NOT NULL CHECK (key ~ '^[a-z0-9][a-z0-9_-]{1,62}$'),
  name_en text NOT NULL CHECK (length(btrim(name_en)) > 0),
  name_ru text NOT NULL CHECK (length(btrim(name_ru)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operating_spaces_company_key_key UNIQUE (management_company_id, key),
  CONSTRAINT operating_spaces_id_company_key UNIQUE (id, management_company_id)
);

CREATE TABLE public.operating_space_properties (
  operating_space_id uuid NOT NULL,
  property_id uuid NOT NULL,
  management_company_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operating_space_properties_pkey PRIMARY KEY (operating_space_id, property_id),
  CONSTRAINT operating_space_properties_one_primary_space UNIQUE (property_id),
  CONSTRAINT operating_space_properties_space_same_company_fkey
    FOREIGN KEY (operating_space_id, management_company_id)
    REFERENCES public.operating_spaces(id, management_company_id) ON DELETE CASCADE,
  CONSTRAINT operating_space_properties_property_same_company_fkey
    FOREIGN KEY (property_id, management_company_id)
    REFERENCES public.properties(id, management_company_id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE public.operating_space_members (
  operating_space_id uuid NOT NULL,
  company_member_id uuid NOT NULL,
  management_company_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operating_space_members_pkey PRIMARY KEY (operating_space_id, company_member_id),
  CONSTRAINT operating_space_members_space_same_company_fkey
    FOREIGN KEY (operating_space_id, management_company_id)
    REFERENCES public.operating_spaces(id, management_company_id) ON DELETE CASCADE,
  CONSTRAINT operating_space_members_member_same_company_fkey
    FOREIGN KEY (company_member_id, management_company_id)
    REFERENCES public.management_company_members(id, company_id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE INDEX operating_space_members_company_member_idx ON public.operating_space_members(company_member_id);
CREATE INDEX operating_space_properties_company_idx ON public.operating_space_properties(management_company_id);

CREATE OR REPLACE FUNCTION public.operating_spaces_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER operating_spaces_touch_updated_at BEFORE UPDATE ON public.operating_spaces
  FOR EACH ROW EXECUTE FUNCTION public.operating_spaces_touch_updated_at();

CREATE OR REPLACE FUNCTION public.operating_spaces_lock_company()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.management_company_id IS DISTINCT FROM OLD.management_company_id THEN
    RAISE EXCEPTION 'operating space company is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER operating_spaces_lock_company BEFORE UPDATE ON public.operating_spaces
  FOR EACH ROW EXECUTE FUNCTION public.operating_spaces_lock_company();

CREATE OR REPLACE FUNCTION public.actor_is_operating_company_overseer(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','uno_team'))
    OR EXISTS (SELECT 1 FROM public.management_company_members m
      WHERE m.company_id = _company_id AND m.user_id = auth.uid()
        AND m.is_active IS TRUE AND m.role IN ('director','admin')))
$$;

CREATE OR REPLACE FUNCTION public.actor_can_access_operating_space(_space_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operating_spaces s
    WHERE s.id = _space_id AND (
      public.actor_is_operating_company_overseer(s.management_company_id)
      OR (s.is_active AND EXISTS (
        SELECT 1 FROM public.operating_space_members sm
        JOIN public.management_company_members m
          ON m.id = sm.company_member_id AND m.company_id = sm.management_company_id
        WHERE sm.operating_space_id = s.id AND sm.is_active
          AND m.is_active IS TRUE AND m.user_id = auth.uid()))))
$$;

REVOKE ALL ON FUNCTION public.actor_is_operating_company_overseer(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.actor_can_access_operating_space(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.actor_is_operating_company_overseer(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.actor_can_access_operating_space(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.operating_spaces_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.operating_spaces_lock_company() FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operating_spaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operating_space_properties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operating_space_members TO authenticated;
GRANT ALL ON public.operating_spaces, public.operating_space_properties, public.operating_space_members TO service_role;
REVOKE ALL ON public.operating_spaces, public.operating_space_properties, public.operating_space_members FROM anon;

ALTER TABLE public.operating_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_space_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY operating_spaces_select ON public.operating_spaces FOR SELECT TO authenticated
  USING (public.actor_can_access_operating_space(id));
CREATE POLICY operating_spaces_overseer_write ON public.operating_spaces FOR ALL TO authenticated
  USING (public.actor_is_operating_company_overseer(management_company_id))
  WITH CHECK (public.actor_is_operating_company_overseer(management_company_id));

CREATE POLICY operating_space_properties_select ON public.operating_space_properties FOR SELECT TO authenticated
  USING (public.actor_can_access_operating_space(operating_space_id));
CREATE POLICY operating_space_properties_overseer_write ON public.operating_space_properties FOR ALL TO authenticated
  USING (public.actor_is_operating_company_overseer(management_company_id))
  WITH CHECK (public.actor_is_operating_company_overseer(management_company_id));

CREATE POLICY operating_space_members_select ON public.operating_space_members FOR SELECT TO authenticated
  USING (public.actor_is_operating_company_overseer(management_company_id)
    OR EXISTS (SELECT 1 FROM public.management_company_members m
      WHERE m.id = company_member_id AND m.user_id = auth.uid() AND m.is_active IS TRUE));
CREATE POLICY operating_space_members_overseer_write ON public.operating_space_members FOR ALL TO authenticated
  USING (public.actor_is_operating_company_overseer(management_company_id))
  WITH CHECK (public.actor_is_operating_company_overseer(management_company_id));

COMMENT ON TABLE public.operating_spaces IS 'E1 shadow scope; not consumed by runtime authorization until approved cutover.';