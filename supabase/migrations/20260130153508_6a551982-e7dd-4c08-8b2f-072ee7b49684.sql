-- ============================================
-- VENDOR ACQUISITION AGENT
-- AI-powered vendor prospecting and outreach
-- ============================================

-- Register the agent
INSERT INTO ai_agents (
  slug, 
  name_en, 
  name_ru, 
  agent_type, 
  model,
  temperature, 
  max_tokens,
  icon, 
  description_en, 
  description_ru,
  target_audience, 
  tone,
  is_active,
  is_public
) VALUES (
  'vendor-acquisition',
  'Vendor Acquisition',
  'Привлечение вендоров',
  'utility',
  'google/gemini-3-flash-preview',
  0.6,
  3000,
  'UserPlus',
  'AI-powered vendor prospecting: analyze sources, score potential, generate personalized outreach',
  'AI-привлечение вендоров: анализ источников, скоринг потенциала, персонализированный outreach',
  ARRAY['admin', 'manager'],
  'professional',
  true,
  false
);

-- Create vendor prospects table
CREATE TABLE IF NOT EXISTS vendor_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  source_type TEXT NOT NULL CHECK (source_type IN ('instagram', 'facebook', 'google_maps', 'manual', 'inbound', 'referral')),
  source_url TEXT,
  source_data JSONB DEFAULT '{}',
  
  -- Business info
  business_name TEXT NOT NULL,
  business_name_ru TEXT,
  business_type TEXT, -- restaurant, salon, clinic, tour, etc.
  category TEXT,
  
  -- Contact info
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  website TEXT,
  
  -- Location
  address TEXT,
  district TEXT,
  city TEXT DEFAULT 'Phuket',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Social metrics (from scraping)
  followers_count INTEGER,
  posts_count INTEGER,
  engagement_rate NUMERIC(5,2),
  last_post_at TIMESTAMPTZ,
  
  -- AI analysis
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_priority TEXT CHECK (ai_priority IN ('hot', 'warm', 'cold', 'not_fit')),
  ai_reasoning TEXT,
  ai_recommended_plan TEXT, -- basic, plus, pro
  ai_talking_points TEXT[],
  ai_analyzed_at TIMESTAMPTZ,
  
  -- Pipeline status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'researching', 'contacted', 'replied', 'meeting', 'negotiating', 'won', 'lost', 'not_interested')),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Outreach tracking
  outreach_channel TEXT, -- whatsapp, email, instagram_dm, phone
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  next_followup_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  -- Conversion
  converted_provider_id UUID REFERENCES providers(id),
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_prospects ENABLE ROW LEVEL SECURITY;

-- RLS policies for admins
CREATE POLICY "Admins can manage vendor prospects"
ON vendor_prospects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for assigned managers
CREATE POLICY "Assigned managers can view their prospects"
ON vendor_prospects
FOR SELECT
USING (assigned_to = auth.uid());

CREATE POLICY "Assigned managers can update their prospects"
ON vendor_prospects
FOR UPDATE
USING (assigned_to = auth.uid());

-- Prospect activity log
CREATE TABLE IF NOT EXISTS vendor_prospect_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES vendor_prospects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- status_change, outreach_sent, note_added, ai_analysis, meeting_scheduled
  old_value TEXT,
  new_value TEXT,
  message_content TEXT,
  message_channel TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_prospect_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prospect activity"
ON vendor_prospect_activity
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Outreach templates
CREATE TABLE IF NOT EXISTS vendor_outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'instagram_dm', 'sms')),
  language TEXT NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'th')),
  business_type TEXT, -- null = universal
  stage TEXT NOT NULL CHECK (stage IN ('initial', 'followup_1', 'followup_2', 'followup_3', 'meeting_request', 'proposal')),
  subject TEXT, -- for email
  template TEXT NOT NULL,
  variables TEXT[], -- {{business_name}}, {{contact_name}}, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outreach templates"
