-- Capital CRM Seed Data
-- Automatically uses the first auth.users row as the owner.
-- Run after the migration has been applied.

do $$
declare
  _uid uuid;
begin
  -- Pick the first user in auth.users (you can replace with a specific id)
  select id into _uid from auth.users order by created_at limit 1;

  if _uid is null then
    raise exception 'No users found in auth.users — create an account first, then re-run this seed.';
  end if;

  raise notice 'Seeding Capital CRM data for user %', _uid;

  -- ── Projects ──
  insert into public.capital_projects (id, name, developer, location_area, price_from, price_to, currency, completion_date, construction_status, target_buyer_types, selling_points, commission_pct, is_active, units_total, units_available, notes, user_id) values
    ('a0000001-0000-0000-0000-000000000001', 'Siamese Bangtao', 'Siamese Asset', 'Bangtao / Laguna', 4500000, 12000000, 'THB', '2027-06-01', 'off_plan', '{investor_rental,end_user}', '["500м до пляжа","Управление от Siamese","Гарантированная доходность 7%","Бассейн на крыше"]'::jsonb, 5, true, 280, 142, 'Премиум-кондо, старт продаж Q1 2026', _uid),
    ('a0000001-0000-0000-0000-000000000002', 'Baan Mai Khao', 'Baan Group', 'Mai Khao', 8000000, 25000000, 'THB', '2028-03-01', 'under_construction', '{investor_resale,end_user,mixed}', '["Рядом с аэропортом","Вид на Андаманское море","Частный пляж","Smart home"]'::jsonb, 4, true, 96, 38, 'Виллы и таунхаусы, строительство 40%', _uid),
    ('a0000001-0000-0000-0000-000000000003', 'Botanica Luxury Villas', 'Botanica', 'Layan', 18000000, 45000000, 'THB', '2026-12-01', 'under_construction', '{investor_resale,end_user}', '["Pool villa","Тропический сад","Отделка под ключ","Рассрочка 36 мес"]'::jsonb, 3.5, true, 24, 9, 'Люкс-виллы, осталось 9 из 24', _uid)
  on conflict (id) do nothing;

  -- ── Contacts ──
  insert into public.capital_contacts (id, name, phone, email, telegram_id, whatsapp_phone, preferred_channel, budget_min, budget_max, budget_currency, buyer_type, warmth, source, tags, notes, user_id) values
    ('b0000001-0000-0000-0000-000000000001', 'Алексей Петров', '+79161234567', 'apetrov@gmail.com', 'alex_petrov', '+79161234567', 'whatsapp', 5000000, 15000000, 'THB', 'investor_rental', 'hot', 'referral', '["VIP","повторный"]'::jsonb, 'Уже купил 1 юнит в Laguna, ищет ещё', _uid),
    ('b0000001-0000-0000-0000-000000000002', 'Мария Козлова', '+79037654321', 'mkozlova@yandex.ru', null, '+79037654321', 'whatsapp', 3000000, 8000000, 'THB', 'end_user', 'warm', 'instagram', '["молодая семья"]'::jsonb, 'Планирует переезд на Пхукет в 2027', _uid),
    ('b0000001-0000-0000-0000-000000000003', 'Дмитрий Волков', '+79851112233', null, 'dvolkov_invest', null, 'telegram', 10000000, 50000000, 'THB', 'investor_resale', 'warm', 'conference', '["крупный бюджет","инвестор"]'::jsonb, 'Портфель из 5+ объектов в ЮВА', _uid),
    ('b0000001-0000-0000-0000-000000000004', 'Ольга Сидорова', '+79267778899', 'olga.sid@mail.ru', 'olga_sid', '+79267778899', 'email', 8000000, 20000000, 'THB', 'mixed', 'cold', 'website', '[]'::jsonb, 'Оставила заявку на сайте', _uid),
    ('b0000001-0000-0000-0000-000000000005', 'Игорь Новиков', '+79119998877', 'inovikov@proton.me', 'igor_n', '+79119998877', 'whatsapp', 15000000, 30000000, 'THB', 'investor_rental', 'client', 'agent_network', '["VIP","партнёр"]'::jsonb, 'Постоянный клиент, 3 сделки за 2025', _uid)
  on conflict (id) do nothing;

  -- ── Campaign ──
  insert into public.capital_campaigns (id, name, project_id, target_criteria, status, started_at, created_at, user_id) values
    ('c0000001-0000-0000-0000-000000000001', 'Siamese Bangtao — Старт продаж', 'a0000001-0000-0000-0000-000000000001', '{"buyer_types":["investor_rental","end_user"],"budget_min":4000000,"budget_max":15000000}'::jsonb, 'active', now(), now(), _uid)
  on conflict (id) do nothing;

  -- ── Outreach ──
  insert into public.capital_outreach (campaign_id, contact_id, project_id, channel, message_text, sent_at, response_type, follow_up_date, user_id) values
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'whatsapp', 'Алексей, добрый день! Стартовали продажи Siamese Bangtao — 500м от пляжа, гарантия 7%. Интересно посмотреть?', now() - interval '2 days', 'interested', current_date + 3, _uid),
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'whatsapp', 'Мария, здравствуйте! Новый проект Siamese Bangtao рядом с Лагуной — идеально для семьи. Хотите узнать подробности?', now() - interval '1 day', 'not_now', current_date + 7, _uid),
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'email', 'Ольга, добрый день! Представляем новый проект Siamese Bangtao в районе Банг Тао.', null, null, current_date, _uid);

  -- ── Message Templates ──
  insert into public.capital_message_templates (name, channel, buyer_type, language, subject, body, variables, is_active, user_id) values
    ('Первый контакт — инвестор', 'whatsapp', 'investor_rental', 'ru', null, '{{name}}, добрый день! Это Павел из Ignatev Capital. У нас стартовали продажи {{project_name}} — {{selling_point}}. Гарантированная доходность {{yield}}%. Интересно обсудить?', '["name","project_name","selling_point","yield"]'::jsonb, true, _uid),
    ('Первый контакт — для себя', 'whatsapp', 'end_user', 'ru', null, '{{name}}, здравствуйте! Это Павел, Ignatev Capital. Хочу рассказать про {{project_name}} — {{selling_point}}. Цены от {{price_from}} ฿. Хотите узнать подробности?', '["name","project_name","selling_point","price_from"]'::jsonb, true, _uid);

  raise notice 'Capital CRM seed data inserted successfully!';
