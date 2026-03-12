-- Contact to Property many-to-many
-- Enables investors/owners with multiple properties to be properly linked
CREATE TABLE public.contact_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
    'owner', 'tenant', 'interested', 'previous_owner', 'investor'
  )),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, property_id, relationship_type)
);

CREATE INDEX idx_contact_properties_contact ON public.contact_properties(contact_id);
CREATE INDEX idx_contact_properties_property ON public.contact_properties(property_id);
CREATE INDEX idx_contact_properties_company ON public.contact_properties(company_id);

ALTER TABLE public.contact_properties ENABLE ROW LEVEL SECURITY;

-- RLS: same pattern as other CRM tables (mc_can_access)
CREATE POLICY "contact_properties_select" ON public.contact_properties
  FOR SELECT TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'view'));

CREATE POLICY "contact_properties_insert" ON public.contact_properties
  FOR INSERT TO authenticated
  WITH CHECK (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_properties_update" ON public.contact_properties
  FOR UPDATE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));

CREATE POLICY "contact_properties_delete" ON public.contact_properties
  FOR DELETE TO authenticated
  USING (mc_can_access(auth.uid(), company_id, 'crm', 'edit'));
