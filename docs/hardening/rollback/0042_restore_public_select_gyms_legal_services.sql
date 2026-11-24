-- Rollback for 0042. WARNING: this REINTRODUCES the exposure of unapproved and
-- inactive gyms and legal services to anonymous readers. Use it only as an emergency
-- restore of public visibility while records are being approved.

CREATE POLICY "Gyms are viewable by everyone" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Legal services are viewable by everyone" ON public.legal_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can view all legal_services" ON public.legal_services;
