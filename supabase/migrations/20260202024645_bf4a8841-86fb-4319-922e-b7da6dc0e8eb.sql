-- =====================================================
-- UNO TEAM MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =====================================================

-- 1. Helper function to check if user is a team member
CREATE OR REPLACE FUNCTION public.is_team_member(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role IN ('uno_team', 'admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Team specialization type
DO $$ BEGIN
  CREATE TYPE team_specialization AS ENUM (
    'content_manager',
    'support_operator', 
    'sales_manager',
    'moderation_officer',
    'team_lead'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Team Members table - profiles with specializations
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specializations TEXT[] DEFAULT '{}',
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  shift_schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMPTZ DEFAULT now(),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Helper function to check specialization
CREATE OR REPLACE FUNCTION public.has_specialization(check_user_id UUID, spec TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = check_user_id 
    AND spec = ANY(specializations)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Team Activity Log - for KPI tracking
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  points_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Team Gamification - points and levels
CREATE TABLE IF NOT EXISTS public.team_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges TEXT[] DEFAULT '{}',
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Team Achievements definitions
CREATE TABLE IF NOT EXISTS public.team_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  icon TEXT DEFAULT 'trophy',
  category TEXT DEFAULT 'general',
  points_required INTEGER DEFAULT 0,
  unlock_condition JSONB,
  is_secret BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Team User Achievements - unlocked achievements
CREATE TABLE IF NOT EXISTS public.team_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.team_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 9. Team Chat Messages
CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.team_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  reactions JSONB DEFAULT '{}',
  mentioned_users UUID[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Team Entity Notes - notes attached to any object
CREATE TABLE IF NOT EXISTS public.team_entity_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Team Channels - chat channel definitions
CREATE TABLE IF NOT EXISTS public.team_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'hash',
  allowed_specializations TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false,
  is_announcements_only BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_specializations ON public.team_members USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_user_id ON public.team_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_created_at ON public.team_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_action_type ON public.team_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_team_gamification_user_id ON public.team_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_team_gamification_points ON public.team_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_channel ON public.team_messages(channel);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON public.team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON public.team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_entity_notes_entity ON public.team_entity_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_team_entity_notes_user ON public.team_entity_notes(user_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_entity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;

-- Team Members policies
CREATE POLICY "Team members can view all team members"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Team members can update own profile"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Activity Log policies
CREATE POLICY "Team members can view own activity"
  ON public.team_activity_log FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Team members can insert own activity"
  ON public.team_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid()));

-- Gamification policies
CREATE POLICY "Anyone can view gamification leaderboard"
  ON public.team_gamification FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "System can update gamification"
  ON public.team_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert gamification"
  ON public.team_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements"
  ON public.team_achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.team_achievements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- User Achievements policies
CREATE POLICY "Team can view all user achievements"
  ON public.team_user_achievements FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "System can insert user achievements"
  ON public.team_user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Team members can view messages"
  ON public.team_messages FOR SELECT
  USING (public.is_team_member(auth.uid()) AND is_deleted = false);

CREATE POLICY "Team members can send messages"
  ON public.team_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_team_member(auth.uid()));

CREATE POLICY "Users can update own messages"
  ON public.team_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Entity Notes policies
CREATE POLICY "Team members can view notes"
  ON public.team_entity_notes FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Team members can create notes"
  ON public.team_entity_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(auth.uid()));

CREATE POLICY "Users can update own notes"
  ON public.team_entity_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.team_entity_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Channels policies
CREATE POLICY "Team members can view channels"
  ON public.team_channels FOR SELECT
  USING (public.is_team_member(auth.uid()));

CREATE POLICY "Admins can manage channels"
  ON public.team_channels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_gamification_updated_at
  BEFORE UPDATE ON public.team_gamification
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_messages_updated_at
  BEFORE UPDATE ON public.team_messages
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_entity_notes_updated_at
  BEFORE UPDATE ON public.team_entity_notes
  FOR EACH ROW EXECUTE FUNCTION update_team_updated_at();

-- =====================================================
-- FUNCTION: Add points and check achievements
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_team_points(
  p_user_id UUID,
  p_action_type TEXT,
  p_points INTEGER,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_current_level INTEGER;
BEGIN
  -- Log activity
  INSERT INTO public.team_activity_log (user_id, action_type, entity_type, entity_id, points_earned, metadata)
  VALUES (p_user_id, p_action_type, p_entity_type, p_entity_id, p_points, p_metadata);

  -- Update or insert gamification record
  INSERT INTO public.team_gamification (user_id, total_points, weekly_points, monthly_points, last_activity_date)
  VALUES (p_user_id, p_points, p_points, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = team_gamification.total_points + p_points,
    weekly_points = team_gamification.weekly_points + p_points,
    monthly_points = team_gamification.monthly_points + p_points,
    last_activity_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN team_gamification.last_activity_date = CURRENT_DATE - 1 THEN team_gamification.streak_days + 1
      WHEN team_gamification.last_activity_date = CURRENT_DATE THEN team_gamification.streak_days
      ELSE 1
    END
  RETURNING total_points, level INTO v_new_total, v_current_level;

  -- Calculate new level
  v_new_level := CASE
    WHEN v_new_total >= 10000 THEN 5
    WHEN v_new_total >= 5000 THEN 4
    WHEN v_new_total >= 2000 THEN 3
    WHEN v_new_total >= 500 THEN 2
    ELSE 1
  END;

  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.team_gamification 
    SET level = v_new_level 
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- INITIAL DATA: Default achievements
-- =====================================================

INSERT INTO public.team_achievements (key, name_en, name_ru, description_en, description_ru, icon, category, points_required, sort_order) VALUES
  ('first_contact', 'First Contact', 'Первый контакт', 'Process your first lead', 'Обработайте первый лид', 'user-plus', 'sales', 0, 1),
  ('speed_demon', 'Speed Demon', 'Скорострел', 'Close 10 tickets in one day', 'Закройте 10 тикетов за день', 'zap', 'support', 0, 2),
  ('golden_hands', 'Golden Hands', 'Золотые руки', 'Add 100 listings', 'Добавьте 100 листингов', 'crown', 'content', 0, 3),
  ('converter', 'Converter', 'Конвертор', '50 successful conversions', '50 успешных конверсий', 'target', 'sales', 0, 4),
  ('marathon', 'Marathon Runner', 'Марафонец', '30-day streak', '30-дневная серия', 'flame', 'bonus', 0, 5),
  ('rising_star', 'Rising Star', 'Восходящая звезда', 'Reach Level 2', 'Достигните уровня 2', 'star', 'level', 500, 6),
  ('pro', 'Professional', 'Профессионал', 'Reach Level 3', 'Достигните уровня 3', 'award', 'level', 2000, 7),
  ('expert', 'Expert', 'Эксперт', 'Reach Level 4', 'Достигните уровня 4', 'medal', 'level', 5000, 8),
  ('legend', 'Legend', 'Легенда', 'Reach Level 5', 'Достигните уровня 5', 'trophy', 'level', 10000, 9),
  ('team_player', 'Team Player', 'Командный игрок', 'Send 100 messages', 'Отправьте 100 сообщений', 'users', 'chat', 0, 10),
  ('helper', 'Helper', 'Помощник', 'Add 50 notes', 'Добавьте 50 заметок', 'file-text', 'notes', 0, 11),
  ('early_bird', 'Early Bird', 'Ранняя пташка', 'Complete 5 tasks before 9 AM', 'Выполните 5 задач до 9 утра', 'sunrise', 'bonus', 0, 12)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INITIAL DATA: Default channels
-- =====================================================

INSERT INTO public.team_channels (slug, name_en, name_ru, description, icon, is_announcements_only) VALUES
  ('general', 'General', 'Общий', 'General team discussion', 'hash', false),
  ('support', 'Support', 'Поддержка', 'Support team channel', 'headphones', false),
  ('sales', 'Sales', 'Продажи', 'Sales team channel', 'trending-up', false),
  ('content', 'Content', 'Контент', 'Content team channel', 'edit-3', false),
  ('announcements', 'Announcements', 'Объявления', 'Important announcements', 'megaphone', true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ENABLE REALTIME for chat
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;