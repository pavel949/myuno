-- Batch 7
-- Migration: 20260207082357_893ab2bd-f105-423e-8fae-42bde179ba02.sql

-- =============================================
-- ENRICH ACTIVITIES WITH REAL DATA
-- =============================================

-- 1. Andamanda Water Park
UPDATE experiences SET
  description_en = 'Thailand''s biggest themed waterpark with 6 immersive zones inspired by Thai mythology. Features over 25 rides including Southeast Asia''s longest lazy river, a massive wave pool, family splash zones, and adrenaline slides up to 20m high. Perfect for families with children of all ages — toddler pools to extreme slides. Full-day entertainment with on-site restaurants, lockers, and cabanas.',
  description_ru = 'Крупнейший тематический аквапарк Таиланда с 6 зонами, вдохновлёнными тайской мифологией. Более 25 аттракционов: самая длинная ленивая река в ЮВА, огромный волновой бассейн, детские зоны и горки до 20 м. Идеально для семей с детьми любого возраста — от малышей до экстремалов. Рестораны, шкафчики и кабаны на территории.',
  long_description = 'Andamanda Water Park is Phuket''s premier water attraction, opened in 2022 as the island''s largest and most modern waterpark. Spread across a vast area in Kathu, it features six themed zones inspired by the Naga legend of Thai mythology: Naga Jungle, Emerald Forest, Coral World, Thai Village, Mystic Springs, and Sky Breaker.

Families will love the dedicated toddler splash area and the giant wave pool, while thrill-seekers can tackle slides reaching 20 meters in height. The lazy river — the longest in Southeast Asia — winds through beautifully landscaped gardens. On-site dining ranges from Thai street food to international cuisine. Private cabanas with butler service are available for those wanting a VIP experience.

Best for: Families with kids 3+, couples, friend groups. Allow a full day. Arrive early (10 AM) to avoid afternoon crowds. Bring reef-safe sunscreen. Lockers and towels are included in the ticket price.',
  meeting_point = '888 Moo 3, Kathu, Phuket 83120, Thailand',
  meeting_point_lat = 7.9156,
  meeting_point_lng = 98.3465,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["6 themed zones inspired by Thai mythology","25+ rides & slides including 20m-high thrillers","Southeast Asia''s longest lazy river","Toddler-safe splash area for young kids","On-site dining, lockers, towels & VIP cabanas"]'::jsonb,
  includes = '["Full-day access to all zones","Locker","Towel"]'::jsonb,
  excludes = '["Food & drinks","Cabana rental","Professional photos"]'::jsonb,
  external_link = 'https://www.andamandaphuket.com',
  booking_url = 'https://www.andamandaphuket.com',
  age_restriction = 0,
  location_name = 'Kathu, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000001';

-- 2. Splash Jungle Water Park
UPDATE experiences SET
  description_en = 'Family water park on Mai Khao Beach with wave pool, lazy river, kids aqua play zone, and thrilling Boomerango slide. Smaller and more intimate than Andamanda — great for younger kids (2–10 years). Located inside the Centara Seaview Resort area with heated Jacuzzis, a swim-up bar, and direct beach access.',
  description_ru = 'Семейный аквапарк на пляже Май Кхао с волновым бассейном, ленивой рекой, детской водной зоной и горкой Бумеранго. Компактнее Андаманды — идеален для малышей 2–10 лет. Расположен на территории Centara Seaview Resort: джакузи, бар в бассейне и выход на пляж.',
  long_description = 'Splash Jungle Water Park sits on Phuket''s quieter northern coast in Mai Khao, offering a more relaxed waterpark experience compared to the mega-parks. Its signature Boomerango slide launches riders up a near-vertical wall, while the lazy river and wave pool provide gentler fun.

The kids'' aqua play zone with shallow pools and mini-slides is ideal for toddlers and children under 10. Parents appreciate the swim-up bar, heated Jacuzzis, and the ability to walk straight to Mai Khao Beach. The park is never overcrowded, making it a stress-free family outing.

Best for: Families with toddlers and young children (2–10), couples looking for a chill water day. Half-day visit is sufficient. Bring your own towel (rental 100 THB) and sunscreen.',
  meeting_point = '65 Soi Mai Khao 4, Mai Khao, Thalang, Phuket 83110, Thailand',
  meeting_point_lat = 8.1690,
  meeting_point_lng = 98.3036,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Boomerango thrill slide","Kids aqua play zone for toddlers","Wave pool & lazy river","Swim-up bar & heated Jacuzzis","Direct Mai Khao Beach access"]'::jsonb,
  includes = '["All-day access to all slides & pools","Locker"]'::jsonb,
  excludes = '["Towel rental (100 THB)","Food & drinks","Sunscreen"]'::jsonb,
  external_link = 'https://www.splashjunglewaterpark.com',
  booking_url = 'https://www.splashjunglewaterpark.com',
  age_restriction = 0,
  location_name = 'Mai Khao, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000002';

-- 3. Blue Tree Phuket
UPDATE experiences SET
  description_en = 'A vibrant family lifestyle complex centered around a stunning blue lagoon. Features cliff jumping (3m–12m), water slides, kids splash zone, fitness areas, and a shopping & dining district. Not just a waterpark — it''s a full-day destination with restaurants, shops, and entertainment. Open until 9 PM for sunset drinks by the lagoon.',
  description_ru = 'Яркий семейный комплекс с великолепной голубой лагуной. Прыжки со скал (3–12 м), водные горки, детская зона, фитнес и торгово-ресторанный квартал. Не просто аквапарк — это место на целый день с ресторанами, магазинами и развлечениями. Работает до 21:00 — закаты у лагуны.',
  long_description = 'Blue Tree Phuket redefines the waterpark concept by combining a stunning man-made lagoon with retail, dining, fitness, and entertainment in one sprawling complex in Cherng Talay. The centrepiece is the brilliant blue lagoon where you can cliff jump from platforms at 3m, 6m, 9m, and 12m heights, or simply float and swim.

Kids have their own splash zone with shallow pools and gentle slides. Beyond the water, explore a curated dining district (Thai, Japanese, Italian), boutique shops, a gym, and regular events including weekend markets and live music. The complex stays open until 9 PM, making it perfect for a late-afternoon arrival followed by sunset dining.

