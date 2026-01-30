-- Add agent_type column to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'conversational';

-- Add check constraint for valid types
ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_type_check 
CHECK (agent_type IN ('conversational', 'utility', 'analyzer'));

-- Update existing agents with their types
UPDATE public.ai_agents SET agent_type = 'analyzer' WHERE slug = 'listing-quality-analyzer';

-- Insert standalone utility agents (if not exists)
INSERT INTO public.ai_agents (slug, name_en, name_ru, agent_type, model, temperature, is_active, is_public, description_en, description_ru, icon, max_tokens)
VALUES 
  ('ai-translate', 'Translator', 'Переводчик', 'utility', 'google/gemini-2.5-flash', 0.3, true, false, 'Translates text between Russian, English, and Thai', 'Переводит текст между русским, английским и тайским языками', 'Languages', 500),
  ('ai-generate-description', 'Description Generator', 'Генератор описаний', 'utility', 'google/gemini-2.5-flash', 0.7, true, false, 'Generates compelling product, service, and property descriptions', 'Создаёт продающие описания товаров, услуг и недвижимости', 'FileText', 500),
  ('ai-smart-data', 'Smart Data Processor', 'Обработчик данных', 'utility', 'google/gemini-2.5-flash', 0.2, true, false, 'Parses and structures unstructured data from various sources', 'Парсит и структурирует данные из различных источников', 'Database', 2000),
  ('ai-personalize-home', 'Home Personalizer', 'Персонализация главной', 'utility', 'google/gemini-2.5-flash', 0.5, true, false, 'Personalizes homepage content based on user personas', 'Персонализирует контент главной страницы на основе профиля пользователя', 'Home', 300)
ON CONFLICT (slug) DO UPDATE SET
  agent_type = EXCLUDED.agent_type,
  name_en = EXCLUDED.name_en,
  name_ru = EXCLUDED.name_ru;