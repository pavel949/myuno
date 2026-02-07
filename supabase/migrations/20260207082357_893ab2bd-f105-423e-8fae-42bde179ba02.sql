
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
