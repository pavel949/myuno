
-- Create portal_messages table
CREATE TABLE public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'owner',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_messages_property ON public.portal_messages(property_id, created_at DESC);
CREATE INDEX idx_portal_messages_sender ON public.portal_messages(sender_id);

ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies using existing is_mc_member_for_property function
CREATE POLICY "Owner reads own portal messages"
  ON public.portal_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
    OR public.is_mc_member_for_property(auth.uid(), portal_messages.property_id)
  );

CREATE POLICY "Owner sends portal messages"
  ON public.portal_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "MC sends portal messages"
  ON public.portal_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'mc'
    AND public.is_mc_member_for_property(auth.uid(), portal_messages.property_id)
  );

CREATE POLICY "MC updates read status"
  ON public.portal_messages FOR UPDATE
  USING (public.is_mc_member_for_property(auth.uid(), portal_messages.property_id))
  WITH CHECK (public.is_mc_member_for_property(auth.uid(), portal_messages.property_id));

CREATE POLICY "Owner updates read status"
  ON public.portal_messages FOR UPDATE
  USING (
    sender_role = 'mc'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    sender_role = 'mc'
    AND EXISTS (
      SELECT 1 FROM public.owner_portal_settings ops
      WHERE ops.property_id = portal_messages.property_id
        AND ops.owner_user_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;
