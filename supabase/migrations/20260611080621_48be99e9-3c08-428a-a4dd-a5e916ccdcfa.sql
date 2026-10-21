CREATE TABLE public.contract_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'ru' CHECK (language IN ('ru','en')),
  contract_type TEXT NULL,
  preview JSONB NULL,
  full_report JSONB NULL,
  risk_score INTEGER NULL,
  status TEXT NOT NULL DEFAULT 'preview' CHECK (status IN ('preview','pending_payment','paid','failed')),
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_analyses_user ON public.contract_analyses(user_id, created_at DESC);
CREATE INDEX idx_contract_analyses_status ON public.contract_analyses(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_analyses TO authenticated;
GRANT ALL ON public.contract_analyses TO service_role;

ALTER TABLE public.contract_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own contract analyses"
  ON public.contract_analyses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_contract_analyses_updated
  BEFORE UPDATE ON public.contract_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();