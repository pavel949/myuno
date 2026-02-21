
-- Activity log for management terms changes
CREATE TABLE public.management_terms_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terms_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'archived'
  field_name TEXT, -- which field changed
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.management_terms_activity ENABLE ROW LEVEL SECURITY;

-- Users can view activity for terms they manage
CREATE POLICY "Users can view own terms activity"
ON public.management_terms_activity FOR SELECT
USING (user_id = auth.uid());

-- Users can insert activity for their own actions
CREATE POLICY "Users can insert own activity"
ON public.management_terms_activity FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_terms_activity_terms_id ON public.management_terms_activity(terms_id);
CREATE INDEX idx_terms_activity_created ON public.management_terms_activity(created_at DESC);
