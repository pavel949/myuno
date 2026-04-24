-- Allow the property's owner, provider, or active MC director/admin to update inquiry status.
-- Guests can already update their own inquiries (existing policy). Admins already have ALL.
DROP POLICY IF EXISTS "Providers can update inquiries for their properties" ON public.property_inquiries;

CREATE POLICY "Providers can update inquiries for their properties"
ON public.property_inquiries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    LEFT JOIN public.providers pr ON pr.id = p.provider_id
    LEFT JOIN public.management_company_members mcm
      ON mcm.company_id = p.management_company_id
     AND mcm.user_id = auth.uid()
     AND mcm.is_active = true
     AND mcm.role = ANY (ARRAY['director'::text, 'admin'::text, 'manager'::text])
    WHERE p.id = property_inquiries.property_id
      AND (
        p.owner_id = auth.uid()
        OR pr.user_id = auth.uid()
        OR mcm.user_id IS NOT NULL
      )
  )
);