Best for: Families, couples, fitness enthusiasts. Works as a half-day or full-day visit. Cliff jump sessions are charged separately from basic lagoon entry.',
  meeting_point = '4/2 Srisoonthorn Rd, Cherng Talay, Thalang, Phuket 83110, Thailand',
  meeting_point_lat = 7.9845,
  meeting_point_lng = 98.3129,
  start_times = ARRAY['09:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Blue lagoon with cliff jumping (3–12m)","Kids splash zone & water slides","Shopping & dining district","Open until 9 PM — enjoy sunset","Fitness & wellness facilities"]'::jsonb,
  includes = '["Lagoon swimming access"]'::jsonb,
  excludes = '["Cliff jump sessions (extra charge)","Food & drinks","Equipment rental"]'::jsonb,
  external_link = 'https://bluetree.fun',
  booking_url = 'https://bluetree.fun',
  age_restriction = 0,
  location_name = 'Cherng Talay, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000003';

-- 4. Baan Teelanka (Upside Down House)
UPDATE experiences SET
  description_en = 'A quirky interactive museum where the entire house is built upside down — walk on ceilings, pose with furniture dangling above, and capture mind-bending photos. Also features a challenging garden maze and mini-golf course. Perfect for families with kids 4+ and anyone who loves Instagram-worthy photo ops. Allow about 90 minutes for all attractions.',
  description_ru = 'Необычный интерактивный музей — весь дом построен вверх дном! Ходите по потолкам, фотографируйтесь с мебелью над головой. Также есть садовый лабиринт и мини-гольф. Идеально для семей с детьми от 4 лет и любителей необычных фото. Запланируйте около 90 минут.',
  long_description = 'Baan Teelanka is one of Phuket''s most unique attractions — a fully furnished two-storey house built completely upside down. Every room is meticulously designed with real furniture, appliances, and decorations attached to the ceiling, creating surreal photo opportunities that challenge your sense of gravity.

The complex also includes a large garden maze where you navigate hedgerow paths to find the exit (timed challenge available), and an 18-hole mini-golf course set in tropical gardens. Together, the three attractions offer about 90 minutes of family entertainment.

Best for: Families with children 4+, couples, Instagram enthusiasts. Great activity for cloudy or hot days (partially shaded). Located in Chalong, easy to combine with Big Buddha visit.',
  meeting_point = '51/11 Chalermprakiat Ror 9 Rd, Chalong, Phuket 83130, Thailand',
  meeting_point_lat = 7.8416,
  meeting_point_lng = 98.3360,
  start_times = ARRAY['09:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Fully furnished upside-down house","Mind-bending photo opportunities","Garden maze challenge (timed)","18-hole mini-golf course","Great for Instagram & families"]'::jsonb,
  includes = '["Entry to all 3 attractions (house, maze, mini-golf)"]'::jsonb,
  excludes = '["Food & drinks","Professional photography"]'::jsonb,
  external_link = 'https://www.baanteelanka.com',
  booking_url = 'https://www.baanteelanka.com',
  age_restriction = 0,
  location_name = 'Chalong, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000004';

-- 5. Phuket Trickeye Museum
UPDATE experiences SET
  description_en = 'Interactive 3D art museum in Phuket Old Town with over 100 optical illusion paintings you can pose with. Zones include underwater worlds, dinosaurs, space, and classic art parodies. Each painting is designed for you to step inside and create hilarious, shareable photos. Great rainy-day activity. Air-conditioned, fully indoor.',
  description_ru = 'Интерактивный музей 3D-искусства в Старом городе с более чем 100 оптическими иллюзиями. Зоны: подводный мир, динозавры, космос, пародии на классику. Каждая картина создана для фото — встаньте внутрь и создайте забавные снимки. Идеально в дождь. Кондиционер, полностью в помещении.',
  long_description = 'Phuket Trickeye Museum brings interactive 3D art to life in the heart of Phuket Old Town. Over 100 large-scale optical illusion paintings span 10 themed zones — from swimming with whales to escaping dinosaurs, floating in space, or stepping into famous masterpieces. Each artwork is designed with precise perspective so that when you stand in the right spot and take a photo, the illusion comes alive.

The museum is fully air-conditioned, making it the perfect escape from Phuket''s heat or rain. It''s located on Phang Nga Road in the charming Old Town district, so you can combine your visit with exploring the colourful Sino-Portuguese shophouses, street art, and local cafés.

Best for: Families with kids of all ages, couples, friend groups. Allow 1–1.5 hours. Best combined with an Old Town walking tour and lunch at a local restaurant.',
  meeting_point = '130/1 Phang Nga Rd, Talat Yai, Mueang Phuket, Phuket 83000, Thailand',
  meeting_point_lat = 7.8849,
  meeting_point_lng = 98.3889,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["100+ interactive 3D illusion paintings","10 themed zones (sea, space, dinosaurs)","Fully air-conditioned indoor venue","Perfect rainy-day activity","Located in historic Old Town"]'::jsonb,
  includes = '["Museum entry to all zones","Unlimited photo opportunities"]'::jsonb,
  excludes = '["Printed photos","Food & drinks"]'::jsonb,
  external_link = 'https://www.phuket3dmuseum.com',
  booking_url = 'https://www.phuket3dmuseum.com',
  age_restriction = 0,
  location_name = 'Phuket Old Town'
WHERE id = 'fa000001-0001-0001-0001-000000000005';

-- 6. Go-Kart Speedway (Kathu)
UPDATE experiences SET
  description_en = 'Open-air go-kart track in Kathu with karts for all ages and skill levels. Choose from kids'' karts (5+ years), standard 160cc, or powerful 270cc racing karts. 10-minute sessions on a purpose-built circuit with hairpin turns and long straights. Located opposite Tiger Kingdom — easy to combine both. No experience needed.',
  description_ru = 'Картинг-трек под открытым небом в Кату для всех возрастов. Детские карты (от 5 лет), стандартные 160cc и мощные гоночные 270cc. 10-минутные сессии на профессиональной трассе. Напротив Tiger Kingdom — удобно совместить. Опыт не нужен.',
  long_description = 'Phuket Go-Kart Speedway is the island''s most popular karting venue, set on a purpose-built outdoor circuit in Kathu. The track features challenging hairpin turns, sweeping bends, and long straights that test drivers of all skill levels.

Three kart categories are available: kids'' karts for children aged 5+ (safe, speed-limited), standard 160cc karts for casual fun, and high-performance 270cc karts for experienced drivers who want real racing thrills. Each session lasts approximately 10 minutes. Helmets and a safety briefing are provided before every session.

Best for: Families, teens, adrenaline seekers, stag/hen groups. Located directly opposite Tiger Kingdom and near the Phuket Shooting Range — combine all three for a full day of action in Kathu. No prior driving experience required.',
  meeting_point = '46/158 Moo 6, Phrabaramee Rd, Kathu, Phuket 83120, Thailand',
  meeting_point_lat = 7.9050,
  meeting_point_lng = 98.3250,
  start_times = ARRAY['09:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Kids karts (age 5+), 160cc & 270cc adult karts","10-minute sessions on professional circuit","No experience needed — helmets provided","Located opposite Tiger Kingdom","Great for families, teens & groups"]'::jsonb,
  includes = '["Kart rental (per session)","Helmet","Safety briefing"]'::jsonb,
  excludes = '["Racing suit","Photos","Drinks"]'::jsonb,
  external_link = 'https://www.phuketkartspeedway.com',
  booking_url = 'https://www.phuketkartspeedway.com',
  age_restriction = 5,
  location_name = 'Kathu, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000006';

-- 7. Flying Hanuman Zipline
UPDATE experiences SET
  description_en = 'Premium zipline adventure through 300-year-old rainforest canopy in Kathu. 28 platforms connected by ziplines, sky bridges, spiral staircases, and abseiling stations spanning over 1.5 km. Professional safety equipment and trained guides at every station. Kids course available (age 4+). The most scenic zipline in Phuket with waterfall viewpoint.',
  description_ru = 'Премиальный зиплайн через 300-летний тропический лес в Кату. 28 платформ, соединённых зиплайнами, небесными мостами, винтовыми лестницами и станциями спуска на верёвке — более 1,5 км. Профессиональное оборудование, инструкторы на каждой станции. Детский курс (от 4 лет). Самый живописный зиплайн на Пхукете.',
  long_description = 'Flying Hanuman is Phuket''s most scenic zipline experience, set deep in a pristine 300-year-old rainforest in the Kathu valley. The course features 28 platforms connected by a network of ziplines, sky bridges, spiral staircases, and abseiling stations, covering over 1.5 kilometres through the jungle canopy.

Every platform is staffed by trained safety guides using a double-clip harness system — you''re always connected. The course includes a stunning waterfall viewpoint, and you''ll spot native birds, monkeys, and tropical flora throughout the journey. A dedicated kids'' course is available for children aged 4+.

Best for: Families (kids 4+), adventure seekers, nature lovers. Allow 3–4 hours including hotel transfer. The full experience includes round-trip hotel pickup, all equipment, insurance, and light refreshments. Photo/video packages are available at extra cost. Book the morning session (8 AM) for cooler temperatures and better wildlife spotting.',
  meeting_point = '89/16 Moo 6, Soi Namtok Kathu, Kathu, Phuket 83120, Thailand',
  meeting_point_lat = 7.9270,
  meeting_point_lng = 98.3290,
  start_times = ARRAY['08:00','10:00','13:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["28 platforms over 1.5 km through rainforest","300-year-old jungle canopy","Sky bridges, abseiling & spiral staircases","Kids course available (age 4+)","Waterfall viewpoint & wildlife spotting"]'::jsonb,
  includes = '["Hotel round-trip transfer","All safety equipment","Professional guide at every station","Insurance","Light refreshments"]'::jsonb,
  excludes = '["Photo & video package (extra)","Lunch","Gratuities"]'::jsonb,
  external_link = 'https://www.flyinghanuman.com',
  booking_url = 'https://www.flyinghanuman.com',
  age_restriction = 4,
  location_name = 'Kathu Rainforest, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000007';

-- 8. Dino Park Mini Golf
UPDATE experiences SET
  description_en = 'Jurassic-themed 18-hole mini-golf course at Kata Beach with life-size animatronic dinosaurs. The course winds through tropical gardens with caves, waterfalls, and erupting volcanoes. On-site restaurant and bar with panoramic views — perfect for a sunset round followed by dinner. Family-friendly, open late!',
  description_ru = 'Тематический мини-гольф на 18 лунок у пляжа Ката с динозаврами в натуральную величину. Трасса проходит через тропические сады с пещерами, водопадами и извергающимися вулканами. Ресторан и бар с панорамным видом — идеально для вечернего раунда с ужином. Для всей семьи, работает допоздна!',
  long_description = 'Dino Park Mini Golf is one of Phuket''s most beloved family attractions, located right at the southern end of Kata Beach. The 18-hole course is set in a fantastical Jurassic landscape with life-size animatronic dinosaurs that move and roar, alongside caves, waterfalls, a smoking volcano, and lush tropical vegetation.

The on-site "Flintstone"-style restaurant and bar sits elevated above the course, offering panoramic views of Kata Bay — making it a popular spot for sunset drinks and dinner even for non-golfers. The course is well-lit for evening play and stays open until 11 PM in high season.

Best for: Families with kids of all ages, couples on a fun date night, groups. Allow 1–1.5 hours for the course. Pro tip: arrive around 5:30 PM, play 18 holes as the sun sets, then have dinner at the restaurant. Located next to Surf House Kata — combine both for a full evening.',
  meeting_point = '43 Karon Rd, Kata Beach, Karon, Phuket 83100, Thailand',
  meeting_point_lat = 7.8217,
  meeting_point_lng = 98.2978,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["18-hole Jurassic-themed course","Life-size animatronic dinosaurs","Caves, waterfalls & erupting volcano","Panoramic restaurant & bar","Open until 11 PM in high season"]'::jsonb,
  includes = '["Golf club, ball & scorecard"]'::jsonb,
  excludes = '["Food & drinks","Souvenir photos"]'::jsonb,
  external_link = 'https://www.dinopark.com',
  booking_url = 'https://www.dinopark.com',
  age_restriction = 0,
  location_name = 'Kata Beach, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000008';

-- 9. Phuket Aquarium
UPDATE experiences SET
  description_en = 'Government-run marine aquarium at Cape Panwa showcasing Andaman Sea species. Features an underwater tunnel, touch pool, seahorse exhibits, and Thailand''s first Omura''s whale skeleton display. Small but educational and budget-friendly. Great rainy-day option for families with kids under 10.',
  description_ru = 'Государственный морской аквариум на мысе Панва с видами Андаманского моря. Подводный тоннель, контактный бассейн, морские коньки и первый в Таиланде скелет кита Омуры. Компактный, познавательный и бюджетный. Отличный вариант в дождь для семей с детьми до 10 лет.',
  long_description = 'Phuket Aquarium is a charming, government-operated marine research facility at Cape Panwa on Phuket''s southeastern tip. While smaller than mega-aquariums, it offers genuine educational value with well-maintained exhibits showcasing the rich marine biodiversity of the Andaman Sea and Gulf of Thailand.

The highlight is the walk-through underwater tunnel where sharks, rays, and tropical fish swim overhead. Kids love the touch pool where they can handle starfish and sea cucumbers. The recently added Omura''s whale skeleton — the first displayed in Thailand — is a genuine scientific treasure. Recently renovated interactive exhibits make learning about marine conservation engaging for young visitors.

Best for: Families with children under 10, marine life enthusiasts, budget-conscious visitors. Allow 1–1.5 hours. Very affordable entry fee. Combine with a visit to Cape Panwa viewpoint or lunch at a nearby seafood restaurant.',
  meeting_point = '51 Moo 8, Sakdidet Rd, Wichit, Cape Panwa, Phuket 83000, Thailand',
  meeting_point_lat = 7.8017,
  meeting_point_lng = 98.3938,
  start_times = ARRAY['08:30'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Underwater walk-through tunnel","Touch pool for kids (starfish, sea cucumbers)","Thailand''s first Omura''s whale skeleton","Seahorse & clownfish exhibits","Budget-friendly entry fee"]'::jsonb,
  includes = '["Access to all exhibits & touch pool"]'::jsonb,
  excludes = '["Parking (free)","Souvenir shop items"]'::jsonb,
  external_link = 'https://phuketaquarium.org',
  booking_url = 'https://phuketaquarium.org',
  age_restriction = 0,
  location_name = 'Cape Panwa, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000009';

-- 10. Tiger Kingdom
UPDATE experiences SET
  description_en = 'Get up close with real tigers in a safe, supervised environment. Choose from different size categories — smallest (cubs), small, medium, and big — each with different pricing. Professional photographers capture your moment. Located in Kathu, next to Go-Kart Speedway. Age 4+ for smallest tigers. Allow 1–2 hours.',
  description_ru = 'Близкое знакомство с настоящими тиграми в безопасной контролируемой среде. Выбирайте по размеру — от тигрят до взрослых, каждая категория с разной ценой. Профессиональные фотографы. В Кату, рядом с картинг-треком. Дети от 4 лет. Рассчитайте 1–2 часа.',
  long_description = 'Tiger Kingdom Phuket offers a unique opportunity to interact with real tigers of various ages and sizes in a controlled, supervised setting. Located in the Kathu district, the park lets you choose from four tiger categories: smallest (cubs, very popular with families), small, medium, and big — each priced differently.

Every enclosure visit is supervised by trained handlers, and professional photographers are on hand to capture your experience (photos available for purchase). The on-site café provides a comfortable spot to relax before or after your encounter.

Best for: Animal lovers, families (kids 4+ for smallest tigers), photographers. Allow 1–2 hours depending on how many categories you visit. Note: ethical considerations regarding captive animal attractions apply — please research and decide for yourself. Located directly adjacent to Go-Kart Speedway and near the Shooting Range.',
  meeting_point = '118/88 Moo 7, Kathu, Phuket 83120, Thailand',
  meeting_point_lat = 7.9050,
  meeting_point_lng = 98.3276,
  start_times = ARRAY['09:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Close encounters with real tigers","4 size categories (cubs to big)","Professional photographers on-site","Adjacent to Go-Kart Speedway","On-site café"]'::jsonb,
  includes = '["Tiger enclosure entry","Safety briefing","Professional supervision"]'::jsonb,
  excludes = '["Photo package (optional extra)","Food & drinks"]'::jsonb,
  external_link = 'https://www.tigerkingdom.com',
  booking_url = 'https://www.tigerkingdom.com',
  age_restriction = 4,
  location_name = 'Kathu, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000010';

-- 11. Surf House Kata (FlowRider)
UPDATE experiences SET
  description_en = 'Indoor FlowRider surf simulator right on Kata Beach. Learn to surf or bodyboard on a continuous artificial wave — no ocean experience needed. 1-hour sessions with professional instructors. Beachfront bar and restaurant with live DJs on weekends. Combine with Dino Park mini-golf next door for a full evening.',
  description_ru = 'Симулятор серфинга FlowRider на пляже Ката. Учитесь серфить или бодибордить на искусственной волне — опыт не нужен. Часовые сессии с инструкторами. Бар и ресторан у пляжа, DJ по выходным. Совместите с мини-гольфом Dino Park по соседству.',
  long_description = 'Surf House Kata brings year-round surfing to Phuket with its FlowRider — a continuous artificial wave machine that lets you surf or bodyboard regardless of ocean conditions. Located right on Kata Beach, the venue is equal parts surf school, bar, and restaurant.

Professional instructors guide beginners through the basics of balance and stance, while experienced riders can show off tricks on the powerful wave. Sessions last 1 hour and equipment (board, rash guard) is included. After surfing, grab a craft beer or cocktail at the beachfront bar — live DJs play on weekend evenings, creating a vibrant atmosphere.

Best for: Teens, young adults, couples, families with older kids (8+). Great evening activity — combine with Dino Park mini-golf next door for a complete night out at Kata. No prior surfing experience required. Open until 10 PM daily.',
  meeting_point = '4 Pakbang Rd, Kata Beach, Karon, Phuket 83100, Thailand',
  meeting_point_lat = 7.8196,
  meeting_point_lng = 98.2981,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["FlowRider surf simulator — surf year-round","Professional instructors for beginners","Beachfront bar & restaurant","Weekend live DJ nights","Right next to Dino Park mini-golf"]'::jsonb,
  includes = '["Board rental","Instruction","1-hour session"]'::jsonb,
  excludes = '["Food & drinks","Photos","Rash guard (provided free)"]'::jsonb,
  external_link = 'https://www.surfhousephuket.com',
  booking_url = 'https://www.surfhousephuket.com',
  age_restriction = 0,
  location_name = 'Kata Beach, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000011';

-- 12. Rawai Park — Kids Playground
UPDATE experiences SET
  description_en = 'Purpose-built kids park in Rawai with splash waterpark, outdoor playgrounds, indoor kids club, mini zoo, and carp pond — all in a lush garden. Designed for children aged 1–10. Parents relax at the on-site restaurant while kids play safely. Budget-friendly: 250 THB kids / 100 THB adults.',
  description_ru = 'Детский парк в Равай с аквапарком, площадками, крытым детским клубом, мини-зоопарком и прудом с карпами — в тропическом саду. Для детей 1–10 лет. Родители отдыхают в ресторане, пока дети играют. Бюджетно: 250 бат дети / 100 бат взрослые.',
  long_description = 'Rawai Park is southern Phuket''s favourite family destination — a purpose-built kids'' paradise set in beautiful tropical gardens in the Rawai area. The park offers a splash waterpark with slides and spray features, multiple outdoor playgrounds for different age groups, an air-conditioned indoor kids'' club, a mini zoo with rabbits and birds, and a carp feeding pond.

Everything is designed with safety in mind for children aged 1–10. The grounds are clean, well-maintained, and shaded. Parents can sit at the on-site family restaurant (Thai and international menu) with clear sightlines to the play areas. Weekday pricing is very affordable at just 250 THB for kids and 100 THB for adults.

Best for: Families with babies, toddlers, and children up to 10. Allow 2–4 hours. The indoor kids'' club and trampoline zone are available at additional cost. Great option for both rainy and sunny days. Located near Rawai Beach and Nai Harn.',
  meeting_point = '2/5 Viset Rd, Rawai, Mueang Phuket, Phuket 83130, Thailand',
  meeting_point_lat = 7.7768,
  meeting_point_lng = 98.3264,
  start_times = ARRAY['09:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Kids waterpark with slides & sprays","Indoor air-conditioned kids club","Mini zoo & carp feeding pond","Family restaurant on-site","Budget-friendly (250 THB kids)"]'::jsonb,
  includes = '["Access to outdoor playgrounds & waterpark"]'::jsonb,
  excludes = '["Indoor kids club (extra charge)","Trampoline zone (extra)","Food & drinks"]'::jsonb,
  external_link = 'https://rawaipark.com',
  booking_url = 'https://rawaipark.com',
  age_restriction = 0,
  location_name = 'Rawai, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000012';

-- 13. Boat Avenue Family Market
UPDATE experiences SET
  description_en = 'Free-entry evening family market at Boat Avenue in Cherng Talay. Thai street food, artisan crafts, live music, and kids play areas every Friday to Sunday. A relaxed, local-favourite night out with dozens of food stalls, fresh juices, clothing vendors, and a festive atmosphere.',
  description_ru = 'Бесплатный вечерний семейный рынок на Boat Avenue в Чернг Талай. Тайская еда, ремесленные товары, живая музыка и детские зоны — пятница–воскресенье. Любимое место местных для вечернего отдыха с десятками фуд-столлов и праздничной атмосферой.',
  long_description = 'Boat Avenue Family Market is a beloved weekend evening market in the heart of Cherng Talay, just 5 minutes from Bang Tao Beach. Every Friday through Sunday from 5 PM to 10 PM, the Boat Avenue complex transforms into a vibrant night market with dozens of food stalls serving Thai street food, grilled seafood, freshly made smoothies, and international bites.

Beyond food, you''ll find local artisans selling handmade jewellery, clothing, souvenirs, and art. Live music creates a festive backdrop, and dedicated kids'' play areas keep little ones entertained while parents browse and eat. The market is free to enter and has a relaxed, family-friendly vibe that both tourists and expats love.

Best for: Families, couples, foodie groups. Free entry. Allow 1–2 hours. Arrive around 6 PM for the best selection. Street parking and the Boat Avenue car park are available. Combine with dinner and shopping at the adjacent Boat Avenue lifestyle shops.',
  meeting_point = 'Boat Avenue, Cherng Talay, Phuket 83110, Thailand',
  meeting_point_lat = 7.9880,
  meeting_point_lng = 98.3090,
  start_times = ARRAY['17:00'],
  available_days = ARRAY['fri','sat','sun'],
  highlights = '["Free entry evening market","Thai street food & seafood stalls","Live music & festive atmosphere","Kids play areas","Artisan crafts & local souvenirs"]'::jsonb,
  includes = '["Free entry"]'::jsonb,
  excludes = '["Food & drinks (pay-per-vendor)","Purchases"]'::jsonb,
  age_restriction = 0,
  location_name = 'Cherng Talay, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000014';

-- 14. Phuket Shooting Range
UPDATE experiences SET
  description_en = 'Outdoor shooting range in Kathu offering pistols, rifles, and shotguns. Packages start from 10 rounds. All equipment provided with professional safety supervision. No experience required. Minimum age 12. Located near Go-Kart Speedway and Tiger Kingdom — combine all three for a full day of thrills.',
  description_ru = 'Стрелковый тир под открытым небом в Кату: пистолеты, винтовки, дробовики. Пакеты от 10 выстрелов. Всё оборудование включено, профессиональный инструктаж. Опыт не нужен. От 12 лет. Рядом с картингом и Tiger Kingdom — совместите все три.',
  long_description = 'Phuket Shooting Range offers a safe, supervised environment to experience firing real firearms in Kathu. The outdoor range provides a variety of weapons including 9mm pistols, .357 Magnums, shotguns, and rifles (including AR-15 style). Packages start from just 10 rounds, with options for larger packages at better per-round pricing.

Every shooter is accompanied by a professional instructor who handles loading, safety, and technique coaching. First-timers are welcome — most visitors have never fired a gun before. Eye and ear protection is provided.

Best for: Adults and teens (12+) seeking a unique experience. Allow 30–60 minutes depending on your package. Located on the same road as Go-Kart Speedway and Tiger Kingdom — all three make for an action-packed day in Kathu. No reservation needed, walk-ins welcome.',
  meeting_point = '46/158 Moo 6, Phrabaramee Rd, Kathu, Phuket 83120, Thailand',
  meeting_point_lat = 7.9052,
  meeting_point_lng = 98.3248,
  start_times = ARRAY['10:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Multiple firearm types (pistols, rifles, shotguns)","Professional instructor at your side","No experience needed — beginners welcome","Near Go-Kart Speedway & Tiger Kingdom","Walk-ins welcome, no reservation needed"]'::jsonb,
  includes = '["Firearm","Ammunition (per package)","Safety equipment (eye & ear protection)","Professional instruction"]'::jsonb,
  excludes = '["Extra ammunition rounds","Photos","Drinks"]'::jsonb,
  age_restriction = 12,
  location_name = 'Kathu, Phuket'
WHERE id = 'fa000001-0001-0001-0001-000000000016';

-- 15. Hanuman World (zipline entries)
UPDATE experiences SET
  description_en = 'Thailand''s biggest zipline park with over 40 platforms across multiple courses in pristine rainforest. Features the 400m-long Roller Zipline, sky walks, rope bridges, and a giant swing. Choose from 10, 18, or 32-platform courses. Suitable for ages 4–70 with a dedicated kids course. The most popular adventure activity in Phuket.',
  description_ru = 'Крупнейший зиплайн-парк Таиланда с более чем 40 платформами в нетронутом тропическом лесу. 400-метровый Roller Zipline, небесные тропы, верёвочные мосты и гигантские качели. Курсы на 10, 18 или 32 платформы. Для возраста 4–70 лет, детский курс. Самый популярный экстрим-аттракцион Пхукета.',
  long_description = 'Hanuman World is Phuket''s largest and most popular zipline adventure park, nestled in virgin rainforest on the island''s eastern hills. With over 40 platforms spread across multiple courses, it dwarfs all competitors in scale and variety.

The star attraction is the 400-metre Roller Zipline — the longest in Southeast Asia — where you glide on a wheeled carriage through the canopy. Other highlights include dramatic sky walks between trees at 40m height, rope bridges, abseiling stations, and a thrilling giant swing. Three course options (10, 18, or 32 platforms) let you choose based on your time and budget.

Safety is paramount with a patented double-clip system ensuring you''re always connected. A dedicated kids'' course makes it accessible for children as young as 4. Hotel transfers are included in select packages.

Best for: Families (kids 4+), adventure seekers, fitness enthusiasts, groups. Allow 2–4 hours depending on course length. Morning sessions are cooler and better for wildlife spotting.',
  meeting_point = '105 Moo 4, Chao Fa Tawan Tok Rd, Wichit, Phuket 83000, Thailand',
  meeting_point_lat = 7.8730,
  meeting_point_lng = 98.3230,
  start_times = ARRAY['08:00','10:00','13:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["40+ platforms — Thailand''s biggest zipline park","400m Roller Zipline (Southeast Asia''s longest)","Sky walks at 40m height & rope bridges","Dedicated kids course (age 4+)","Double-clip safety system"]'::jsonb,
  includes = '["Hotel transfer (select packages)","All safety equipment","Professional guides","Insurance"]'::jsonb,
  excludes = '["Photo & video package (extra)","Lunch","Gratuities"]'::jsonb,
  external_link = 'https://hanumanworldphuket.com',
  booking_url = 'https://hanumanworldphuket.com',
  age_restriction = 4,
  location_name = 'Wichit, Phuket'
WHERE id = 'e1000001-0001-0001-0001-000000000003';

-- Also update the Roller Zipline standalone
UPDATE experiences SET
  description_en = 'Experience Hanuman World''s signature 400m Roller Zipline — the longest in Southeast Asia. Glide on a wheeled carriage through the rainforest canopy at breathtaking speed. Standalone entry option for those short on time. Includes safety equipment and guide. Age 4+.',
  description_ru = 'Испытайте фирменный 400-метровый Roller Zipline Hanuman World — самый длинный в ЮВА. Скользите на тележке через полог тропического леса на захватывающей скорости. Отдельный билет для тех, у кого мало времени. Оборудование и гид включены. От 4 лет.',
  meeting_point = '105 Moo 4, Chao Fa Tawan Tok Rd, Wichit, Phuket 83000, Thailand',
  meeting_point_lat = 7.8730,
  meeting_point_lng = 98.3230,
  start_times = ARRAY['08:00','10:00','13:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["400m Roller Zipline — Southeast Asia''s longest","Wheeled carriage through rainforest canopy","Standalone entry (no full course needed)","Professional safety equipment","Suitable for ages 4+"]'::jsonb,
  includes = '["Roller Zipline ride","Safety equipment","Guide"]'::jsonb,
  excludes = '["Hotel transfer","Photos","Full course access"]'::jsonb,
  external_link = 'https://hanumanworldphuket.com',
  booking_url = 'https://hanumanworldphuket.com',
  age_restriction = 4,
  location_name = 'Wichit, Phuket'
WHERE id = 'e1000001-0001-0001-0001-000000000004';

-- Skywalk standalone
UPDATE experiences SET
  description_en = 'Walk along Hanuman World''s dramatic skywalks — suspended walkways at 40 metres above the jungle floor. Take in panoramic views of the pristine rainforest canopy, spot birds and wildlife, and test your nerve on the transparent-floor sections. Standalone entry available without full zipline course.',
  description_ru = 'Прогулка по небесным тропам Hanuman World — подвесные дорожки на высоте 40 метров над джунглями. Панорамные виды тропического леса, наблюдение за птицами и прозрачные участки пола. Отдельный вход без полного зиплайн-курса.',
  meeting_point = '105 Moo 4, Chao Fa Tawan Tok Rd, Wichit, Phuket 83000, Thailand',
  meeting_point_lat = 7.8730,
  meeting_point_lng = 98.3230,
  start_times = ARRAY['08:00','10:00','13:00'],
  available_days = ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  highlights = '["Skywalks at 40m above jungle floor","Panoramic rainforest views","Transparent-floor sections","Wildlife & bird spotting","Standalone entry available"]'::jsonb,
  includes = '["Skywalk access","Safety equipment","Guide"]'::jsonb,
  excludes = '["Hotel transfer","Photos","Zipline access"]'::jsonb,
  external_link = 'https://hanumanworldphuket.com',
  booking_url = 'https://hanumanworldphuket.com',
  age_restriction = 4,
  location_name = 'Wichit, Phuket'
WHERE id = 'e1000001-0001-0001-0001-000000000005';

-- =============================================
-- ENRICH TOURS WITH REAL DATA
-- =============================================

-- Elephant Sanctuary tours (update all 3 variants)
UPDATE experiences SET
  description_en = 'Ethical elephant sanctuary experience where you observe, feed, and walk alongside rescued elephants in their natural habitat — no riding, no tricks. Learn about each elephant''s rescue story from knowledgeable guides. Includes mud bath observation and waterhole visit. A meaningful, educational experience for all ages.',
  description_ru = 'Этичный визит в слоновий приют — наблюдение, кормление и прогулка рядом со спасёнными слонами в естественной среде. Без катания, без трюков. Узнайте историю каждого слона от гидов. Грязевые ванны и водопой. Значимый и познавательный опыт для всех возрастов.',
  long_description = 'Visit one of Phuket''s ethical elephant sanctuaries for a deeply moving experience with rescued elephants. Unlike traditional elephant camps, these sanctuaries practice a strict no-riding, no-performance policy — the elephants roam freely in forested habitats and engage in natural behaviours.

Your half-day visit begins with a briefing about the sanctuary''s rescue mission, followed by preparing fruit baskets to feed the elephants by hand. Walk alongside these gentle giants as they forage, watch them play in mud baths, and observe them cooling off at the waterhole. Knowledgeable guides share each elephant''s personal rescue story.

Best for: Families with children of all ages, animal lovers, ethically-minded travellers. Hotel pickup and drop-off included. Allow 3–4 hours total. Morning sessions (8 AM) are cooler and elephants are more active. Wear clothes you don''t mind getting muddy.',
  highlights = '["Ethical no-riding sanctuary","Feed elephants by hand","Mud bath & waterhole observation","Learn rescue stories from guides","Hotel transfer included"]'::jsonb,
  includes = '["Hotel round-trip transfer","Fruit for elephant feeding","Guide","Light refreshments","Insurance"]'::jsonb,
  excludes = '["Lunch","Photos (bring your own camera)","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id IN ('e1000001-0001-0001-0001-000000000001', 'e1000001-0001-0001-0001-000000000002', '520a1043-64e2-44d8-b484-3000b86f7c51', '854d2088-0c04-405e-8608-63d4d8b5ce75', '337388a5-ac3f-4b92-b625-f7341993e2f6');

-- Big Buddha & Temples Tour (update all 3)
UPDATE experiences SET
  description_en = 'Visit Phuket''s most iconic landmark — the 45-metre Big Buddha statue atop Nakkerd Hill — with panoramic 360° views of the island. Continue to Wat Chalong, Phuket''s largest and most important Buddhist temple. Learn about Thai Buddhist culture, history, and traditions from an English-speaking guide.',
  description_ru = 'Посетите главную достопримечательность Пхукета — 45-метровую статую Большого Будды на холме Наккерд с панорамным видом на 360°. Затем — Ват Чалонг, крупнейший буддийский храм острова. Узнайте о тайской буддийской культуре и традициях от англоговорящего гида.',
  long_description = 'This cultural half-day tour takes you to Phuket''s two most significant religious sites. Start at the majestic Big Buddha (Phra Phutthamingmongkol Akenakkiri) — a 45-metre marble-clad statue sitting atop Nakkerd Hill at 400 metres elevation. The viewpoint offers spectacular 360° panoramas of Chalong Bay, Kata, Karon, and the southern coastline.

Next, visit Wat Chalong (Wat Chaiyathararam), the island''s most revered Buddhist temple. Explore the ornate Grand Pagoda housing a splinter of Lord Buddha''s bone, the beautiful main hall with its gilded statues, and the peaceful temple grounds.

Best for: All travellers — cultural enthusiasts, photographers, first-time Phuket visitors. Allow 3–4 hours. Dress respectfully (covered shoulders and knees) — sarongs available on-site. Morning visits offer clearer views and fewer crowds. Hotel pickup included.',
  highlights = '["45-metre Big Buddha statue","360° panoramic island views","Wat Chalong — Phuket''s most sacred temple","Grand Pagoda with Buddha relic","English-speaking cultural guide"]'::jsonb,
  includes = '["Hotel pickup & drop-off","English-speaking guide","Temple entry"]'::jsonb,
  excludes = '["Lunch","Drinks","Personal purchases","Donations"]'::jsonb,
  age_restriction = 0
WHERE id IN ('8aa354c9-58b3-4308-85f1-0280c995de02', 'd71c7aa6-6cc6-41a4-9100-7b17a6b6fb89', '43d5cb55-1d8b-4610-86bc-09bfbe750688');

-- James Bond Island Tours (update all 3)
UPDATE experiences SET
  description_en = 'Explore the iconic James Bond Island (Khao Phing Kan) from "The Man with the Golden Gun" and the stunning limestone karsts of Phang Nga Bay. Kayak through sea caves and hidden lagoons, visit a floating Muslim fishing village, and enjoy lunch surrounded by dramatic scenery.',
  description_ru = 'Посетите легендарный остров Джеймса Бонда (Кхао Пинг Кан) из фильма "Человек с золотым пистолетом" и впечатляющие известняковые скалы залива Пханг Нга. Каякинг по морским пещерам, плавучая мусульманская деревня и обед среди потрясающих пейзажей.',
  long_description = 'Phang Nga Bay is one of Thailand''s most spectacular natural wonders — a vast seascape of towering limestone karsts, hidden lagoons, and sea caves. This full-day tour takes you to the bay''s most famous spot: James Bond Island (Khao Phing Kan), made world-famous by the 1974 film "The Man with the Golden Gun."

Highlights include kayaking through dramatic sea caves and into hidden hongs (collapsed cave lagoons), visiting Koh Panyi — a fascinating Muslim fishing village built entirely on stilts over the water — and cruising past dozens of towering karst formations. Lunch is typically served at Koh Panyi or on the boat.

Best for: All travellers, families (kids 4+), couples, photographers. Full-day tour (8 AM – 5 PM). Hotel pickup included. Choose between longtail boat (more authentic), speedboat (faster), or big boat (most comfortable) options depending on the tour operator. Bring sunscreen, hat, and waterproof bag for your phone.',
  highlights = '["James Bond Island (Khao Phing Kan)","Kayaking through sea caves & hidden lagoons","Koh Panyi — floating fishing village","Stunning limestone karst scenery","Full-day adventure with lunch"]'::jsonb,
  includes = '["Hotel pickup & drop-off","Boat transportation","Kayaking","Lunch","National park fee","Guide","Insurance"]'::jsonb,
  excludes = '["Drinks","Personal purchases","Tips","Professional photos"]'::jsonb,
  age_restriction = 0
WHERE id IN ('1773a914-663a-4cfa-b8e0-3f78ec73b38a', 'cb34f286-caa1-4593-99fc-1e2aa1274bd2', '6a26c077-f423-4ac8-a3ad-8be8754949d8');

-- ATV Jungle Adventure (update both)
UPDATE experiences SET
  description_en = 'Ride ATVs through Phuket''s jungle trails, rubber plantations, and muddy tracks. Choose from 30-minute, 1-hour, or 2-hour programs. No driving licence needed — full instruction and safety gear provided. Suitable for beginners. Kids can ride as passengers with an adult driver.',
  description_ru = 'Катайтесь на квадроциклах по джунглям Пхукета, каучуковым плантациям и грязевым тропам. Программы на 30 минут, 1 час или 2 часа. Права не нужны — полный инструктаж и защитное снаряжение. Подходит для начинающих. Дети могут быть пассажирами.',
  long_description = 'ATV jungle adventure is one of Phuket''s most popular off-road experiences, taking you through the island''s interior landscapes that most tourists never see. Routes wind through dense jungle trails, rubber plantations, coconut groves, and muddy tracks — with viewpoints overlooking Phuket''s hills and coastline.

Three duration options are available: a 30-minute introductory ride (great for first-timers), a 1-hour standard course (most popular), and a 2-hour extended adventure covering more remote terrain with river crossings. All ATVs are automatic — no driving licence or prior experience required. Professional guides lead every group.

Best for: Adventure seekers, couples, families (kids ride as passengers), groups. Wear closed-toe shoes and clothes you don''t mind getting muddy. Helmets and safety gear provided. Hotel pickup available. Morning rides are cooler; sunset rides are more atmospheric.',
  highlights = '["Jungle trails & rubber plantations","30-min, 1-hour, or 2-hour programs","No licence needed — full instruction","Beginners welcome","Scenic viewpoints & mud tracks"]'::jsonb,
  includes = '["ATV rental","Helmet & safety gear","Professional guide","Basic instruction","Insurance"]'::jsonb,
  excludes = '["Hotel transfer (some providers)","Photos","Drinks","Shower facilities (some camps)"]'::jsonb,
  age_restriction = 0
WHERE id IN ('4e40c1ea-e059-4e80-a26c-01630d97d290', '6c8eb43c-1949-44cc-b32b-3afcecf5a969');

-- Thai Cooking Classes (update all variants)
UPDATE experiences SET
  description_en = 'Learn to cook authentic Thai dishes in a hands-on cooking class. Visit a local market to select fresh ingredients, then prepare 3–5 dishes including curries, pad Thai, and tom yum soup. Take home recipes to recreate your favourites. Suitable for all skill levels including children.',
  description_ru = 'Научитесь готовить настоящие тайские блюда на практическом кулинарном мастер-классе. Посетите местный рынок за свежими ингредиентами, затем приготовьте 3–5 блюд: карри, пад-тай, суп том-ям. Рецепты — домой. Для любого уровня, включая детей.',
  long_description = 'Thai cooking classes are one of the most rewarding cultural experiences in Phuket. Most classes begin with a guided visit to a local fresh market where your chef-instructor explains Thai ingredients — galangal, lemongrass, kaffir lime, fresh chillies, and exotic herbs you''ve never seen.

Back at the cooking school, you''ll prepare 3–5 dishes at your own cooking station. Typical menus include green or red curry paste from scratch, pad Thai, tom yum or tom kha soup, spring rolls, and a dessert like mango sticky rice. Vegetarian and vegan options are always available. You eat everything you cook!

Best for: Foodies, couples, families (kids 6+ can participate), solo travellers. Half-day classes run 3–4 hours (morning or afternoon); full-day classes include market visit, 5+ dishes, and lunch. No cooking experience needed. Hotel pickup included with most operators. You''ll receive a recipe booklet to take home.',
  highlights = '["Hands-on cooking (3–5 dishes)","Local market visit with chef guide","Learn to make curry paste from scratch","Eat everything you cook","Recipe booklet to take home"]'::jsonb,
  includes = '["All ingredients","Cooking station & equipment","Chef instruction","Market tour","Recipe booklet","Meals (what you cook)"]'::jsonb,
  excludes = '["Hotel transfer (some providers)","Drinks (water provided)","Apron to keep"]'::jsonb,
  age_restriction = 0
WHERE id IN ('063fe9dd-df32-4a49-812a-ee479cf738ec', '1e38938a-07d7-4c09-92fa-4693b574174e', 'e1000001-0001-0001-0001-000000000010', 'e1000001-0001-0001-0001-000000000011');

-- Hong by Starlight (Sea Cave Kayaking)
UPDATE experiences SET
  description_en = 'An exclusive evening kayaking tour through the sea caves and hidden hongs (collapsed cave lagoons) of Phang Nga Bay. Paddle under starlit skies as bioluminescent plankton glows in the water around you. Includes sunset dinner on the boat. Limited to small groups for an intimate experience.',
  description_ru = 'Эксклюзивный вечерний тур на каяках по морским пещерам и скрытым «хонгам» (обвалившимся пещерным лагунам) залива Пханг Нга. Гребите под звёздным небом, наблюдая свечение биолюминесцентного планктона. Ужин на закате на лодке. Малые группы для камерного опыта.',
  long_description = 'Hong by Starlight is widely regarded as one of the most magical experiences available in Phuket. Unlike daytime Phang Nga Bay tours, this evening departure lets you explore the bay''s hidden hongs (collapsed cave lagoons only accessible by kayak) in the tranquil twilight and darkness.

As the sun sets, you''ll paddle through narrow cave passages into secret lagoons surrounded by towering limestone walls. After dark, the real magic begins: bioluminescent plankton creates an ethereal blue-green glow in the water with every paddle stroke. The experience is enhanced by the sounds of nature — eagle calls, cicadas, and the gentle lap of water against stone.

A sunset dinner of Thai cuisine is served aboard the support vessel. Groups are kept deliberately small (max 20 guests) to preserve the serene atmosphere. This is the original — created by legendary guide Mr. Caveman (John Gray).

Best for: Couples (extremely romantic), nature lovers, photographers, families with older kids (8+). Full evening tour (12:30 PM – 9:30 PM). Hotel pickup included. Book well in advance — this sells out quickly in high season.',
  highlights = '["Bioluminescent plankton — glowing water at night","Sea caves & hidden lagoons by kayak","Sunset dinner on the boat","Small groups (max 20 guests)","Original John Gray Sea Canoe experience"]'::jsonb,
  includes = '["Hotel pickup & drop-off","Professional kayak guide","All kayak equipment","Sunset dinner & drinks","National park fee","Insurance"]'::jsonb,
  excludes = '["Alcoholic drinks","Professional photos","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id = 'e1000001-0001-0001-0001-000000000006';

-- Koh Phanak Sailing Boat Trip
UPDATE experiences SET
  description_en = 'Sail to Koh Phanak in Phang Nga Bay aboard a traditional boat and explore spectacular sea caves and collapsed cave lagoons (hongs) accessible only at certain tides. Kayak through narrow passages into hidden chambers with dramatic stalactites. A more authentic, less crowded alternative to speedboat tours.',
  description_ru = 'Парусная поездка к Ко Панак в заливе Пханг Нга — исследуйте морские пещеры и скрытые лагуны (хонги), доступные только при определённых приливах. Каякинг по узким проходам в скрытые пещеры со сталактитами. Более аутентичная и менее многолюдная альтернатива спидботам.',
  long_description = 'Koh Phanak is one of Phang Nga Bay''s hidden gems — a limestone island riddled with sea caves, tunnels, and collapsed hongs that few tourists visit. This sailing boat trip offers a slower, more authentic alternative to the crowded speedboat tours, letting you absorb the bay''s ethereal beauty at a natural pace.

The main highlight is kayaking through Koh Phanak''s cave system at the right tide — navigating narrow, low-ceilinged passages that open into spectacular hidden lagoons surrounded by sheer limestone walls draped in stalactites. Your guide will time the visit to match tidal conditions for optimal cave access.

Best for: Nature lovers, photographers, couples seeking a romantic alternative to mass tours, families. Full-day tour with Thai lunch served on board. Hotel pickup included. Smaller group sizes than standard Phang Nga Bay tours.',
  highlights = '["Sail to Koh Phanak — Phang Nga Bay''s hidden gem","Kayak through spectacular sea caves","Hidden lagoons with stalactites","Smaller groups, less crowded","Thai lunch served on board"]'::jsonb,
  includes = '["Hotel pickup & drop-off","Sailing boat transportation","Kayak & equipment","Thai lunch & drinks","National park fee","Guide","Insurance"]'::jsonb,
  excludes = '["Alcoholic drinks","Professional photos","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id = 'e1000001-0001-0001-0001-000000000007';

-- Private Boat Charter
UPDATE experiences SET
  description_en = 'Private speedboat charter for up to 4 people — design your own itinerary. Visit secret beaches, snorkel pristine reefs, explore hidden coves, or cruise to Phi Phi, Racha, or Coral Island at your own pace. Captain, fuel, snorkeling gear, and cooler box included. The ultimate flexible day on the water.',
  description_ru = 'Частный спидбот на 4 человека — составьте свой маршрут. Секретные пляжи, снорклинг на нетронутых рифах, скрытые бухты или круиз к Пхи-Пхи, Рача или Коралловому острову. Капитан, топливо, снаряжение и кулер включены. Максимальная свобода на воде.',
  long_description = 'A private boat charter is the ultimate way to explore Phuket''s surrounding islands and coastline on your own terms. You choose the destinations — popular options include the stunning Phi Phi Islands, Racha Yai for world-class snorkeling, Coral Island for family-friendly beaches, or hidden coves along Phuket''s south coast.

Your charter includes a professional captain who knows every bay and reef, plus snorkeling gear, a cooler box (bring your own drinks), and basic fishing equipment. Most charters depart from Chalong Pier or Rawai and run from 9 AM to 5 PM.

Best for: Couples wanting a romantic day, families with kids, small groups of friends, honeymoon travellers. Book at least 2 days in advance. Add-ons like lunch catering, a Thai cook on board, or wakeboarding equipment available with some operators.',
  highlights = '["Design your own itinerary","Visit Phi Phi, Racha, Coral Island or hidden coves","Captain, fuel & snorkel gear included","Up to 4 guests — fully private","Cooler box for your drinks"]'::jsonb,
  includes = '["Private speedboat & captain","Fuel","Snorkeling gear","Cooler box","Insurance"]'::jsonb,
  excludes = '["Food & drinks (bring your own or add catering)","National park fees","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id = 'e1000001-0001-0001-0001-000000000008';

-- Private Speedboat Trip (Phang Nga or Phi Phi)
UPDATE experiences SET
  description_en = 'Private speedboat day trip to either Phang Nga Bay or Phi Phi Islands — you choose. Visit James Bond Island or Maya Bay, snorkel crystal-clear waters, kayak through sea caves, and enjoy a beachside lunch. Captain and guide included. Perfect for families and small groups wanting a private experience.',
  description_ru = 'Частная поездка на спидботе в залив Пханг Нга или на острова Пхи-Пхи — выбирайте. Остров Джеймса Бонда или бухта Майя, снорклинг, каякинг в морских пещерах и обед на пляже. Капитан и гид включены. Идеально для семей и малых групп.',
  long_description = 'Choose your adventure: Phang Nga Bay or Phi Phi Islands, both explored in complete privacy aboard your own speedboat. The Phang Nga option takes you to James Bond Island, sea caves for kayaking, and the floating village of Koh Panyi. The Phi Phi option visits Maya Bay (made famous by "The Beach"), Pileh Lagoon, Monkey Beach, and pristine snorkeling spots.

Both routes include an experienced captain and English-speaking guide, snorkeling equipment, and lunch (either at a local restaurant or beachside). The speedboat ensures you reach destinations faster than big boats, giving you more time to explore and less time in transit.

Best for: Families, couples, groups of friends. Full-day (9 AM – 5 PM). Departs from Chalong Pier or Boat Lagoon. Book 2+ days ahead for availability. National park fees may apply and are usually included in the price.',
  highlights = '["Choose: Phang Nga Bay OR Phi Phi Islands","Private speedboat — no sharing","James Bond Island or Maya Bay","Snorkeling & kayaking included","Captain & English-speaking guide"]'::jsonb,
  includes = '["Private speedboat & captain","English-speaking guide","Snorkeling gear","Kayak (Phang Nga option)","Lunch","National park fees","Insurance"]'::jsonb,
  excludes = '["Drinks","Professional photos","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id = 'e1000001-0001-0001-0001-000000000009';

-- Similan Islands Snorkeling (update both)
UPDATE experiences SET
  description_en = 'Day trip to the Similan Islands — Thailand''s premier snorkeling and diving destination with crystal-clear waters and vibrant coral reefs. Visit iconic Sail Rock (Donald Duck Bay), snorkel 3–4 world-class sites, and relax on pristine white-sand beaches. Open season: October 15 – May 15 only.',
  description_ru = 'Дневная поездка на Симиланские острова — лучшее место для снорклинга в Таиланде с кристально чистой водой и яркими коралловыми рифами. Знаменитая Sail Rock, 3–4 снорклинг-сайта и белоснежные пляжи. Сезон: 15 октября — 15 мая.',
  long_description = 'The Similan Islands are a national marine park consistently ranked among the world''s top 10 dive and snorkel destinations. Located 84 km northwest of Phuket, these 11 pristine islands offer visibility up to 30 metres, stunning coral gardens, and encounters with sea turtles, reef sharks, manta rays, and thousands of tropical fish species.

A typical day trip departs early (6–7 AM from Khao Lak pier, 1.5 hours from Phuket) and includes speedboat transfers, 3–4 snorkeling stops at the best sites, a visit to the iconic Sail Rock (nicknamed Donald Duck Bay), beach time on powder-white sand, and a Thai lunch. Full snorkeling equipment is provided.

Best for: Snorkelers, nature lovers, photographers, families (kids 4+). Open only October 15 – May 15 (park closes for monsoon season). Book early in high season (December–March). Bring reef-safe sunscreen, hat, and underwater camera. Early departure required (5–6 AM pickup from Phuket hotels). Allow a full day.',
  highlights = '["World-class snorkeling — visibility up to 30m","Iconic Sail Rock (Donald Duck Bay)","Sea turtles, reef sharks & tropical fish","Pristine white-sand beaches","3–4 snorkeling stops included"]'::jsonb,
  includes = '["Hotel pickup & drop-off","Speedboat transfer","Snorkeling equipment","3–4 snorkeling stops","Thai lunch & drinks","National park fee","Guide","Insurance"]'::jsonb,
  excludes = '["Underwater camera rental","Professional photos","Tips"]'::jsonb,
  age_restriction = 4
WHERE id IN ('c7fa678c-b8a3-493a-a5a2-068ac5351e28', 'ebd84de7-f4c5-4a2b-bdf3-438a4920e22b');

-- Sunset Dinner Cruise (update both)
UPDATE experiences SET
  description_en = 'Romantic sunset cruise along Phuket''s coastline aboard a traditional Thai boat or luxury catamaran. Watch the sun set over the Andaman Sea while enjoying a Thai-international dinner buffet, live music, and open bar. Passes by Promthep Cape, Nai Harn Bay, and Coral Island.',
  description_ru = 'Романтический круиз на закате вдоль побережья Пхукета на традиционной тайской лодке или катамаране. Закат над Андаманским морем, тайско-международный ужин-буфет, живая музыка и открытый бар. Мимо мыса Промтхеп, бухты Най Харн и Кораллового острова.',
  long_description = 'A sunset dinner cruise is one of Phuket''s most romantic and memorable experiences. As the boat departs in the late afternoon, you''ll cruise along Phuket''s stunning southern and western coastline, passing landmarks like Promthep Cape, Nai Harn Bay, and the silhouette of Coral Island against the setting sun.

On board, a Thai-international dinner buffet is served as the sky transforms through golden, pink, and purple hues. Most cruises include an open bar (beer, wine, cocktails, soft drinks) and live music or entertainment. Choose from traditional converted Thai junk boats (atmospheric and unique) or modern luxury catamarans (smoother ride, more space).

Best for: Couples (ideal date night or anniversary), families, groups celebrating occasions. Typically 5:30 PM – 8:30 PM. Hotel pickup included. Book at least 1 day in advance. Dress code is smart casual. Not recommended for those prone to seasickness (the boat stays in sheltered waters, but there can be gentle swell).',
  highlights = '["Sunset over the Andaman Sea","Thai-international dinner buffet","Open bar included","Live music & entertainment","Passes Promthep Cape & Nai Harn Bay"]'::jsonb,
  includes = '["Hotel pickup & drop-off","Dinner buffet","Open bar (beer, wine, cocktails, soft drinks)","Live music","Insurance"]'::jsonb,
  excludes = '["Premium spirits","Professional photos","Gratuities"]'::jsonb,
  age_restriction = 0
WHERE id IN ('961a6cf0-0f3f-41ec-b3a0-a601e136c957', '6c89543b-102a-4eb0-b8bb-d8c87cc51cfd');

-- Khao Sok National Park
UPDATE experiences SET
  description_en = 'Full-day excursion to Khao Sok National Park — one of the world''s oldest evergreen rainforests. Explore Cheow Lan Lake with its dramatic limestone karsts, kayak through emerald waters, hike jungle trails, and spot wildlife including gibbons, hornbills, and wild elephants. 2.5 hours from Phuket.',
  description_ru = 'Полнодневная экскурсия в национальный парк Кхао Сок — один из древнейших тропических лесов мира. Озеро Чео Лан с известняковыми скалами, каякинг, джунгли-хайкинг и наблюдение за дикой природой: гиббоны, птицы-носороги, дикие слоны. 2,5 часа от Пхукета.',
  long_description = 'Khao Sok National Park is one of Thailand''s most spectacular natural areas — home to the world''s oldest evergreen rainforest (160+ million years), older than the Amazon. Located about 2.5 hours north of Phuket in Surat Thani province, this full-day tour takes you into a primeval landscape of soaring limestone karsts, dense jungle, and the stunning Cheow Lan Lake.

The lake is the centrepiece: a vast reservoir surrounded by 300-metre limestone cliffs draped in tropical vegetation, often compared to a freshwater version of Halong Bay. Activities include longtail boat cruises across the lake, kayaking in emerald waters, swimming in secluded coves, and short jungle hikes where you might spot gibbons, macaques, hornbills, and other wildlife.

Best for: Nature lovers, photographers, active travellers, families (kids 6+). Full-day tour with early morning departure (6–7 AM) and return around 7–8 PM. Lunch included. Wear comfortable hiking shoes and bring insect repellent. 2-day/1-night options with floating bungalow stays are also available for a deeper experience.',
  highlights = '["World''s oldest evergreen rainforest (160M+ years)","Cheow Lan Lake with 300m limestone cliffs","Kayaking on emerald waters","Jungle hiking & wildlife spotting","Longtail boat cruise"]'::jsonb,
  includes = '["Hotel pickup & drop-off","National park fee","Longtail boat cruise","Kayaking","Jungle hike","Thai lunch","Guide","Insurance"]'::jsonb,
  excludes = '["Drinks","Professional photos","Overnight stay (separate booking)","Tips"]'::jsonb,
  age_restriction = 0
WHERE id = '4896a90c-77e9-4dac-a420-303f08533eeb';

-- Muay Thai Training
UPDATE experiences SET
  description_en = 'Train with professional Muay Thai fighters at an authentic Thai boxing camp. Learn fundamental techniques — stance, punches, kicks, knees, elbows, and clinch work. Suitable for all fitness levels from complete beginners to experienced fighters. A genuine cultural and physical experience.',
  description_ru = 'Тренировка с профессиональными бойцами Муай Тай в аутентичном боксёрском лагере. Основные техники: стойка, удары руками, ногами, коленями, локтями и клинч. Для любого уровня — от новичков до опытных бойцов. Настоящий культурный и спортивный опыт.',
  long_description = 'Muay Thai (Thai boxing) is Thailand''s national sport, and training at a real Muay Thai camp in Phuket is one of the island''s most authentic cultural experiences. Professional trainers — many of them former competitive fighters — guide you through the fundamentals of this ancient martial art.

Sessions typically last 1–2 hours and cover proper stance, footwork, jab-cross combinations, roundhouse kicks, knee and elbow strikes, and basic clinch techniques. All equipment (gloves, pads, wraps) is provided. Classes are adapted to your fitness level — whether you''ve never thrown a punch or you''re an experienced martial artist.

Best for: Fitness enthusiasts, martial arts fans, travellers seeking authentic experiences. All ages (12+ for full sessions, some camps offer kids classes 6+). Single sessions and multi-day packages available. Morning sessions (7–9 AM) are cooler. Bring a change of clothes, towel, and water bottle.',
  highlights = '["Train with professional Muay Thai fighters","All fitness levels — beginners welcome","Learn kicks, punches, knees & elbows","All equipment provided","Authentic cultural experience"]'::jsonb,
  includes = '["Training session (1–2 hours)","Professional trainer","Gloves, pads & wraps","Water"]'::jsonb,
  excludes = '["Hotel transfer (some camps)","Personal towel","Muay Thai shorts (available to buy)"]'::jsonb,
  age_restriction = 0
WHERE id = '4010f503-b054-4dc4-83ff-5b97ad96786d';

-- Migration: 20260207103353_fad2f613-aa30-41ae-8753-29af8314eab1.sql
-- Add 'gym' to the entity_type check constraint
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;
ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY['property','service','experience','transport','restaurant','yacht','tour','vehicle','clinic','babysitter','legal_service','bank','salon','event','gym']));
-- Migration: 20260207104916_b54e1ea6-ab43-4a17-bd94-2780a0ad7285.sql

-- LifeOS Routes: guided paths from pain → action → relief
CREATE TABLE public.lifeos_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_situation_id UUID NOT NULL REFERENCES public.life_situations(id) ON DELETE CASCADE,
  
  -- Pain-first context
  pain_type TEXT NOT NULL DEFAULT 'uncertainty',
  emotional_state TEXT NOT NULL DEFAULT 'anxious',
  risk_level TEXT NOT NULL DEFAULT 'medium',
  
  -- Route blocks (bilingual)
  recognition_en TEXT NOT NULL,
  recognition_ru TEXT NOT NULL,
  reassurance_en TEXT NOT NULL,
  reassurance_ru TEXT NOT NULL,
  what_matters_en TEXT[] NOT NULL DEFAULT '{}',
  what_matters_ru TEXT[] NOT NULL DEFAULT '{}',
  
  -- Recommended path
  recommended_entity_type TEXT,
  recommended_entity_id UUID,
  recommended_title_en TEXT NOT NULL,
  recommended_title_ru TEXT NOT NULL,
  recommended_why_en TEXT NOT NULL,
  recommended_why_ru TEXT NOT NULL,
  
  -- Action block
  cta_text_en TEXT NOT NULL DEFAULT 'Get help now',
  cta_text_ru TEXT NOT NULL DEFAULT 'Получить помощь',
  cta_type TEXT NOT NULL DEFAULT 'navigate',
  cta_target TEXT,
  
  -- Alternatives (max 2 entity references shown as small cards)
  alternative_entity_ids UUID[] DEFAULT '{}',
  
  -- Next routes (situation codes)
  next_routes TEXT[] DEFAULT '{}',
  next_routes_labels_en TEXT[] DEFAULT '{}',
  next_routes_labels_ru TEXT[] DEFAULT '{}',
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT lifeos_routes_unique_situation UNIQUE(life_situation_id)
);

-- RLS
ALTER TABLE public.lifeos_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routes are publicly readable"
  ON public.lifeos_routes FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_lifeos_routes_updated_at
  BEFORE UPDATE ON public.lifeos_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 9 routes

-- 1. Just Arrived
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'cognitive_overload', 'tired', 'medium',
  'You just landed. You''re tired, it''s hot, and everything is unfamiliar.',
  'Вы только прилетели. Устали, жарко, всё незнакомо.',
  'This is normal. We''ll get you settled safely, step by step.',
  'Это нормально. Мы поможем вам обустроиться шаг за шагом.',
  ARRAY['Get to your place safely', 'Don''t overpay for transport', 'Get a local SIM card'],
  ARRAY['Безопасно добраться до жилья', 'Не переплатить за транспорт', 'Купить местную SIM-карту'],
  'clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896',
  'Private airport transfer with fixed price',
  'Трансфер из аэропорта с фиксированной ценой',
  'No scams, no haggling. Driver meets you at arrivals. Price agreed in advance.',
  'Без обмана, без торга. Водитель встречает в зоне прилёта. Цена согласована заранее.',
  'Book transfer', 'Забронировать трансфер', 'navigate', '/transfers',
  ARRAY['82514fcc-fad1-4cc8-b897-34fb91dafef5'::uuid, 'ae2fbb83-a67c-4036-81a6-7a9ff7e58388'::uuid],
  ARRAY['emergency_medical', 'long_term_living', 'vacation_leisure'],
  ARRAY['Need a doctor or pharmacy', 'Setting up for longer stay', 'Ready to explore & relax'],
  ARRAY['Нужен врач или аптека', 'Обустраиваюсь надолго', 'Готов отдыхать и гулять']
);

-- 2. Medical Help
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '672c2e2f-0d82-4a73-a089-70989412d5b6', 'urgency', 'anxious', 'high',
  'Something happened. You or someone close needs medical help right now.',
  'Что-то случилось. Вам или близкому нужна медицинская помощь прямо сейчас.',
  'Phuket has excellent hospitals with English-speaking doctors. You''re in safe hands.',
  'На Пхукете отличные больницы с англоговорящими врачами. Вы в надёжных руках.',
  ARRAY['Get to the nearest hospital', 'Know what your insurance covers', 'Don''t delay — act now'],
  ARRAY['Добраться до ближайшей больницы', 'Узнать что покрывает страховка', 'Не медлить — действовать'],
  'clinic', '00417e90-d60b-4e8e-8d6c-fc9caca15896',
  'Bangkok Hospital Phuket — 24/7 Emergency',
  'Bangkok Hospital Phuket — Скорая 24/7',
  'International-standard ER with English-speaking staff. Most insurance accepted. Open 24 hours.',
  'ER международного уровня с англоговорящим персоналом. Принимают большинство страховок. Круглосуточно.',
  'Call hospital', 'Позвонить в больницу', 'phone', 'tel:+6676254425',
  ARRAY['57c0fad8-ff89-47f8-93d4-e8bfa2d57c03'::uuid, '18b7b131-c2b7-4e25-acc2-92a28542c5fa'::uuid],
  ARRAY['relocation_visa', 'long_term_living'],
  ARRAY['Need legal help with insurance', 'Getting settled after recovery'],
  ARRAY['Нужна юридическая помощь со страховкой', 'Обустроиться после выздоровления']
);

-- 3. Trip Planning
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'uncertainty', 'confused', 'low',
  'You''re planning a trip to Phuket and want to get the basics sorted before you fly.',
  'Вы планируете поездку на Пхукет и хотите решить основные вопросы до вылета.',
  'Smart move. Booking in advance saves money and removes stress on arrival.',
  'Правильное решение. Бронирование заранее экономит деньги и снимает стресс по прилёту.',
  ARRAY['Book accommodation that fits your budget', 'Arrange airport transfer', 'Consider renting a car or scooter'],
  ARRAY['Забронировать жильё по бюджету', 'Организовать трансфер из аэропорта', 'Рассмотреть аренду авто или скутера'],
  'property', 'b3f3d753-aca6-4725-915b-fb403af2e1ef',
  'Browse verified villas & apartments',
  'Проверенные виллы и квартиры',
  'All listings verified by our team. Transparent pricing, real photos, trusted owners.',
  'Все объекты проверены нашей командой. Прозрачные цены, реальные фото, надёжные владельцы.',
  'Browse properties', 'Смотреть жильё', 'navigate', '/properties',
  ARRAY['ae2fbb83-a67c-4036-81a6-7a9ff7e58388'::uuid],
  ARRAY['arrival_first_day', 'vacation_leisure', 'family_with_children'],
  ARRAY['First day on the ground', 'Activities & experiences', 'Traveling with kids'],
  ARRAY['Первый день на месте', 'Активности и впечатления', 'Едете с детьми']
);

-- 4. Relocation & Visa
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'df8d8428-e232-4558-8f6c-25f4f301d5ec', 'trust_deficit', 'anxious', 'high',
  'You''re moving to Thailand and the visa and legal situation feels overwhelming.',
  'Вы переезжаете в Таиланд, и визовые/юридические вопросы пугают.',
  'Thousands of expats have done this before you. With the right help, it''s straightforward.',
  'Тысячи экспатов прошли через это до вас. С правильной помощью — всё просто.',
  ARRAY['Get your visa sorted properly', 'Open a Thai bank account', 'Find long-term housing'],
  ARRAY['Правильно оформить визу', 'Открыть счёт в тайском банке', 'Найти жильё на долгий срок'],
  'legal_service', '40e5b231-7d4c-4974-84e9-e0050aa7e031',
  'Trusted visa & legal service',
  'Проверенный визовый и юридический сервис',
  'Licensed, English-speaking, handles all visa types. No hidden fees.',
  'Лицензированные, англоговорящие специалисты. Все типы виз. Без скрытых комиссий.',
  'Get consultation', 'Получить консультацию', 'navigate', '/legal-services',
  ARRAY['9dc73e19-eaf9-40bd-9df4-80ea83e3c0a4'::uuid, '99f75ff1-2e53-472a-b6c4-40335cabf99c'::uuid],
  ARRAY['long_term_living', 'business_work', 'investment_property'],
  ARRAY['Setting up daily life', 'Working or starting a business', 'Investing in property'],
  ARRAY['Обустройство повседневной жизни', 'Работа или бизнес', 'Инвестиции в недвижимость']
);

-- 5. Long-term Stay
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '250717ac-da6a-4903-9296-917fb3923cc2', 'cognitive_overload', 'confused', 'medium',
  'You''re staying longer and need to build a normal life: home, health, daily routine.',
  'Вы остаётесь надолго и нужно наладить обычную жизнь: дом, здоровье, быт.',
  'Most expats feel settled within 2-3 weeks. We''ll help you find the essentials.',
  'Большинство экспатов обживаются за 2-3 недели. Мы поможем найти всё необходимое.',
  ARRAY['Find comfortable monthly rental', 'Register with a trusted clinic', 'Discover your neighbourhood'],
  ARRAY['Найти комфортную аренду помесячно', 'Прикрепиться к проверенной клинике', 'Изучить район'],
  'property', '1b3d43ab-e7f8-42d5-965c-c48a25416e5f',
  'Monthly rentals — verified & furnished',
  'Помесячная аренда — проверено и с мебелью',
  'All properties inspected. Clear contracts. No agent tricks.',
  'Все объекты проверены. Прозрачные договоры. Без уловок агентов.',
  'Find rental', 'Найти жильё', 'navigate', '/properties',
  ARRAY['9c63485c-5ff8-4660-b5e6-5ee527c714b8'::uuid],
  ARRAY['relocation_visa', 'family_with_children', 'business_work'],
  ARRAY['Visa & legal matters', 'Activities for your kids', 'Work & coworking'],
  ARRAY['Визы и юр. вопросы', 'Развлечения для детей', 'Работа и коворкинги']
);

-- 6. Vacation & Leisure
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'uncertainty', 'tired', 'low',
  'You''re on holiday and want to make the most of it without overthinking.',
  'Вы в отпуске и хотите провести его по максимуму, не ломая голову.',
  'We''ve curated the best experiences so you don''t have to search.',
  'Мы отобрали лучшие впечатления, чтобы вам не пришлось искать.',
  ARRAY['Book a top-rated day trip', 'Find a great dinner spot', 'Consider a yacht day'],
  ARRAY['Забронировать лучший дневной тур', 'Найти отличный ресторан на вечер', 'Рассмотреть день на яхте'],
  'tour', 'bc231231-1823-4748-ba93-b6240f7fbd25',
  'Top-rated island tours',
  'Лучшие островные туры',
  'Small groups, quality boats, lunch included. Verified by 500+ guests.',
  'Маленькие группы, качественные лодки, обед включён. Проверено 500+ гостями.',
  'Browse tours', 'Выбрать тур', 'navigate', '/tours',
  ARRAY['982c6a7e-e82c-4bf2-a124-b64963f9b8bc'::uuid, 'ff755ab9-c9e7-4386-af0a-cf6c735a7406'::uuid],
  ARRAY['family_with_children', 'emergency_medical'],
  ARRAY['Fun things for the kids', 'Just in case — medical help'],
  ARRAY['Развлечения для детей', 'На всякий случай — мед. помощь']
);

-- 7. Family with Kids
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '47dd9683-4648-4ccb-acdb-060551b8379d', 'emotional_stress', 'anxious', 'medium',
  'Traveling with kids is stressful. You want them safe, happy, and entertained.',
  'Путешествие с детьми — это стресс. Хочется, чтобы они были в безопасности и довольны.',
  'Phuket is extremely family-friendly. We''ve picked the best activities for every age.',
  'Пхукет очень дружелюбен к семьям. Мы выбрали лучшие активности для любого возраста.',
  ARRAY['Find safe, fun activities', 'Know where the nearest hospital is', 'Book a trusted babysitter if needed'],
  ARRAY['Найти безопасные и весёлые активности', 'Знать где ближайшая больница', 'Забронировать проверенную няню'],
  'experience', 'fa000001-0001-0001-0001-000000000001',
  'Top family activities',
  'Лучшие семейные активности',
  'Water parks, animal encounters, adventure — all safety-checked, all ages welcome.',
  'Аквапарки, животные, приключения — всё проверено на безопасность, для всех возрастов.',
  'Browse activities', 'Смотреть активности', 'navigate', '/experiences',
  ARRAY['fa000001-0001-0001-0001-000000000002'::uuid, 'fa000001-0001-0001-0001-000000000003'::uuid],
  ARRAY['emergency_medical', 'vacation_leisure', 'long_term_living'],
  ARRAY['Medical help for kids', 'More experiences for adults', 'Staying longer with family'],
  ARRAY['Мед. помощь для детей', 'Впечатления для взрослых', 'Остаётесь с семьёй надолго']
);

