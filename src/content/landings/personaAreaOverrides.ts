/**
 * @module content/landings/personaAreaOverrides
 * @description Sprint 3 — long-tail SEO content overrides for the highest-intent
 * persona × area combos. Renders rich RU/EN intro, 3 reasons-to-pick and a
 * pre-tagged WhatsApp CTA on top of the auto-generated PersonaAreaLandingPage.
 *
 * Mapping (3 areas × 3 personas = 9 combos):
 *   - Bang Tao / Patong / Kamala
 *   × passive-investors (Investor) / snowbirds (Second-home) / families (Family)
 *
 * NOTE: «Second-home» surfaces via the closest live persona `snowbirds`
 * (seasonal owner-occupied second residence — per
 * `docs/canonical/01-segmentation-framework.md` §4 P5). Until a dedicated
 * `second-home` persona ships, this is the canonical fit.
 *
 * To extend coverage to 15 entries add 2 more areas (e.g. `laguna`,
 * `cherngtalay`) — the page renders overrides automatically when present.
 */

export interface PersonaAreaOverride {
  /** Three-bullet «почему здесь подходит именно вам» block. */
  reasons: {
    ru: readonly string[];
    en: readonly string[];
  };
  /** SEO H1 / hero strapline override (optional — defaults to persona.h1). */
  intro: {
    ru: string;
    en: string;
  };
  /** WhatsApp pre-filled message. Plain text, no encoding. */
  whatsappMessage: {
    ru: string;
    en: string;
  };
  /** Label for the WhatsApp button. */
  whatsappLabel: {
    ru: string;
    en: string;
  };
}

type OverrideMap = Record<string, Record<string, PersonaAreaOverride>>;

