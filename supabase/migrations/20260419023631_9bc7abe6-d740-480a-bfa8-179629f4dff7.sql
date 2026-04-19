
-- Restore chat_message_flags
CREATE TABLE IF NOT EXISTS public.chat_message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid,
  user_id uuid,
  flag_type text,
  warning_level integer DEFAULT 0,
  is_restricted boolean DEFAULT false,
  reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_message_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage chat flags" ON public.chat_message_flags
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restore chat_violation_history
CREATE TABLE IF NOT EXISTS public.chat_violation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  violation_type text,
  warning_level integer DEFAULT 0,
  is_restricted boolean DEFAULT false,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_violation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage violations" ON public.chat_violation_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restore moderation_queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  flagged_reason text,
  payload jsonb DEFAULT '{}'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage moderation queue" ON public.moderation_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restore disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid,
  order_id uuid,
  raised_by uuid,
  against_user_id uuid,
  status text NOT NULL DEFAULT 'open',
  category text,
  description text,
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage disputes" ON public.disputes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users see own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = raised_by OR auth.uid() = against_user_id);

-- Restore inventory_inspections
CREATE TABLE IF NOT EXISTS public.inventory_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  inspection_type text,
  inspector_id uuid,
  items jsonb DEFAULT '[]'::jsonb,
  notes text,
  photos text[],
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inspections" ON public.inventory_inspections
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restore developer_impersonation_log
CREATE TABLE IF NOT EXISTS public.developer_impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  developer_id uuid NOT NULL,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
ALTER TABLE public.developer_impersonation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage impersonation log" ON public.developer_impersonation_log
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restore developer_users
CREATE TABLE IF NOT EXISTS public.developer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL,
  user_id uuid,
  email text,
  role text DEFAULT 'member',
  status text DEFAULT 'invited',
  invite_token text,
  invite_expires_at timestamptz,
  invited_by uuid,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage developer users" ON public.developer_users
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users see own developer link" ON public.developer_users
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users accept own invite" ON public.developer_users
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Restore juristic_documents
CREATE TABLE IF NOT EXISTS public.juristic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid,
  document_type text,
  title text,
  file_url text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.juristic_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage juristic docs" ON public.juristic_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
