
CREATE TABLE public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('review', 'photo', 'listing', 'comment')),
  title text NOT NULL,
  content text,
  rating smallint,
  photo_count int,
  category text,
  entity_id uuid,
  entity_type text,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view moderation queue"
  ON public.moderation_queue FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Team can update moderation queue"
  ON public.moderation_queue FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team')
    )
  );

CREATE POLICY "Users can submit for moderation"
  ON public.moderation_queue FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can view own submissions"
  ON public.moderation_queue FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());
