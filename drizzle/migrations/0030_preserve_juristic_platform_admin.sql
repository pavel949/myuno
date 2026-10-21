-- Protected admin oversight must survive removal of unscoped employment permission rows.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='juristic_contacts' AND policyname='Admins can manage juristic contacts' AND qual='false') THEN RAISE EXCEPTION 'E2.8 juristic policy drift'; END IF;
END $$;
ALTER POLICY "Admins can manage juristic contacts" ON public.juristic_contacts TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