-- 8. Business & Work
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  'bcc6805a-556d-4b41-8db7-6312e25e632b', 'uncertainty', 'rushed', 'medium',
  'You need to work from Phuket: reliable internet, a quiet space, maybe legal setup.',
  'Нужно работать с Пхукета: надёжный интернет, тихое место, возможно — юридическое оформление.',
  'Remote work from Phuket is well-established. We''ll point you to the essentials.',
  'Удалённая работа с Пхукета — обычное дело. Мы покажем вам главное.',
  ARRAY['Find a workspace with fast internet', 'Sort legal status if staying long', 'Arrange comfortable housing'],
  ARRAY['Найти рабочее место с быстрым интернетом', 'Решить визовый вопрос если надолго', 'Организовать комфортное жильё'],
  'property', '9c63485c-5ff8-4660-b5e6-5ee527c714b8',
  'Properties near coworking areas',
  'Жильё рядом с коворкингами',
  'Boat Lagoon, Phuket Town — areas popular with digital nomads. Good wifi, cafes nearby.',
  'Boat Lagoon, Phuket Town — районы популярные у цифровых кочевников. Хороший wifi, кафе рядом.',
  'View properties', 'Смотреть жильё', 'navigate', '/properties',
  ARRAY['9bbcda1c-5a56-4776-a584-b2d0f9c41b2e'::uuid, 'ec18aa9b-e9a3-46bb-ac3b-9e52921dae83'::uuid],
  ARRAY['relocation_visa', 'long_term_living', 'vacation_leisure'],
  ARRAY['Legal & visa setup', 'Full settling-in guide', 'Time off — things to do'],
  ARRAY['Визы и юр. вопросы', 'Полный гид по обустройству', 'Свободное время — чем заняться']
);

