-- Seed starter Knowledge Hub content for Phuket.
--
-- The location_knowledge table shipped empty, so the Knowledge Hub section
-- cards rendered "0 articles". This seeds factual, evergreen bilingual content
-- for the five grid sections (overview, culture, government, nature, practical).
-- Emergency and dos-donts are intentionally not seeded — they are served by
-- dedicated cards on the hub (EmergencyContacts -> /sos and DosDontsCard).
--
-- Idempotent: ON CONFLICT (city_id, section, slug) DO NOTHING. Safe to re-run.
-- City is resolved by slug; if Phuket is missing the CROSS JOIN yields no rows
-- and nothing is inserted (no error).

INSERT INTO public.location_knowledge
  (city_id, section, slug, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, icon, sort_order, is_published)
SELECT c.id, v.section, v.slug, v.title_en, v.title_ru, v.summary_en, v.summary_ru, v.content_en, v.content_ru, v.icon, v.sort_order, true
FROM (SELECT id FROM public.cities WHERE slug = 'phuket' LIMIT 1) c
CROSS JOIN (VALUES
  -- ───────────────────────────── OVERVIEW ─────────────────────────────
  (
    'overview', 'phuket-at-a-glance',
    'Phuket at a glance', 'Пхукет: главное',
    'Geography, climate, districts and how to get around Thailand''s largest island.',
    'География, климат, районы и как передвигаться по самому большому острову Таиланда.',
    E'Phuket is Thailand''s largest island, on the Andaman coast in the south. It is linked to the mainland by the Sarasin Bridge, and Phuket International Airport (HKT) in the north handles most arrivals.\n\n## Climate & seasons\n\nThe weather is tropical and warm year-round (around 28°C).\n\n- High season: November–April — dry, calm seas, best for beaches.\n- Green season: May–October — warm with short heavy showers, fewer crowds and lower prices.\n- The sea can be rough from May to October; always check beach flags before swimming.\n\n## Districts & beaches\n\n- Patong — nightlife and the busiest beach.\n- Karon & Kata — calmer family beaches.\n- Kamala & Surin — quieter and upmarket.\n- Rawai & Nai Harn — the south, local life and seafood.\n- Phuket Town — culture, the Sino-Portuguese old town and markets.\n\n## Getting around\n\n- Taxis and ride-hailing apps (Grab, Bolt, inDrive) are the easiest way to move.\n- Scooters are popular but risky — always wear a helmet and carry a valid licence.\n- Distances are larger than they look; allow extra time in traffic.\n\n## SIM & internet\n\nBuy a tourist SIM (AIS, TrueMove or dtac) at the airport or any 7-Eleven with your passport. Mobile data and coverage are good across the island.',
    E'Пхукет — самый большой остров Таиланда на Андаманском побережье на юге страны. Он соединён с материком мостом Сарасин, а большинство туристов прибывает через аэропорт Пхукета (HKT) на севере.\n\n## Климат и сезоны\n\nКлимат тропический, тепло круглый год (около 28°C).\n\n- Высокий сезон: ноябрь–апрель — сухо, спокойное море, лучшее время для пляжей.\n- Зелёный сезон: май–октябрь — тепло, короткие сильные ливни, меньше людей и ниже цены.\n- С мая по октябрь море бывает неспокойным; всегда проверяйте флаги на пляже перед купанием.\n\n## Районы и пляжи\n\n- Патонг — ночная жизнь и самый людный пляж.\n- Карон и Ката — спокойные семейные пляжи.\n- Камала и Сурин — тише и дороже.\n- Раваи и Най Харн — юг, местная жизнь и морепродукты.\n- Пхукет-Таун — культура, старый сино-португальский город и рынки.\n\n## Как передвигаться\n\n- Такси и приложения (Grab, Bolt, inDrive) — самый простой способ.\n- Скутеры популярны, но опасны — всегда надевайте шлем и имейте действующие права.\n- Расстояния больше, чем кажутся; закладывайте время на пробки.\n\n## SIM и интернет\n\nКупите туристическую SIM (AIS, TrueMove или dtac) в аэропорту или в любом 7-Eleven по паспорту. Мобильный интернет и покрытие хорошие по всему острову.',
    '🏝️', 1
  ),
  -- ───────────────────────────── CULTURE ─────────────────────────────
  (
    'culture', 'thai-culture-and-etiquette',
    'Thai culture & etiquette', 'Культура и этикет Таиланда',
    'Temples, the wai greeting, respect for the monarchy and keeping face.',
    'Храмы, приветствие «вай», уважение к монархии и понятие «лица».',
    E'Thai culture values calm, politeness and respect. A little effort goes a long way.\n\n## The wai\n\nThe wai (palms pressed together with a slight bow) is both a greeting and a sign of respect. Returning a wai is polite; you do not need to wai children or service staff.\n\n## Temples & dress\n\n- Cover your shoulders and knees at temples.\n- Remove your shoes before entering temple buildings and many homes and shops.\n- Never point your feet at people or Buddha images, and do not touch anyone''s head.\n- Buddha images are sacred — treat them respectfully, not as décor.\n\n## The monarchy\n\nThai people deeply respect the Royal Family. Disrespect is a serious crime. Stand for the royal anthem when it is played in cinemas.\n\n## Keeping face\n\nStaying calm preserves "face". Shouting or showing anger in public is counter-productive and embarrassing for everyone. Smile, stay patient, and problems are resolved faster.',
    E'Тайская культура ценит спокойствие, вежливость и уважение. Немного усилий — и к вам отнесутся теплее.\n\n## Приветствие «вай»\n\n«Вай» (сложенные ладони и лёгкий поклон) — это и приветствие, и знак уважения. Ответить на «вай» вежливо; детям и обслуживающему персоналу отвечать не обязательно.\n\n## Храмы и одежда\n\n- В храмах закрывайте плечи и колени.\n- Снимайте обувь перед входом в храмовые здания и во многие дома и магазины.\n- Никогда не показывайте ступнями на людей или изображения Будды и не трогайте никого за голову.\n- Изображения Будды священны — относитесь к ним с уважением, а не как к декору.\n\n## Монархия\n\nТайцы глубоко уважают королевскую семью. Неуважение — серьёзное преступление. Вставайте, когда в кинотеатре звучит королевский гимн.\n\n## Понятие «лица»\n\nСпокойствие сохраняет «лицо». Крик и гнев на людях только вредят и ставят в неловкое положение всех. Улыбайтесь, сохраняйте терпение — и проблемы решаются быстрее.',
    '🙏', 1
  ),
  (
    'culture', 'festivals-and-holidays',
    'Festivals & holidays', 'Праздники и фестивали',
    'Songkran, Loy Krathong, the Vegetarian Festival and other key dates.',
    'Сонгкран, Лой Кратонг, Вегетарианский фестиваль и другие важные даты.',
    E'Phuket''s calendar is full of colourful festivals worth planning around.\n\n## Songkran (mid-April)\n\nThai New Year, famous for citywide water fights. Protect your phone in a waterproof pouch and expect to get soaked.\n\n## Loy Krathong (November)\n\nAt night people float decorated baskets on the water to release bad luck. Beautiful and family-friendly.\n\n## Phuket Vegetarian Festival (Sept/Oct)\n\nA unique nine-day Taoist festival with street processions and strict vegan food across the island. Expect firecrackers and early-morning events.\n\n## Good to know\n\n- On major Buddhist holidays alcohol sales can be restricted.\n- Public holidays affect bank and government office hours — plan visa or banking errands around them.',
    E'Календарь Пхукета полон ярких фестивалей, под которые стоит подстроить поездку.\n\n## Сонгкран (середина апреля)\n\nТайский Новый год, известный массовыми «водными боями». Спрячьте телефон в водонепроницаемый чехол и будьте готовы промокнуть.\n\n## Лой Кратонг (ноябрь)\n\nНочью люди пускают по воде украшенные корзинки, отпуская неудачи. Красиво и подходит для семьи.\n\n## Вегетарианский фестиваль Пхукета (сентябрь/октябрь)\n\nУникальный девятидневный даосский фестиваль с уличными процессиями и строго веганской едой по всему острову. Будут петарды и ранние утренние церемонии.\n\n## Полезно знать\n\n- В крупные буддийские праздники продажа алкоголя может быть ограничена.\n- Государственные праздники влияют на часы работы банков и госорганов — планируйте визовые и банковские дела заранее.',
    '🎉', 2
  ),
  -- ───────────────────────────── GOVERNMENT ─────────────────────────────
  (
    'government', 'visas-and-immigration',
    'Visas & immigration', 'Визы и иммиграция',
    'TM30 address registration, the 90-day report and overstay basics.',
    'Регистрация адреса TM30, отчёт каждые 90 дней и основы по оверстею.',
    E'Immigration rules change often — always confirm current requirements with Phuket Immigration or a licensed agent before acting.\n\n## TM30 (address registration)\n\nYour landlord or hotel must report where you are staying. For long stays, make sure your TM30 is filed — you may need it for other immigration tasks.\n\n## 90-day report\n\nIf you stay long-term, you must report your address to Immigration every 90 days. This can often be done online, by post or in person.\n\n## Overstay\n\nOverstaying your permitted dates is taken seriously:\n\n- The fine is 500 THB per day, up to 20,000 THB.\n- Long overstays can lead to detention and re-entry bans.\n- If you do overstay, go to Immigration as soon as possible.\n\n## Tips\n\n- Keep digital and paper copies of your passport, visa stamp and TM30.\n- For complex cases (work, retirement, marriage, Elite/LTR) use a reputable visa service.\n\nNeed help? UNO can connect you with visa and legal specialists.',
    E'Иммиграционные правила часто меняются — всегда уточняйте актуальные требования в иммиграции Пхукета или у лицензированного агента.\n\n## TM30 (регистрация адреса)\n\nВаш арендодатель или отель обязан сообщить, где вы проживаете. При длительном пребывании убедитесь, что TM30 подан — он может понадобиться для других процедур.\n\n## Отчёт каждые 90 дней\n\nПри долгом пребывании нужно сообщать свой адрес в иммиграцию каждые 90 дней. Часто это можно сделать онлайн, по почте или лично.\n\n## Оверстей (просрочка)\n\nК превышению разрешённого срока относятся серьёзно:\n\n- Штраф — 500 бат в день, до 20 000 бат.\n- Длительная просрочка может привести к задержанию и запрету на въезд.\n- Если вы всё же просрочили — идите в иммиграцию как можно скорее.\n\n## Советы\n\n- Храните цифровые и бумажные копии паспорта, визового штампа и TM30.\n- Для сложных случаев (работа, пенсия, брак, Elite/LTR) обращайтесь в надёжный визовый сервис.\n\nНужна помощь? UNO свяжет вас с визовыми и юридическими специалистами.',
    '🛂', 1
  ),
  (
    'government', 'embassies-and-consulates',
    'Embassies & consulates', 'Посольства и консульства',
    'Where to turn for lost passports and consular help.',
    'Куда обращаться при утере паспорта и за консульской помощью.',
    E'Most embassies are in Bangkok, with some honorary consulates in Phuket. For a lost or stolen passport you will usually need a local police report first.\n\n## If your passport is lost or stolen\n\n1. File a police report (Tourist Police: 1155, English-speaking).\n2. Contact your embassy or consulate for an emergency travel document.\n3. Bring the police report, photos and any ID copies you have.\n\n## Useful contacts (Phuket)\n\n- Russian Consulate Phuket: 076-510-392\n- Russian Embassy Bangkok: 02-234-9824\n- Immigration Phuket: 076-221-905\n\nFor the full list of emergency numbers, open the Emergency hub (SOS) in the app.',
    E'Большинство посольств находится в Бангкоке, в Пхукете есть несколько почётных консульств. При утере или краже паспорта обычно сначала нужен местный полицейский отчёт.\n\n## Если паспорт потерян или украден\n\n1. Подайте заявление в полицию (туристическая полиция: 1155, на английском).\n2. Свяжитесь с посольством или консульством для оформления временного документа.\n3. Возьмите с собой полицейский отчёт, фотографии и любые копии документов.\n\n## Полезные контакты (Пхукет)\n\n- Консульство РФ на Пхукете: 076-510-392\n- Посольство РФ в Бангкоке: 02-234-9824\n- Иммиграция Пхукета: 076-221-905\n\nПолный список экстренных номеров — в разделе экстренной помощи (SOS) в приложении.',
    '🏛️', 2
  ),
  -- ───────────────────────────── NATURE ─────────────────────────────
  (
    'nature', 'beaches-and-marine-safety',
    'Beaches & marine safety', 'Пляжи и безопасность на море',
    'Rip currents, warning flags, jellyfish and safe swimming.',
    'Отбойные течения, предупреждающие флаги, медузы и безопасное купание.',
    E'Phuket''s beaches are beautiful, but the Andaman Sea can be dangerous — especially in green season (May–October).\n\n## Flags\n\n- Red flag = no swimming, real danger and possible fines.\n- Green flag = safe to swim.\n- When in doubt, stay out. Drownings happen here every year.\n\n## Rip currents\n\nIf you are caught in a rip current, do NOT fight it:\n\n- Stay calm and float.\n- Swim parallel to the shore until you are out of the pull.\n- Then angle back towards the beach.\n\n## Jellyfish & marine life\n\n- For most stings, rinse with vinegar (not fresh water) and seek help.\n- Box jellyfish are rare but dangerous — call 1669 for severe reactions.\n- Wear reef shoes to avoid sea urchins and coral cuts.\n\n## Boats & tours\n\nUse operators that provide life jackets and check the weather. Trips are sometimes cancelled in rough seas for good reason.',
    E'Пляжи Пхукета прекрасны, но Андаманское море бывает опасным — особенно в зелёный сезон (май–октябрь).\n\n## Флаги\n\n- Красный флаг = купаться нельзя, реальная опасность и возможные штрафы.\n- Зелёный флаг = купаться безопасно.\n- Сомневаетесь — не заходите в воду. Здесь ежегодно случаются утопления.\n\n## Отбойные течения\n\nЕсли вас уносит отбойным течением, НЕ боритесь с ним:\n\n- Сохраняйте спокойствие и держитесь на воде.\n- Плывите параллельно берегу, пока не выйдете из течения.\n- Затем направляйтесь к берегу под углом.\n\n## Медузы и морские обитатели\n\n- При большинстве ожогов промойте уксусом (не пресной водой) и обратитесь за помощью.\n- Кубомедузы редки, но опасны — при сильной реакции звоните 1669.\n- Надевайте коралловые тапочки, чтобы не пораниться о морских ежей и кораллы.\n\n## Лодки и экскурсии\n\nВыбирайте операторов, которые выдают спасательные жилеты, и следите за погодой. Иногда поездки отменяют из-за шторма — и не зря.',
    '🌊', 1
  ),
  (
    'nature', 'wildlife-and-nature',
    'Wildlife & nature precautions', 'Животные и природа',
    'Monkeys, stray dogs, insects and ethical wildlife tourism.',
    'Обезьяны, бродячие собаки, насекомые и этичный туризм с животными.',
    E'Phuket''s wildlife is part of its charm, but keep a respectful distance.\n\n## Monkeys\n\nAt spots like Monkey Hill the monkeys are bold:\n\n- Do not feed them or show food.\n- Avoid eye contact and keep your bags closed.\n- A bite or scratch means you need rabies shots — see a doctor quickly.\n\n## Dogs\n\nStray dogs are common. Do not approach or corner them; back away slowly and never run. Bites require prompt medical care.\n\n## Insects & sun\n\n- Use repellent at dusk; dengue-carrying mosquitoes also bite during the day.\n- Heat and sun are intense — drink water and use sunscreen.\n\n## Ethical tourism\n\nAvoid attractions that exploit animals (tiger selfies, elephant riding). Choose genuine sanctuaries where animals can roam.',
    E'Дикая природа Пхукета — часть его очарования, но держите уважительную дистанцию.\n\n## Обезьяны\n\nВ местах вроде Обезьяньей горы обезьяны наглые:\n\n- Не кормите их и не показывайте еду.\n- Избегайте зрительного контакта и держите сумки закрытыми.\n- Укус или царапина означают необходимость прививок от бешенства — быстро к врачу.\n\n## Собаки\n\nБродячие собаки встречаются часто. Не подходите и не загоняйте их в угол; медленно отступайте и никогда не бегите. При укусе нужна срочная медицинская помощь.\n\n## Насекомые и солнце\n\n- Используйте репеллент в сумерках; комары — переносчики денге кусают и днём.\n- Жара и солнце сильные — пейте воду и наносите солнцезащитный крем.\n\n## Этичный туризм\n\nИзбегайте развлечений, эксплуатирующих животных (селфи с тиграми, катание на слонах). Выбирайте настоящие приюты, где животные могут свободно перемещаться.',
    '🐒', 2
  ),
  -- ───────────────────────────── PRACTICAL ─────────────────────────────
  (
    'practical', 'money-and-banking',
    'Money & banking', 'Деньги и банки',
    'Cash, cards, ATMs and exchanging money safely.',
    'Наличные, карты, банкоматы и безопасный обмен валюты.',
    E'The local currency is the Thai Baht (฿). Cash is still king for small vendors, markets and taxis.\n\n## Cards & cash\n\n- Cards work in hotels, malls and many restaurants; small shops and street food are cash-only.\n- Keep 2,000+ THB in cash for transport and emergencies.\n\n## ATMs\n\n- Foreign-card ATMs charge a fixed fee (around 220 THB) on top of your own bank''s fees.\n- Use ATMs attached to bank branches and cover your PIN.\n- Withdraw larger amounts less often to save on fees.\n\n## Exchange\n\nDedicated exchange booths (such as SuperRich or Twelve Victory) usually beat airport and hotel rates. Count your cash before leaving the counter.\n\n## Opening a bank account\n\nLong-stay residents can open accounts, but requirements vary by bank and branch; you may need a long-term visa, proof of address or an agent''s help.',
    E'Местная валюта — тайский бат (฿). Для мелких продавцов, рынков и такси наличные по-прежнему главное.\n\n## Карты и наличные\n\n- Карты принимают в отелях, торговых центрах и многих ресторанах; небольшие магазины и уличная еда — только наличные.\n- Держите при себе от 2 000 бат наличными на транспорт и непредвиденные случаи.\n\n## Банкоматы\n\n- Банкоматы для иностранных карт берут фиксированную комиссию (около 220 бат) сверх комиссии вашего банка.\n- Пользуйтесь банкоматами при отделениях банков и прикрывайте PIN.\n- Снимайте бóльшие суммы реже, чтобы сэкономить на комиссиях.\n\n## Обмен валюты\n\nСпециализированные обменники (например, SuperRich или Twelve Victory) обычно выгоднее, чем в аэропорту и отелях. Пересчитывайте деньги, не отходя от кассы.\n\n## Открытие счёта\n\nРезиденты с долгим пребыванием могут открыть счёт, но требования зависят от банка и отделения; могут понадобиться долгосрочная виза, подтверждение адреса или помощь агента.',
    '💰', 1
  ),
  (
    'practical', 'healthcare-and-pharmacies',
    'Healthcare & pharmacies', 'Медицина и аптеки',
    'Hospitals, pharmacies and why travel insurance matters.',
    'Больницы, аптеки и почему важна страховка.',
    E'Phuket has good private hospitals with English-speaking staff, but treatment is expensive without insurance.\n\n## Hospitals\n\n- Bangkok Hospital Phuket, Phuket International Hospital and Dibuk Hospital have international departments.\n- For emergencies, call an ambulance on 1669.\n\n## Insurance\n\nTravel or health insurance is essential — a serious hospital bill can run from 50,000 to 500,000+ THB. Carry your policy number and emergency line.\n\n## Pharmacies\n\n- Pharmacies (look for the green cross) are widespread and can advise on minor issues.\n- Many medicines are available over the counter, but bring a prescription for anything you rely on.\n\n## Everyday health\n\n- Drink bottled or filtered water.\n- Be careful with street-food hygiene early in your trip.\n- Protect against mosquito bites to reduce dengue risk.',
    E'На Пхукете хорошие частные больницы с англоговорящим персоналом, но лечение дорогое без страховки.\n\n## Больницы\n\n- Bangkok Hospital Phuket, Phuket International Hospital и больница Dibuk имеют международные отделения.\n- В экстренных случаях вызывайте скорую по номеру 1669.\n\n## Страховка\n\nТуристическая или медицинская страховка необходима — серьёзный счёт может составить от 50 000 до 500 000+ бат. Носите при себе номер полиса и телефон экстренной линии.\n\n## Аптеки\n\n- Аптеки (ищите зелёный крест) распространены и помогут с лёгкими проблемами.\n- Многие лекарства продаются без рецепта, но для важных препаратов берите рецепт.\n\n## Повседневное здоровье\n\n- Пейте бутилированную или фильтрованную воду.\n- В начале поездки будьте осторожны с гигиеной уличной еды.\n- Защищайтесь от укусов комаров, чтобы снизить риск денге.',
    '🏥', 2
  ),
  (
    'practical', 'transport-and-driving',
    'Transport & driving', 'Транспорт и вождение',
    'Taxis, ride-hailing, scooters and licence rules.',
    'Такси, приложения, скутеры и правила по правам.',
    E'Getting around Phuket takes planning — there is no metro and public buses are limited.\n\n## Taxis & ride-hailing\n\n- Apps like Grab, Bolt and inDrive give upfront prices and are usually cheaper than street taxis.\n- Agree the fare before getting into a non-metered taxi.\n\n## Scooters\n\nScooters are cheap and convenient but cause most tourist injuries:\n\n- Always wear a helmet — it is the law and it protects you.\n- You legally need a motorcycle licence or an International Driving Permit.\n- Without a valid licence, insurance may refuse to pay after an accident.\n- Video the bike before renting to avoid fake damage claims.\n\n## Driving culture\n\nTraffic can be chaotic and roads get slippery in the rain. Drive defensively, expect sudden stops, and avoid riding at night or after drinking.',
    E'Передвижение по Пхукету требует планирования — метро нет, а общественных автобусов мало.\n\n## Такси и приложения\n\n- Приложения Grab, Bolt и inDrive показывают цену заранее и обычно дешевле уличных такси.\n- Договаривайтесь о цене до посадки в такси без счётчика.\n\n## Скутеры\n\nСкутеры дёшевы и удобны, но на них приходится большинство травм туристов:\n\n- Всегда надевайте шлем — это закон и ваша защита.\n- По закону нужны права категории «мотоцикл» или международное водительское удостоверение.\n- Без действующих прав страховка может отказать в выплате после аварии.\n- Снимите байк на видео до аренды, чтобы избежать ложных претензий о повреждениях.\n\n## Культура вождения\n\nДвижение бывает хаотичным, а дороги скользкими в дождь. Ведите осторожно, ожидайте резких остановок и не садитесь за руль ночью или после алкоголя.',
    '🛵', 3
  )
) AS v(section, slug, title_en, title_ru, summary_en, summary_ru, content_en, content_ru, icon, sort_order)
ON CONFLICT (city_id, section, slug) DO NOTHING;
