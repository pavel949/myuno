
-- Create lifecycle_templates table
CREATE TABLE public.lifecycle_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  title_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_ru TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  promo_code TEXT,
  discount_percent INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lifecycle_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can manage lifecycle_templates"
  ON public.lifecycle_templates
  FOR ALL
  USING (public.is_admin_or_uno_team());

-- Trigger for updated_at
CREATE TRIGGER update_lifecycle_templates_updated_at
  BEFORE UPDATE ON public.lifecycle_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Seed default templates
INSERT INTO public.lifecycle_templates (trigger_type, channel, title_ru, title_en, body_ru, body_en, promo_code, discount_percent) VALUES
  ('welcome', 'email', 'Добро пожаловать в UNO!', 'Welcome to UNO!', 'Мы рады видеть вас! Откройте для себя лучшие услуги на Пхукете.', 'We are glad to see you! Discover the best services in Phuket.', NULL, NULL),
  ('welcome', 'push', 'Добро пожаловать! 🎉', 'Welcome! 🎉', 'Исследуйте услуги и получите скидку на первый заказ.', 'Explore services and get a discount on your first order.', NULL, NULL),
  ('at_risk_reactivation', 'email', 'Мы скучаем по вам!', 'We miss you!', 'Давно вас не видели. Специальное предложение ждёт вас!', 'Long time no see. A special offer awaits you!', 'COMEBACK10', 10),
  ('at_risk_reactivation', 'push', 'Вернитесь к нам! 💙', 'Come back! 💙', 'У нас для вас персональная скидка 10%.', 'We have a personal 10% discount for you.', 'COMEBACK10', 10),
  ('dormant_winback', 'email', 'Новые услуги ждут вас', 'New services await you', 'За время вашего отсутствия у нас появилось много нового. Посмотрите!', 'A lot has changed since your last visit. Check it out!', 'WINBACK15', 15),
  ('vip_reward', 'email', 'Спасибо за лояльность! 🌟', 'Thank you for your loyalty! 🌟', 'Вы наш VIP-клиент. Эксклюзивное предложение внутри.', 'You are our VIP client. Exclusive offer inside.', 'VIP20', 20),
  ('post_order_review', 'push', 'Как всё прошло? ⭐', 'How was it? ⭐', 'Оцените ваш последний заказ и помогите другим.', 'Rate your last order and help others.', NULL, NULL),
  ('cross_sell', 'push', 'Вам может понравиться 🎁', 'You might like 🎁', 'На основе вашего заказа мы подобрали рекомендации.', 'Based on your order, we have recommendations for you.', NULL, NULL);
