-- Register leads-factory agent
INSERT INTO ai_agents (
  slug, name_en, name_ru, agent_type, model,
  temperature, max_tokens, icon, description_en, description_ru,
  target_audience, is_active, is_public
) VALUES (
  'leads-factory',
  'Leads Factory',
  'Фабрика лидов',
  'utility',
  'google/gemini-3-flash-preview',
  0.4,
  2000,
  'factory',
  'AI-powered lead scoring, follow-up generation and smart assignment for consultation requests',
  'AI-скоринг лидов, генерация follow-up сообщений и умное назначение менеджеров для заявок',
  ARRAY['admin', 'manager'],
  true,
  false
);

-- Add AI analysis columns to consultation_requests
ALTER TABLE consultation_requests 
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_priority TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT;

-- Create index for efficient filtering by AI score
CREATE INDEX IF NOT EXISTS idx_consultation_requests_ai_score 
  ON consultation_requests (ai_score DESC NULLS LAST);

-- Create index for AI priority filtering
CREATE INDEX IF NOT EXISTS idx_consultation_requests_ai_priority 
  ON consultation_requests (ai_priority);

-- Insert knowledge base for leads-factory agent
INSERT INTO ai_agent_knowledge (
  agent_id,
  system_prompt,
  knowledge_base,
  version,
  is_published
)
SELECT 
  id,
  E'You are the Leads Factory AI agent for UNO Properties platform. Your role is to analyze consultation requests (leads) and provide:\n\n1. **Lead Scoring (0-100)**: Calculate a "hotness" score based on:\n   - Budget (25%): Higher budget = more points\n   - Urgency (20%): Near dates = higher priority\n   - Request type (15%): vacation_rental is hottest, then property_tour, then investment\n   - Data completeness (15%): Email + Phone + Districts = bonus points\n   - SLA status (10%): Overdue leads get priority boost\n\n2. **Priority Classification**: hot (70-100), warm (40-69), cold (0-39)\n\n3. **Follow-up Message Generation**: Create personalized messages in the lead''s preferred language\n   - WhatsApp: Short, friendly, with emojis\n   - Email: Professional, detailed\n\n4. **Action Recommendations**: Suggest next steps based on lead type and urgency\n\nALWAYS respond in valid JSON format.\n\n{{KNOWLEDGE_BASE}}',
  E'## Lead Type Weights\n\n| Type | Base Multiplier | Urgency Factor |\n|------|-----------------|----------------|\n| vacation_rental | 1.3x | Dates within 7 days = +25 |\n| property_tour | 1.2x | Dates within 3 days = +20 |\n| property_consultation | 1.0x | Standard |\n| investment_advice | 1.1x | Budget > 10M = +15 |\n| full_management | 1.0x | Has property = +10 |\n| channel_management | 0.9x | Standard |\n\n## Budget Scoring (THB)\n\n- > 100,000/night or > 50M purchase: +25\n- > 50,000/night or > 20M purchase: +20\n- > 20,000/night or > 10M purchase: +15\n- > 10,000/night or > 5M purchase: +10\n- Below: +5\n\n## Data Completeness Bonus\n\n- Has email: +5\n- Has phone: +5\n- Has districts specified: +5\n- Has property types: +3\n- Has dates/timeline: +5\n- Has guest count: +2\n\n## SLA Modifiers\n\n- Overdue by > 24h: +15 (urgent)\n- Overdue by < 24h: +10\n- Within SLA: 0\n- New (< 1h): +5 (fresh lead bonus)\n\n## Message Templates\n\n### WhatsApp (RU)\nЗдравствуйте, {name}! 🌴 Спасибо за заявку на {type}. {personalized_hook} Удобно созвониться сегодня?\n\n### WhatsApp (EN)\nHello {name}! 🌴 Thanks for your {type} request. {personalized_hook} Would you be available for a call today?\n\n### Email Subject (RU)\nUNO Properties: Ваша заявка на {type} получена\n\n### Email Subject (EN)\nUNO Properties: Your {type} Request Received',
  1,
  true
FROM ai_agents WHERE slug = 'leads-factory';