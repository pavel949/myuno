
-- Add stage/offset fields to lifecycle_templates
ALTER TABLE public.lifecycle_templates
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'check_in',
  ADD COLUMN IF NOT EXISTS offset_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS cta_label_en text,
  ADD COLUMN IF NOT EXISTS cta_label_ru text;

-- Create lifecycle_executions table to track what was sent
CREATE TABLE IF NOT EXISTS public.lifecycle_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.property_bookings(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.lifecycle_templates(id) ON DELETE CASCADE,
  guest_user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, template_id, channel)
);

-- Index for processor queries
CREATE INDEX IF NOT EXISTS idx_lifecycle_exec_pending ON public.lifecycle_executions(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lifecycle_exec_booking ON public.lifecycle_executions(booking_id);

-- RLS
ALTER TABLE public.lifecycle_executions ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins manage lifecycle_executions" ON public.lifecycle_executions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Guests can read their own notifications
CREATE POLICY "Guests read own lifecycle_executions" ON public.lifecycle_executions
  FOR SELECT TO authenticated
  USING (guest_user_id = auth.uid());

-- Enable realtime for in-app notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.lifecycle_executions;

-- Seed default 5-stage templates
INSERT INTO public.lifecycle_templates (trigger_type, stage, offset_hours, sort_order, channel, title_en, title_ru, body_en, body_ru, cta_url, cta_label_en, cta_label_ru, is_active) VALUES
('pre_arrival', 'pre_arrival', -24, 1, 'email', 'Your stay is tomorrow! 🏠', 'Ваше проживание уже завтра! 🏠', 'We''re excited to welcome you! Here''s everything you need for a smooth check-in.', 'Мы рады вас приветствовать! Вот всё, что нужно для удобного заезда.', '/welcome/{bookingId}', 'View check-in guide', 'Инструкция по заезду', true),
('check_in', 'check_in', 0, 2, 'in_app', 'Welcome to your new home! 🎉', 'Добро пожаловать в ваш новый дом! 🎉', 'Explore local services, restaurants, and experiences curated just for you.', 'Откройте для себя местные сервисы, рестораны и впечатления, подобранные специально для вас.', '/welcome/{bookingId}', 'Explore services', 'Посмотреть сервисы', true),
('mid_stay', 'mid_stay', 72, 3, 'in_app', 'How''s your stay going? ☀️', 'Как проходит ваш отдых? ☀️', 'Need a yacht trip, spa day, or restaurant recommendation? We''ve got you covered.', 'Хотите яхт-прогулку, спа или рекомендацию ресторана? Мы поможем.', '/discover', 'Browse experiences', 'Посмотреть впечатления', true),
('pre_checkout', 'pre_checkout', -24, 4, 'email', 'Checkout tomorrow — anything else you need?', 'Завтра выезд — нужно что-то ещё?', 'Don''t forget to check out by the time specified. Need a transfer to the airport?', 'Не забудьте выехать в указанное время. Нужен трансфер в аэропорт?', '/airport', 'Book transfer', 'Заказать трансфер', true),
('post_stay', 'post_stay', 24, 5, 'email', 'Thank you for staying with us! ⭐', 'Спасибо, что были с нами! ⭐', 'We hope you had an amazing time. Share your experience and earn loyalty points!', 'Надеемся, вам понравилось! Оставьте отзыв и получите баллы лояльности.', '/guest/profile', 'Leave a review', 'Оставить отзыв', true)
ON CONFLICT DO NOTHING;
