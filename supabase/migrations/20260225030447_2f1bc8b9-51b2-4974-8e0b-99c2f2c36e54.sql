
-- Add date_of_birth to staff_members for birthday tracking
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create personal_reminders table for visa, insurance, rent, etc.
CREATE TABLE public.personal_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reminder_type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  remind_days_before integer NOT NULL DEFAULT 14,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_interval text, -- 'monthly', 'quarterly', 'yearly'
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.personal_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON public.personal_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.personal_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.personal_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_reminders_updated_at
  BEFORE UPDATE ON public.personal_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient queries
CREATE INDEX idx_personal_reminders_user_due ON public.personal_reminders (user_id, due_date) WHERE status = 'active';
