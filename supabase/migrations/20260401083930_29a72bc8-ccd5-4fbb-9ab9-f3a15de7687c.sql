-- visa_records table for VisaTrack MVP
CREATE TABLE public.visa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  visa_type text NOT NULL,
  entry_date date,
  expiry_date date NOT NULL,
  status text DEFAULT 'active',
  document_url text,
  notes text,
  reminder_sent_30d boolean DEFAULT false,
  reminder_sent_14d boolean DEFAULT false,
  reminder_sent_7d boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_visa_record_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'expired', 'renewal_pending') THEN
    RAISE EXCEPTION 'Invalid visa record status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_visa_status
  BEFORE INSERT OR UPDATE ON public.visa_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_visa_record_status();

ALTER TABLE public.visa_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own visa records" ON public.visa_records
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for visa documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('visa-documents', 'visa-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can manage their own visa documents
CREATE POLICY "Users upload own visa docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own visa docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own visa docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'visa-documents' AND (storage.foldername(name))[1] = auth.uid()::text);