end $$;

-- Investment Hub Seed Data (minimal linked graph, RU/EN/TH i18n)
do $$
declare
  _uid uuid;
begin
  select id into _uid from auth.users order by created_at limit 1;

  if _uid is null then
    raise exception 'No users found in auth.users — create an account first, then re-run this seed.';
  end if;

  raise notice 'Seeding Investment Hub data for user %', _uid;

  -- ── Investment Entities (5) ──
  insert into public.investment_entities
    (id, entity_type, name, country_code, city, verification_status, reliability_score, metadata, created_by)
  values
    (
      'd0000001-0000-0000-0000-000000000001',
      'fund',
      'Andaman Yield Fund',
      'TH',
      'Phuket',
      'verified',
      92,
      '{
        "i18n": {
          "title": {"ru":"Фонд доходности Андаман","en":"Andaman Yield Fund","th":"กองทุนผลตอบแทนอันดามัน"},
          "summary": {"ru":"Фонд для rental yield и hospitality активов","en":"Fund focused on rental yield and hospitality assets","th":"กองทุนที่เน้นสินทรัพย์รายได้ค่าเช่าและการบริการ"}
        },
        "entity_role":"investor"
      }'::jsonb,
      _uid
    ),
    (
      'd0000001-0000-0000-0000-000000000002',
      'project',
      'Laguna Smart Villas Phase 2',
      'TH',
      'Phuket',
      'verified',
      88,
      '{
        "i18n": {
          "title": {"ru":"Laguna Smart Villas Фаза 2","en":"Laguna Smart Villas Phase 2","th":"Laguna Smart Villas ระยะที่ 2"},
          "summary": {"ru":"Новый жилой кластер с высоким спросом на аренду","en":"New residential cluster with strong rental demand","th":"โครงการที่อยู่อาศัยใหม่ที่มีความต้องการเช่าสูง"}
        },
        "entity_role":"project_owner"
      }'::jsonb,
      _uid
    ),
    (
      'd0000001-0000-0000-0000-000000000003',
      'company',
      'Phuket Marina Hospitality Group',
      'TH',
      'Phuket',
      'verified',
      84,
      '{
        "i18n": {
          "title": {"ru":"Phuket Marina Hospitality Group","en":"Phuket Marina Hospitality Group","th":"Phuket Marina Hospitality Group"},
          "summary": {"ru":"Оператор marina и lifestyle объектов","en":"Operator of marina and lifestyle assets","th":"ผู้ดำเนินการสินทรัพย์มาริน่าและไลฟ์สไตล์"}
        },
        "entity_role":"advisor"
      }'::jsonb,
      _uid
    ),
    (
      'd0000001-0000-0000-0000-000000000004',
      'person',
      'Nattapong S.',
      'TH',
      'Bangkok',
      'verified',
      80,
      '{
        "i18n": {
          "title": {"ru":"Наттапонг С.","en":"Nattapong S.","th":"ณัฐพงศ์ ส."},
          "summary": {"ru":"Лицензированный партнер по закрытию сделок","en":"Licensed partner for deal closing","th":"พาร์ทเนอร์ที่ได้รับใบอนุญาตสำหรับการปิดดีล"}
        },
        "entity_role":"operator"
      }'::jsonb,
      _uid
    ),
    (
      'd0000001-0000-0000-0000-000000000005',
      'company',
      'Ignatev Capital Thailand',
      'TH',
      'Phuket',
      'verified',
      95,
      '{
        "i18n": {
          "title": {"ru":"Ignatev Capital Thailand","en":"Ignatev Capital Thailand","th":"Ignatev Capital Thailand"},
          "summary": {"ru":"Оператор экосистемы investment hub","en":"Operator of the investment hub ecosystem","th":"ผู้ดำเนินการระบบนิเวศ investment hub"}
        },
        "entity_role":"admin"
      }'::jsonb,
      _uid
    )
  on conflict (id) do nothing;

  -- ── Investment Opportunities (4 zones) ──
  insert into public.investment_opportunities
    (id, entity_id, title, summary, asset_class, stage, zone, fit_score, reliability_score, execution_score, target_raise_usd, min_ticket_usd, currency, country_code, metadata, created_by)
  values
    (
      'e0000001-0000-0000-0000-000000000001',
      'd0000001-0000-0000-0000-000000000002',
      'Laguna Villas Yield Series',
      'Market intelligence opportunity for premium rental villas.',
      'real_estate',
      'qualified',
      'market',
      86,
      90,
      74,
      3200000,
      100000,
      'USD',
      'TH',
      '{
        "i18n": {
          "title": {"ru":"Доходная серия Laguna Villas","en":"Laguna Villas Yield Series","th":"Laguna Villas ซีรีส์ผลตอบแทน"},
          "summary": {"ru":"Рыночная возможность для премиальных rental-вилл","en":"Market opportunity for premium rental villas","th":"โอกาสทางการตลาดสำหรับวิลล่าให้เช่าระดับพรีเมียม"}
        },
        "thesis_tags":["yield","phuket","villa"]
      }'::jsonb,
      _uid
    ),
    (
      'e0000001-0000-0000-0000-000000000002',
      'd0000001-0000-0000-0000-000000000003',
      'Marina F&B Roll-up',
      'Deal marketplace case for hospitality consolidation.',
      'hospitality',
      'intro',
      'deals',
      79,
      84,
      69,
      2100000,
      75000,
      'USD',
      'TH',
      '{
        "i18n": {
          "title": {"ru":"Marina F&B консолидация","en":"Marina F&B Roll-up","th":"การรวมกิจการ Marina F&B"},
          "summary": {"ru":"Кейс marketplace по консолидации hospitality-активов","en":"Marketplace case for consolidating hospitality assets","th":"กรณี marketplace สำหรับการรวมสินทรัพย์การบริการ"}
        },
        "thesis_tags":["hospitality","consolidation","cashflow"]
      }'::jsonb,
      _uid
    ),
    (
      'e0000001-0000-0000-0000-000000000003',
      'd0000001-0000-0000-0000-000000000003',
      'Thailand Co-Invest Network Batch',
      'Partner syndication batch for co-invest network.',
      'mixed_use',
      'qualified',
      'network',
      82,
      81,
      71,
      5000000,
      120000,
      'USD',
      'TH',
      '{
        "i18n": {
          "title": {"ru":"Пакет Co-Invest Network Thailand","en":"Thailand Co-Invest Network Batch","th":"ชุดเครือข่าย Co-Invest Thailand"},
          "summary": {"ru":"Партнерский пакет для синдикации и co-invest","en":"Partner batch for syndication and co-invest","th":"ชุดพาร์ทเนอร์สำหรับการ syndication และ co-invest"}
        },
        "thesis_tags":["network","syndicate","multi-asset"]
      }'::jsonb,
      _uid
    ),
    (
      'e0000001-0000-0000-0000-000000000004',
      'd0000001-0000-0000-0000-000000000002',
      'Execution Ready Phuket Pipeline',
      'Execution workspace opportunity at due diligence stage.',
      'real_estate',
      'dd',
      'execution',
      88,
      91,
      83,
      4100000,
      150000,
      'USD',
      'TH',
      '{
        "i18n": {
          "title": {"ru":"Готовый pipeline сделок Phuket","en":"Execution Ready Phuket Pipeline","th":"ไปป์ไลน์ดีลภูเก็ตพร้อมดำเนินการ"},
          "summary": {"ru":"Возможность в execution workspace на стадии DD","en":"Execution workspace opportunity at DD stage","th":"โอกาสใน execution workspace ที่อยู่ในขั้นตอน DD"}
        },
        "thesis_tags":["execution","dd","close"]
      }'::jsonb,
      _uid
    )
  on conflict (id) do nothing;

  -- ── Funding Rounds (3) ──
  insert into public.funding_rounds
    (id, opportunity_id, round_name, target_amount_usd, raised_amount_usd, valuation_usd, status, close_date)
  values
    ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'Series A', 3200000, 1400000, 12000000, 'open', current_date + 120),
    ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'Growth Round', 2100000, 900000, 8500000, 'open', current_date + 90),
    ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', 'Bridge Round', 4100000, 4100000, 17000000, 'closed', current_date - 10)
  on conflict (id) do nothing;

  -- ── Co-investment Matches (3) ──
  insert into public.co_investment_matches
    (id, opportunity_id, investor_entity_id, partner_entity_id, fit_score, status, notes)
  values
    ('c1000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 87, 'accepted', 'Yield strategy aligned with investor thesis'),
    ('c1000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 78, 'proposed', 'Pending compliance review'),
    ('c1000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 81, 'converted', 'Converted to formal syndicate')
  on conflict (id) do nothing;

  -- ── Intro Requests (3) ──
  insert into public.intro_requests
    (id, opportunity_id, investor_entity_id, project_entity_id, intro_status, fee_type, requested_by)
  values
    ('i0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'qualified', 'intro_fee', _uid),
    ('i0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'scheduled', 'intro_fee', _uid),
    ('i0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'completed', 'success_fee', _uid)
  on conflict (id) do nothing;

  -- ── Due Diligence Rooms (3) ──
  insert into public.due_diligence_rooms
    (id, intro_request_id, status, checklist, data_provenance, created_by)
  values
    (
      'r0000001-0000-0000-0000-000000000001',
      'i0000001-0000-0000-0000-000000000001',
      'in_review',
      '["financial_model","title_deeds","operator_contract"]'::jsonb,
      '{"source":"capital_team","verified_by":"ops","i18n":{"summary":{"ru":"DD в процессе","en":"DD in progress","th":"DD อยู่ระหว่างดำเนินการ"}}}'::jsonb,
      _uid
    ),
    (
      'r0000001-0000-0000-0000-000000000002',
      'i0000001-0000-0000-0000-000000000002',
      'open',
      '["tenant_mix","cashflow_history"]'::jsonb,
      '{"source":"advisor","verified_by":"operator","i18n":{"summary":{"ru":"Ожидаются документы","en":"Awaiting documents","th":"รอเอกสาร"}}}'::jsonb,
      _uid
    ),
    (
      'r0000001-0000-0000-0000-000000000003',
      'i0000001-0000-0000-0000-000000000003',
      'completed',
      '["legal_check","tax_review","partner_clearance"]'::jsonb,
      '{"source":"licensed_partner","verified_by":"admin","i18n":{"summary":{"ru":"DD завершен","en":"DD completed","th":"DD เสร็จสมบูรณ์"}}}'::jsonb,
      _uid
    )
  on conflict (id) do nothing;

  raise notice 'Investment Hub seed data inserted successfully!';
end $$;