-- 9. Investment Property
INSERT INTO public.lifeos_routes (life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_entity_type, recommended_entity_id,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target,
  alternative_entity_ids, next_routes, next_routes_labels_en, next_routes_labels_ru
) VALUES (
  '956d6089-8693-4cca-8ce2-04200e631405', 'trust_deficit', 'confused', 'high',
  'You''re considering buying property in Thailand. It''s a big decision with unique legal rules.',
  'Вы рассматриваете покупку недвижимости в Таиланде. Это серьёзное решение с особыми правилами.',
  'Foreigners buy property in Phuket every week. With proper legal advice, it''s safe and profitable.',
  'Иностранцы покупают недвижимость на Пхукете каждую неделю. С правильной помощью — это безопасно и выгодно.',
  ARRAY['Understand ownership rules for foreigners', 'Get independent legal review', 'Compare investment-grade properties'],
  ARRAY['Понять правила владения для иностранцев', 'Получить независимую юридическую проверку', 'Сравнить инвестиционную недвижимость'],
  'property', '28fc5a32-8713-4f2b-bab7-4297cdb46bfa',
  'Investment properties with ROI data',
  'Инвестиционная недвижимость с данными по доходности',
  'Verified projects, transparent pricing, rental yield estimates included.',
  'Проверенные проекты, прозрачные цены, оценки доходности от аренды.',
  'View properties', 'Смотреть объекты', 'navigate', '/properties',
  ARRAY['10f19dc6-a859-48c6-ba3b-189364cd1595'::uuid, '3ced59a3-5591-4d89-9505-48cfc7b79c57'::uuid],
  ARRAY['relocation_visa', 'business_work'],
  ARRAY['Legal setup for property owners', 'Work & live in Phuket'],
  ARRAY['Юридическое оформление', 'Работа и жизнь на Пхукете']
);

