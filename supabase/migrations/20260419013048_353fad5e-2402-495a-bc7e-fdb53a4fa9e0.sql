-- ============================================================
-- 1. capital_contacts: legacy/UI-expected columns
-- ============================================================
ALTER TABLE public.capital_contacts
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS preferred_channel TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC,
  ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS buyer_type TEXT,
  ADD COLUMN IF NOT EXISTS warmth TEXT DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

-- Backfill name/whatsapp_phone from existing data
UPDATE public.capital_contacts
SET name = COALESCE(NULLIF(trim(first_name || ' ' || COALESCE(last_name, '')), ''), 'Unknown')
WHERE name IS NULL OR name = '';

UPDATE public.capital_contacts
SET whatsapp_phone = whatsapp
WHERE whatsapp_phone IS NULL AND whatsapp IS NOT NULL;

-- Sync trigger: keep name <-> first/last_name and whatsapp_phone <-> whatsapp consistent
CREATE OR REPLACE FUNCTION public.sync_capital_contact_dual_fields()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Maintain name from first/last when caller updated those
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := COALESCE(NULLIF(trim(COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')), ''), 'Unknown');
  ELSIF (TG_OP = 'INSERT' OR NEW.name IS DISTINCT FROM OLD.name)
        AND (NEW.first_name IS NULL OR NEW.first_name = '' OR (TG_OP='UPDATE' AND NEW.first_name = OLD.first_name AND (NEW.last_name = OLD.last_name OR (NEW.last_name IS NULL AND OLD.last_name IS NULL)))) THEN
    -- caller updated name only -> split into first/last
    NEW.first_name := COALESCE(NULLIF(split_part(NEW.name, ' ', 1), ''), 'Unknown');
    NEW.last_name := COALESCE(NULLIF(trim(substring(NEW.name FROM position(' ' IN NEW.name || ' ') + 1)), ''), '');
  END IF;

  -- Mirror whatsapp_phone <-> whatsapp
  IF NEW.whatsapp_phone IS NOT NULL AND NEW.whatsapp IS NULL THEN
    NEW.whatsapp := NEW.whatsapp_phone;
  ELSIF NEW.whatsapp IS NOT NULL AND NEW.whatsapp_phone IS NULL THEN
    NEW.whatsapp_phone := NEW.whatsapp;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_capital_contact_dual ON public.capital_contacts;
CREATE TRIGGER trg_sync_capital_contact_dual
  BEFORE INSERT OR UPDATE ON public.capital_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_capital_contact_dual_fields();

-- ============================================================
-- 2. capital_pipeline: legacy/UI-expected columns
-- ============================================================
ALTER TABLE public.capital_pipeline
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS price_agreed NUMERIC,
  ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS commission_expected NUMERIC,
  ADD COLUMN IF NOT EXISTS commission_received NUMERIC,
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.capital_campaigns(id) ON DELETE SET NULL;

-- Auto-update stage_changed_at when stage changes
CREATE OR REPLACE FUNCTION public.touch_capital_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_changed_at := COALESCE(NEW.stage_changed_at, now());
  ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_pipeline_stage ON public.capital_pipeline;
CREATE TRIGGER trg_touch_pipeline_stage
  BEFORE INSERT OR UPDATE OF stage ON public.capital_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_capital_pipeline_stage();

-- ============================================================
-- 3. capital_outreach: legacy/UI-expected columns
-- ============================================================
ALTER TABLE public.capital_outreach
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS response_type TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.capital_projects(id) ON DELETE SET NULL;

-- Mirror body <-> message_text on write
CREATE OR REPLACE FUNCTION public.sync_capital_outreach_body()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.message_text IS NOT NULL AND NEW.body IS NULL THEN
    NEW.body := NEW.message_text;
  ELSIF NEW.body IS NOT NULL AND NEW.message_text IS NULL THEN
    NEW.message_text := NEW.body;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_outreach_body ON public.capital_outreach;
CREATE TRIGGER trg_sync_outreach_body
  BEFORE INSERT OR UPDATE ON public.capital_outreach
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_capital_outreach_body();

-- ============================================================
-- 4. capital_templates: language/buyer_type used by UI
-- ============================================================
ALTER TABLE public.capital_templates
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ru',
  ADD COLUMN IF NOT EXISTS buyer_type TEXT;

-- ============================================================
-- 5. Set default CRM owner if not configured
-- ============================================================
INSERT INTO public.system_settings (key, value, description)
SELECT
  'capital_crm_owner_user_id',
  to_jsonb((SELECT user_id::text FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
  'Owner user_id that receives auto-synced Investment Hub leads in Ignatev Capital CRM'
WHERE EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. Seed Investment Articles (Invest in Thailand)
-- ============================================================
INSERT INTO public.investment_articles
  (slug, category, asset_class, title_ru, title_en, excerpt_ru, excerpt_en, body_ru, body_en, read_time_min, avg_ticket_thb, typical_roi_pct, risks_summary, is_published, sort_order, published_at)
VALUES
  ('thailand-macro-2025', 'macro', NULL,
   'Почему Таиланд: макроэкономика 2025',
   'Why Thailand: Macro Snapshot 2025',
   'Рост ВВП +3%, 40M+ туристов, стабильный THB, низкая инфляция, безопасность.',
   'GDP growth +3%, 40M+ tourists, stable THB, low inflation, safety.',
   E'## Почему Таиланд\n\nТаиланд занимает уникальное место в Юго-Восточной Азии: 2-я экономика региона, крупнейший туристический рынок, стабильная валюта.\n\n### Ключевые цифры 2025:\n- ВВП: $548 млрд (+3% г/г)\n- Туристы: 40+ млн в год (90% pre-COVID)\n- Курс THB: 33-36 за USD (низкая волатильность)\n- Инфляция: 1.5%\n- ЦБ Таиланда сохраняет ставку 2.25%\n\n### Что это значит для инвестора\nСтабильная среда для долгосрочных инвестиций в недвижимость, гостеприимство и сервис.',
   E'## Why Thailand\n\nThailand holds a unique place in Southeast Asia: 2nd-largest economy, biggest tourism market, stable currency.\n\n### Key 2025 figures:\n- GDP: $548B (+3% YoY)\n- Tourists: 40M+/year (90% pre-COVID)\n- THB rate: 33-36 per USD (low volatility)\n- Inflation: 1.5%\n- Bank of Thailand rate: 2.25%\n\n### What it means for investors\nStable environment for long-term plays in real estate, hospitality and services.',
   4, NULL, NULL, 'Политические риски (low), валютные риски (medium для иностранных инвесторов).',
   true, 10, now()),

  ('hospitality-investment-thailand', 'industry_brief', 'hospitality',
   'Инвестиции в гостеприимство: отели и резорты',
   'Investing in Hospitality: Hotels & Resorts',
   'Тикет 20-100M ฿, ROI 8-14%, окупаемость 7-12 лет.',
   'Ticket 20-100M ฿, ROI 8-14%, payback 7-12 years.',
   E'## Гостеприимство в Таиланде\n\nИндустрия #1 по объему: 18% ВВП, 5M+ рабочих мест.\n\n### Сегменты:\n- **Boutique hotels** (10-30 ключей): тикет 30-80M ฿, ROI 10-15%\n- **Resorts** (50+ ключей): 100M+ ฿, ROI 8-12%\n- **Serviced apartments**: 20-60M ฿, ROI 9-13%\n\n### Лучшие локации\nПхукет, Самуи, Краби, Чианг Май. Бангкок — для деловых путешественников.',
   E'## Hospitality in Thailand\n\n#1 industry by volume: 18% GDP, 5M+ jobs.\n\n### Segments:\n- **Boutique hotels** (10-30 keys): 30-80M ฿, ROI 10-15%\n- **Resorts** (50+ keys): 100M+ ฿, ROI 8-12%\n- **Serviced apartments**: 20-60M ฿, ROI 9-13%\n\n### Best locations\nPhuket, Samui, Krabi, Chiang Mai. Bangkok for business travel.',
   5, 60000000, 11, 'Сезонность (low season Apr-Oct), репутация бренда, валютные курсы.',
   true, 20, now()),

  ('fnb-investment-thailand', 'industry_brief', 'fnb',
   'F&B и рестораны: low ticket, fast payback',
   'F&B & Restaurants: Low Ticket, Fast Payback',
   'Тикет 5-30M ฿, ROI 15-25%, окупаемость 2-4 года.',
   'Ticket 5-30M ฿, ROI 15-25%, payback 2-4 years.',
   E'## F&B в Таиланде\n\nСамый быстрый сегмент по окупаемости. Высокая конкуренция, но большой рынок.\n\n### Форматы:\n- Casual dining: 5-15M ฿\n- Premium / fine dining: 15-40M ฿\n- Beach club / resto-bar: 20-80M ฿\n- Ghost kitchen / delivery: 2-8M ฿',
   E'## F&B in Thailand\n\nFastest payback segment. High competition but huge market.\n\n### Formats:\n- Casual dining: 5-15M ฿\n- Premium / fine dining: 15-40M ฿\n- Beach club / resto-bar: 20-80M ฿\n- Ghost kitchen / delivery: 2-8M ฿',
   3, 18000000, 20, 'Высокая текучка персонала, лицензии (alcohol, food), трендовость локаций.',
   true, 30, now()),

  ('real-estate-development-thailand', 'industry_brief', 'real_estate',
   'Девелопмент недвижимости: высокий ROI, длинный цикл',
   'Real Estate Development: High ROI, Long Cycle',
   'Тикет 50-500M ฿, ROI 20-40%, цикл 24-36 месяцев.',
   'Ticket 50-500M ฿, ROI 20-40%, cycle 24-36 months.',
   E'## Девелопмент в Таиланде\n\nКлассический способ создать капитал. Off-plan, переуступки, готовые активы.\n\n### Структуры сделок:\n- **JV с владельцем земли**: 30-50% разработчику\n- **Equity investor**: pref returns 12-18%\n- **Mezzanine**: 15-22% годовых\n\n### Ключевые локации\nПхукет (Banyan, Bangtao, Rawai), Самуи, Hua Hin.',
   E'## Real Estate Development\n\nClassic capital builder. Off-plan, assignments, completed assets.\n\n### Deal structures:\n- **JV with landowner**: 30-50% to developer\n- **Equity investor**: pref returns 12-18%\n- **Mezzanine**: 15-22% annual',
   6, 200000000, 28, 'Permits, sales velocity, FX, политические/regulatory изменения.',
   true, 40, now()),

  ('marine-yachts-thailand', 'industry_brief', 'marine',
   'Marine и яхты: бутиковая ниша',
   'Marine & Yachts: Boutique Niche',
   'Тикет 10-100M ฿, ROI 10-20%, longterm play.',
   'Ticket 10-100M ฿, ROI 10-20%, long-term play.',
   E'## Marine vertical\n\nЧартеры, marina-операции, продажа/обслуживание яхт. Phuket — №1 hub в Юго-Восточной Азии.\n\n### Возможности:\n- Charter fleet: 30-80M ฿, ROI 12-18%\n- Marina services: 20-60M ฿\n- Yacht brokerage: low CapEx, высокая комиссия',
   E'## Marine vertical\n\nCharters, marina ops, yacht sales/service. Phuket is the #1 hub in SEA.\n\n### Opportunities:\n- Charter fleet: 30-80M ฿, ROI 12-18%\n- Marina services: 20-60M ฿\n- Yacht brokerage: low CapEx, high commission',
   4, 40000000, 14, 'Сезонность (Nov-Apr peak), maintenance, страхование.',
   true, 50, now()),

  ('legal-structures-foreign-investors', 'legal', NULL,
   'Юридические структуры для иностранных инвесторов',
   'Legal Structures for Foreign Investors',
   'BOI, Thai Limited, freehold/leasehold, BOI privileges.',
   'BOI, Thai Limited, freehold/leasehold, BOI privileges.',
   E'## Структуры собственности\n\n### Земля и недвижимость:\n- **Condominium freehold**: до 49% иностранцам\n- **Villa leasehold**: 30+30+30 лет\n- **Thai Limited Company**: requires Thai partners (51%)\n- **BOI promotion**: 100% foreign ownership при определенных условиях\n\n### Налоги:\n- Corporate tax: 20%\n- Capital gains: 0% для частных лиц при правильной структуре\n- WHT для дивидендов: 10%',
   E'## Ownership structures\n\n### Land & property:\n- **Condominium freehold**: up to 49% foreign\n- **Villa leasehold**: 30+30+30 years\n- **Thai Limited Company**: needs Thai partners (51%)\n- **BOI promotion**: 100% foreign ownership under conditions\n\n### Taxes:\n- Corporate tax: 20%\n- Capital gains: 0% for individuals with proper structure\n- WHT on dividends: 10%',
   7, NULL, NULL, 'Изменения регуляции, due diligence на номинальных партнерах, audit compliance.',
   true, 60, now())
ON CONFLICT (slug) DO NOTHING;