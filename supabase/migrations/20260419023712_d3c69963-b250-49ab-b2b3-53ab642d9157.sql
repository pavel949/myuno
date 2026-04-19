
-- chat_message_flags missing columns
ALTER TABLE public.chat_message_flags 
  ADD COLUMN IF NOT EXISTS property_id uuid,
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS detected_pattern text,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS auto_detected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- moderation_queue missing columns
ALTER TABLE public.moderation_queue
  ADD COLUMN IF NOT EXISTS item_type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS photo_count integer,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS submitted_by_name text;

-- disputes missing columns
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS provider_id uuid,
  ADD COLUMN IF NOT EXISTS dispute_type text,
  ADD COLUMN IF NOT EXISTS evidence_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- developer_users missing columns
ALTER TABLE public.developer_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
