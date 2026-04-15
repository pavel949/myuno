-- Won reason on deals (analytics); RE-specific lost reasons + win_reason options for existing companies.

ALTER TABLE public.agent_deals
  ADD COLUMN IF NOT EXISTS won_reason text;

COMMENT ON COLUMN public.agent_deals.won_reason IS 'Optional label/slug when stage = closed_won; pairs with crm_custom_options category win_reason';

-- New lost_reason values (Phuket RE), idempotent per company
INSERT INTO public.crm_custom_options (
  company_id, category, value, label_en, label_ru, short_en, short_ru, color, icon, probability, is_system, is_active, sort_order
)
SELECT
  mc.id,
  'lost_reason',
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
    ('financing_failed', 'Financing failed', 'Не прошло финансирование', '#b91c1c', 9),
    ('developer_delay', 'Developer / project delay', 'Задержка застройщика / проекта', '#c2410c', 10),
    ('visa_issue', 'Visa / stay issue', 'Виза / легальный статус', '#0369a1', 11),
    ('unit_sold_to_other', 'Unit sold to someone else', 'Лот продан другому', '#7c2d12', 12),
    ('decided_to_rent_not_buy', 'Decided to rent instead of buy', 'Решил арендовать вместо покупки', '#57534e', 13)
) AS v(value, label_en, label_ru, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_custom_options o
  WHERE o.company_id = mc.id AND o.category = 'lost_reason' AND lower(o.value) = lower(v.value)
);

-- Full win_reason set per company (category often empty until first UI open)
INSERT INTO public.crm_custom_options (
  company_id, category, value, label_en, label_ru, short_en, short_ru, color, icon, probability, is_system, is_active, sort_order
)
SELECT
  mc.id,
  'win_reason',
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
    ('cash_or_transfer', 'Cash / transfer closed', 'Оплата наличными / перевод', '#15803d', 1),
    ('mortgage_financed', 'Mortgage or financing approved', 'Ипотека / финансирование одобрено', '#0d9488', 2),
    ('spa_or_reservation', 'SPA or reservation completed', 'SPA / бронь завершены', '#7c3aed', 3),
    ('referral_or_partner', 'Referral or partner intro', 'Реферал / партнёр', '#2563eb', 4),
    ('repeat_client', 'Repeat client', 'Повторный клиент', '#ca8a04', 5),
    ('competitive_terms', 'Strong price or terms', 'Сильная цена / условия', '#059669', 6),
    ('management_signed', 'PMC / subscription signed', 'Договор УК / подписка', '#8b5cf6', 7),
    ('other', 'Other', 'Другое', '#78716c', 8)
) AS v(value, label_en, label_ru, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_custom_options o
  WHERE o.company_id = mc.id AND o.category = 'win_reason' AND lower(o.value) = lower(v.value)
);

-- New task_type slugs for playbooks (idempotent)
INSERT INTO public.crm_custom_options (
  company_id, category, value, label_en, label_ru, short_en, short_ru, color, icon, probability, is_system, is_active, sort_order
)
SELECT
  mc.id,
  'task_type',
  v.value,
  v.label_en,
  v.label_ru,
  NULL,
  NULL,
  v.color,
  v.icon,
  NULL,
  true,
  true,
  v.sort_order
FROM public.management_companies mc
CROSS JOIN (
  VALUES
    ('check_in', 'Check-in / arrival', 'Заезд / прибытие', '#0d9488', 'CalendarCheck', 13),
    ('key_handover', 'Key handover', 'Передача ключей', '#a16207', 'Key', 14),
    ('installment_reminder', 'Installment / payment schedule', 'Взнос / график платежей', '#c026d3', 'CalendarClock', 15),
    ('reservation', 'Reservation / booking fee', 'Бронь / booking fee', '#ea580c', 'Bookmark', 16),
    ('kyc_docs', 'KYC / documents', 'KYC / документы', '#0369a1', 'ShieldCheck', 17),
    ('onboarding_visit', 'Onboarding / property visit', 'Онбординг / осмотр объекта', '#4f46e5', 'Home', 18),
    ('renewal_call', 'Renewal / upsell call', 'Продление / upsell', '#65a30d', 'PhoneForwarded', 19)
) AS v(value, label_en, label_ru, color, icon, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_custom_options o
  WHERE o.company_id = mc.id AND o.category = 'task_type' AND lower(o.value) = lower(v.value)
);
