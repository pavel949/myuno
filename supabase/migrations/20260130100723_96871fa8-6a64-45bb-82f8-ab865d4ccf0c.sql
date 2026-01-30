-- ==========================================
-- CHAT DELEGATION & MODERATION SYSTEM (Fixed)
-- ==========================================

-- 1. Add chat_delegated_to_platform field to owner_properties
ALTER TABLE owner_properties 
ADD COLUMN IF NOT EXISTS chat_delegated_to_platform boolean DEFAULT false;

-- 2. Create chat moderation table for flagged messages and violations
CREATE TABLE IF NOT EXISTS public.chat_message_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.property_chat_messages(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.property_bookings(id) ON DELETE SET NULL,
  
  -- Flag details
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'contact_sharing',      -- phone, email, telegram, whatsapp
    'off_platform_payment', -- mentions of cash, direct transfer
    'offensive_language',   -- insults, profanity
    'spam',                 -- repetitive/promotional content
    'suspicious_link',      -- external URLs
    'policy_violation',     -- general policy violation
    'manual_flag'           -- flagged by staff
  )),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Detection details
  detected_pattern TEXT,           -- what triggered the flag
  confidence_score DECIMAL(3,2),   -- 0.00-1.00 confidence
  auto_detected BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,               -- e.g., 'warning_shown', 'message_hidden', 'user_warned'
  
  -- User warning tracking
  warning_shown_to_sender BOOLEAN DEFAULT false,
  warning_acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user violation history table
CREATE TABLE IF NOT EXISTS public.chat_violation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_count INTEGER NOT NULL DEFAULT 1,
  last_violation_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  warning_level INTEGER NOT NULL DEFAULT 1 CHECK (warning_level BETWEEN 1 AND 5),
  -- Level 1: First warning, Level 5: Account restriction
  is_restricted BOOLEAN DEFAULT false,
  restricted_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add hidden flag to messages for moderation
ALTER TABLE property_chat_messages 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_metadata JSONB;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_flags_message_id ON chat_message_flags(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_flags_property_id ON chat_message_flags(property_id);
CREATE INDEX IF NOT EXISTS idx_chat_flags_status ON chat_message_flags(status);
CREATE INDEX IF NOT EXISTS idx_chat_flags_created_at ON chat_message_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_history_user ON chat_violation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_hidden ON property_chat_messages(is_hidden) WHERE is_hidden = true;

-- 6. Enable RLS
ALTER TABLE public.chat_message_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_violation_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for chat_message_flags
-- Property owners can view flags for their properties
CREATE POLICY "Owners can view flags for their properties"
ON public.chat_message_flags
FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT id FROM owner_properties WHERE owner_id = auth.uid()
  )
);

-- Platform staff can manage all flags (using correct roles: admin, uno_team, support, staff)
CREATE POLICY "Staff can manage all flags"
ON public.chat_message_flags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
);

-- 8. RLS Policies for chat_violation_history
-- Users can view their own violations
CREATE POLICY "Users can view own violations"
ON public.chat_violation_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can manage all violations
CREATE POLICY "Staff can manage violations"
ON public.chat_violation_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'uno_team', 'support', 'staff')
  )
);

-- 9. Comments
COMMENT ON TABLE chat_message_flags IS 'Tracks flagged chat messages for policy violations (contact sharing, off-platform payments, etc.)';
COMMENT ON TABLE chat_violation_history IS 'Tracks user violation history and warning levels';

-- 10. Enable realtime for moderation updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_flags;