-- Migration: 20260207135431_171f40a5-ea40-4bcc-847d-f54d82734015.sql
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS departure_times text[] DEFAULT NULL;
-- Migration: 20260207152522_0ab84c52-f577-4a2c-a1ee-5ffcda631ac1.sql

-- Phase 1: Add new columns for exclusions
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS exclusions_en text[];
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS exclusions_ru text[];

-- Fix charter_options to reflect actual pricing availability
UPDATE public.yachts SET charter_options = ARRAY(
  SELECT unnest FROM unnest(ARRAY[
    CASE WHEN price_half_day IS NOT NULL AND price_half_day > 0 THEN 'half_day' END,
    CASE WHEN price_full_day IS NOT NULL AND price_full_day > 0 THEN 'full_day' END,
    CASE WHEN price_sunset IS NOT NULL AND price_sunset > 0 THEN 'sunset' END,
    CASE WHEN price_overnight IS NOT NULL AND price_overnight > 0 THEN 'overnight' END
  ]) WHERE unnest IS NOT NULL
);

-- Generate slugs for yachts missing them
UPDATE public.yachts 
SET slug = lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Populate departure_times with sensible defaults (text[] format)
UPDATE public.yachts 
SET departure_times = ARRAY['09:00', '13:00', '16:30']
WHERE departure_times IS NULL OR array_length(departure_times, 1) IS NULL;

-- Migration: 20260207231411_791b4f50-c20b-471b-98cf-4f2aa7862960.sql

-- AIRPORT FAST TRACK SERVICE - Phase 1 Schema

