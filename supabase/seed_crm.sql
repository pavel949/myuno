-- Capital CRM Seed Data
-- Replace 'REPLACE_USER_ID' with an actual auth.users id before running

-- ── Projects ──
insert into public.capital_projects (id, name, developer, location_area, price_from, price_to, currency, completion_date, construction_status, target_buyer_types, selling_points, commission_pct, is_active, units_total, units_available, notes, user_id) values
  ('a0000001-0000-0000-0000-000000000001', 'Siamese Bangtao', 'Siamese Asset', 'Bangtao / Laguna', 4500000, 12000000, 'THB', '2027-06-01', 'off_plan', '{investor_rental,end_user}', '["500м до пляжа","Управление от Siamese","Гарантированная доходность 7%","Бассейн на крыше"]'::jsonb, 5, true, 280, 142, 'Премиум-кондо, старт продаж Q1 2026', 'REPLACE_USER_ID'),
  ('a0000001-0000-0000-0000-000000000002', 'Baan Mai Khao', 'Baan Group', 'Mai Khao', 8000000, 25000000, 'THB', '2028-03-01', 'under_construction', '{investor_resale,end_user,mixed}', '["Рядом с аэропортом","Вид на Андаманское море","Частный пляж","Smart home"]'::jsonb, 4, true, 96, 38, 'Виллы и таунхаусы, строительство 40%', 'REPLACE_USER_ID'),
  ('a0000001-0000-0000-0000-000000000003', 'Botanica Luxury Villas', 'Botanica', 'Layan', 18000000, 45000000, 'THB', '2026-12-01', 'under_construction', '{investor_resale,end_user}', '["Pool villa","Тропический сад","Отделка под ключ","Рассрочка 36 мес"]'::jsonb, 3.5, true, 24, 9, 'Люкс-виллы, осталось 9 из 24', 'REPLACE_USER_ID');

-- ── Contacts ──
insert into public.capital_contacts (id, name, phone, email, telegram_id, whatsapp_phone, preferred_channel, budget_min, budget_max, budget_currency, buyer_type, warmth, source, tags, notes, user_id) values
  ('b0000001-0000-0000-0000-000000000001', 'Алексей Петров', '+79161234567', 'apetrov@gmail.com', 'alex_petrov', '+79161234567', 'whatsapp', 5000000, 15000000, 'THB', 'investor_rental', 'hot', 'referral', '["VIP","повторный"]'::jsonb, 'Уже купил 1 юнит в Laguna, ищет ещё', 'REPLACE_USER_ID'),
  ('b0000001-0000-0000-0000-000000000002', 'Мария Козлова', '+79037654321', 'mkozlova@yandex.ru', null, '+79037654321', 'whatsapp', 3000000, 8000000, 'THB', 'end_user', 'warm', 'instagram', '["молодая семья"]'::jsonb, 'Планирует переезд на Пхукет в 2027', 'REPLACE_USER_ID'),
  ('b0000001-0000-0000-0000-000000000003', 'Дмитрий Волков', '+79851112233', null, 'dvolkov_invest', null, 'telegram', 10000000, 50000000, 'THB', 'investor_resale', 'warm', 'conference', '["крупный бюджет","инвестор"]'::jsonb, 'Портфель из 5+ объектов в ЮВА', 'REPLACE_USER_ID'),
  ('b0000001-0000-0000-0000-000000000004', 'Ольга Сидорова', '+79267778899', 'olga.sid@mail.ru', 'olga_sid', '+79267778899', 'email', 8000000, 20000000, 'THB', 'mixed', 'cold', 'website', '[]'::jsonb, 'Оставила заявку на сайте', 'REPLACE_USER_ID'),
  ('b0000001-0000-0000-0000-000000000005', 'Игорь Новиков', '+79119998877', 'inovikov@proton.me', 'igor_n', '+79119998877', 'whatsapp', 15000000, 30000000, 'THB', 'investor_rental', 'client', 'agent_network', '["VIP","партнёр"]'::jsonb, 'Постоянный клиент, 3 сделки за 2025', 'REPLACE_USER_ID');

-- ── Campaign ──
insert into public.capital_campaigns (id, name, project_id, target_criteria, status, started_at, created_at, user_id) values
  ('c0000001-0000-0000-0000-000000000001', 'Siamese Bangtao — Старт продаж', 'a0000001-0000-0000-0000-000000000001', '{"buyer_types":["investor_rental","end_user"],"budget_min":4000000,"budget_max":15000000}'::jsonb, 'active', now(), now(), 'REPLACE_USER_ID');

-- ── Outreach ──
insert into public.capital_outreach (campaign_id, contact_id, project_id, channel, message_text, sent_at, response_type, follow_up_date, user_id) values
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'whatsapp', 'Алексей, добрый день! Стартовали продажи Siamese Bangtao — 500м от пляжа, гарантия 7%. Интересно посмотреть?', now() - interval '2 days', 'interested', current_date + 3, 'REPLACE_USER_ID'),
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'whatsapp', 'Мария, здравствуйте! Новый проект Siamese Bangtao рядом с Лагуной — идеально для семьи. Хотите узнать подробности?', now() - interval '1 day', 'not_now', current_date + 7, 'REPLACE_USER_ID'),
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'email', 'Ольга, добрый день! Представляем новый проект Siamese Bangtao в районе Банг Тао.', null, null, current_date, 'REPLACE_USER_ID');

-- ── Message Templates ──
insert into public.capital_message_templates (name, channel, buyer_type, language, subject, body, variables, is_active, user_id) values
  ('Первый контакт — инвестор', 'whatsapp', 'investor_rental', 'ru', null, '{{name}}, добрый день! Это Павел из Ignatev Capital. У нас стартовали продажи {{project_name}} — {{selling_point}}. Гарантированная доходность {{yield}}%. Интересно обсудить?', '["name","project_name","selling_point","yield"]'::jsonb, true, 'REPLACE_USER_ID'),
  ('Первый контакт — для себя', 'whatsapp', 'end_user', 'ru', null, '{{name}}, здравствуйте! Это Павел, Ignatev Capital. Хочу рассказать про {{project_name}} — {{selling_point}}. Цены от {{price_from}} ฿. Хотите узнать подробности?', '["name","project_name","selling_point","price_from"]'::jsonb, true, 'REPLACE_USER_ID');
