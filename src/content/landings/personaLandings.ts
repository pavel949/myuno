/**
 * @module content/landings/personaLandings
 * @description M6 · Tracks B.2 + B.7 — конфиг 25 persona-лендингов.
 *
 * Источник правды: `docs/canonical/01-segmentation-framework.md` §4 (P1..P25).
 * Tone-of-voice: `03-tone-of-voice.md` §14 (без urgency, без «лучший», цифры
 * вместо обещаний, обращение «вы», CTA — глагол действия).
 *
 * Состояние:
 *  - 22 персоны как `draft` → роут `/for/:slug` отдаёт 404 (B.4).
 *  - 3 персоны live с полным контентом (P1 tourists, P9 hnw, P13 pet-owners).
 *
 * Slug-конвенция: kebab-case, английский, человеко-читаемый.
 */

import type { PersonaLanding } from '@/lib/landings/types';

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────

function draftPersona(
  personaCode: PersonaLanding['personaCode'],
  slug: string,
  hint: { ru: string; en: string },
): PersonaLanding {
  return {
    personaCode,
    slug,
    status: 'draft',
    h1: hint,
    subtitle: {
      ru: 'Страница в разработке.',
      en: 'Page under development.',
    },
    pains: [],
    services: [],
    faq: [],
    primaryCta: {
      label: { ru: 'На главную', en: 'Go home' },
      href: '/',
    },
  };
}

const OG_DEFAULT = 'https://myuno.app/og/default-og.jpg';

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P1 — Туристы из России
// ──────────────────────────────────────────────────────────────────────

