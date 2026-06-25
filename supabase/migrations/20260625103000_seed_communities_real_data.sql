-- ============================================================
-- Seed public.communities with REAL, verified Phuket directory
-- ------------------------------------------------------------
-- Replaces the fabricated rows that were added directly to prod.
-- Powers the "Найти своих" / Find-your-community page (/communities).
-- Renderers: src/pages/communities/CommunitiesIndex.tsx + CommunityDetail.tsx
-- Hook:      src/hooks/useCommunities.ts
--
-- Notes on field usage (verified against the UI code):
--   * pickLocalized() fallback for RU is ru -> en -> th, so RU+EN is enough.
--   * Consulates MUST carry country_code (ISO-2): the country dropdown and the
--     card flag (countryFlag) are both derived from it.
--   * lat/lng left NULL on purpose — the maps button searches by name+address,
--     which avoids shipping inaccurate pins.
--   * Sources verified via official MFA pages, chabad.org, phuket.net and
--     Wikipedia (June 2026).
-- ============================================================

-- 1) Wipe the fabricated rows (table is admin-managed, not user-generated).
DELETE FROM public.communities;

-- 2) Insert the curated directory.
INSERT INTO public.communities
  (slug, kind, name_en, name_ru, name_th,
   description_en, description_ru,
   religion, country_code, consulate_type, language_primary,
   tags, address, city, province, website, source_url, is_active)
VALUES
-- ─────────────────────────────────────────────────────────────
-- RELIGION · Buddhist temples
-- ─────────────────────────────────────────────────────────────
('wat-chalong', 'religion',
 'Wat Chalong', 'Храм Ват Чалонг', 'วัดฉลอง',
 'Phuket''s largest and most revered Buddhist temple, honouring the venerated monks Luang Pho Chaem and Luang Pho Chuang. Free entry; modest dress required.',
 'Самый большой и почитаемый буддийский храм Пхукета, посвящённый монахам Луанг Пхо Чэму и Луанг Пхо Чуангу. Вход свободный; нужна скромная одежда.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist'], NULL, 'Chalong', 'Phuket',
 NULL, 'https://en.wikipedia.org/wiki/Wat_Chalong', true),

('big-buddha-phuket', 'religion',
 'Big Buddha Phuket', 'Большой Будда Пхукета', 'พระพุทธมิ่งมงคลเอกนาคคีรี',
 'A 45-metre white-marble seated Buddha on Nakkerd Hill with panoramic views over Chalong, Kata and Rawai. One of Phuket''s most important landmarks.',
 '45-метровая статуя сидящего Будды из белого мрамора на холме Наккерд с панорамным видом на Чалонг, Кату и Раваи. Один из главных символов Пхукета.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist','landmark'], 'Nakkerd Hills', 'Karon', 'Phuket',
 NULL, 'https://en.wikipedia.org/wiki/Big_Buddha,_Phuket', true),

('wat-phra-thong', 'religion',
 'Wat Phra Thong (Golden Buddha Temple)', 'Храм Ват Пхра Тхонг (Золотой Будда)', 'วัดพระทอง',
 'Thalang temple famous for a half-buried golden Buddha image which, by legend, cannot be fully excavated.',
 'Храм в Таланге, известный наполовину врытой в землю золотой статуей Будды, которую, по преданию, нельзя выкопать полностью.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist'], NULL, 'Thalang', 'Phuket',
 NULL, 'https://en.wikipedia.org/wiki/Wat_Phra_Thong', true),

('wat-phra-nang-sang', 'religion',
 'Wat Phra Nang Sang', 'Храм Ват Пхра Нанг Санг', 'วัดพระนางสร้าง',
 'One of the oldest temples on the island, in Thalang, home to three large historic tin Buddha images.',
 'Один из старейших храмов острова в Таланге, где хранятся три большие исторические оловянные статуи Будды.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist'], NULL, 'Thalang', 'Phuket',
 NULL, 'https://en.wikipedia.org/wiki/Wat_Phra_Nang_Sang', true),

('wat-khao-rang', 'religion',
 'Wat Khao Rang', 'Храм Ват Кхао Ранг', 'วัดเขารัง',
 'Hillside temple above Phuket Town with a seated golden Buddha and sweeping city views.',
 'Храм на холме над городом Пхукет с золотой статуей сидящего Будды и широким видом на город.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist'], NULL, 'Phuket Town', 'Phuket',
 NULL, NULL, true),

