-- Align legacy lead_source slugs with crm_custom_options seeds; keep analytics consistent.
UPDATE public.crm_contacts
SET source = 'social'
WHERE source = 'social_media';

-- Add expanded contact_type / lead_source options for existing companies (idempotent).
-- New companies still get full defaults from app seed on first useCrmOptions fetch.

INSERT INTO public.crm_custom_options (
  company_id, category, value, label_en, label_ru, short_en, short_ru, color, icon, probability, is_system, is_active, sort_order
)
SELECT
  mc.id,
  'contact_type',
  v.value,
  v.label_en,
  v.label_ru,
  NULL,
  NULL,
  v.color,
  NULL,
  NULL,
  true,
  true,
  v.sort_order
FROM public.management_companies mc
CROSS JOIN (
  VALUES
    ('developer', 'Developer', 'Застройщик', '#0d9488', 7),
    ('broker', 'Broker', 'Брокер', '#6366f1', 8),
    ('tourist', 'Tourist / short stay', 'Турист / краткий визит', '#14b8a6', 9),
    ('resident', 'Resident', 'Резидент', '#0891b2', 10),
    ('corporate', 'Corporate / B2B', 'Компания / B2B', '#4f46e5', 11),
    ('services', 'Services (visa, legal, lifestyle)', 'Услуги (виза, юр., lifestyle)', '#db2777', 12)
) AS v(value, label_en, label_ru, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_custom_options o
  WHERE o.company_id = mc.id AND o.category = 'contact_type' AND lower(o.value) = lower(v.value)
);

INSERT INTO public.crm_custom_options (
  company_id, category, value, label_en, label_ru, short_en, short_ru, color, icon, probability, is_system, is_active, sort_order
)
SELECT
  mc.id,
  'lead_source',
  v.value,
  v.label_en,
  v.label_ru,
  NULL,
  NULL,
  v.color,
  NULL,
  NULL,
  true,
  true,
  v.sort_order
FROM public.management_companies mc
CROSS JOIN (
  VALUES
    ('instagram', 'Instagram', 'Instagram', '#e11d48', 7),
    ('facebook', 'Facebook', 'Facebook', '#2563eb', 8),
    ('telegram', 'Telegram', 'Telegram', '#0284c7', 9),
    ('youtube', 'YouTube', 'YouTube', '#dc2626', 10),
    ('google_ads', 'Google Ads', 'Google Ads', '#ea4335', 11),
    ('meta_ads', 'Meta Ads', 'Meta Ads', '#0668E1', 12),
    ('email_campaign', 'Email campaign', 'Email-рассылка', '#7c3aed', 13),
    ('event_expo', 'Event / exhibition', 'Мероприятие / выставка', '#c026d3', 14),
    ('cold_outreach', 'Cold outreach', 'Холодные контакты', '#64748b', 15),
    ('chat_widget', 'Chat widget', 'Чат на сайте', '#0d9488', 16),
    ('partner', 'Partner', 'Партнёр', '#059669', 17),
    ('repeat_client', 'Repeat client', 'Повторное обращение', '#ca8a04', 18)
) AS v(value, label_en, label_ru, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_custom_options o
  WHERE o.company_id = mc.id AND o.category = 'lead_source' AND lower(o.value) = lower(v.value)
);