/** Outer key = areaSlug, inner key = personaSlug. */
const OVERRIDES: OverrideMap = {
  // ─────────────────────────────────────────────────────────────────────────
  // BANG TAO
  // ─────────────────────────────────────────────────────────────────────────
  'bang-tao': {
    'passive-investors': {
      intro: {
        ru: 'Bang Tao — флагманский кластер Laguna с самым прозрачным рынком аренды на Пхукете: лицензированные отельные операторы, гарантированная доходность от застройщиков и ликвидный вторичный рынок.',
        en: 'Bang Tao is the flagship Laguna cluster — Phuket\'s most transparent rental market with licensed hotel operators, developer rental guarantees and a liquid resale market.',
      },
      reasons: {
        ru: [
          'Доходность 6–8% годовых в USD за счёт hotel-licensed пулов (Banyan Tree, Angsana, Cassia, Dusit, Avani).',
          'Самый ликвидный вторичный рынок на острове: средний срок продажи 4–6 месяцев против 9–12 в Kamala/Patong.',
          'Готовая инфраструктура: Boat Avenue, Porto de Phuket, Blue Tree, UWC школа — премия к арендной ставке +25%.',
        ],
        en: [
          '6–8% USD net yield via hotel-licensed pools (Banyan Tree, Angsana, Cassia, Dusit, Avani).',
          'Most liquid resale market on the island: 4–6 month average sale vs. 9–12 in Kamala/Patong.',
          'Mature infrastructure — Boat Avenue, Porto de Phuket, Blue Tree, UWC school — adds +25% rental premium.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Рассматриваю инвестиционный объект в Bang Tao. Хочу подборку с ClearView-рейтингом и расчётом доходности.',
        en: 'Hello! I am considering an investment property in Bang Tao. Please share options with ClearView ratings and yield breakdown.',
      },
      whatsappLabel: {
        ru: 'Запросить инвест-подборку',
        en: 'Request investor shortlist',
      },
    },
    snowbirds: {
      intro: {
        ru: 'Bang Tao — лучший район для второго дома на 3–6 месяцев в году: бренд-резиденции с консьержем, прямой пляж 6 км, международные школы и сервис «закрыл-уехал» от управляющих компаний.',
        en: 'Bang Tao is the prime second-home district for 3–6 month stays: branded residences with concierge, 6 km of unbroken beach, international schools and full lock-up-and-leave management.',
      },
      reasons: {
        ru: [
          'Бренд-резиденции (Banyan Tree, Angsana, Dusit) — управление всё включено, можно оставить ключи и улететь.',
          'Спокойная северная сторона: семейный пляж 6 км, без ночных клубов, прямые такси до аэропорта 25 мин.',
          'Готовое русскоязычное комьюнити: врачи, репетиторы, фитнес — мягкая адаптация при сезонном проживании.',
        ],
        en: [
          'Branded residences (Banyan Tree, Angsana, Dusit) — fully managed, lock-up-and-leave with hotel-grade service.',
          'Quiet north-shore: 6 km family beach, no nightclubs, 25-min direct airport transfer.',
          'Established Russian-speaking community — doctors, tutors, fitness — soft landing for seasonal residents.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Ищу второй дом в Bang Tao на 3–6 месяцев в году. Расскажите про бренд-резиденции и сервис управления.',
        en: 'Hello! I am looking for a second home in Bang Tao for 3–6 months a year. Please walk me through branded residences and management.',
      },
      whatsappLabel: {
        ru: 'Обсудить второй дом',
        en: 'Discuss a second home',
      },
    },
    families: {
      intro: {
        ru: 'Bang Tao — район №1 для семей с детьми на Пхукете: UWC International School в 5 минутах, парк Blue Tree, безопасный пляж с пологим входом и плотное русскоязычное комьюнити.',
        en: 'Bang Tao is Phuket\'s #1 family district: UWC International School 5 minutes away, Blue Tree water park, gentle family beach and a dense Russian-speaking expat community.',
      },
      reasons: {
        ru: [
          'UWC Thailand (IB-программа, $24–32K/год) — 5 минут на скутере, school bus от большинства резиденций.',
          'Семейная инфраструктура: Blue Tree, Splash Jungle, BIS-кампус в Laguna, педиатры Bangkok Hospital в 15 мин.',
          'Безопасные виллы с огороженным бассейном и большой парковкой — формат «жить + учить детей» 12 месяцев.',
        ],
        en: [
          'UWC Thailand (IB curriculum, $24–32K/year) — 5 minutes by scooter, school buses from most residences.',
          'Family infrastructure: Blue Tree, Splash Jungle, BIS Laguna campus, Bangkok Hospital paediatrics 15 min away.',
          'Safe villas with fenced pools and large parking — designed for «live + school» year-round families.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Переезжаю с семьёй в Bang Tao. Нужна вилла с огороженным бассейном рядом со школой и подбор школы.',
        en: 'Hello! Relocating my family to Bang Tao. Need a villa with fenced pool near a school plus school placement advice.',
      },
      whatsappLabel: {
        ru: 'Подбор виллы и школы',
        en: 'Villa & school finder',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PATONG
  // ─────────────────────────────────────────────────────────────────────────
  patong: {
    'passive-investors': {
      intro: {
        ru: 'Patong — самый высокий cash-on-cash возврат на Пхукете: круглогодичный турпоток 6+ млн в год, средняя загрузка кондо-отелей 78%, доходность до 9% годовых в THB.',
        en: 'Patong delivers Phuket\'s highest cash-on-cash returns: year-round tourist flow of 6M+ visitors, 78% average condo-hotel occupancy and yields up to 9% in THB.',
      },
      reasons: {
        ru: [
          'Самая высокая загрузка на острове — 78–85% круглый год против 55–65% в Bang Tao.',
          'Низкий порог входа: студии в hotel-pool от ฿4.5M ($125K) с гарантированной доходностью 6–7%.',
          'Прозрачный exit: вторичный рынок Patong самый активный, объект продаётся в среднем за 5 месяцев.',
        ],
        en: [
          'Highest occupancy on the island — 78–85% year-round vs. 55–65% in Bang Tao.',
          'Low entry: hotel-pool studios from ฿4.5M ($125K) with 6–7% guaranteed yield.',
          'Clean exit path — Patong has the most active secondary market, average 5-month sale time.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Интересует кондо-отель в Patong с гарантированной доходностью. Пришлите варианты от $125K с ClearView-рейтингом.',
        en: 'Hello! Interested in a Patong condo-hotel with guaranteed yield. Please share options from $125K with ClearView ratings.',
      },
      whatsappLabel: {
        ru: 'Запросить кондо-отели',
        en: 'Request condo-hotel options',
      },
    },
    snowbirds: {
      intro: {
        ru: 'Patong для второго дома — формат «город у моря»: больница, рестораны, фитнес, ТЦ и аэропорт-такси без зависимости от машины. Подходит тем, кто прилетает на 2–4 месяца и хочет «жизнь в шаговой доступности».',
        en: 'Patong as a second home is «city by the sea»: hospital, restaurants, gyms, malls and airport transfers without a car. Perfect for 2–4 month stays where you want everything within walking distance.',
      },
      reasons: {
        ru: [
          'Всё пешком: Bangkok Hospital Patong, Jungceylon, Banzaan Market, фитнес — машина не нужна.',
          'Низкий чек на вход: апартаменты в Wyndham/Andamaya от $180K с гостиничным управлением.',
          'Прямые ночные рейсы из Москвы/Дубая в HKT, такси до Patong 45 минут — удобно прилетать на сезон.',
        ],
        en: [
          'Everything walkable: Bangkok Hospital Patong, Jungceylon, Banzaan Market, gyms — no car needed.',
          'Low entry: Wyndham / Andamaya residences from $180K with hotel-grade management.',
          'Direct overnight flights from Moscow/Dubai to HKT, 45-min taxi — easy seasonal arrivals.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Хочу второй дом в Patong на 2–4 месяца в году. Подберите апартаменты с управлением и без необходимости в машине.',
        en: 'Hello! Looking for a second home in Patong for 2–4 months a year. Please find a managed apartment within walking distance of everything.',
      },
      whatsappLabel: {
        ru: 'Обсудить второй дом',
        en: 'Discuss a second home',
      },
    },
    families: {
      intro: {
        ru: 'Patong для семьи — спорный выбор, но рабочий: если важны ежедневный доступ к больнице, международной кухне и развлечениям. Подойдут семьи с детьми 8+ лет, которые могут самостоятельно ходить на пляж и в кафе.',
        en: 'Patong for families is a contrarian pick that works for the right profile: daily hospital access, international dining and entertainment. Best for families with kids 8+ who can walk to the beach and cafés independently.',
      },
      reasons: {
        ru: [
          'Bangkok Hospital Patong с педиатрией — 5 минут от любой точки района, важно для семей с маленькими детьми.',
          'Тихие резиденции на холмах (Kalim, Tri Trang) — спокойнее ночью, виды на залив, 7 минут до пляжа.',
          'BIS Phuket в 25 мин на машине — реально возить детей в международную школу, оставаясь в городе.',
        ],
        en: [
          'Bangkok Hospital Patong with paediatrics — 5 minutes from anywhere in the area, key for young families.',
          'Quiet hillside residences (Kalim, Tri Trang) — calm nights, bay views, 7 minutes to the beach.',
          'BIS Phuket 25-min drive — viable international school commute while staying in town.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Рассматриваю Patong для семьи с детьми. Покажите тихие резиденции на холмах в шаговой доступности от больницы.',
        en: 'Hello! Considering Patong for my family. Please show quiet hillside residences within walking distance of the hospital.',
      },
      whatsappLabel: {
        ru: 'Подбор для семьи',
        en: 'Family-friendly options',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KAMALA
  // ─────────────────────────────────────────────────────────────────────────
  kamala: {
    'passive-investors': {
      intro: {
        ru: 'Kamala — район-апсайд: миллиард-долларовый кластер MontAzure меняет профиль с тихого пляжа на премиум-курорт InterContinental + Como + Twinpalms. Раннее вхождение даёт 30–40% capital growth за 3 года.',
        en: 'Kamala is Phuket\'s upside play: the billion-dollar MontAzure cluster is transforming a quiet beach into a premium InterContinental + Como + Twinpalms hub. Early entry has delivered 30–40% capital growth over 3 years.',
      },
      reasons: {
        ru: [
          'MontAzure ecosystem: InterContinental уже работает, Twinpalms открыт, в pipeline ещё 4 бренда до 2027.',
          'Capital growth 30–40% за 3 года против 12–18% в Bang Tao — район в фазе re-positioning.',
          'Меньше предложения на вторичке = меньше конкуренции при перепродаже, тонкая liquidity premium.',
        ],
        en: [
          'MontAzure ecosystem: InterContinental live, Twinpalms open, 4 more brands in pipeline by 2027.',
          'Capital growth 30–40% over 3 years vs. 12–18% in Bang Tao — re-positioning phase.',
          'Thinner resale supply = lower competition on exit, modest liquidity premium.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Интересует инвестиция в Kamala / MontAzure. Какие проекты доступны с upside по capital growth?',
        en: 'Hello! Interested in Kamala / MontAzure investments. Which projects offer the strongest capital-growth upside?',
      },
      whatsappLabel: {
        ru: 'Получить MontAzure-подборку',
        en: 'Request MontAzure shortlist',
      },
    },
    snowbirds: {
      intro: {
        ru: 'Kamala для второго дома — компромисс между тишиной Bang Tao и драйвом Patong: 10 минут до Patong на такси, но ночью слышно только море. Бренд-резиденции с управлением и без толп.',
        en: 'Kamala as a second home strikes the balance between Bang Tao quiet and Patong energy: 10-min taxi to Patong nightlife, but at night you only hear the sea. Branded residences, fully managed, no crowds.',
      },
      reasons: {
        ru: [
          'Бренд-резиденции InterContinental и Twinpalms — сервис уровня 5* без отельной суеты.',
          'Длинный пляж 2 км без толп — утром можно спокойно плавать без чартерных туристов.',
          'Локально: Café del Mar, HQ Beach Club, Twinpalms — есть где провести вечер без поездки в Patong.',
        ],
        en: [
          'Branded residences (InterContinental, Twinpalms) — 5* hotel service without hotel crowds.',
          '2 km of uncrowded beach — quiet morning swims without charter-tourist traffic.',
          'On-site: Café del Mar, HQ Beach Club, Twinpalms — full evening scene without driving to Patong.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Ищу второй дом в Kamala — нужна бренд-резиденция с управлением и видом на море.',
        en: 'Hello! Looking for a second home in Kamala — branded residence, fully managed, sea views.',
      },
      whatsappLabel: {
        ru: 'Обсудить второй дом',
        en: 'Discuss a second home',
      },
    },
    families: {
      intro: {
        ru: 'Kamala для семей — «тихая гавань с школой через перевал»: HeadStart International School в Kamala, безопасный длинный пляж и виллы по разумной цене в сравнении с Bang Tao (-15–20%).',
        en: 'Kamala for families is a quiet harbour with a school over the headland: HeadStart International School in Kamala itself, a safe long beach and villas 15–20% cheaper than Bang Tao.',
      },
      reasons: {
        ru: [
          'HeadStart International School (British curriculum) прямо в Kamala — 5 минут от большинства резиденций.',
          'Виллы дешевле Bang Tao на 15–20% при сопоставимом уровне инфраструктуры и тишине.',
          'Безопасный пляж 2 км с пологим входом, watch-tower и кафе вдоль набережной — комфорт для маленьких детей.',
        ],
        en: [
          'HeadStart International School (British curriculum) inside Kamala — 5 minutes from most residences.',
          'Villas 15–20% cheaper than Bang Tao at comparable infrastructure and quiet.',
          'Safe 2 km beach with gentle entry, watch-towers and seafront cafés — perfect for young children.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Переезжаю с детьми в Kamala. Нужна вилла рядом с HeadStart и подбор бюджета.',
        en: 'Hello! Relocating with kids to Kamala. Need a villa near HeadStart School plus budget guidance.',
      },
      whatsappLabel: {
        ru: 'Подбор виллы и школы',
        en: 'Villa & school finder',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LAGUNA
  // ─────────────────────────────────────────────────────────────────────────
  laguna: {
    'passive-investors': {
      intro: {
        ru: 'Laguna Phuket — закрытый интегрированный курорт на 1000 акров с 8 отелями (Banyan Tree, Angsana, Dusit, Cassia, Avani, SAii, Outrigger) и собственным channel-manager. Самый институциональный pool аренды на острове.',
        en: 'Laguna Phuket is a gated 1000-acre integrated resort with 8 hotels (Banyan Tree, Angsana, Dusit, Cassia, Avani, SAii, Outrigger) and an in-house channel manager — the most institutional rental pool on the island.',
      },
      reasons: {
        ru: [
          'Гарантированная доходность 6–7% от Laguna Property Management — 30 лет track record, ноль defaults.',
          'Единственный кластер с собственным гольф-полем (18 holes), 3 пляжными клубами и lagoon-shuttle сервисом.',
          'Самая высокая ликвидность вторички в премиум-сегменте: brand recognition ускоряет exit на 40%.',
        ],
        en: [
          '6–7% guaranteed yield via Laguna Property Management — 30-year track record, zero defaults.',
          'Only cluster with its own 18-hole golf course, 3 beach clubs and lagoon shuttle service.',
          'Highest premium resale liquidity — brand recognition accelerates exit by 40%.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Интересует инвестиция в Laguna Phuket с управлением от Laguna Property Management. Какие проекты сейчас открыты?',
        en: 'Hello! Interested in a Laguna Phuket investment managed by Laguna Property Management. Which projects are open right now?',
      },
      whatsappLabel: {
        ru: 'Запросить Laguna-подборку',
        en: 'Request Laguna shortlist',
      },
    },
    snowbirds: {
      intro: {
        ru: 'Laguna для второго дома — формат «всё внутри ворот»: 8 отелей, гольф, рестораны, спа, школа BIS, медцентр и lagoon-shuttle. Можно прилетать на полгода и не выезжать за периметр.',
        en: 'Laguna as a second home is «everything inside the gates»: 8 hotels, golf, restaurants, spa, BIS school, medical clinic and lagoon shuttle. You can stay for half a year and never leave the perimeter.',
      },
      reasons: {
        ru: [
          'Закрытый контур 24/7: security, медцентр Bangkok Hospital Laguna, шаттл между отелями и пляжем.',
          'Гольф 18 holes, теннис, велодорожки 12 км вокруг лагуны — режим жизни, а не отпуска.',
          'Сервис уровня resort при наличии собственного жилья: housekeeping, room service, F&B credit.',
        ],
        en: [
          '24/7 gated perimeter: security, Bangkok Hospital Laguna clinic, inter-hotel and beach shuttle.',
          '18-hole golf, tennis, 12 km of bike paths around the lagoon — a lifestyle, not a vacation.',
          'Resort-grade service while owning your home: housekeeping, room service, F&B credit.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Ищу второй дом в Laguna Phuket — нужна резиденция с гольф-видом и управлением от Laguna.',
        en: 'Hello! Looking for a second home in Laguna Phuket — residence with golf views and Laguna-managed service.',
      },
      whatsappLabel: {
        ru: 'Обсудить резиденцию',
        en: 'Discuss a residence',
      },
    },
    families: {
      intro: {
        ru: 'Laguna для семьи — безопасный «город в городе» с British International School (BIS) внутри периметра, велодорожками вместо дорог и медцентром в 3 минутах. Дети могут самостоятельно ездить на велосипеде в школу и к друзьям.',
        en: 'Laguna for families is a safe «town within a town» with British International School (BIS) inside the perimeter, bike paths instead of roads and a medical clinic 3 minutes away. Kids can bike to school and friends independently.',
      },
      reasons: {
        ru: [
          'BIS Phuket (British curriculum, £20–28K/год) внутри Laguna — дети ездят на велосипеде, без school bus.',
          'Безопасный 1000-акровый периметр с 24/7 security: дети самостоятельно у бассейна, на пляже, на велодорожках.',
          'Bangkok Hospital Laguna Clinic + педиатрия — 3 минуты от любой резиденции.',
        ],
        en: [
          'BIS Phuket (British curriculum, £20–28K/year) inside Laguna — kids bike to school, no bus needed.',
          '1000-acre gated perimeter with 24/7 security: independent kids at the pool, beach and bike paths.',
          'Bangkok Hospital Laguna Clinic + paediatrics — 3 minutes from any residence.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Переезжаю с семьёй в Laguna Phuket. Нужна вилла внутри периметра рядом с BIS-кампусом.',
        en: 'Hello! Relocating my family to Laguna Phuket. Need a villa inside the perimeter near the BIS campus.',
      },
      whatsappLabel: {
        ru: 'Подбор виллы и BIS',
        en: 'Villa & BIS finder',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CHERNGTALAY
  // ─────────────────────────────────────────────────────────────────────────
  cherngtalay: {
    'passive-investors': {
      intro: {
        ru: 'Cherngtalay — «расширение Bang Tao» с ценами на 20–25% ниже и теми же арендаторами. Растущий кластер кондоминиумов рядом с Boat Avenue и Porto de Phuket с доходностью 7–8% при меньшем входе.',
        en: 'Cherngtalay is the «Bang Tao extension» — 20–25% cheaper at identical tenant demand. A growing condo cluster next to Boat Avenue and Porto de Phuket delivering 7–8% yield at a lower entry point.',
      },
      reasons: {
        ru: [
          'Цена за м² на 20–25% ниже Bang Tao при той же арендной ставке — лучший yield-per-baht на западном побережье.',
          'Активный pipeline новостроек 2026–2028: ранний вход даёт capital growth 15–20% к handover.',
          'Boat Avenue + Porto de Phuket в шаговой доступности — premium-тренд для семейных и snowbird-арендаторов.',
        ],
        en: [
          'Price per sqm 20–25% below Bang Tao at the same rental rate — best yield-per-baht on the west coast.',
          'Active 2026–2028 new-build pipeline: early entry yields 15–20% capital growth by handover.',
          'Boat Avenue + Porto de Phuket within walking distance — premium pull for family and snowbird tenants.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Интересует инвестиция в Cherngtalay — пришлите off-plan с ранним входом и расчётом доходности.',
        en: 'Hello! Interested in Cherngtalay investments — please share off-plan options with early-entry pricing and yield breakdown.',
      },
      whatsappLabel: {
        ru: 'Получить off-plan подборку',
        en: 'Request off-plan shortlist',
      },
    },
    snowbirds: {
      intro: {
        ru: 'Cherngtalay для второго дома — тишина деревни в 5 минутах от инфраструктуры Bang Tao: Boat Avenue, Porto de Phuket, пляж Layan. Цена ниже, сервис тот же, парковки больше.',
        en: 'Cherngtalay as a second home offers village quiet 5 minutes from Bang Tao infrastructure: Boat Avenue, Porto de Phuket, Layan beach. Lower price, same services, more parking.',
      },
      reasons: {
        ru: [
          'Тише, чем Bang Tao: меньше туристов, прямой выезд к Layan/Bang Tao за 5–8 минут.',
          'Инфраструктура «через дорогу»: Villa Market, Boat Avenue, фитнес, рестораны — без необходимости ездить далеко.',
          'Цены на резиденции на 20% ниже Bang Tao при том же качестве застройщиков (Banyan Tree, Anantara, Layan Green Park).',
        ],
        en: [
          'Quieter than Bang Tao: fewer tourists, direct 5–8 min access to Layan/Bang Tao.',
          'Infrastructure across the road: Villa Market, Boat Avenue, gyms, restaurants — no long drives.',
          'Residence prices 20% below Bang Tao at the same developer quality (Banyan Tree, Anantara, Layan Green Park).',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Ищу второй дом в Cherngtalay на 3–6 месяцев — нужна резиденция рядом с Boat Avenue.',
        en: 'Hello! Looking for a second home in Cherngtalay for 3–6 months — residence near Boat Avenue preferred.',
      },
      whatsappLabel: {
        ru: 'Обсудить второй дом',
        en: 'Discuss a second home',
      },
    },
    families: {
      intro: {
        ru: 'Cherngtalay для семьи — оптимум по цене/качеству: UWC и BIS в 7–10 минутах, виллы с большими участками (от 600 м²) и тихие soi без сквозного трафика. Подходит семьям, которым нужен сад и пространство.',
        en: 'Cherngtalay for families is the best price/quality fit: UWC and BIS 7–10 minutes away, villas with large plots (600 m²+) and quiet soi streets with no through-traffic. Built for families who want a garden and space.',
      },
      reasons: {
        ru: [
          'UWC Thailand 7 минут, BIS Phuket 10 минут — реалистичный school commute без пробок.',
          'Виллы с участками 600–1200 м² по цене таунхаусов Bang Tao — сад, барбекю, место для собаки.',
          'Семейная деревня: педиатры, детские кружки, Villa Market, Tesco Lotus — всё в 5 минутах.',
        ],
        en: [
          'UWC Thailand 7 min, BIS Phuket 10 min — realistic school commute with no traffic.',
          'Villas with 600–1200 m² plots at Bang Tao townhouse prices — garden, BBQ, room for a dog.',
          'Family village: paediatricians, kids clubs, Villa Market, Tesco Lotus — all within 5 minutes.',
        ],
      },
      whatsappMessage: {
        ru: 'Здравствуйте! Переезжаю с семьёй в Cherngtalay. Нужна вилла с участком 600+ м² рядом с UWC/BIS.',
        en: 'Hello! Relocating my family to Cherngtalay. Need a villa with a 600 m²+ plot close to UWC/BIS.',
      },
      whatsappLabel: {
        ru: 'Подбор виллы',
        en: 'Villa finder',
      },
    },
  },
};

export function findPersonaAreaOverride(
  personaSlug: string,
  areaSlug: string,
): PersonaAreaOverride | undefined {
  return OVERRIDES[areaSlug]?.[personaSlug];
}

/** Total count for sitemap / audit. */
export const PERSONA_AREA_OVERRIDE_COUNT = Object.values(OVERRIDES).reduce(
  (n, perArea) => n + Object.keys(perArea).length,
  0,
);