('wat-mongkol-nimit', 'religion',
 'Wat Mongkol Nimit', 'Храм Ват Монгкол Нимит', 'วัดมงคลนิมิตร',
 'A central Theravada temple in Phuket Old Town, active in local Buddhist festivals and ceremonies.',
 'Центральный буддийский храм в Старом городе Пхукета, активно участвующий в местных праздниках и церемониях.',
 'buddhist', NULL, NULL, 'th',
 ARRAY['temple','buddhist','old-town'], NULL, 'Phuket Town', 'Phuket',
 NULL, NULL, true),

-- ─────────────────────────────────────────────────────────────
-- RELIGION · Christian
-- ─────────────────────────────────────────────────────────────
('holy-redeemer-catholic-church', 'religion',
 'Holy Redeemer Catholic Church', 'Католическая церковь Святого Искупителя', NULL,
 'The main Roman Catholic church in Phuket Town, with Sunday Mass in Thai and English (times vary by season).',
 'Главная римско-католическая церковь в городе Пхукет; воскресная месса на тайском и английском (расписание зависит от сезона).',
 'christian_catholic', NULL, NULL, 'en',
 ARRAY['church','catholic'], 'Yaowarat Road', 'Phuket Town', 'Phuket',
 NULL, NULL, true),

('our-lady-of-the-assumption-phuket', 'religion',
 'Church of Our Lady of the Assumption', 'Церковь Успения Богородицы', NULL,
 'Historic Catholic parish that has served Thai and foreign Christians on Phuket for over 70 years.',
 'Историческая католическая церковь, более 70 лет служащая тайским и иностранным христианам Пхукета.',
 'christian_catholic', NULL, NULL, 'en',
 ARRAY['church','catholic'], NULL, 'Phuket Town', 'Phuket',
 NULL, NULL, true),

('holy-trinity-orthodox-church-phuket', 'religion',
 'Holy Trinity Russian Orthodox Church', 'Православный храм Святой Троицы', 'โบสถ์รัสเซียนออร์โธดอกซ์',
 'Russian Orthodox church near Thalang, opened in 2011, serving the Russian-speaking Orthodox community of Phuket.',
 'Русская православная церковь близ Таланга, открытая в 2011 году; служит русскоязычной православной общине Пхукета.',
 'christian_orthodox', NULL, NULL, 'ru',
 ARRAY['church','orthodox'], NULL, 'Thalang', 'Phuket',
 NULL, 'https://www.orthodox.or.th', true),

('phuket-international-church', 'religion',
 'Phuket International Church', 'Международная церковь Пхукета', NULL,
 'English-language, non-denominational Protestant Sunday services in the Chalong area (venue can change).',
 'Протестантские внеконфессиональные воскресные службы на английском языке в районе Чалонг (место может меняться).',
 'christian_protestant', NULL, NULL, 'en',
 ARRAY['church','protestant','english'], NULL, 'Chalong', 'Phuket',
 NULL, NULL, true),

-- ─────────────────────────────────────────────────────────────
-- RELIGION · Muslim
-- ─────────────────────────────────────────────────────────────
('phuket-central-mosque', 'religion',
 'Phuket Central Mosque (Masjid Mukaram)', 'Центральная мечеть Пхукета', 'มัสยิดกลางจังหวัดภูเก็ต',
 'The principal mosque of Phuket on Rassada Road near Phuket Town. Friday prayers and community events; modest dress required.',
 'Главная мечеть Пхукета на улице Рассада близ города Пхукет. Пятничные молитвы и общинные мероприятия; нужна скромная одежда.',
 'muslim', NULL, NULL, 'th',
 ARRAY['mosque','muslim'], 'Rassada Road', 'Phuket Town', 'Phuket',
 NULL, NULL, true),

-- ─────────────────────────────────────────────────────────────
-- RELIGION · Jewish
-- ─────────────────────────────────────────────────────────────
('chabad-of-phuket', 'religion',
 'Chabad of Phuket', 'Хабад Пхукета (еврейский центр)', NULL,
 'Jewish community centre and synagogue in Patong with Shabbat services, kosher meals and a Jewish restaurant, especially active in high season.',
 'Еврейский общинный центр и синагога в Патонге: шаббатние службы, кошерная еда и еврейский ресторан, особенно активны в высокий сезон.',
 'jewish', NULL, NULL, 'en',
 ARRAY['synagogue','jewish','chabad'], 'Patong', 'Patong', 'Phuket',
 NULL, 'https://www.chabad.org/centers/default_cdo/aid/564778', true),

