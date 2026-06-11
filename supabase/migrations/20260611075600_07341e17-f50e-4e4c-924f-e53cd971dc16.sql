
CREATE POLICY "Users upload their vault files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deposit-vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read their vault files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'deposit-vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete their vault files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'deposit-vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Service role manages vault files"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'deposit-vault') WITH CHECK (bucket_id = 'deposit-vault');