ON vendor_outreach_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_vendor_prospects_status ON vendor_prospects(status);
CREATE INDEX idx_vendor_prospects_source ON vendor_prospects(source_type);
CREATE INDEX idx_vendor_prospects_ai_priority ON vendor_prospects(ai_priority);
CREATE INDEX idx_vendor_prospects_assigned ON vendor_prospects(assigned_to);
CREATE INDEX idx_vendor_prospects_next_followup ON vendor_prospects(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_vendor_prospect_activity_prospect ON vendor_prospect_activity(prospect_id);

-- Auto-update updated_at
CREATE TRIGGER update_vendor_prospects_updated_at
  BEFORE UPDATE ON vendor_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default templates
INSERT INTO vendor_outreach_templates (name, channel, language, stage, template, variables) VALUES
-- WhatsApp Initial (Russian)
('WhatsApp Initial RU', 'whatsapp', 'ru', 'initial', 
'Добрый день, {{contact_name}}! 👋

Меня зовут {{manager_name}} из UNO — платформы для бизнеса в Пхукете.

Увидел ваш {{business_type}} {{business_name}} и хотел предложить сотрудничество:
✅ Бесплатное размещение на платформе
✅ Новые клиенты из русскоязычного сообщества
✅ Система онлайн-бронирований

Удобно созвониться сегодня на 5 минут?', 
ARRAY['contact_name', 'manager_name', 'business_type', 'business_name']),

-- WhatsApp Initial (English)
('WhatsApp Initial EN', 'whatsapp', 'en', 'initial',
'Hi {{contact_name}}! 👋

I''m {{manager_name}} from UNO — the leading business platform in Phuket.

I came across {{business_name}} and would love to discuss a partnership:
✅ Free listing on our platform
✅ Access to Russian-speaking community
✅ Online booking system

Would you have 5 minutes for a quick call today?',
ARRAY['contact_name', 'manager_name', 'business_name']),

-- Email Initial (Russian)
('Email Initial RU', 'email', 'ru', 'initial',
'Здравствуйте, {{contact_name}}!

Меня зовут {{manager_name}}, я представляю платформу UNO — маркетплейс услуг для русскоязычного сообщества в Пхукете.

Мы помогаем бизнесам как {{business_name}} находить новых клиентов через нашу платформу с более чем 10,000 активных пользователей.

Что мы предлагаем:
• Бесплатное базовое размещение
• Систему онлайн-бронирований
• Продвижение в нашем приложении
• Аналитику и отзывы клиентов

Буду рад обсудить детали сотрудничества в удобное для вас время.

С уважением,
{{manager_name}}
UNO Phuket',
ARRAY['contact_name', 'manager_name', 'business_name']),

-- Follow-up 1 (Russian)
('WhatsApp Follow-up 1 RU', 'whatsapp', 'ru', 'followup_1',
'{{contact_name}}, добрый день! 🙂

Напоминаю о своём предложении разместить {{business_name}} на платформе UNO.

На этой неделе мы запускаем новую категорию и ищем партнёров. Первые 10 бизнесов получат Premium-размещение бесплатно на месяц!

Могу прислать презентацию?',
ARRAY['contact_name', 'business_name']),

-- Meeting Request (Russian)
('Meeting Request RU', 'whatsapp', 'ru', 'meeting_request',
'{{contact_name}}, отлично! 🎉

Давайте договоримся о встрече. Я могу приехать к вам в {{business_name}} или созвониться в Zoom.

Когда вам удобнее:
📅 {{suggested_date_1}}
📅 {{suggested_date_2}}

Встреча займёт ~15 минут. Покажу платформу и отвечу на вопросы.',
ARRAY['contact_name', 'business_name', 'suggested_date_1', 'suggested_date_2']);

-- Create knowledge base for the agent
INSERT INTO ai_agent_knowledge (
  agent_id,
  version,
  system_prompt,
  knowledge_base,
  is_published,
  published_at
) 
SELECT 
  id,
  1,
  'You are the Vendor Acquisition AI for UNO platform in Phuket, Thailand.

Your job is to analyze potential vendor prospects and generate personalized outreach messages.

ALWAYS respond in valid JSON format.

{{KNOWLEDGE_BASE}}

When analyzing a prospect, consider:
1. Business relevance to UNO platform categories
2. Social media presence and engagement
3. Location (Phuket focus)
4. Potential revenue (busy location, pricing, reviews)
5. Language preference (Russian speakers are priority)

When generating outreach:
1. Keep WhatsApp messages under 500 characters
2. Include 1-2 relevant emojis
3. Personalize based on business type and source
4. Highlight specific benefits relevant to their business
5. Include clear call-to-action',
  '# Vendor Acquisition Knowledge Base

## UNO Platform Overview
UNO — маркетплейс услуг для русскоязычного сообщества в Таиланде, с фокусом на Пхукет.

### Категории бизнесов
- Рестораны и кафе
- Салоны красоты и спа
- Медицинские клиники
- Туры и экскурсии
- Аренда транспорта (авто, байки, яхты)
- Фитнес и спорт
- Недвижимость
- Юридические услуги
- Образование

### Тарифные планы
| План | Цена | Особенности |
|------|------|-------------|
| Basic | Бесплатно | Базовый листинг, до 5 фото |
| Plus | 2,990 ฿/мес | Приоритет в поиске, 20 фото, аналитика |
| Pro | 5,990 ฿/мес | Топ позиция, неограниченные фото, промо-баннеры |

### Преимущества для вендоров
1. Доступ к 10,000+ активных пользователей
2. Система онлайн-бронирований
3. Приём платежей через платформу
4. Отзывы и рейтинги
5. Аналитика и статистика
6. Поддержка на русском языке

## Scoring Rules (0-100)

### Base Score by Business Type (weight: 20%)
- Restaurant/Cafe: 80 base
- Beauty Salon: 75 base
- Medical Clinic: 85 base
- Tour Operator: 70 base
- Rental: 65 base
- Other: 50 base

### Social Presence (weight: 25%)
- 10K+ followers: +25
- 5K-10K: +20
- 1K-5K: +15
- 500-1K: +10
- <500: +5

### Engagement Rate (weight: 15%)
- >5%: +15
- 3-5%: +12
- 1-3%: +8
- <1%: +3

### Location Score (weight: 15%)
- Patong/Kata/Karon: +15 (high tourist traffic)
- Rawai/Chalong: +12
- Phuket Town: +10
- Other Phuket: +8

### Data Completeness (weight: 10%)
- Phone + Email + Social: +10
- Phone + Social: +7
- Only Social: +5
- Only one contact: +3

### Activity Signals (weight: 15%)
- Posted this week: +15
- Posted this month: +10
- Posted 1-3 months ago: +5
- Inactive: +0

## Priority Classification
- Hot (80-100): Immediate outreach, high conversion potential
- Warm (60-79): Good prospect, schedule outreach
- Cold (40-59): Lower priority, nurture campaign
- Not Fit (<40): Not suitable or inactive

## Outreach Best Practices

### WhatsApp
- Keep under 500 characters
- Use 1-2 emojis
- Personal greeting
- One clear CTA
- Send 10am-7pm local time

### Email
- Professional subject line
- Brief intro (2-3 sentences)
- Bullet points for benefits
- Clear next steps
- Include signature

### Instagram DM
- Like 2-3 posts first
- Comment something genuine
- Wait 24h before DM
- Keep DM casual and short

## Follow-up Sequence
1. Initial contact: Day 0
2. Follow-up 1: Day 3 (if no response)
3. Follow-up 2: Day 7 (different angle)
4. Follow-up 3: Day 14 (final attempt)
5. Archive if no response after 21 days',
  true,
  now()
FROM ai_agents WHERE slug = 'vendor-acquisition';