const P1_TOURISTS: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: {
    ru: 'Пхукет для русскоязычных туристов',
    en: 'Phuket for Russian-speaking travellers',
  },
  subtitle: {
    ru: 'Трансфер из аэропорта, eSIM, аренда виллы, экскурсии и помощь по-русски — в одном приложении.',
    en: 'Airport transfer, eSIM, villa rental, tours and Russian-speaking support — in one app.',
  },
  pains: [
    {
      ru: 'Не знаете, как доехать из аэропорта без переплаты таксистам.',
      en: 'You don’t know how to get from the airport without overpaying the taxi mafia.',
    },
    {
      ru: 'Нужна связь с первого часа: интернет, навигация, переводчик.',
      en: 'You need connectivity from hour one: internet, navigation, a translator.',
    },
    {
      ru: 'Ищете виллу или отель, где принимают карты «Мир» или платёж в THB.',
      en: 'You’re looking for a villa or hotel that accepts Mir cards or THB payment.',
    },
    {
      ru: 'Хотите посмотреть остров, но не довериться продавцам туров на улице.',
      en: 'You want to see the island without trusting street tour vendors.',
    },
    {
      ru: 'В случае проблем — нужен русскоязычный контакт, не Google Translate.',
      en: 'If something goes wrong, you need a Russian-speaking contact, not Google Translate.',
    },
  ],
  services: [
    {
      slug: 'airport-transfer',
      label: { ru: 'Трансфер из аэропорта', en: 'Airport transfer' },
      oneLiner: {
        ru: 'Фиксированная цена в THB, оплата в приложении.',
        en: 'Fixed THB price, paid in the app.',
      },
      href: '/landing/airport-transfer',
    },
    {
      slug: 'esim',
      label: { ru: 'eSIM с интернетом', en: 'eSIM with data' },
      oneLiner: {
        ru: 'Активация за 5 минут, без поездки в офис оператора.',
        en: 'Activated in 5 minutes, no operator office visit.',
      },
      href: '/sim',
    },
    {
      slug: 'villa-rental',
      label: { ru: 'Аренда виллы или апартаментов', en: 'Villa & apartment rental' },
      oneLiner: {
        ru: 'Каталог проверенных объектов, без двойного бронирования.',
        en: 'Catalogue of verified stays, no double bookings.',
      },
      href: '/property',
    },
    {
      slug: 'tours',
      label: { ru: 'Экскурсии и туры', en: 'Tours & experiences' },
      oneLiner: {
        ru: 'Острова, рынки, рестораны — программа на каждый день.',
        en: 'Islands, markets, restaurants — a plan for every day.',
      },
      href: '/experiences',
    },
    {
      slug: 'concierge',
      label: { ru: 'Поддержка по-русски', en: 'Russian-speaking concierge' },
      oneLiner: {
        ru: 'Чат и WhatsApp с ответом в течение часа.',
        en: 'Chat and WhatsApp with replies within an hour.',
      },
      href: '/concierge',
    },
  ],
  faq: [
    {
      q: { ru: 'Как оплатить, если карты российских банков не работают?', en: 'How do I pay if my Russian cards don’t work?' },
      a: {
        ru: 'Принимаем карты «Мир», UnionPay, USDT и наличные THB у водителя или в офисе партнёра.',
        en: 'We accept Mir, UnionPay, USDT and cash THB at the driver or partner office.',
      },
    },
    {
      q: { ru: 'Сколько стоит трансфер из аэропорта Пхукета до Патонга?', en: 'How much is the airport transfer to Patong?' },
      a: {
        ru: 'Седан — 800 THB, минивэн — 1 200 THB. Цена фиксирована в приложении и не зависит от пробок.',
        en: 'Sedan — 800 THB, minivan — 1,200 THB. The price is fixed in the app regardless of traffic.',
      },
    },
    {
      q: { ru: 'eSIM работает на iPhone, купленном в России?', en: 'Does eSIM work on an iPhone bought in Russia?' },
      a: {
        ru: 'Да, на всех iPhone XS и новее. На некоторых моделях из РФ нужно проверить, что eSIM не отключён в настройках.',
        en: 'Yes, on iPhone XS and newer. On some Russian-market phones you may need to confirm eSIM is enabled in settings.',
      },
    },
    {
      q: { ru: 'Можно ли отменить бронирование виллы?', en: 'Can I cancel a villa booking?' },
      a: {
        ru: 'Зависит от объекта. Для большинства — бесплатная отмена за 7 дней, далее удерживается 1 ночь.',
        en: 'Depends on the property. Most allow free cancellation 7 days out; later, one night is retained.',
      },
    },
    {
      q: { ru: 'Что делать, если потерял документы?', en: 'What if I lose my documents?' },
      a: {
        ru: 'Напишите в чат — мы соединим с консульством и поможем составить заявление в туристическую полицию.',
        en: 'Message us in chat — we’ll connect you to the consulate and help file a tourist police report.',
      },
    },
    {
      q: { ru: 'Безопасно ли арендовать байк?', en: 'Is renting a scooter safe?' },
      a: {
        ru: 'Только при наличии международных прав категории A и шлема. Без прав — штраф 500–2 000 THB.',
        en: 'Only with an international licence (cat. A) and a helmet. Without — fines 500–2,000 THB.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Заказать трансфер', en: 'Book a transfer' },
    href: '/landing/airport-transfer',
    subtitle: {
      ru: 'Цена в THB, оплата в приложении.',
      en: 'Price in THB, paid in the app.',
    },
  },
  secondaryCta: {
    label: { ru: 'Открыть каталог вилл', en: 'Browse villas' },
    href: '/property',
  },
  seo: {
    metaTitle: {
      ru: 'Пхукет по-русски: трансфер, eSIM, виллы, экскурсии — myUNO',
      en: 'Phuket in Russian: transfer, eSIM, villas, tours — myUNO',
    },
    metaDescription: {
      ru: 'Трансфер из аэропорта, eSIM, аренда виллы и экскурсии. Поддержка по-русски, оплата в THB. Без посредников у стойки.',
      en: 'Airport transfer, eSIM, villa rental and tours on Phuket. Russian-speaking support, THB payments, no street vendors.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/tourists',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/tourists?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/tourists?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P9 — HNW-инвесторы
// ──────────────────────────────────────────────────────────────────────

const P9_HNW: PersonaLanding = {
  personaCode: 'P9',
  slug: 'hnw',
  status: 'live',
  h1: {
    ru: 'Недвижимость Пхукета для частного капитала',
    en: 'Phuket real estate for private capital',
  },
  subtitle: {
    ru: 'Закрытый шорт-лист объектов, ClearView™ рейтинг застройщиков, юрист и налоговый консультант — на одном договоре.',
    en: 'A private shortlist of properties, ClearView™ developer ratings, lawyer and tax advisor — under one engagement.',
  },
  pains: [
    {
      ru: 'Брокеры показывают одни и те же 30 объектов — нужен независимый анализ.',
      en: 'Brokers show the same 30 listings — you need an independent view.',
    },
    {
      ru: 'Нет понимания, какой застройщик доделает проект, а какой — нет.',
      en: 'No clarity on which developer will deliver and which won’t.',
    },
    {
      ru: 'Нужна структура владения, которая выдержит проверку в РФ и ЕС.',
      en: 'You need an ownership structure that holds up in Russia and the EU.',
    },
    {
      ru: 'Хотите управлять активом удалённо, без мелочной операционки.',
      en: 'You want to manage the asset remotely, without operational micro-decisions.',
    },
    {
      ru: 'Важна конфиденциальность — без публикации сделки в открытых каналах.',
      en: 'Confidentiality matters — no deal published in public channels.',
    },
  ],
  services: [
    {
      slug: 'clearview-rating',
      label: { ru: 'ClearView™ рейтинг застройщика', en: 'ClearView™ developer rating' },
      oneLiner: {
        ru: '8 категорий, шкала AAA–BB, отчёт за 5 рабочих дней.',
        en: '8 categories, AAA–BB scale, report in 5 working days.',
      },
      href: '/clearview',
    },
    {
      slug: 'private-shortlist',
      label: { ru: 'Закрытый шорт-лист объектов', en: 'Private shortlist' },
      oneLiner: {
        ru: '5–8 объектов под ваш мандат, без публичной выдачи.',
        en: '5–8 properties matched to your mandate, off-market.',
      },
      href: '/invest',
    },
    {
      slug: 'legal-structuring',
      label: { ru: 'Юридическая структура владения', en: 'Ownership structuring' },
      oneLiner: {
        ru: 'Freehold, leasehold, BVI/Thai company — сравнение по налогам и наследованию.',
        en: 'Freehold, leasehold, BVI/Thai company — compared on tax and inheritance.',
      },
      href: '/legal',
    },
    {
      slug: 'tax-advisory',
      label: { ru: 'Налоговая консультация', en: 'Tax advisory' },
      oneLiner: {
        ru: 'Налогообложение в Таиланде, СОИДН с РФ и ЕС.',
        en: 'Thai taxation and double-tax treaties with Russia and the EU.',
      },
      href: '/legal/tax',
    },
    {
      slug: 'asset-management',
      label: { ru: 'Управление активом', en: 'Asset management' },
      oneLiner: {
        ru: 'Сдача в аренду, отчёт ежемесячно, аудит ежегодно.',
        en: 'Rental management, monthly reporting, annual audit.',
      },
      href: '/owner',
    },
  ],
  faq: [
    {
      q: { ru: 'Как устроен ClearView™ рейтинг?', en: 'How does the ClearView™ rating work?' },
      a: {
        ru: '8 категорий с весами: финансы застройщика, юридический статус земли, история сдач, эскроу, локация, продукт, управление, выход. Шкала AAA, AA, A, BBB, BB.',
        en: 'Eight weighted categories: developer finance, land legal status, delivery history, escrow, location, product, management, exit. Scale AAA, AA, A, BBB, BB.',
      },
    },
    {
      q: { ru: 'Какой минимальный бюджет?', en: 'What’s the minimum budget?' },
      a: {
        ru: 'Шорт-лист собираем от 15 млн THB. Для бюджета ниже — стандартный каталог.',
        en: 'We curate shortlists from 15M THB. Below that — the standard catalogue.',
      },
    },
    {
      q: { ru: 'Можно ли купить на иностранную компанию?', en: 'Can a foreign company hold the asset?' },
      a: {
        ru: 'Да: BVI/Singapore через тайскую компанию-владельца, либо leasehold напрямую. Юрист соберёт варианты под ваш профиль.',
        en: 'Yes: BVI/Singapore through a Thai holding entity, or leasehold directly. The lawyer maps options to your profile.',
      },
    },
    {
      q: { ru: 'Как защищён депозит до сделки?', en: 'How is the deposit protected before closing?' },
      a: {
        ru: 'Через эскроу-счёт банка-партнёра. Возврат при отказе застройщика от сроков — по тайскому Condominium Act.',
        en: 'Via a partner bank escrow. Refundable on developer delay per the Thai Condominium Act.',
      },
    },
    {
      q: { ru: 'Какая комиссия myUNO?', en: 'What’s myUNO’s fee?' },
      a: {
        ru: 'Фиксированная плата за ClearView-отчёт и шорт-лист; на сделке комиссия от застройщика, без надбавки к цене для вас.',
        en: 'Fixed fee for the ClearView report and shortlist; deal commission from the developer, no markup on your price.',
      },
    },
    {
      q: { ru: 'Будет ли сделка публичной?', en: 'Will the deal be public?' },
      a: {
        ru: 'Нет. NDA подписывается до передачи объектов; отчёт и переписка хранятся в закрытом workspace.',
        en: 'No. NDA is signed before any disclosure; reports and chat live in a private workspace.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Запросить шорт-лист', en: 'Request a shortlist' },
    href: '/invest?source=hnw-landing',
    subtitle: {
      ru: 'Ответ в течение 24 часов от партнёра.',
      en: 'Response within 24 hours from a partner.',
    },
  },
  secondaryCta: {
    label: { ru: 'Заказать ClearView-отчёт', en: 'Order a ClearView report' },
    href: '/clearview',
  },
  seo: {
    metaTitle: {
      ru: 'Недвижимость Пхукета для HNW: ClearView™ и юрист — myUNO',
      en: 'Phuket real estate for HNW: ClearView™ + lawyer — myUNO',
    },
    metaDescription: {
      ru: 'Закрытый шорт-лист, ClearView™ рейтинг застройщика, юридическая структура и управление активом. Конфиденциально, от 15M THB.',
      en: 'Private shortlist, ClearView™ developer rating, legal structuring and asset management. Confidential, from 15M THB.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/hnw',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/hnw?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/hnw?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P13 — Путешественники с питомцами
// ──────────────────────────────────────────────────────────────────────

const P13_PET_OWNERS: PersonaLanding = {
  personaCode: 'P13',
  slug: 'pet-owners',
  status: 'live',
  h1: {
    ru: 'Пхукет с питомцем: жильё, ввоз, ветклиники',
    en: 'Phuket with your pet: stays, import, vets',
  },
  subtitle: {
    ru: 'Pet-friendly виллы, оформление ввоза по правилам DLD, ветеринар и груминг — без беготни между офисами.',
    en: 'Pet-friendly villas, DLD-compliant import paperwork, vets and grooming — without office-hopping.',
  },
  pains: [
    {
      ru: 'Большинство гостиниц пишут «pet-friendly», но просят питомца оставить дома.',
      en: 'Most hotels say “pet-friendly” but ask you to leave the pet at home.',
    },
    {
      ru: 'Не понятно, какие документы нужны для ввоза собаки или кошки в Таиланд.',
      en: 'It’s unclear which documents are required to import a dog or cat into Thailand.',
    },
    {
      ru: 'В аэропорту неясно, кто встречает животное и как пройти карантин.',
      en: 'At the airport it’s unclear who receives the animal and how the quarantine works.',
    },
    {
      ru: 'Хотите ветеринара по-русски, который не будет назначать лишних процедур.',
      en: 'You want a Russian-speaking vet who won’t over-prescribe procedures.',
    },
    {
      ru: 'Нужен груминг и передержка на 1–2 дня без стресса для питомца.',
      en: 'You need grooming or 1–2 day boarding without stress for the pet.',
    },
  ],
  services: [
    {
      slug: 'pet-friendly-villas',
      label: { ru: 'Pet-friendly виллы', en: 'Pet-friendly villas' },
      oneLiner: {
        ru: 'Объекты с забором, без антикваритата и с близким парком.',
        en: 'Properties with a fence, no antiques, and a park nearby.',
      },
      href: '/property?petFriendly=1',
    },
    {
      slug: 'pet-import',
      label: { ru: 'Ввоз питомца в Таиланд', en: 'Pet import to Thailand' },
      oneLiner: {
        ru: 'Чек-лист DLD, помощь с разрешением R7 за 7 дней.',
        en: 'DLD checklist, help with R7 permit in 7 days.',
      },
      href: '/pets/import',
    },
    {
      slug: 'pet-airport-pickup',
      label: { ru: 'Встреча в аэропорту', en: 'Airport pickup' },
      oneLiner: {
        ru: 'Координация с грузовым терминалом, перевозка в кондиционируемой машине.',
        en: 'Cargo terminal coordination, transfer in a climate-controlled car.',
      },
      href: '/pets/airport',
    },
    {
      slug: 'vet-clinic',
      label: { ru: 'Ветеринар по-русски', en: 'Russian-speaking vet' },
      oneLiner: {
        ru: 'Сеть из 4 клиник, прозрачный прайс в THB.',
        en: 'A 4-clinic network, transparent THB pricing.',
      },
      href: '/pets/vet',
    },
    {
      slug: 'grooming-boarding',
      label: { ru: 'Груминг и передержка', en: 'Grooming & boarding' },
      oneLiner: {
        ru: 'От 800 THB за груминг, от 600 THB за день передержки.',
        en: 'From 800 THB grooming, from 600 THB per boarding day.',
      },
      href: '/pets/grooming',
    },
  ],
  faq: [
    {
      q: { ru: 'Какие документы нужны для ввоза собаки?', en: 'Which documents are needed to import a dog?' },
      a: {
        ru: 'Микрочип, паспорт, прививка от бешенства не моложе 21 дня, справка из госветслужбы и разрешение R7 от тайского DLD.',
        en: 'Microchip, pet passport, rabies vaccine ≥21 days old, government vet certificate and an R7 permit from Thai DLD.',
      },
    },
    {
      q: { ru: 'Сколько стоит ввоз?', en: 'How much does import cost?' },
      a: {
        ru: 'Госпошлина DLD — около 1 000 THB. Наша помощь с пакетом документов — 6 500 THB. Перевозка из карго — от 2 500 THB.',
        en: 'DLD fee — about 1,000 THB. Our paperwork help — 6,500 THB. Cargo transfer — from 2,500 THB.',
      },
    },
    {
      q: { ru: 'Есть ли карантин?', en: 'Is there quarantine?' },
      a: {
        ru: 'При полном пакете и прививке от бешенства карантин не требуется — питомец едет с вами после оформления в аэропорту.',
        en: 'With a complete package and valid rabies shot, no quarantine — the pet leaves with you after airport clearance.',
      },
    },
    {
      q: { ru: 'Какие виллы реально принимают животных?', en: 'Which villas actually accept pets?' },
      a: {
        ru: 'В каталоге 80+ объектов с подтверждённой политикой. Депозит за животное — 5 000–10 000 THB, возвращается при выезде.',
        en: 'The catalogue lists 80+ properties with confirmed policy. Pet deposit 5,000–10,000 THB, refunded on checkout.',
      },
    },
    {
      q: { ru: 'Можно ли с питомцем в кафе и на пляж?', en: 'Can I go to a café or beach with my pet?' },
      a: {
        ru: 'Часть кафе в Раваи и Чалонге принимает собак. На большинстве пляжей — после 18:00, без ошейника штраф 1 000 THB.',
        en: 'Some cafés in Rawai and Chalong accept dogs. Most beaches — after 6pm; no collar = 1,000 THB fine.',
      },
    },
    {
      q: { ru: 'Что делать, если питомец заболел ночью?', en: 'What if my pet falls ill at night?' },
      a: {
        ru: 'Дежурная клиника принимает 24/7. Напишите в чат — мы согласуем приём и при необходимости пришлём такси.',
        en: 'A 24/7 emergency clinic is on call. Message us — we’ll book the visit and dispatch a taxi if needed.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Подобрать виллу с питомцем', en: 'Find a pet-friendly villa' },
    href: '/property?petFriendly=1',
    subtitle: {
      ru: '80+ проверенных объектов в каталоге.',
      en: '80+ verified properties in the catalogue.',
    },
  },
  secondaryCta: {
    label: { ru: 'Оформить ввоз', en: 'Start the import paperwork' },
    href: '/pets/import',
  },
  seo: {
    metaTitle: {
      ru: 'Пхукет с питомцем: ввоз, виллы, ветеринар — myUNO',
      en: 'Phuket with a pet: import, villas, vet — myUNO',
    },
    metaDescription: {
      ru: 'Pet-friendly виллы, ввоз собаки или кошки по правилам DLD, ветеринар по-русски и груминг. Чек-листы, цены в THB.',
      en: 'Pet-friendly villas, DLD-compliant cat or dog import, Russian-speaking vet and grooming. Checklists, THB pricing.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/pet-owners',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/pet-owners?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/pet-owners?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  Canonical list (P1..P25)
// ──────────────────────────────────────────────────────────────────────

export const PERSONA_LANDINGS: readonly PersonaLanding[] = [
  P1_TOURISTS,
  draftPersona('P2', 'cn-investors', { ru: 'Гости из Китая', en: 'Chinese tourists & scouts' }),
  draftPersona('P3', 'eu-guests', { ru: 'Гости из Европы', en: 'European guests' }),
  draftPersona('P4', 'digital-nomads', { ru: 'Цифровые кочевники', en: 'Digital nomads' }),
  draftPersona('P5', 'snowbirds', { ru: 'Зимовщики', en: 'Snowbirds' }),
  draftPersona('P6', 'ru-expats', { ru: 'Русскоязычные экспаты', en: 'New Russian-speaking expats' }),
  draftPersona('P7', 'families', { ru: 'Семьи с детьми', en: 'Families with children' }),
  draftPersona('P8', 'passive-investors', { ru: 'Пассивные инвесторы', en: 'Passive investors' }),
  P9_HNW,
  draftPersona('P10', 'operators', { ru: 'Операторы STR / PM', en: 'STR & PM operators' }),
  draftPersona('P11', 'mn-investors', { ru: 'Инвесторы из Монголии', en: 'Mongolian investors' }),
  draftPersona('P12', 'bn-business', { ru: 'Бизнес-аудитория из Бангладеш', en: 'Bangladeshi business audience' }),
  P13_PET_OWNERS,
  draftPersona('P14', 'medical', { ru: 'Медицинский туризм', en: 'Medical tourists' }),
  draftPersona('P15', 'weddings', { ru: 'Свадебные путешественники', en: 'Wedding travellers' }),
  draftPersona('P16', 'athletes', { ru: 'Спортсмены и Fight Camp', en: 'Athletes & fight camps' }),
  draftPersona('P17', 'halal', { ru: 'Мусульманские путешественники', en: 'Muslim travellers' }),
  draftPersona('P18', 'lgbtq', { ru: 'ЛГБТК+ путешественники и резиденты', en: 'LGBTQ+ travellers & residents' }),
  draftPersona('P19', 'accessibility', { ru: 'Путешественники с ограниченными возможностями', en: 'Accessibility-first travellers' }),
  draftPersona('P20', 'retirees', { ru: 'Пенсионеры', en: 'Retirees' }),
  draftPersona('P21', 'providers', { ru: 'Локальные подрядчики', en: 'Local providers' }),
  draftPersona('P22', 'freelancers', { ru: 'Локальные фрилансеры', en: 'Local freelancers' }),
  draftPersona('P23', 'smb', { ru: 'Локальный малый бизнес', en: 'Local SMB' }),
  draftPersona('P24', 'creatives', { ru: 'Creative Class', en: 'Creative class' }),
  draftPersona('P25', 'students', { ru: 'Студенты и молодые взрослые', en: 'Students & young adults' }),
] as const;

export const LIVE_PERSONA_SLUGS: readonly string[] = [
  'tourists',   // P1
  'hnw',        // P9
  'pet-owners', // P13
] as const;
