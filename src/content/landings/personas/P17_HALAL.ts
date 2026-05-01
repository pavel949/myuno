/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Wave 3 expansion (2026-05): brought to production-grade parity with P14/P15.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P17_HALAL: PersonaLanding = {
  personaCode: 'P17',
  slug: 'halal',
  status: 'live',
  h1: {
    ru: 'Halal-friendly Пхукет: отдых для мусульманских семей',
    en: 'Halal-friendly Phuket: holidays for Muslim families',
  },
  subtitle: {
    ru: 'Halal-сертифицированные рестораны, виллы с prayer space, мечети рядом, женские spa и приватные пляжи — спокойный отдых по правилам.',
    en: 'Halal-certified restaurants, villas with prayer space, nearby mosques, women-only spa and private beaches — calm holidays by your rules.',
  },
  pains: [
    { ru: 'Сложно найти halal-сертифицированную еду вне Patong и Bang Tao.', en: 'Hard to find halal-certified food outside Patong and Bang Tao.' },
    { ru: 'Нужна вилла с приватным бассейном, prayer space и направлением qibla.', en: 'You need a villa with private pool, prayer space and qibla direction.' },
    { ru: 'Хочется быть рядом с мечетью на пятничную молитву.', en: 'You want to be near a mosque for Friday prayer.' },
    { ru: 'Поездка с большой семьёй — нужен минивэн на 9 пассажиров и halal-меню для детей.', en: 'Travelling with extended family — you need a 9-seat van and halal kids menu.' },
  ],
  services: [
    { slug: 'halal-villas', label: { ru: 'Halal-friendly виллы', en: 'Halal-friendly villas' }, oneLiner: { ru: 'Privacy, prayer mat, qibla, kitchen для своей готовки.', en: 'Privacy, prayer mat, qibla, kitchen for self-cooking.' }, href: '/property/rent' },
    { slug: 'halal-dining', label: { ru: 'Halal-рестораны', en: 'Halal restaurants' }, oneLiner: { ru: '40+ сертифицированных заведений по районам.', en: '40+ certified venues across districts.' }, href: '/cluster/lifestyle' },
    { slug: 'mosque-map', label: { ru: 'Карта мечетей', en: 'Mosque map' }, oneLiner: { ru: 'Bang Tao, Kamala, Phuket Town — расписание молитв и Jumah.', en: 'Bang Tao, Kamala, Phuket Town — prayer & Jumah schedule.' }, href: '/map' },
    { slug: 'family-transfer', label: { ru: 'Семейный трансфер', en: 'Family transfer' }, oneLiner: { ru: 'Toyota Commuter / Hiace на 9 пассажиров с детскими креслами.', en: 'Toyota Commuter / Hiace for 9 passengers with child seats.' }, href: '/landing/airport-transfer' },
    { slug: 'halal-yacht', label: { ru: 'Halal-yacht charter', en: 'Halal yacht charter' }, oneLiner: { ru: 'Чартер с halal-кейтерингом, prayer space, без алкоголя на борту.', en: 'Charter with halal catering, prayer space, no alcohol on board.' }, href: '/yachts' },
    { slug: 'halal-grocery', label: { ru: 'Доставка halal-продуктов', en: 'Halal grocery delivery' }, oneLiner: { ru: 'Halal-мясо и продукты к вилле в день заселения.', en: 'Halal meat and groceries delivered on check-in day.' }, href: '/services/concierge' },
  ],
  faq: [
    { q: { ru: 'Где больше всего halal-инфраструктуры?', en: 'Where is most halal infrastructure?' }, a: { ru: 'Bang Tao и Surin (мусульманские деревни), Kamala, Phuket Town (Old Town) — мечети, рестораны, мясные лавки. Patong — больше отелей с halal-меню. Karon/Kata — слабее.', en: 'Bang Tao and Surin (Muslim villages), Kamala, Phuket Town Old Town — mosques, restaurants, halal butchers. Patong — more hotels with halal menus. Karon/Kata — weaker.' } },
    { q: { ru: 'Можно ли бронировать виллу только для женщин?', en: 'Can I book a women-only villa stay?' }, a: { ru: 'Да — приватные виллы со staff по запросу (только женщины). Доплата ฿1 500–2 500/день за персональный women-only сервис. Заборный приватный pool — стандарт.', en: 'Yes — private villas with women-only staff on request. Surcharge ฿1,500–2,500/day for women-only service. Walled private pool is standard.' } },
    { q: { ru: 'Как обстоит дело с alcohol-free отелями?', en: 'What about alcohol-free hotels?' }, a: { ru: 'Полностью alcohol-free — Al Meroz (Бангкок) и Mövenpick BDMS (Пхукет, halal-wing). Большинство 4–5★ на Пхукете предлагают halal-меню по запросу + alcohol-free room category.', en: 'Fully alcohol-free — Al Meroz (Bangkok) and Mövenpick BDMS (Phuket, halal wing). Most Phuket 4–5★ offer halal menus on request + alcohol-free room category.' } },
    { q: { ru: 'Как с поездками в Рамадан?', en: 'What about travelling during Ramadan?' }, a: { ru: 'Iftar-buffet в Anantara, Mövenpick, JW Marriott — ฿1 200–2 800/чел. Suhoor delivery 24/7. Часы работы пляжных клубов и баров не меняются — стоит выбирать quiet-побережья (Bang Tao, Mai Khao).', en: 'Iftar buffets at Anantara, Mövenpick, JW Marriott — ฿1,200–2,800/pax. 24/7 suhoor delivery. Beach club hours unchanged — pick quieter coasts (Bang Tao, Mai Khao).' } },
    { q: { ru: 'Школы с halal-меню для детей?', en: 'Schools with halal menus for kids?' }, a: { ru: 'British International School (Phuket) и UWC Thailand имеют halal-опцию в столовой. Headstart и BCIS — по запросу. Для летних camps выбирайте Tiger Muay Thai Family Camp с custom-питанием.', en: 'British International School (Phuket) and UWC Thailand offer halal canteen option. Headstart and BCIS — on request. For summer camps, Tiger Muay Thai Family Camp provides custom meals.' } },
    { q: { ru: 'Банковские переводы по шариату?', en: 'Sharia-compliant banking?' }, a: { ru: 'CIMB Thai и Bank of Ayudhya (Krungsri) предлагают Islamic Banking. Для покупки недвижимости через нерезидентский счёт — обычные тайские банки, без процентного депозита; в myUNO структурируем сделку через юриста-халяль.', en: 'CIMB Thai and Bank of Ayudhya (Krungsri) offer Islamic Banking. For property purchase via non-resident account — regular Thai banks, no interest deposit; myUNO structures the deal through a halal-aware lawyer.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent', subtitle: { ru: 'Подборка под семью за 24 часа.', en: 'Family-fit shortlist within 24 hours.' } },
  secondaryCta: { label: { ru: 'Открыть карту мечетей', en: 'Open mosque map' }, href: '/map' },
  seo: {
    metaTitle: { ru: 'Halal Пхукет: виллы, рестораны, мечети — myUNO', en: 'Halal Phuket: villas, restaurants, mosques — myUNO' },
    metaDescription: { ru: 'Halal-friendly отдых на Пхукете: 40+ сертифицированных ресторанов, виллы с prayer space, женские spa и семейные трансферы.', en: 'Halal-friendly holidays on Phuket: 40+ certified restaurants, villas with prayer space, women-only spa and family transfers.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/halal',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/halal?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/halal?lang=en' },
    ],
  },
};