-- ─────────────────────────────────────────────────────────────
-- CONSULATES · honorary consulates in Phuket (full embassies are in Bangkok)
-- ─────────────────────────────────────────────────────────────
('honorary-consulate-russia-phuket', 'consulate',
 'Russia — Honorary Consulate (Phuket)', 'Россия — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of the Russian Federation in Phuket (Kata). The full Embassy is in Bangkok; the honorary consul handles limited services.',
 'Почётное консульство Российской Федерации на Пхукете (Ката). Полное посольство — в Бангкоке; почётный консул оказывает ограниченный набор услуг.',
 NULL, 'RU', 'honorary', 'ru',
 ARRAY['consulate','honorary'], 'Kata Road, Kata Beach', 'Kata', 'Phuket',
 NULL, 'https://embassies.info/RussianHonoraryConsulinPhuketThailand', true),

('honorary-consulate-france-phuket', 'consulate',
 'France — Honorary Consulate (Phuket)', 'Франция — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of France in Phuket (Chalong). The Embassy is in Bangkok; the honorary consul assists French nationals with limited services.',
 'Почётное консульство Франции на Пхукете (Чалонг). Посольство — в Бангкоке; почётный консул помогает гражданам Франции в ограниченном объёме.',
 NULL, 'FR', 'honorary', 'fr',
 ARRAY['consulate','honorary'], 'Chao Fah Tawan Tok Road, Chalong', 'Chalong', 'Phuket',
 NULL, 'https://th.ambafrance.org', true),

('honorary-consulate-germany-phuket', 'consulate',
 'Germany — Honorary Consulate (Phuket)', 'Германия — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of the Federal Republic of Germany in Phuket Town. The Embassy is in Bangkok; the honorary consul handles limited services.',
 'Почётное консульство Федеративной Республики Германия в городе Пхукет. Посольство — в Бангкоке; почётный консул оказывает ограниченный набор услуг.',
 NULL, 'DE', 'honorary', 'de',
 ARRAY['consulate','honorary'], 'Phoonpon Road, Talad Nuea', 'Phuket Town', 'Phuket',
 NULL, 'https://bangkok.diplo.de', true),

('honorary-consulate-netherlands-phuket', 'consulate',
 'Netherlands — Honorary Consulate (Phuket)', 'Нидерланды — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of the Netherlands in Phuket (Rassada). The Embassy is in Bangkok; the honorary consul assists Dutch nationals.',
 'Почётное консульство Нидерландов на Пхукете (Рассада). Посольство — в Бангкоке; почётный консул помогает гражданам Нидерландов.',
 NULL, 'NL', 'honorary', 'nl',
 ARRAY['consulate','honorary'], 'Pracha Uthit 5 Road, Rassada', 'Phuket Town', 'Phuket',
 NULL, 'https://www.netherlandsandyou.nl/web/thailand/about-us/honorary-consul-phuket', true),

('honorary-consulate-finland-phuket', 'consulate',
 'Finland — Honorary Consulate (Phuket)', 'Финляндия — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of Finland in Phuket (Kata). The Embassy is in Bangkok; the honorary consul provides limited consular assistance.',
 'Почётное консульство Финляндии на Пхукете (Ката). Посольство — в Бангкоке; почётный консул оказывает ограниченную консульскую помощь.',
 NULL, 'FI', 'honorary', 'fi',
 ARRAY['consulate','honorary'], 'Pakbang Road, Kata', 'Kata', 'Phuket',
 NULL, 'https://finlandabroad.fi/web/tha', true),

('honorary-consulate-sweden-phuket', 'consulate',
 'Sweden — Honorary Consulate (Phuket)', 'Швеция — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of Sweden in Phuket Town. The Embassy is in Bangkok; the honorary consul assists Swedish nationals with limited services.',
 'Почётное консульство Швеции в городе Пхукет. Посольство — в Бангкоке; почётный консул помогает гражданам Швеции в ограниченном объёме.',
 NULL, 'SE', 'honorary', 'sv',
 ARRAY['consulate','honorary'], 'Mae Luan Road, Talad Nua', 'Phuket Town', 'Phuket',
 NULL, 'https://www.swedenabroad.se/en/embassies/thailand-bangkok', true),

('honorary-consulate-italy-phuket', 'consulate',
 'Italy — Honorary Consulate (Phuket)', 'Италия — почётное консульство (Пхукет)', NULL,
 'Honorary Consulate of Italy in Phuket (Vichit). The Embassy is in Bangkok; the honorary consul assists Italian nationals with limited services.',
 'Почётное консульство Италии на Пхукете (Вичит). Посольство — в Бангкоке; почётный консул помогает гражданам Италии в ограниченном объёме.',
 NULL, 'IT', 'honorary', 'it',
 ARRAY['consulate','honorary'], 'Chaofa West Road, Moo 3, Vichit', 'Phuket Town', 'Phuket',
 NULL, 'https://www.esteri.it', true),

