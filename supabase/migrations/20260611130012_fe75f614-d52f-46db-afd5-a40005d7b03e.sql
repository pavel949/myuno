
-- Storage RLS for transfer-attachments bucket
CREATE POLICY "Authenticated users can upload transfer attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'transfer-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own transfer attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'transfer-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins and operators can read all transfer attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'transfer-attachments'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.transfer_operators o WHERE o.user_id = auth.uid() AND o.is_active = true)
  )
);

CREATE POLICY "Service role full access transfer attachments"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'transfer-attachments')
WITH CHECK (bucket_id = 'transfer-attachments');

-- HMAC secret for operator confirm tokens (auto-generate one-time)
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'transfer_operator_confirm_secret',
  to_jsonb(encode(gen_random_bytes(32), 'hex')),
  'HMAC secret for signing operator confirmation links'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, description) VALUES
  ('feature_flag:transfer_promptpay', 'false'::jsonb, 'Enable Stripe PromptPay for transfers (requires Stripe Dashboard activation)'),
  ('transfer_operator_klod_wa', to_jsonb('66629655545'::text), 'Klod operator WhatsApp number'),
  ('transfer_admin_wa_secondary', to_jsonb('66922407355'::text), 'Secondary admin WhatsApp for transfer notifications')
ON CONFLICT (key) DO NOTHING;
