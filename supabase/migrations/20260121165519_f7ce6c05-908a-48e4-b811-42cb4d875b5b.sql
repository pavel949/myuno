-- Create wellness content table
CREATE TABLE public.wellness_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('meditation', 'breathing', 'soundscape', 'article', 'program', 'workout')),
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  duration_seconds INTEGER,
  audio_url TEXT,
  image_url TEXT,
  category TEXT, -- sleep, focus, relax, morning, energy
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wellness logs table
CREATE TABLE public.user_wellness_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('mood', 'breathing', 'meditation', 'gratitude', 'goal', 'checkin')),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  content_id UUID REFERENCES public.wellness_content(id),
  duration_seconds INTEGER,
  notes TEXT,
  gratitude_items TEXT[],
  metadata JSONB DEFAULT '{}',
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wellness streaks table
CREATE TABLE public.user_wellness_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_meditation_minutes INTEGER DEFAULT 0,
  total_breathing_sessions INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wellness_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wellness_streaks ENABLE ROW LEVEL SECURITY;

-- Wellness content is publicly readable
CREATE POLICY "Wellness content is publicly readable" 
ON public.wellness_content 
FOR SELECT 
USING (is_active = true);

-- Users can view their own wellness logs
CREATE POLICY "Users can view their own wellness logs" 
ON public.user_wellness_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own wellness logs
CREATE POLICY "Users can create their own wellness logs" 
ON public.user_wellness_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own streaks
CREATE POLICY "Users can view their own streaks" 
ON public.user_wellness_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can manage their own streaks
CREATE POLICY "Users can manage their own streaks" 
ON public.user_wellness_streaks 
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_wellness_content_type ON public.wellness_content(type);
CREATE INDEX idx_wellness_content_category ON public.wellness_content(category);
CREATE INDEX idx_user_wellness_logs_user_date ON public.user_wellness_logs(user_id, logged_at);
CREATE INDEX idx_user_wellness_logs_type ON public.user_wellness_logs(log_type);

-- Insert initial content: Breathing exercises
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, duration_seconds, category, metadata) VALUES
('breathing', '4-7-8 Relaxation', '4-7-8 Расслабление', 'Classic breathing technique for deep relaxation and better sleep', 'Классическая техника дыхания для глубокого расслабления и сна', 180, 'relax', '{"inhale": 4, "hold": 7, "exhale": 8, "cycles": 4}'),
('breathing', 'Box Breathing', 'Квадратное дыхание', 'Used by Navy SEALs to stay calm under pressure', 'Используется спецназом для сохранения спокойствия', 240, 'focus', '{"inhale": 4, "hold": 4, "exhale": 4, "holdEmpty": 4, "cycles": 6}'),
('breathing', 'Energizing Breath', 'Энергетическое дыхание', 'Quick breathing exercise to boost energy and alertness', 'Быстрое упражнение для прилива энергии', 120, 'energy', '{"inhale": 2, "exhale": 2, "cycles": 20}'),
('breathing', 'Ocean Breath', 'Дыхание океана', 'Calming breath synchronized with the rhythm of waves', 'Успокаивающее дыхание в ритме волн', 300, 'relax', '{"inhale": 5, "hold": 2, "exhale": 6, "cycles": 8}'),
('breathing', 'Morning Awakening', 'Утреннее пробуждение', 'Start your day with clarity and positive energy', 'Начните день с ясности и позитивной энергии', 180, 'morning', '{"inhale": 4, "hold": 4, "exhale": 4, "cycles": 8}');

-- Insert initial content: Soundscapes
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, duration_seconds, category, image_url, is_featured, metadata) VALUES
('soundscape', 'Phuket Ocean Waves', 'Волны Пхукета', 'Gentle waves from Kata Beach at sunset', 'Нежные волны пляжа Ката на закате', 1800, 'relax', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', true, '{"location": "Kata Beach", "ambientType": "ocean"}'),
('soundscape', 'Tropical Rain', 'Тропический дождь', 'Monsoon rain in the jungle of Phuket', 'Муссонный дождь в джунглях Пхукета', 1800, 'sleep', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800', true, '{"location": "Khao Phra Thaeo", "ambientType": "rain"}'),
('soundscape', 'Jungle Morning', 'Утро в джунглях', 'Birds and nature sounds from Phuket jungle', 'Птицы и звуки природы джунглей Пхукета', 1800, 'morning', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', true, '{"location": "Sirinat National Park", "ambientType": "forest"}'),
('soundscape', 'Temple Bells', 'Храмовые колокола', 'Peaceful sounds from Buddhist temples', 'Умиротворяющие звуки буддийских храмов', 1200, 'focus', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', false, '{"location": "Wat Chalong", "ambientType": "temple"}');

-- Insert initial content: Wellness tips/articles
INSERT INTO public.wellness_content (type, title_en, title_ru, description_en, description_ru, category, is_featured, metadata) VALUES
('article', 'Reset Your Sleep in Paradise', 'Перезагрузите сон в раю', 'How to use vacation time to fix your sleep schedule', 'Как использовать отпуск для восстановления режима сна', 'sleep', true, '{"readingTime": 5}'),
('article', 'Digital Detox Guide', 'Гид по цифровому детоксу', '7 steps to disconnect and reconnect with yourself', '7 шагов к отключению и воссоединению с собой', 'focus', true, '{"readingTime": 7}'),
('article', 'Morning Rituals for Travelers', 'Утренние ритуалы путешественника', 'Simple practices to start each vacation day right', 'Простые практики для идеального начала дня в отпуске', 'morning', false, '{"readingTime": 4}');

-- Add update trigger
CREATE TRIGGER update_wellness_content_updated_at
BEFORE UPDATE ON public.wellness_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wellness_streaks_updated_at
BEFORE UPDATE ON public.user_wellness_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();