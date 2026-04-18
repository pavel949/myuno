DROP POLICY IF EXISTS "Anon insert nb_leads" ON public.nb_leads;
CREATE POLICY "Public insert nb_leads (with contact)"
  ON public.nb_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    coalesce(nullif(trim(phone), ''), nullif(trim(email), ''), nullif(trim(whatsapp), '')) IS NOT NULL
  );
