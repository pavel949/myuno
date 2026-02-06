
CREATE TABLE IF NOT EXISTS public.event_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  timezone text DEFAULT 'Asia/Bangkok',
  notes text,
  source_urls text[] DEFAULT '{}',
  is_cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_starts_at ON event_occurrences(starts_at);

ALTER TABLE public.event_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read event occurrences"
ON public.event_occurrences FOR SELECT USING (true);

CREATE POLICY "Admin can manage event occurrences"
ON public.event_occurrences FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team'))
);