CREATE TABLE public.airport_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  service_type TEXT NOT NULL CHECK (service_type IN ('fast_track', 'addon', 'bundle')),
  direction TEXT CHECK (direction IN ('arrival', 'departure', 'both')),
  sku TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_th TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_th TEXT,
  icon TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  night_surcharge NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  night_start TIME DEFAULT '00:00',
  night_end TIME DEFAULT '06:00',
  includes_items TEXT[],
  bundle_components JSONB,
  bundle_savings_text_en TEXT,
  bundle_savings_text_ru TEXT,
  max_passengers INTEGER DEFAULT 1,
  cutoff_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  contact_phone TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  commission_percent NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_concurrent_jobs INTEGER DEFAULT 5,
  sla_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  service_id UUID NOT NULL REFERENCES public.airport_services(id),
  supplier_id UUID REFERENCES public.airport_suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','paid','confirmed','assigned','in_progress','completed','cancelled','no_show')),
  direction TEXT NOT NULL CHECK (direction IN ('arrival', 'departure')),
  airport_code TEXT NOT NULL DEFAULT 'HKT',
  flight_number TEXT NOT NULL,
  airline TEXT,
  flight_date DATE NOT NULL,
  flight_time TIME NOT NULL,
  is_night_flight BOOLEAN DEFAULT false,
  base_price NUMERIC NOT NULL,
  night_surcharge NUMERIC DEFAULT 0,
  addons_total NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'THB',
  contact_whatsapp TEXT,
  contact_email TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en','ru','th')),
  special_notes TEXT,
  linked_transfer_booking_id UUID,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.airport_bookings(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.airport_booking_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.airport_bookings(id) ON DELETE CASCADE,
  addon_service_id UUID NOT NULL REFERENCES public.airport_services(id),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.airport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_booking_addons ENABLE ROW LEVEL SECURITY;

-- Services: public read
CREATE POLICY "Anyone can view active airport services"
  ON public.airport_services FOR SELECT USING (is_active = true);

-- Suppliers: admin/uno_team only
CREATE POLICY "Admins can manage airport suppliers"
  ON public.airport_suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Bookings
CREATE POLICY "Users can view own airport bookings"
  ON public.airport_bookings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

CREATE POLICY "Users can create own airport bookings"
  ON public.airport_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own airport bookings"
  ON public.airport_bookings FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')));

-- Passengers
CREATE POLICY "Users can manage passengers for own bookings"
  ON public.airport_passengers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.airport_bookings WHERE id = booking_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')))));

-- Addons
CREATE POLICY "Users can manage addons for own bookings"
  ON public.airport_booking_addons FOR ALL
  USING (EXISTS (SELECT 1 FROM public.airport_bookings WHERE id = booking_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin','uno_team')))));

-- Triggers
CREATE TRIGGER update_airport_bookings_updated_at
  BEFORE UPDATE ON public.airport_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airport_services_updated_at
  BEFORE UPDATE ON public.airport_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_airport_suppliers_updated_at
  BEFORE UPDATE ON public.airport_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_airport_bookings_user ON public.airport_bookings(user_id);
CREATE INDEX idx_airport_bookings_status ON public.airport_bookings(status);
CREATE INDEX idx_airport_bookings_flight_date ON public.airport_bookings(flight_date);
CREATE INDEX idx_airport_passengers_booking ON public.airport_passengers(booking_id);
CREATE INDEX idx_airport_services_type ON public.airport_services(service_type, airport_code);

-- Migration: 20260207232050_75d09cf6-e8af-483b-ba75-4c7558c6e6da.sql

ALTER TABLE public.catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;
ALTER TABLE public.catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
  CHECK (entity_type = ANY (ARRAY['property','service','experience','transport','restaurant','yacht','tour','vehicle','clinic','babysitter','legal_service','bank','salon','event','gym','airport_service']));

-- Migration: 20260207234019_b44ab064-5a97-4056-aa43-1665dea26bad.sql

-- 1. Add supplier_id column to airport_services
ALTER TABLE public.airport_services ADD COLUMN supplier_id UUID REFERENCES public.airport_suppliers(id);

-- 2. Update existing Coral services to point to Coral supplier
UPDATE public.airport_services 
SET supplier_id = '7f0cacbe-d644-4acb-8a39-442e4b480c28'
WHERE airport_code = 'HKT' AND sku LIKE 'HKT-CRL-%';

-- Migration: 20260208000632_bd948170-dff2-4372-aa04-b21808679ffe.sql

-- Add 'page' to allowed entity types in catalog_life_map
ALTER TABLE public.catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;

ALTER TABLE public.catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY[
  'property', 'service', 'experience', 'transport', 'restaurant', 
  'yacht', 'tour', 'vehicle', 'clinic', 'babysitter', 
  'legal_service', 'bank', 'salon', 'event', 'gym', 
  'airport_service', 'page'
]));

-- Migration: 20260208023110_e674b8b6-2ce5-4d9a-b196-29090ae99120.sql

-- Create bucket for experience cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Experience images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'experience-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload experience images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'experience-images' AND auth.role() = 'authenticated');

-- Migration: 20260208121930_ac8db36c-2587-4313-a47f-f5ff46232cd3.sql
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_type TEXT,
  p_customer_user_id UUID,
  p_provider_org_id UUID DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT 0,
  p_currency TEXT DEFAULT 'THB',
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_participants JSONB DEFAULT '[]'::jsonb,
  p_addresses JSONB DEFAULT '[]'::jsonb,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_amount NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_participant JSONB;
  v_address JSONB;
BEGIN
  -- Create order
  INSERT INTO public.orders (
    order_type, customer_user_id, provider_org_id,
    status, start_at, end_at, total_amount, currency, notes, metadata
  ) VALUES (
    p_order_type, p_customer_user_id, p_provider_org_id,
    'pending', p_start_at, p_end_at, p_total_amount, p_currency, p_notes, p_metadata
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;
  
  -- Insert items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.order_items (
        order_id, product_id, resource_id, provider_org_id,
        item_name, item_type, qty, unit_price, amount, 
        start_at, end_at, metadata
      ) VALUES (
        v_order_id,
        NULLIF(v_item->>'product_id', '')::uuid,
        NULLIF(v_item->>'resource_id', '')::uuid,
        COALESCE(NULLIF(v_item->>'provider_org_id', '')::uuid, p_provider_org_id),
        v_item->>'item_name',
        COALESCE(v_item->>'item_type', 'service'),
        COALESCE((v_item->>'qty')::int, 1),
        COALESCE((v_item->>'unit_price')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        NULLIF(v_item->>'start_at', '')::timestamptz,
        NULLIF(v_item->>'end_at', '')::timestamptz,
        COALESCE(v_item->'metadata', '{}'::jsonb)
      );
    END LOOP;
  END IF;
  
  -- Insert participants
  IF p_participants IS NOT NULL AND jsonb_array_length(p_participants) > 0 THEN
    FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
    LOOP
      INSERT INTO public.order_participants (
        order_id, role, name, phone, email
      ) VALUES (
        v_order_id,
        COALESCE(v_participant->>'role', 'primary'),
        v_participant->>'name',
        v_participant->>'phone',
        v_participant->>'email'
      );
    END LOOP;
  END IF;
  
  -- Insert addresses
  IF p_addresses IS NOT NULL AND jsonb_array_length(p_addresses) > 0 THEN
    FOR v_address IN SELECT * FROM jsonb_array_elements(p_addresses)
    LOOP
      INSERT INTO public.order_addresses (
        order_id, address_type, address_text, lat, lng, notes
      ) VALUES (
        v_order_id,
        v_address->>'address_type',
        v_address->>'address_text',
        NULLIF(v_address->>'lat', '')::numeric,
        NULLIF(v_address->>'lng', '')::numeric,
        v_address->>'notes'
      );
    END LOOP;
  END IF;
  
  -- Create payment intent if provided (cast text to payment_method enum)
  IF p_payment_method IS NOT NULL AND p_payment_amount IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      order_id, amount, currency, method, status
    ) VALUES (
      v_order_id, p_payment_amount, p_currency, p_payment_method::payment_method, 'pending'
    );
  END IF;
  
  -- Record initial status in history
  INSERT INTO public.order_status_history (
    order_id, from_status, to_status, actor_user_id, reason
  ) VALUES (
    v_order_id, NULL, 'pending', p_customer_user_id, 'Order created'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
-- Migration: 20260209002116_7fc4e2bb-b3fd-49d0-bb96-5afa7079cbd2.sql
-- Expand entity_type check constraint to include all platform verticals
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;

ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check 
CHECK (entity_type = ANY (ARRAY[
  'property', 'service', 'experience', 'transport', 'restaurant', 
  'yacht', 'tour', 'vehicle', 'clinic', 'babysitter', 
  'legal_service', 'bank', 'salon', 'event', 'gym', 
  'airport_service', 'page', 'cleaning', 'pet_service', 
  'insurance', 'education', 'flower_shop', 'water_activity',
  'pharmacy', 'coworking', 'marketplace_product'
]));
-- Migration: 20260209012807_29045bb6-f460-47ee-abd9-485a3316471a.sql

-- Step 1: Update CHECK constraint to include 'transfer'
ALTER TABLE catalog_life_map DROP CONSTRAINT catalog_life_map_entity_type_check;
ALTER TABLE catalog_life_map ADD CONSTRAINT catalog_life_map_entity_type_check CHECK (
  entity_type = ANY (ARRAY[
    'property','service','experience','transport','restaurant','yacht','tour','vehicle',
    'clinic','babysitter','legal_service','bank','salon','event','gym','airport_service',
    'page','cleaning','pet_service','insurance','education','flower_shop','water_activity',
    'pharmacy','coworking','marketplace_product','transfer'
  ])
);

-- Step 2: Create 3 new life situations
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES
  ('wedding_event', 'Wedding & Celebration', 'Свадьба и торжество', 'Planning a wedding, anniversary, or special celebration in Phuket', 'Организация свадьбы, юбилея или торжества на Пхукете', 'PartyPopper', '#D946EF', 38, true),
  ('digital_nomad', 'Remote Work & Nomad', 'Удалённая работа', 'Setting up for productive remote work and digital nomad lifestyle', 'Организация удалённой работы и жизни цифрового кочевника', 'Laptop', '#0EA5E9', 36, true),
  ('retirement_living', 'Retirement Living', 'Жизнь на пенсии', 'Comfortable retirement and senior living in Thailand', 'Комфортная жизнь на пенсии в Таиланде', 'Sunset', '#F97316', 42, true);

-- =============================================
-- Part 2: Map UNMAPPED verticals to existing situations  
-- =============================================

-- Transfers → arrival_first_day (weight 90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'transfer', id, 90, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → pre_trip_planning (weight 80)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'transfer', id, 80, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → family_with_children (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'transfer', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Transfers → vacation_leisure (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'transfer', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Transfers → business_work (weight 55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'bcc6805a-556d-4b41-8db7-6312e25e632b', 'transfer', id, 55, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Water Activities → vacation_leisure (weight 85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'water_activity', id, 85, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Water Activities → family_with_children (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'water_activity', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Water Activities → pre_trip_planning (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'water_activity', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM water_activities WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Flower Shops → long_term_living (weight 50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '250717ac-da6a-4903-9296-917fb3923cc2', 'flower_shop', id, 50, ARRAY['resident','owner'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Flower Shops → vacation_leisure (weight 40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'a6814f83-95ab-47f3-bd8a-6fe8761e6579', 'flower_shop', id, 40, ARRAY['guest','resident'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Flower Shops → family_with_children (weight 35)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'flower_shop', id, 35, ARRAY['guest','resident'], '{}'::jsonb
FROM flower_shops WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Yacht → pre_trip_planning (weight 75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'yacht', id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 10;

-- Yacht → family_with_children (weight 65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'yacht', id, 65, ARRAY['guest','resident'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 8;

-- Yacht → business_work (weight 55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 'bcc6805a-556d-4b41-8db7-6312e25e632b', 'yacht', id, 55, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 6;

-- Yacht → investment_property (weight 40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '956d6089-8693-4cca-8ce2-04200e631405', 'yacht', id, 40, ARRAY['owner','investor'], '{}'::jsonb
FROM yachts WHERE is_active = true ORDER BY is_featured DESC NULLS LAST, rating DESC NULLS LAST LIMIT 5;

-- Event → family_with_children (weight 60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'event', id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 8;

-- Event → arrival_first_day (weight 45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '3b1d64f4-c21c-4d95-8d45-be75718eb25b', 'event', id, 45, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 6;

-- Event → pre_trip_planning (weight 50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '4fee1e79-81e7-482d-b07e-25aed74c6dd7', 'event', id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM events WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 6;

-- Education → long_term_living (weight 65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '250717ac-da6a-4903-9296-917fb3923cc2', 'education', id, 65, ARRAY['resident','owner'], '{}'::jsonb
FROM education_providers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 10;

-- Education → family_with_children (weight 70)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT '47dd9683-4648-4ccb-acdb-060551b8379d', 'education', id, 70, ARRAY['resident','owner'], '{}'::jsonb
FROM education_providers WHERE is_active = true ORDER BY is_featured DESC NULLS LAST LIMIT 10;

-- =============================================
-- Part 3: Map verticals to NEW situations
-- =============================================

-- Wedding: flowers (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'flower_shop', f.id, 90, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM flower_shops f, life_situations ls WHERE ls.code = 'wedding_event' AND f.is_active = true
ORDER BY f.is_featured DESC NULLS LAST LIMIT 10;

-- Wedding: events (88)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'event', e.id, 88, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM events e, life_situations ls WHERE ls.code = 'wedding_event' AND e.is_active = true
ORDER BY e.is_featured DESC NULLS LAST LIMIT 8;

-- Wedding: restaurants (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 85, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'wedding_event' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 10;

-- Wedding: salons (82)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'salon', s.id, 82, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM salons s, life_situations ls WHERE ls.code = 'wedding_event' AND s.is_active = true
ORDER BY s.is_featured DESC NULLS LAST, s.rating DESC NULLS LAST LIMIT 8;

-- Wedding: properties (75)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 75, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'wedding_event' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 8;

-- Wedding: yachts (70)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'yacht', y.id, 70, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM yachts y, life_situations ls WHERE ls.code = 'wedding_event' AND y.is_active = true
ORDER BY y.is_featured DESC NULLS LAST, y.rating DESC NULLS LAST LIMIT 8;

-- Wedding: vehicles (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'vehicle', v.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM vehicles v, life_situations ls WHERE ls.code = 'wedding_event' AND v.is_active = true
ORDER BY v.is_featured DESC NULLS LAST LIMIT 6;

-- Wedding: transfers (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'transfer', t.id, 55, ARRAY['guest','resident'], '{}'::jsonb
FROM transfers t, life_situations ls WHERE ls.code = 'wedding_event' AND t.is_active = true
ORDER BY t.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: properties (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 90, ARRAY['guest','resident'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'digital_nomad' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 10;

-- Digital Nomad: legal (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'legal_service', l.id, 85, ARRAY['guest','resident'], '{}'::jsonb
FROM legal_services l, life_situations ls WHERE ls.code = 'digital_nomad' AND l.is_active = true
ORDER BY l.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: gyms (65)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'gym', g.id, 65, ARRAY['guest','resident'], '{}'::jsonb
FROM gyms g, life_situations ls WHERE ls.code = 'digital_nomad' AND g.is_active = true
ORDER BY g.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: restaurants (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'digital_nomad' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 8;

-- Digital Nomad: events (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'event', e.id, 55, ARRAY['guest','resident'], '{}'::jsonb
FROM events e, life_situations ls WHERE ls.code = 'digital_nomad' AND e.is_active = true
ORDER BY e.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: education (50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'education', ed.id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM education_providers ed, life_situations ls WHERE ls.code = 'digital_nomad' AND ed.is_active = true
ORDER BY ed.is_featured DESC NULLS LAST LIMIT 8;

-- Digital Nomad: clinics (45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'clinic', c.id, 45, ARRAY['guest','resident'], '{}'::jsonb
FROM clinics c, life_situations ls WHERE ls.code = 'digital_nomad' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST LIMIT 6;

-- Digital Nomad: salons (40)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'salon', s.id, 40, ARRAY['guest','resident'], '{}'::jsonb
FROM salons s, life_situations ls WHERE ls.code = 'digital_nomad' AND s.is_active = true
ORDER BY s.is_featured DESC NULLS LAST LIMIT 6;

-- Retirement: properties (90)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'property', p.id, 90, ARRAY['resident','owner'], '{}'::jsonb
FROM properties p, life_situations ls WHERE ls.code = 'retirement_living' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST, p.rating DESC NULLS LAST LIMIT 10;

-- Retirement: clinics (88)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'clinic', c.id, 88, ARRAY['resident','owner'], '{}'::jsonb
FROM clinics c, life_situations ls WHERE ls.code = 'retirement_living' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST, c.rating DESC NULLS LAST LIMIT 10;

-- Retirement: legal (85)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'legal_service', l.id, 85, ARRAY['resident','owner'], '{}'::jsonb
FROM legal_services l, life_situations ls WHERE ls.code = 'retirement_living' AND l.is_active = true
ORDER BY l.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: insurance (82)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'insurance', i.id, 82, ARRAY['resident','owner'], '{}'::jsonb
FROM insurance_providers i, life_situations ls WHERE ls.code = 'retirement_living' AND i.is_active = true
ORDER BY i.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: cleaning (60)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'cleaning', cs.id, 60, ARRAY['resident','owner'], '{}'::jsonb
FROM cleaning_services cs, life_situations ls WHERE ls.code = 'retirement_living' AND cs.is_active = true
ORDER BY cs.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: restaurants (55)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'restaurant', r.id, 55, ARRAY['resident','owner'], '{}'::jsonb
FROM restaurants r, life_situations ls WHERE ls.code = 'retirement_living' AND r.is_active = true
ORDER BY r.is_featured DESC NULLS LAST, r.rating DESC NULLS LAST LIMIT 8;

-- Retirement: gyms (50)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'gym', g.id, 50, ARRAY['resident','owner'], '{}'::jsonb
FROM gyms g, life_situations ls WHERE ls.code = 'retirement_living' AND g.is_active = true
ORDER BY g.is_featured DESC NULLS LAST LIMIT 8;

-- Retirement: pet_services (45)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'pet_service', ps.id, 45, ARRAY['resident','owner'], '{}'::jsonb
FROM pet_services ps, life_situations ls WHERE ls.code = 'retirement_living' AND ps.is_active = true
ORDER BY ps.is_featured DESC NULLS LAST LIMIT 6;

-- Retirement: flowers (35)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT ls.id, 'flower_shop', f.id, 35, ARRAY['resident','owner'], '{}'::jsonb
FROM flower_shops f, life_situations ls WHERE ls.code = 'retirement_living' AND f.is_active = true
ORDER BY f.is_featured DESC NULLS LAST LIMIT 6;

-- Migration: 20260209013525_3a8efc85-2092-4ce7-8271-621be7d3e091.sql

-- =============================================
-- 1. Merge digital_nomad mappings into business_work
-- =============================================
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  'bcc6805a-556d-4b41-8db7-6312e25e632b', -- business_work
  clm.entity_type,
  clm.entity_id,
  clm.weight,
  clm.role_scope,
  clm.rules
FROM catalog_life_map clm
WHERE clm.life_situation_id = 'c66e1a3d-30e4-45fe-8ae3-527227cc20ef' -- digital_nomad
ON CONFLICT (entity_type, entity_id, life_situation_id) DO NOTHING;

-- 2. Deactivate digital_nomad
UPDATE life_situations SET is_active = false WHERE code = 'digital_nomad';

-- 3. Update business_work titles
UPDATE life_situations 
SET title_en = 'Business & Remote Work', title_ru = 'Бизнес и удалёнка'
WHERE code = 'business_work';

-- =============================================
-- 4. Insert departure_day situation
-- =============================================
INSERT INTO life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'departure_day',
  'Departure Day',
  'День отъезда',
  'Everything you need on your last day: airport transfers, checkout, cleaning',
  'Всё для последнего дня: трансфер, выезд, уборка, документы',
  'PlaneTakeoff',
  '#64748B',
  50,
  true
);

-- 5. departure_day mappings: transfers
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'transfer', t.id, 95, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM transfers t, life_situations ls
WHERE ls.code = 'departure_day' AND t.is_active = true
ORDER BY t.is_featured DESC NULLS LAST, t.rating DESC NULLS LAST
LIMIT 10;

-- departure_day: airport_services
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'airport_service', s.id, 90, ARRAY['guest','resident'], '{}'::jsonb
FROM airport_services s, life_situations ls
WHERE ls.code = 'departure_day' AND s.is_active = true
LIMIT 10;

-- departure_day: cleaning
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'cleaning', c.id, 70, ARRAY['guest','resident','owner'], '{}'::jsonb
FROM cleaning_services c, life_situations ls
WHERE ls.code = 'departure_day' AND c.is_active = true
ORDER BY c.is_featured DESC NULLS LAST
LIMIT 10;

-- departure_day: property (checkout)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'property', p.id, 60, ARRAY['guest','resident'], '{}'::jsonb
FROM properties p, life_situations ls
WHERE ls.code = 'departure_day' AND p.is_active = true
ORDER BY p.is_featured DESC NULLS LAST
LIMIT 10;

-- departure_day: legal_service (document closure)
INSERT INTO catalog_life_map (life_situation_id, entity_type, entity_id, weight, role_scope, rules)
SELECT 
  ls.id, 'legal_service', l.id, 50, ARRAY['guest','resident'], '{}'::jsonb
FROM legal_services l, life_situations ls
WHERE ls.code = 'departure_day' AND l.is_active = true
LIMIT 8;

-- =============================================
-- 6. Update priorities for all 12 situations
-- =============================================
UPDATE life_situations SET priority = 5 WHERE code = 'arrival_first_day';
UPDATE life_situations SET priority = 10 WHERE code = 'vacation_leisure';
UPDATE life_situations SET priority = 15 WHERE code = 'family_with_children';
UPDATE life_situations SET priority = 20 WHERE code = 'long_term_living';
UPDATE life_situations SET priority = 25 WHERE code = 'relocation_visa';
UPDATE life_situations SET priority = 30 WHERE code = 'business_work';
UPDATE life_situations SET priority = 35 WHERE code = 'emergency_medical';
UPDATE life_situations SET priority = 40 WHERE code = 'wedding_event';
UPDATE life_situations SET priority = 45 WHERE code = 'pre_trip_planning';
UPDATE life_situations SET priority = 50 WHERE code = 'departure_day';
UPDATE life_situations SET priority = 55 WHERE code = 'investment_property';
UPDATE life_situations SET priority = 60 WHERE code = 'retirement_living';

-- Migration: 20260209014137_677b5ac6-b3d0-45fd-ae71-446b0a5cc8a2.sql

-- =============================================
-- LifeOS 3-Level Taxonomy Rebuild
-- =============================================
-- Step 1: Create life_scenarios table
-- Step 2: Create life_tasks table  
-- Step 3: Create task_entity_map table
-- Step 13: Add life_scenario_id to lifeos_routes
-- =============================================

-- ============ STEP 1: life_scenarios ============
CREATE TABLE public.life_scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_situation_id uuid NOT NULL REFERENCES public.life_situations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ru text NOT NULL,
  description_en text,
  description_ru text,
  urgency_level text NOT NULL DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  icon text,
  priority integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_scenarios_situation ON public.life_scenarios(life_situation_id);
CREATE INDEX idx_life_scenarios_code ON public.life_scenarios(code);
CREATE INDEX idx_life_scenarios_active ON public.life_scenarios(is_active) WHERE is_active = true;

ALTER TABLE public.life_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_scenarios_read" ON public.life_scenarios FOR SELECT USING (true);

-- ============ STEP 2: life_tasks ============
CREATE TABLE public.life_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_scenario_id uuid NOT NULL REFERENCES public.life_scenarios(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ru text NOT NULL,
  task_type text NOT NULL DEFAULT 'service' CHECK (task_type IN ('service', 'product', 'experience', 'info')),
  priority integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_tasks_scenario ON public.life_tasks(life_scenario_id);
CREATE INDEX idx_life_tasks_code ON public.life_tasks(code);
CREATE INDEX idx_life_tasks_active ON public.life_tasks(is_active) WHERE is_active = true;

ALTER TABLE public.life_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_tasks_read" ON public.life_tasks FOR SELECT USING (true);

-- ============ STEP 3: task_entity_map ============
CREATE TABLE public.task_entity_map (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  life_task_id uuid NOT NULL REFERENCES public.life_tasks(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  relevance_weight integer NOT NULL DEFAULT 50 CHECK (relevance_weight BETWEEN 0 AND 100),
  role_scope text[] DEFAULT '{guest,resident,owner,investor}',
  rules jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_entity_map_task ON public.task_entity_map(life_task_id);
CREATE INDEX idx_task_entity_map_entity ON public.task_entity_map(entity_type, entity_id);
CREATE INDEX idx_task_entity_map_active ON public.task_entity_map(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_task_entity_map_unique ON public.task_entity_map(life_task_id, entity_type, entity_id);

ALTER TABLE public.task_entity_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_entity_map_read" ON public.task_entity_map FOR SELECT USING (true);

-- ============ STEP 13: lifeos_routes link to scenarios ============
ALTER TABLE public.lifeos_routes ADD COLUMN IF NOT EXISTS life_scenario_id uuid REFERENCES public.life_scenarios(id);

-- ============ Triggers for updated_at ============
CREATE TRIGGER update_life_scenarios_updated_at
  BEFORE UPDATE ON public.life_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_life_tasks_updated_at
  BEFORE UPDATE ON public.life_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_entity_map_updated_at
  BEFORE UPDATE ON public.task_entity_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STEP 8: Compatibility bridge view ============
CREATE OR REPLACE VIEW public.catalog_life_map_v2 AS
SELECT
  tem.id,
  ls.id AS life_situation_id,
  tem.entity_type,
  tem.entity_id,
  tem.relevance_weight AS weight,
  tem.role_scope,
  tem.rules,
  lsc.code AS scenario_code,
  lt.code AS task_code,
  lsc.urgency_level,
  lt.task_type
FROM public.task_entity_map tem
JOIN public.life_tasks lt ON lt.id = tem.life_task_id
JOIN public.life_scenarios lsc ON lsc.id = lt.life_scenario_id
JOIN public.life_situations ls ON ls.id = lsc.life_situation_id
WHERE tem.is_active AND lt.is_active AND lsc.is_active AND ls.is_active;

-- ============ STEP 9: Update resolve_life_os_context to support both old & new ============
-- The existing RPC reads from catalog_life_map which stays unchanged.
-- We add NEW RPCs for the 3-level model (Step 10).

-- ============ STEP 10: New resolver RPCs ============

-- Get scenarios for a situation code
CREATE OR REPLACE FUNCTION public.resolve_life_scenarios(
  p_situation_code text,
  p_locale text DEFAULT 'en'
)
RETURNS TABLE(
  id uuid,
  code text,
  title text,
  description text,
  urgency_level text,
  icon text,
  priority integer,
  task_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lsc.id,
    lsc.code,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lsc.title_ru, lsc.title_en) ELSE lsc.title_en END,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lsc.description_ru, lsc.description_en) ELSE lsc.description_en END,
    lsc.urgency_level,
    lsc.icon,
    lsc.priority,
    (SELECT count(*) FROM life_tasks lt WHERE lt.life_scenario_id = lsc.id AND lt.is_active)
  FROM life_scenarios lsc
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE ls.code = p_situation_code
    AND ls.is_active = true
    AND lsc.is_active = true
  ORDER BY lsc.priority;
END;
$$;

-- Get tasks for a scenario code
CREATE OR REPLACE FUNCTION public.resolve_life_tasks(
  p_scenario_code text,
  p_locale text DEFAULT 'en'
)
RETURNS TABLE(
  id uuid,
  code text,
  title text,
  task_type text,
  priority integer,
  entity_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lt.id,
    lt.code,
    CASE WHEN p_locale = 'ru' THEN COALESCE(lt.title_ru, lt.title_en) ELSE lt.title_en END,
    lt.task_type,
    lt.priority,
    (SELECT count(*) FROM task_entity_map tem WHERE tem.life_task_id = lt.id AND tem.is_active)
  FROM life_tasks lt
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  WHERE lsc.code = p_scenario_code
    AND lsc.is_active = true
    AND lt.is_active = true
  ORDER BY lt.priority;
END;
$$;

-- Get entities for a task code with catalog resolution
CREATE OR REPLACE FUNCTION public.resolve_task_entities(
  p_task_code text,
  p_user_role text DEFAULT 'guest',
  p_locale text DEFAULT 'en',
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  entity_type text,
  entity_id text,
  title text,
  title_localized text,
  price numeric,
  currency text,
  location text,
  provider_id text,
  trust_level text,
  relevance_weight integer,
  role_scope text[],
  rules jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tem.entity_type,
    tem.entity_id::text,
    loc.title,
    CASE WHEN p_locale = 'ru' THEN COALESCE(loc.title_ru, loc.title) ELSE COALESCE(loc.title, loc.title_ru) END,
    loc.price,
    loc.currency,
    loc.location,
    loc.provider_id,
    loc.trust_level,
    tem.relevance_weight,
    tem.role_scope,
    tem.rules
  FROM task_entity_map tem
  JOIN life_tasks lt ON lt.id = tem.life_task_id
  LEFT JOIN life_os_catalog loc ON loc.entity_type = tem.entity_type AND loc.entity_id = tem.entity_id::text
  WHERE lt.code = p_task_code
    AND lt.is_active = true
    AND tem.is_active = true
    AND (tem.role_scope IS NULL OR p_user_role = ANY(tem.role_scope))
  ORDER BY tem.relevance_weight DESC, loc.price ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ============ STEP 11: Rebuild lifeos_health_view for 3 levels ============
DROP VIEW IF EXISTS public.lifeos_health_view;
CREATE OR REPLACE VIEW public.lifeos_health_view AS
WITH situation_stats AS (
  SELECT
    ls.id AS situation_id,
    ls.code AS situation_code,
    ls.title_en,
    ls.title_ru,
    ls.is_active,
    (SELECT count(*) FROM life_scenarios lsc WHERE lsc.life_situation_id = ls.id AND lsc.is_active) AS scenario_count,
    (SELECT count(*) FROM life_scenarios lsc JOIN life_tasks lt ON lt.life_scenario_id = lsc.id WHERE lsc.life_situation_id = ls.id AND lsc.is_active AND lt.is_active) AS task_count,
    -- Legacy: count from catalog_life_map for backward compat
    (SELECT count(*) FROM catalog_life_map clm WHERE clm.life_situation_id = ls.id) AS legacy_entity_count,
    -- New: count from task_entity_map via the chain
    (SELECT count(*) FROM task_entity_map tem
     JOIN life_tasks lt ON lt.id = tem.life_task_id
     JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
     WHERE lsc.life_situation_id = ls.id AND tem.is_active AND lt.is_active AND lsc.is_active
    ) AS new_entity_count
  FROM life_situations ls
),
orphan_scenarios AS (
  SELECT count(*) AS cnt FROM life_scenarios lsc
  WHERE lsc.is_active AND NOT EXISTS (SELECT 1 FROM life_tasks lt WHERE lt.life_scenario_id = lsc.id AND lt.is_active)
),
orphan_tasks AS (
  SELECT count(*) AS cnt FROM life_tasks lt
  WHERE lt.is_active AND NOT EXISTS (SELECT 1 FROM task_entity_map tem WHERE tem.life_task_id = lt.id AND tem.is_active)
),
overused_entities AS (
  SELECT count(*) AS cnt FROM (
    SELECT entity_type, entity_id FROM task_entity_map WHERE is_active GROUP BY entity_type, entity_id HAVING count(*) > 3
  ) sub
)
SELECT
  ss.situation_id,
  ss.situation_code,
  ss.title_en,
  ss.title_ru,
  ss.is_active,
  ss.scenario_count,
  ss.task_count,
  ss.legacy_entity_count,
  ss.new_entity_count,
  (ss.scenario_count = 0 AND ss.is_active) AS flag_no_scenarios,
  (ss.task_count = 0 AND ss.is_active) AS flag_no_tasks,
  (ss.new_entity_count = 0 AND ss.is_active) AS flag_no_entities,
  (SELECT cnt FROM orphan_scenarios) AS orphan_scenario_count,
  (SELECT cnt FROM orphan_tasks) AS orphan_task_count,
  (SELECT cnt FROM overused_entities) AS entity_overuse_count,
  CASE
    WHEN ss.scenario_count = 0 AND ss.is_active THEN 0
    WHEN ss.task_count = 0 AND ss.is_active THEN 25
    WHEN ss.new_entity_count = 0 AND ss.is_active THEN 50
    ELSE LEAST(100, 60 + ss.scenario_count * 5 + ss.task_count * 2)
  END AS health_score
FROM situation_stats ss
ORDER BY ss.is_active DESC, ss.situation_code;

-- Migration: 20260209015610_0d339ed4-a1f9-43a3-bb97-ef1b1a99c4de.sql

-- ============================================================
-- VERTICAL ↔ LIFE TASK CANONICAL MAPPING TABLE
-- ============================================================

CREATE TABLE public.vertical_life_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vertical_code text NOT NULL,
  life_task_id uuid NOT NULL REFERENCES public.life_tasks(id) ON DELETE CASCADE,
  priority_weight int NOT NULL DEFAULT 100,
  context_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vertical_code, life_task_id)
);

CREATE INDEX idx_vlt_vertical ON public.vertical_life_tasks(vertical_code) WHERE is_active;
CREATE INDEX idx_vlt_task ON public.vertical_life_tasks(life_task_id) WHERE is_active;

ALTER TABLE public.vertical_life_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vertical_life_tasks_read_all"
  ON public.vertical_life_tasks FOR SELECT USING (true);

CREATE POLICY "vertical_life_tasks_admin_write"
  ON public.vertical_life_tasks FOR ALL
  USING (is_admin_or_uno_team());

CREATE TRIGGER update_vertical_life_tasks_updated_at
  BEFORE UPDATE ON public.vertical_life_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CANONICAL DATA: 19 verticals mapped to life_tasks
-- ============================================================

-- TRANSFER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('transfer', '45a9a43b-d021-41d4-97c1-612d9e720052', 100, NULL),
  ('transfer', 'bf7c56ca-7e86-4ca1-9c65-021f5ca8e2b3', 100, NULL),
  ('transfer', 'c90ea603-378e-4919-9ae7-1a7323b5a0c0', 100, NULL),
  ('transfer', '3c8ee587-e873-407b-8f4e-3c62850cd0b2', 70, 'Emergency medical transport');

-- VEHICLE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('vehicle', '7eb9092f-d3f6-4217-abe1-6d3024b07255', 100, NULL),
  ('vehicle', '9218f8de-7afe-4863-8bec-6d94cc7a9994', 40, 'Self-drive excursion option');

-- PROPERTY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('property', 'b5b4d69d-daf1-4d4c-b6e3-bc8cca2d8f4f', 100, NULL),
  ('property', '306c1455-e791-4316-989f-775b572715ff', 100, NULL),
  ('property', '0975da73-74e1-40ce-aa6f-bc8bfdab6f45', 100, NULL),
  ('property', 'ab935aaf-e6ea-4944-86b0-4bb42b5a6999', 100, NULL),
  ('property', '00ef8bae-4f75-4d53-b777-1e25492c5573', 70, NULL),
  ('property', '2aba2b5b-17f2-439e-be7e-cfcc62f7dc87', 100, NULL),
  ('property', 'fb45874b-bc5c-4df7-b060-999c0298cca2', 100, NULL),
  ('property', '8e987d62-9a24-4863-9935-d1cabd983976', 100, NULL),
  ('property', '7430ce03-a9f7-4069-ad79-c278f743bb23', 40, 'Property comfort for retirees');

-- YACHT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('yacht', '869a4392-cadf-432a-b096-44ead472d48e', 100, NULL),
  ('yacht', '64360de1-2d6a-4206-b360-4b6da8a9ad4e', 100, NULL),
  ('yacht', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 40, 'Yacht as unique experience');

-- TOUR
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('tour', '1580119d-a342-408f-896a-d8a4723607df', 100, NULL),
  ('tour', '99db031f-fd68-493a-abb7-b3192c27f2b0', 100, NULL),
  ('tour', '9218f8de-7afe-4863-8bec-6d94cc7a9994', 100, NULL),
  ('tour', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 70, NULL);

-- EXPERIENCE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('experience', 'c2ce1ac0-a029-4184-9ab8-8b1ed9b532ba', 100, NULL),
  ('experience', '99db031f-fd68-493a-abb7-b3192c27f2b0', 70, NULL),
  ('experience', '99153978-598e-4c12-96f1-d31577ba048a', 70, 'Experience-driven nightlife');

-- CLEANING
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('cleaning', '54415c49-451d-4d92-b457-639708d64762', 100, NULL),
  ('cleaning', 'feb06865-8bc0-48d5-abd7-cfdbbadee5de', 100, NULL),
  ('cleaning', '7430ce03-a9f7-4069-ad79-c278f743bb23', 70, 'Cleaning as comfort service');

-- BABYSITTER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('babysitter', 'ab859b25-087e-40f4-b9c0-4608b5053014', 100, NULL);

-- BEAUTY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('beauty', '9367098e-04be-40d7-9bed-509265e11be7', 100, NULL),
  ('beauty', '5844aa63-6897-4283-934c-5be2070f615c', 70, 'Salon spa services');

-- RESTAURANT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('restaurant', '37e4888c-8c9e-4772-ae85-b32fcff2ec08', 100, NULL),
  ('restaurant', 'd24d1881-9c60-4889-acc4-0847d6a93c04', 100, NULL),
  ('restaurant', 'd1bfd984-00a2-4e01-9e15-30b598052a92', 100, NULL),
  ('restaurant', '65371f20-75d6-4209-9a00-101f2853a76b', 70, 'Restaurant catering for events');

-- MEDICAL
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('medical', '052f304f-2b46-480e-9da7-3aff6f5b5f6f', 100, NULL),
  ('medical', '55e29ff8-affe-49c3-8cc0-6ba238d25bac', 70, NULL),
  ('medical', 'c4487fe3-5e12-4b88-a21d-28b2a59fe949', 100, NULL),
  ('medical', '7254da20-60ea-4546-9b9e-7e94e63be138', 100, NULL),
  ('medical', '132d4589-e1d0-46b6-9d51-a77d13e9f593', 100, NULL);

-- LEGAL
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('legal', 'c3754d11-73ee-423f-bfe1-e6afe7e0ccc6', 100, NULL),
  ('legal', 'c4a5be80-ccff-433e-9a3f-8ef193db64d6', 100, NULL),
  ('legal', '700ba024-2049-4b40-b7b6-97c6f9529c13', 70, NULL),
  ('legal', '482f93b6-22aa-45a2-b98b-a46d58e65d1c', 70, NULL),
  ('legal', '4ff91534-1f3e-4643-9bd2-6b83cea1c83a', 70, NULL),
  ('legal', '5d96503a-18e1-4764-8beb-64addc1abf53', 100, NULL),
  ('legal', '6e351fa0-853e-477a-8379-0be44c40cafa', 70, 'Close contracts on departure'),
  ('legal', '00ef8bae-4f75-4d53-b777-1e25492c5573', 70, 'Legal review of rental contract');

-- EDUCATION
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('education', 'b644bbb4-b710-41aa-955e-dcd82f4f560e', 100, NULL),
  ('education', 'e4b75a6c-7093-4b58-bbc3-30164d03f7e6', 100, NULL),
  ('education', '1578b1cb-a81a-40db-95de-6258f5ae0358', 100, NULL);

-- FITNESS
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('fitness', '81f18fe2-d37e-4fdb-b2f1-bf9cc389b7d7', 100, NULL),
  ('fitness', 'b3766622-e3fe-4c2e-99c7-8ea42e4baeaf', 100, NULL);

-- EVENT
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('event', '8d15825c-eb31-49a3-a667-54c6be04b2e3', 100, NULL),
  ('event', 'e353f47d-d219-4028-b74e-f40532526b01', 100, NULL),
  ('event', '99153978-598e-4c12-96f1-d31577ba048a', 100, NULL),
  ('event', '44e14470-0e29-4b2d-96e8-0ca57e273809', 100, NULL);

-- WATER_ACTIVITY
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('water_activity', '82027abf-8f26-49df-887b-af653af6bc70', 100, NULL),
  ('water_activity', '4f5c12a5-e530-4b3f-a7e1-71b711d361d6', 100, NULL);

-- PET_SERVICE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('pet_service', '75db77f0-975c-4dc8-81ac-aa4f9d86802b', 100, NULL),
  ('pet_service', 'a31ebff7-0268-4a5f-8c4c-41864102e9f9', 100, NULL);

-- FLOWER
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('flower', 'd0bb66bd-d447-49d4-a974-853e866c91c8', 100, NULL);

-- INSURANCE
INSERT INTO public.vertical_life_tasks (vertical_code, life_task_id, priority_weight, context_notes) VALUES
  ('insurance', 'a1163d34-36e0-4343-951b-23d9890f0413', 100, NULL),
  ('insurance', 'aa8fec18-f5d7-4b78-ac67-342fdd34c1c6', 100, NULL),
  ('insurance', '2b200b28-2161-4201-819f-985850cfd73b', 100, NULL);

-- ============================================================
-- VALIDATION VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.vertical_task_coverage AS
SELECT
  vlt.vertical_code,
  count(*) AS task_count,
  count(*) FILTER (WHERE vlt.priority_weight >= 100) AS core_tasks,
  count(*) FILTER (WHERE vlt.priority_weight BETWEEN 50 AND 99) AS support_tasks,
  count(*) FILTER (WHERE vlt.priority_weight < 50) AS contextual_tasks,
  array_agg(DISTINCT lt.code ORDER BY lt.code) AS task_codes
FROM public.vertical_life_tasks vlt
JOIN public.life_tasks lt ON lt.id = vlt.life_task_id
WHERE vlt.is_active
GROUP BY vlt.vertical_code
ORDER BY vlt.vertical_code;

-- ============================================================
-- RPCs
-- ============================================================

-- Resolve verticals for a specific task
CREATE OR REPLACE FUNCTION public.resolve_verticals_for_task(p_task_code text)
RETURNS TABLE(vertical_code text, priority_weight int, context_notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vlt.vertical_code, vlt.priority_weight, vlt.context_notes
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  WHERE lt.code = p_task_code AND vlt.is_active AND lt.is_active
  ORDER BY vlt.priority_weight DESC;
$$;

-- Resolve tasks for a specific vertical
CREATE OR REPLACE FUNCTION public.resolve_tasks_for_vertical(p_vertical_code text)
RETURNS TABLE(task_code text, task_title_en text, task_type text, scenario_code text, situation_code text, priority_weight int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lt.code, lt.title_en, lt.task_type, lsc.code, ls.code, vlt.priority_weight
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE vlt.vertical_code = p_vertical_code
    AND vlt.is_active AND lt.is_active AND lsc.is_active AND ls.is_active
  ORDER BY vlt.priority_weight DESC;
$$;

-- Resolve ranked verticals for a situation
CREATE OR REPLACE FUNCTION public.resolve_verticals_for_situation(p_situation_code text)
RETURNS TABLE(vertical_code text, max_priority int, task_count bigint, tasks text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT vlt.vertical_code, max(vlt.priority_weight)::int, count(*), array_agg(lt.code ORDER BY vlt.priority_weight DESC)
  FROM vertical_life_tasks vlt
  JOIN life_tasks lt ON lt.id = vlt.life_task_id
  JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
  JOIN life_situations ls ON ls.id = lsc.life_situation_id
  WHERE ls.code = p_situation_code
    AND vlt.is_active AND lt.is_active AND lsc.is_active AND ls.is_active
  GROUP BY vlt.vertical_code
  ORDER BY max(vlt.priority_weight) DESC, count(*) DESC;
$$;

-- Migration: 20260209044532_044a719a-905b-44e5-bf63-732dcada6e05.sql
-- Fix: create_order_atomic must bypass RLS to insert into child tables
ALTER FUNCTION public.create_order_atomic(
  p_order_type text,
  p_customer_user_id uuid,
  p_provider_org_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_total_amount numeric,
  p_currency text,
  p_notes text,
  p_metadata jsonb,
  p_items jsonb,
  p_participants jsonb,
  p_addresses jsonb,
  p_payment_method text,
  p_payment_amount numeric
) SECURITY DEFINER SET search_path = public;

-- Also add INSERT policy for order_status_history as a safety net
CREATE POLICY "Users can insert status for own orders"
ON public.order_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id
    AND orders.customer_user_id = auth.uid()
  )
);
-- Migration: 20260209052030_a2bde20f-8922-40d9-a8d5-8d106bd56bcb.sql

-- Add booking_model column to experiences
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS booking_model text DEFAULT 'group';

-- Add new experience categories to lookup_values (correct column names)
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES
  ('experience_category', 'shooting', 'Shooting Range', 'Тир', '🎯', 60, true),
  ('experience_category', 'escape-room', 'Escape Room', 'Квест-комната', '🔐', 61, true),
  ('experience_category', 'golf', 'Golf', 'Гольф', '⛳', 62, true),
  ('experience_category', 'extreme', 'Extreme', 'Экстрим', '🤸', 63, true),
  ('experience_category', 'wildlife', 'Wildlife', 'Животные', '🐘', 65, true),
  ('experience_category', 'food-tour', 'Food Tour', 'Гастротур', '🍜', 66, true),
  ('experience_category', 'city-tour', 'City Tour', 'Городской тур', '🏛️', 67, true),
  ('experience_category', 'paintball', 'Paintball', 'Пейнтбол', '🎨', 68, true)
ON CONFLICT DO NOTHING;

-- Add to experience_categories table
INSERT INTO public.experience_categories (slug, name_en, name_ru, icon, experience_type, sort_order, is_active)
VALUES
  ('shooting', 'Shooting Range', 'Тир', '🎯', 'activity', 20, true),
  ('escape-room', 'Escape Room', 'Квест-комната', '🔐', 'activity', 21, true),
  ('golf', 'Golf', 'Гольф', '⛳', 'activity', 22, true),
  ('extreme', 'Extreme', 'Экстрим', '🤸', 'activity', 23, true),
  ('wildlife', 'Wildlife', 'Животные', '🐘', 'activity', 24, true),
  ('food-tour', 'Food Tour', 'Гастротур', '🍜', 'tour', 25, true),
  ('city-tour', 'City Tour', 'Городской тур', '🏛️', 'tour', 26, true),
  ('paintball', 'Paintball', 'Пейнтбол', '🎨', 'activity', 27, true)
ON CONFLICT DO NOTHING;

-- Migration: 20260209060558_d52f305e-0f49-4aa6-9d0b-732cc7e29041.sql

-- Create storage bucket for yacht images
INSERT INTO storage.buckets (id, name, public)
VALUES ('yacht-images', 'yacht-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read yacht images"
ON storage.objects FOR SELECT
USING (bucket_id = 'yacht-images');

-- Allow authenticated uploads (admins/system)
CREATE POLICY "Authenticated upload yacht images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'yacht-images' AND auth.role() = 'authenticated');

-- Allow authenticated updates
CREATE POLICY "Authenticated update yacht images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'yacht-images' AND auth.role() = 'authenticated');

-- Migration: 20260209075100_c8764d15-6b42-4aa1-8f65-ada19acf0d75.sql
-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Property images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Service role can upload (edge functions use service role)
CREATE POLICY "Service role can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Service role can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');

-- Migration: 20260209154321_6e9809c2-d752-4223-a280-76cbe24f5861.sql
INSERT INTO public.life_tasks (life_scenario_id, code, title_en, title_ru, task_type, priority, is_active)
VALUES
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.checkin_checkout', 'Guest check-in / check-out', 'Заезд / выезд гостей', 'service', 80, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.cleaning', 'Cleaning & housekeeping', 'Уборка и клининг', 'service', 75, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.meters', 'Utility meter readings', 'Показания счётчиков', 'service', 60, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.deposits', 'Security deposits', 'Депозиты и залоги', 'service', 55, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.taxes', 'Property taxes', 'Налоги на недвижимость', 'info', 50, true),
  ('9937f2fa-72d8-4f5c-af0b-0252e3a7e8e9', 'property.management.inspection', 'Property inspection', 'Инспекция объекта', 'service', 45, true)
ON CONFLICT (code) DO NOTHING;
-- Migration: 20260210074828_500b3274-5c9f-4aa0-be55-a534dbb166e6.sql

-- Management Companies table
CREATE TABLE public.management_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo TEXT,
  cover_image TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  address TEXT,
  district TEXT,
  languages TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  founded_year INT,
  properties_count INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link members (managers) to companies
CREATE TABLE public.management_company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Add management_company_id to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS management_company_id UUID REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_management_company ON public.properties(management_company_id);
CREATE INDEX IF NOT EXISTS idx_mc_members_user ON public.management_company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_slug ON public.management_companies(slug);

-- RLS
ALTER TABLE public.management_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_company_members ENABLE ROW LEVEL SECURITY;

-- Public read for active companies (guests can browse)
CREATE POLICY "Anyone can view active management companies"
  ON public.management_companies FOR SELECT
  USING (is_active = true);

-- Members can update their company
CREATE POLICY "Company members can update their company"
  ON public.management_companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Admins can manage all companies
CREATE POLICY "Admins can manage companies"
  ON public.management_companies FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
  );

-- Members: users can see their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.management_company_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Company admins can manage members
CREATE POLICY "Company admins can manage members"
  ON public.management_company_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = management_company_members.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
        AND mcm.is_active = true
    )
  );

-- Admins can manage all memberships
CREATE POLICY "Admins can manage all memberships"
  ON public.management_company_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
  );

-- Public can view memberships (for company profile pages)
CREATE POLICY "Anyone can view company memberships"
  ON public.management_company_members FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_management_companies_updated_at
  BEFORE UPDATE ON public.management_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20260210081900_f641de9e-9bd3-43c5-b228-a8d9d582e240.sql

-- Add provider_id link to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD CONSTRAINT management_companies_provider_id_key UNIQUE (provider_id);

-- Trigger function: auto-create/update management_companies from providers
CREATE OR REPLACE FUNCTION public.sync_provider_to_management_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for property_management providers
  IF NEW.business_category = 'property_management' THEN
    INSERT INTO public.management_companies (
      provider_id,
      slug,
      name_en,
      name_ru,
      description_en,
      description_ru,
      logo,
      cover_image,
      phone,
      email,
      website,
      rating,
      review_count,
      is_verified,
      is_active
    ) VALUES (
      NEW.id,
      LOWER(REPLACE(REPLACE(TRIM(NEW.name), ' ', '-'), '''', '')),
      NEW.name,
      COALESCE(NEW.name, ''),
      NEW.description_en,
      NEW.description_ru,
      NEW.logo_url,
      NEW.cover_image,
      NEW.phone,
      NEW.email,
      NEW.website,
      NEW.rating,
      NEW.review_count,
      NEW.is_verified,
      NEW.is_active
    )
    ON CONFLICT (provider_id) DO UPDATE SET
      name_en = EXCLUDED.name_en,
      name_ru = EXCLUDED.name_ru,
      description_en = EXCLUDED.description_en,
      description_ru = EXCLUDED.description_ru,
      logo = EXCLUDED.logo,
      cover_image = EXCLUDED.cover_image,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      website = EXCLUDED.website,
      rating = EXCLUDED.rating,
      review_count = EXCLUDED.review_count,
      is_verified = EXCLUDED.is_verified,
      is_active = EXCLUDED.is_active;
  ELSE
    -- If category changed away from property_management, deactivate
    IF TG_OP = 'UPDATE' AND OLD.business_category = 'property_management' THEN
      UPDATE public.management_companies SET is_active = false WHERE provider_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_sync_provider_to_mc ON public.providers;
CREATE TRIGGER trg_sync_provider_to_mc
  AFTER INSERT OR UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_provider_to_management_company();

-- Migration: 20260210105640_c42458d7-5391-4957-9a30-d77b09c893e7.sql

-- 1. Add "planning" life situation
INSERT INTO public.life_situations (code, title_en, title_ru, description_en, description_ru, icon, color, priority, is_active)
VALUES (
  'planning',
  'Trip Planning',
  'Планирование поездки',
  'Key decisions before your trip: accommodation, transport, insurance, experiences',
  'Ключевые решения до поездки: жильё, транспорт, страховка, впечатления',
  'CalendarCheck',
  '#6366F1',
  1,
  true
);

-- 2. Add LifeOS route
INSERT INTO public.lifeos_routes (
  life_situation_id, pain_type, emotional_state, risk_level,
  recognition_en, recognition_ru, reassurance_en, reassurance_ru,
  what_matters_en, what_matters_ru,
  recommended_title_en, recommended_title_ru,
  recommended_why_en, recommended_why_ru,
  cta_text_en, cta_text_ru, cta_type, cta_target, is_active
)
SELECT id,
  'uncertainty', 'anticipation', 'low',
  'Planning a trip to Phuket? The best villas, cars, and experiences get booked early.',
  'Планируете поездку на Пхукет? Лучшие виллы, авто и впечатления бронируют заранее.',
  'We help thousands of guests plan their perfect trip.',
  'Мы помогаем тысячам гостей спланировать идеальную поездку.',
  ARRAY['Accommodation', 'Transport', 'Insurance', 'Experiences'],
  ARRAY['Жильё', 'Транспорт', 'Страховка', 'Впечатления'],
  'Start Your Trip Plan',
  'Начните планирование',
  'Secure the best options early — availability drops closer to travel dates.',
  'Лучшие варианты заканчиваются ближе к дате вылета — бронируйте заранее.',
  'Start planning', 'Начать планирование',
  'navigate', '/life/planning', true
FROM public.life_situations WHERE code = 'planning';

-- 3. Catalog mappings with real entity UUIDs
-- Properties (weight 85)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'property', e.eid::uuid, ls.id, 85, ARRAY['guest','resident','investor'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('891d0f8f-4c61-4029-8784-dc934588f9d8'),
  ('1eb24816-8100-465a-b7c2-fdad8b2e6d22'),
  ('92cd49c8-6af1-4b01-8d98-d0a473643053'),
  ('4c7d5de0-5df2-48c8-a695-2d08bac80659'),
  ('fc65b216-14c8-46fd-8f43-2264c02369f0')
) AS e(eid)
WHERE ls.code = 'planning';

-- Vehicles (weight 80)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'vehicle', e.eid::uuid, ls.id, 80, ARRAY['guest','resident'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('d38da19d-814a-4710-9f78-034145f59ba4'),
  ('233c5a94-d1d9-407d-8fee-ef006c3f6e9c'),
  ('c02c5b45-aa37-4882-900b-9dc5424734fa')
) AS e(eid)
WHERE ls.code = 'planning';

-- Experiences (weight 75)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'experience', e.eid::uuid, ls.id, 75, ARRAY['guest','resident'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('bc231231-1823-4748-ba93-b6240f7fbd25'),
  ('ff755ab9-c9e7-4386-af0a-cf6c735a7406'),
  ('5b065150-6bc5-4fa2-b8c5-01e88a95397d')
) AS e(eid)
WHERE ls.code = 'planning';

-- Yachts (weight 70)
INSERT INTO public.catalog_life_map (entity_type, entity_id, life_situation_id, weight, role_scope, rules)
SELECT 'yacht', e.eid::uuid, ls.id, 70, ARRAY['guest','resident','investor'], '{}'::jsonb
FROM public.life_situations ls,
(VALUES 
  ('b5010005-0007-4000-a000-000000000001'),
  ('b5010003-0009-4000-a000-000000000001')
) AS e(eid)
WHERE ls.code = 'planning';

-- Migration: 20260211054408_bcfbc623-aae2-4b0f-a62a-0f49a934f786.sql

-- =============================================
-- 1. ENHANCE EXISTING REVIEWS TABLE
-- =============================================
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'auto_approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Backfill entity_type/entity_id from existing item_type/item_id
UPDATE public.reviews SET entity_type = item_type WHERE entity_type IS NULL AND item_type IS NOT NULL;
UPDATE public.reviews SET entity_id = item_id::uuid WHERE entity_id IS NULL AND item_id IS NOT NULL AND item_id ~ '^[0-9a-f-]{36}$';

CREATE INDEX IF NOT EXISTS idx_reviews_entity ON public.reviews(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews(order_id);

-- Auto-moderate trigger
CREATE OR REPLACE FUNCTION public.auto_moderate_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 3 THEN
    NEW.moderation_status := 'pending';
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_moderate_review ON public.reviews;
CREATE TRIGGER trg_auto_moderate_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_moderate_review();

-- =============================================
-- 2. REFERRAL SYSTEM
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_balance NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC NOT NULL DEFAULT 200,
  reward_currency TEXT NOT NULL DEFAULT 'THB',
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  qualifying_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.user_referrals(referred_id);
CREATE UNIQUE INDEX idx_referrals_unique ON public.user_referrals(referrer_id, referred_id);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON public.user_referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- Generate referral code trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT OR UPDATE OF referral_code ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- Generate codes for existing profiles
UPDATE public.profiles SET referral_code = upper(substring(md5(id::text || random()::text) from 1 for 6)) WHERE referral_code IS NULL;

-- =============================================
-- 3. ENHANCE USER_DOCUMENTS TABLE
-- =============================================
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS reminder_days INT[] DEFAULT '{30,14,7}';
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS country TEXT;

-- Migration: 20260211163441_cdce3d10-d948-45e0-975c-c61d228d0474.sql
-- Create storage bucket for processed bouquet images
INSERT INTO storage.buckets (id, name, public) VALUES ('bouquet-images', 'bouquet-images', true);

-- Allow public read access
CREATE POLICY "Public read bouquet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bouquet-images');

-- Allow service role to upload
CREATE POLICY "Service upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bouquet-images');
-- Migration: 20260212003009_9895df0a-1ed4-4d24-bf85-52a2ac9af45d.sql

-- Add psychology, margin, and SEO columns to bouquets table
ALTER TABLE public.bouquets
  ADD COLUMN IF NOT EXISTS cost_thb numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS margin_percent numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS box_type text DEFAULT 'wrap',
  ADD COLUMN IF NOT EXISTS short_description_en text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS short_description_ru text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS urgency_badge text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_proof_badge text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scarcity_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emotional_trigger_tag text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bestseller_rank integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seo_slug text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collection_slug text DEFAULT NULL;

-- Add flower_addons table for upsell items
CREATE TABLE IF NOT EXISTS public.flower_addons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  price_thb numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'addon',
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flower_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flower addons are publicly readable"
  ON public.flower_addons FOR SELECT USING (true);

-- Insert standard addons
INSERT INTO public.flower_addons (name_en, name_ru, price_thb, type, sort_order) VALUES
  ('Greeting Card', 'Открытка', 150, 'card', 1),
  ('Premium Chocolate Box', 'Премиум шоколад', 890, 'chocolate', 2),
  ('Glass Vase', 'Стеклянная ваза', 590, 'vase', 3),
  ('Teddy Bear', 'Плюшевый мишка', 690, 'toy', 4),
  ('Balloon Bundle', 'Воздушные шары', 450, 'balloon', 5);

-- Migration: 20260212004955_05ec62b3-f548-4741-94b1-db0752783237.sql

-- Create storage bucket for bouquet images
INSERT INTO storage.buckets (id, name, public) VALUES ('bouquet-images', 'bouquet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Bouquet images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'bouquet-images');

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bouquet-images' AND auth.role() = 'authenticated');

-- Migration: 20260213115201_1b55f6f6-1d37-42b3-975f-59cb73501a89.sql

-- Fix: Property guidebook access should expire after checkout date
DROP POLICY IF EXISTS "Users with bookings can view guidebook" ON public.property_guidebook;

CREATE POLICY "Users with bookings can view guidebook"
ON public.property_guidebook
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_bookings pb
    JOIN public.profiles p ON pb.guest_email = p.email
    WHERE pb.property_id = property_guidebook.property_id
    AND p.id = auth.uid()
    AND pb.status IN ('confirmed', 'checked_in')
    AND pb.check_out >= CURRENT_DATE
  )
  OR
  EXISTS (
    SELECT 1 FROM public.guest_check_in_data gc
    JOIN public.property_bookings pb ON gc.booking_id = pb.id
    WHERE pb.property_id = property_guidebook.property_id
    AND gc.user_id = auth.uid()
    AND pb.check_out >= CURRENT_DATE
  )
);

-- Migration: 20260218013857_0ca741ad-c4e6-4df2-b1a6-c38f45a34d31.sql

-- Fix check_yacht_availability: replace o.entity_id (does not exist) with correct
-- lookup via order_items metadata or orders metadata
CREATE OR REPLACE FUNCTION public.check_yacht_availability(
  p_yacht_id uuid,
  p_start_date date,
  p_end_date date,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM orders o
  WHERE o.vertical = 'yacht'
    AND (o.metadata->>'yacht_id')::uuid = p_yacht_id
    AND o.status NOT IN ('cancelled', 'refunded')
    AND (p_exclude_order_id IS NULL OR o.id != p_exclude_order_id)
    AND o.start_at IS NOT NULL
    AND (
      (o.start_at::date, COALESCE(o.end_at::date, o.start_at::date + interval '1 day'))
      OVERLAPS
      (p_start_date, p_end_date + interval '1 day')
    );

  RETURN v_conflict_count = 0;
END;
$$;

-- Migration: 20260219004018_6aba8c55-5108-4f48-bf2d-cbdb314859b9.sql

-- ══════════════════════════════════════════════════════════════════
-- FIX 1: Add in-app notification trigger for new consultation leads
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vertical text;
  v_type_label text;
  v_budget text;
BEGIN
  -- Build readable type label
  v_vertical := COALESCE(NEW.vertical_id, NEW.request_type, 'general');
  
  v_type_label := CASE NEW.request_type
    WHEN 'vacation_rental'        THEN '🏠 Аренда жилья'
    WHEN 'property_consultation'  THEN '🏠 Консультация по недвижимости'
    WHEN 'property_tour'          THEN '🏠 Просмотр объекта'
    WHEN 'investment_advice'      THEN '💰 Инвестиционная консультация'
    WHEN 'full_management'        THEN '🔑 Полное управление'
    WHEN 'channel_management'     THEN '📡 Управление каналами'
    WHEN 'long_term_rental'       THEN '📋 Долгосрочная аренда'
    WHEN 'property_purchase'      THEN '🏡 Покупка недвижимости'
    WHEN 'yacht_charter'          THEN '🛥️ Аренда яхты'
    WHEN 'car_rental'             THEN '🚗 Аренда авто'
    WHEN 'airport_transfer'       THEN '✈️ Трансфер'
    WHEN 'visa_consultation'      THEN '📄 Визовая консультация'
    WHEN 'doctor_appointment'     THEN '🏥 Запись к врачу'
    WHEN 'babysitter_hourly'      THEN '👶 Няня (почасово)'
    WHEN 'babysitter_daily'       THEN '👶 Няня (на день)'
    WHEN 'spa_booking'            THEN '💆 Спа'
    WHEN 'gym_daypass'            THEN '💪 Зал (день)'
    WHEN 'gym_membership'         THEN '💪 Абонемент в зал'
    WHEN 'table_booking'          THEN '🍽️ Бронь стола'
    ELSE COALESCE(NEW.request_type, 'general_inquiry')
  END;

  -- Build budget string
  IF NEW.budget_min IS NOT NULL OR NEW.budget_max IS NOT NULL THEN
    v_budget := ' · ' || COALESCE(NEW.currency, 'THB') || ' ' ||
                COALESCE(NEW.budget_min::text, '?') || '–' ||
                COALESCE(NEW.budget_max::text, '?');
  ELSE
    v_budget := '';
  END IF;

  -- Insert notification for all admins
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '📩 Новая заявка: ' || v_type_label,
    NEW.name || ' · ' || NEW.phone || v_budget,
    'lead',
    jsonb_build_object(
      'lead_id',      NEW.id,
      'request_type', NEW.request_type,
      'vertical_id',  v_vertical,
      'name',         NEW.name,
      'phone',        NEW.phone,
      'status',       NEW.status,
      'priority',     NEW.priority
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$$;

-- Create the trigger on consultation_requests
DROP TRIGGER IF EXISTS trg_notify_admins_new_lead ON public.consultation_requests;
CREATE TRIGGER trg_notify_admins_new_lead
  AFTER INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_lead();


-- ══════════════════════════════════════════════════════════════════
-- FIX 2: Remove duplicate property submission trigger
-- (keep the older canonical one, drop the duplicate)
-- ══════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trigger_notify_admins_property_submission ON public.owner_properties;


-- ══════════════════════════════════════════════════════════════════
-- FIX 3: Fix notify-admin-order email duplicate 'subject' key
-- (this is in edge function code, not DB — handled separately)
-- ══════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- FIX 4: Add trigger for admin in-app notification on airport bookings
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_airport_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dir text;
BEGIN
  v_dir := CASE NEW.direction
    WHEN 'arrival'   THEN '✈️ Прилёт'
    WHEN 'departure' THEN '🛫 Вылет'
    ELSE NEW.direction
  END;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    ur.user_id,
    '✈️ Fast Track: ' || v_dir,
    'Рейс ' || NEW.flight_number || ' · ' || NEW.flight_date || ' · ' || NEW.currency || ' ' || NEW.total_price::text,
    'airport_booking',
    jsonb_build_object(
      'booking_id',     NEW.id,
      'direction',      NEW.direction,
      'flight_number',  NEW.flight_number,
      'flight_date',    NEW.flight_date,
      'total_price',    NEW.total_price,
      'status',         NEW.status
    )
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'uno_team');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_airport_booking ON public.airport_bookings;
CREATE TRIGGER trg_notify_admins_airport_booking
  AFTER INSERT ON public.airport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_airport_booking();

-- Migration: 20260219005420_1a326480-fecf-4bdd-9f09-e386f4714ad1.sql

-- Add 'persona' concept to user_roles to handle tourist/resident/property_owner
-- These are user personas, not security roles, but should still live in user_roles

-- First, check if user_persona type exists (it does per types.ts), update app_role enum if needed
-- The app_role enum already includes: tourist, resident, property_owner, vendor, owner, admin etc.
-- So personas can be stored as roles in user_roles table

-- Add missing persona values to app_role if not present
-- (already present based on types.ts: tourist, resident, property_owner)

-- Add all profile_details columns to profiles table for merge
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[],
  ADD COLUMN IF NOT EXISTS medical_conditions text,
  ADD COLUMN IF NOT EXISTS travel_preferences jsonb;

-- Standardize emergency contact fields in profiles (rename relationship -> relation for consistency)
-- profiles has: emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
-- profile_details has: emergency_contact_name, emergency_contact_phone, emergency_contact_relation
-- Keep profiles columns as canonical, add alias in profile_details is irrelevant after merge

-- Migrate existing profile_details data into profiles
UPDATE public.profiles p
SET
  date_of_birth = pd.date_of_birth::date,
  gender = pd.gender,
  nationality = pd.nationality,
  address_line1 = pd.address_line1,
  address_line2 = pd.address_line2,
  city = pd.city,
  state_province = pd.state_province,
  postal_code = pd.postal_code,
  country = pd.country,
  dietary_restrictions = pd.dietary_restrictions,
  medical_conditions = pd.medical_conditions,
  travel_preferences = pd.travel_preferences,
  -- Merge emergency contact from profile_details only if profiles doesn't already have them
  emergency_contact_name = COALESCE(p.emergency_contact_name, pd.emergency_contact_name),
  emergency_contact_phone = COALESCE(p.emergency_contact_phone, pd.emergency_contact_phone),
  emergency_contact_relationship = COALESCE(p.emergency_contact_relationship, pd.emergency_contact_relation)
FROM public.profile_details pd
WHERE pd.user_id = p.id;

-- Migrate user_type from profiles to user_roles (as personas)
-- Only insert if not already present in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.user_type::text::app_role
FROM public.profiles p
WHERE p.user_type IS NOT NULL
  AND p.user_type::text::app_role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id
      AND ur.role = p.user_type::text::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies for profiles to allow users to update new columns
-- (existing RLS should already cover this since policies are on the table level)

-- Drop profile_details table (data migrated to profiles)
DROP TABLE IF EXISTS public.profile_details CASCADE;

-- Add comment to user_type column marking it as deprecated
COMMENT ON COLUMN public.profiles.user_type IS 'DEPRECATED: Use user_roles table instead. Kept for backward compatibility only.';

-- Migration: 20260219010922_0979bae2-71d2-4a94-9f10-7e02c0e2f185.sql

-- Module 6: vertical_subscriptions table
CREATE TABLE IF NOT EXISTS public.vertical_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vertical_slug TEXT NOT NULL,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, vertical_slug)
);

ALTER TABLE public.vertical_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vertical subscriptions"
  ON public.vertical_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vertical subscriptions"
  ON public.vertical_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vertical subscriptions"
  ON public.vertical_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vertical subscriptions"
  ON public.vertical_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vertical subscriptions"
  ON public.vertical_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uno_team'));

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_vertical_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vertical_subscriptions_updated_at
  BEFORE UPDATE ON public.vertical_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vertical_subscriptions_updated_at();

-- Ensure user_segments has is_vip and is_at_risk columns (add if missing)
ALTER TABLE public.user_segments
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_at_risk BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Migration: 20260219011721_9e79ec63-1743-4272-b407-39372bbd4cd7.sql
-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Migration: 20260219012152_1f6d8bdf-c00c-45d4-8d9e-d80ff5f3b5de.sql
-- Remove duplicate RLS policies on property_bookings that conflict with each other
DROP POLICY IF EXISTS "Owners can delete own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can insert own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can update own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Owners can view own property bookings" ON public.property_bookings;
DROP POLICY IF EXISTS "Property owners can view their bookings" ON public.property_bookings;
-- Migration: 20260219014603_befbd764-7247-4a23-a9d8-374145c37f25.sql

-- Fix RLS policies on property_reports: unify permission key 'financial' → 'financials'

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Owners can view their reports" ON property_reports;

-- Recreate SELECT policy with correct key 'financials'
CREATE POLICY "Owners can view their reports"
ON property_reports FOR SELECT
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM property_delegates pd
    WHERE pd.property_id = property_reports.property_id
      AND pd.user_id = auth.uid()
      AND pd.status = 'active'
      AND ((pd.permissions->>'financials')::boolean = true)
  )
);

-- Drop old INSERT policy
DROP POLICY IF EXISTS "Users can create reports for their properties" ON property_reports;

-- Recreate INSERT policy with correct key 'financials'
CREATE POLICY "Owners and managers can create reports"
ON property_reports FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM owner_properties op
    WHERE op.id = property_reports.property_id
      AND op.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM property_delegates pd
    WHERE pd.property_id = property_reports.property_id
      AND pd.user_id = auth.uid()
      AND pd.status = 'active'
      AND ((pd.permissions->>'financials')::boolean = true)
  )
);

-- Migration: 20260219020053_fb22873b-510d-4ad0-8a99-63ec5a2c19f8.sql

-- Fix is_property_owner function with correct column name
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_properties
    WHERE id = _property_id AND owner_id = _user_id
  )
$$;

-- Migration: 20260219021046_e89c5f9a-9e7e-4cae-90e6-21f001ea543e.sql

-- =====================================================
-- 1. PROPERTY COMPLEXES (Группировка объектов по комплексам)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_complexes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,  -- УК / владелец создающий комплекс
  name text NOT NULL,
  name_ru text,
  description text,
  address text,
  district text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_complexes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own complexes"
  ON public.property_complexes
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Add complex_id to owner_properties
ALTER TABLE public.owner_properties
  ADD COLUMN IF NOT EXISTS complex_id uuid REFERENCES public.property_complexes(id) ON DELETE SET NULL;

-- =====================================================
-- 2. STAFF MEMBERS (Реестр сотрудников УК)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,  -- УК / владелец, которому принадлежит сотрудник
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',  -- cleaner | maintenance | manager | admin | staff
  phone text,
  email text,
  notes text,
  hourly_rate numeric(10,2),
  daily_rate numeric(10,2),
  monthly_salary numeric(10,2),
  pay_type text NOT NULL DEFAULT 'salary',  -- salary | hourly | daily | per_task
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own staff"
  ON public.staff_members
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Staff assignments to properties
CREATE TABLE IF NOT EXISTS public.staff_property_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,  -- references owner_properties.id
  owner_id uuid NOT NULL,
  role_at_property text,  -- specific role for this property (may differ from general role)
  is_primary boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their staff assignments"
  ON public.staff_property_assignments
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- 3. COST SOURCE (Своих vs внешние — поле в финансах)
-- =====================================================
-- Add cost_source column to existing property_financials table
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS cost_source text DEFAULT 'external' CHECK (cost_source IN ('internal', 'external', 'mixed'));

-- Add staff_member_id link for internal costs
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL;

-- =====================================================
-- 4. AUTO-UPDATED timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_complexes_updated_at
  BEFORE UPDATE ON public.property_complexes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migration: 20260220020748_4a3a09c8-72d7-42ab-80ad-3f0999088b92.sql

-- Fix 3 Security Definer Views by setting security_invoker=true
-- These are public catalog views that don't expose PII, but should still use invoker security

ALTER VIEW public.catalog_life_map_v2 SET (security_invoker = true);
ALTER VIEW public.lifeos_health_view SET (security_invoker = true);
ALTER VIEW public.vertical_task_coverage SET (security_invoker = true);

-- Fix function search_path mutable for set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Migration: 20260220020814_12c94f02-5216-4dfb-b1f7-29d076be0380.sql

-- Fix: the previous migration dropped the policy but failed on creating the new one
-- Re-create proper policies for property_listing_scores

CREATE POLICY "Anyone can read listing scores"
ON public.property_listing_scores
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage listing scores"
ON public.property_listing_scores
FOR ALL
TO authenticated
USING (public.is_admin_or_uno_team())
WITH CHECK (public.is_admin_or_uno_team());

-- Migration: 20260220020828_a4e6db95-817b-436e-8fb1-9c1294b9b147.sql

-- Drop the old permissive "System can manage listing scores" policy
DROP POLICY IF EXISTS "System can manage listing scores" ON public.property_listing_scores;