-- ─────────────────────────────────────────────────────────────
-- CLUBS · expat clubs & associations
-- ─────────────────────────────────────────────────────────────
('phuket-international-womens-club', 'club',
 'Phuket International Women''s Club (PIWC)', 'Международный женский клуб Пхукета (PIWC)', NULL,
 'Non-profit social and networking club for women in Phuket''s international community, funding student bursaries for over 30 years.',
 'Некоммерческий социальный и нетворкинг-клуб для женщин международного сообщества Пхукета; более 30 лет финансирует стипендии для студентов.',
 NULL, NULL, NULL, 'en',
 ARRAY['club','women','charity','networking'], NULL, 'Phuket', 'Phuket',
 'https://www.piwc-phuket.com', 'https://www.piwc-phuket.com', true),

('rotary-club-patong-beach', 'club',
 'Rotary Club of Patong Beach', 'Ротари-клуб Патонг-Бич', NULL,
 'Phuket''s English-speaking Rotary International chapter, focused on humanitarian and community service.',
 'Англоязычное отделение Rotary International на Пхукете; занимается гуманитарными и общественными проектами.',
 NULL, NULL, NULL, 'en',
 ARRAY['club','rotary','charity','networking'], 'Rat Uthit Road, Patong', 'Patong', 'Phuket',
 'https://www.rotarypatong.org', 'https://www.rotarypatong.org', true),

('phuket-expats-club', 'club',
 'Phuket Expats Club', 'Клуб экспатов Пхукета', NULL,
 'Founded in 2001, a long-running club helping expatriates living and working in Phuket connect and build social bonds.',
 'Основанный в 2001 году клуб, помогающий экспатам, живущим и работающим на Пхукете, знакомиться и заводить связи.',
 NULL, NULL, NULL, 'en',
 ARRAY['club','expat','social'], NULL, 'Phuket', 'Phuket',
 NULL, NULL, true),

('international-business-association-phuket', 'club',
 'International Business Association of Phuket (IBAP)', 'Международная бизнес-ассоциация Пхукета (IBAP)', NULL,
 'Networking association for Thai and foreign businesses in Phuket, with monthly meetings and networking events.',
 'Нетворкинг-ассоциация тайского и иностранного бизнеса на Пхукете; ежемесячные встречи и деловые мероприятия.',
 NULL, NULL, NULL, 'en',
 ARRAY['club','business','networking'], NULL, 'Phuket', 'Phuket',
 NULL, NULL, true),

-- ─────────────────────────────────────────────────────────────
-- MEETUPS · regular expat gatherings & online communities
-- ─────────────────────────────────────────────────────────────
('internations-phuket', 'meetup',
 'InterNations Phuket', 'InterNations Пхукет', NULL,
 'Global expat network with regular social and networking events in Phuket, helping newcomers settle in.',
 'Глобальная сеть экспатов с регулярными социальными и нетворкинг-встречами на Пхукете; помогает новичкам обустроиться.',
 NULL, NULL, NULL, 'en',
 ARRAY['meetup','expat','networking'], NULL, 'Phuket', 'Phuket',
 'https://www.internations.org/phuket-expats', 'https://www.internations.org/phuket-expats', true),

('foreigners-in-phuket-meetup', 'meetup',
 'Foreigners in Phuket', 'Иностранцы на Пхукете (Meetup)', NULL,
 'Meetup.com group running casual gatherings, language exchanges and interest-based events for foreigners in Phuket.',
 'Группа на Meetup.com: неформальные встречи, языковой обмен и тематические мероприятия для иностранцев на Пхукете.',
 NULL, NULL, NULL, 'en',
 ARRAY['meetup','expat','social'], NULL, 'Phuket', 'Phuket',
 'https://www.meetup.com/foreigners-in-phuket/', 'https://www.meetup.com/foreigners-in-phuket/', true),

('phuket-expats-facebook-group', 'meetup',
 'Phuket Expats (community group)', 'Phuket Expats (сообщество)', NULL,
 'Large online community of Phuket residents sharing advice, events and informal meetups across the island.',
 'Большое онлайн-сообщество жителей Пхукета: советы, события и неформальные встречи по всему острову.',
 NULL, NULL, NULL, 'en',
 ARRAY['meetup','expat','community','online'], NULL, 'Phuket', 'Phuket',
 NULL, NULL, true);
