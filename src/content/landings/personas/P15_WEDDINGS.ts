/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P15_WEDDINGS: PersonaLanding = {
  personaCode: 'P15',
  slug: 'weddings',
  status: 'live',
  h1: {
    ru: 'Свадьба на Пхукете под ключ',
    en: 'Destination wedding on Phuket',
  },
  subtitle: {
    ru: 'Площадка с видом на закат, юридическая регистрация, сценография, фотограф и логистика гостей — собираем свадьбу на 10–120 человек без сюрпризов в счёте.',
    en: 'Sunset venue, legal registration, styling, photographer and guest logistics — weddings for 10–120 with no budget surprises.',
  },
  pains: [
    { ru: 'Не понятно, как сделать тайскую свадьбу юридически признаваемой дома.', en: 'Unclear how to make a Thai wedding legally valid back home.' },
    { ru: 'Цены площадок отличаются в 5 раз — сложно сравнить «что входит».', en: 'Venue prices vary 5× — hard to compare what is actually included.' },
    { ru: 'Координировать гостей из разных стран и часовых поясов.', en: 'Coordinating guests across countries and time zones is tough.' },
    { ru: 'Хочется уникальную локацию, но не сорвать сроки и бюджет.', en: 'You want a unique venue without blowing the timeline or budget.' },
  ],
  services: [
    { slug: 'wedding-venues', label: { ru: 'Подбор площадки', en: 'Venue scouting' }, oneLiner: { ru: 'Виллы, beach clubs, отели — 60+ верифицированных локаций.', en: 'Villas, beach clubs, hotels — 60+ verified venues.' }, href: '/wedding/venues' },
    { slug: 'wedding-legal', label: { ru: 'Юридическая регистрация', en: 'Legal registration' }, oneLiner: { ru: 'Marriage certificate, апостиль, признание в стране.', en: 'Marriage certificate, apostille, home-country recognition.' }, href: '/wedding/legal' },
    { slug: 'wedding-planner', label: { ru: 'Wedding planner', en: 'Wedding planner' }, oneLiner: { ru: 'Сценография, тайминг, координация подрядчиков.', en: 'Styling, timeline, vendor coordination.' }, href: '/wedding/planner' },
    { slug: 'wedding-photo', label: { ru: 'Фото и видео', en: 'Photo & video' }, oneLiner: { ru: 'Профессионалы с портфолио на Пхукете.', en: 'Professional portfolios shot on Phuket.' }, href: '/wedding/photo' },
    { slug: 'guest-logistics', label: { ru: 'Логистика гостей', en: 'Guest logistics' }, oneLiner: { ru: 'Трансфер из аэропорта, блок в отеле, welcome pack.', en: 'Airport transfers, hotel block, welcome pack.' }, href: '/wedding/guests' },
    { slug: 'honeymoon', label: { ru: 'Honeymoon escape', en: 'Honeymoon escape' }, oneLiner: { ru: 'Виллы 5★ с приватным шефом и dinner setup.', en: '5★ villas with private chef and dinner setup.' }, href: '/property?audience=honeymoon' },
  ],
  faq: [
    { q: { ru: 'Признаётся ли тайская свадьба в России?', en: 'Is a Thai marriage recognised in Russia?' }, a: { ru: 'Да, через консульский апостиль и легализацию. Свидетельство о браке выдаёт амфур (район), переводится и легализуется. Срок — 7–14 дней после церемонии.', en: 'Yes, via consular apostille and legalisation. The amphur (district office) issues the certificate; it is translated and legalised. Timeline — 7–14 days after the ceremony.' } },
    { q: { ru: 'Сколько стоит свадьба на 30 человек?', en: 'How much is a 30-guest wedding?' }, a: { ru: 'Бюджет: ฿380 000–550 000 (вилла, кейтеринг, фото, декор). Средний: ฿650 000–950 000. Премиум beach club с яхтой: ฿1 200 000–2 500 000. Юр. оформление — ฿35 000.', en: 'Budget: ฿380,000–550,000 (villa, catering, photo, decor). Mid: ฿650,000–950,000. Premium beach club + yacht: ฿1,200,000–2,500,000. Legal — ฿35,000.' } },
    { q: { ru: 'Лучшее время года для свадьбы?', en: 'Best time of year for a wedding?' }, a: { ru: 'Ноябрь–март — высокий сезон, без дождей, цены +25%. Апрель–май и октябрь — баланс. Июнь–сентябрь — сезон дождей, скидки до −40%, нужен резервный indoor-план.', en: 'November–March — high season, dry, prices +25%. April–May and October — balanced. June–September — rainy, up to −40% but needs an indoor plan.' } },
    { q: { ru: 'Какие площадки самые востребованные?', en: 'Which venues are most popular?' }, a: { ru: 'Sri Panwa, Trisara, Cape Sienna, Iniala — премиум. Surin Beach villas — средний сегмент. Catch Beach Club и HQ Beach Lounge — beach club свадьбы.', en: 'Sri Panwa, Trisara, Cape Sienna, Iniala — premium. Surin Beach villas — mid. Catch Beach Club, HQ Beach Lounge — beach club weddings.' } },
    { q: { ru: 'Нужен ли planner или можно своими силами?', en: 'Do I need a planner or can I DIY?' }, a: { ru: 'До 15 гостей — реально без planner, через одну вендор-цепочку. От 30+ человек planner экономит больше, чем стоит — за счёт скидок у проверенных подрядчиков и timeline-контроля.', en: 'Up to 15 guests — DIY is realistic with one vendor chain. From 30+ a planner saves more than they cost via vendor discounts and timeline control.' } },
    { q: { ru: 'Можно ли совместить свадьбу и отпуск гостей?', en: 'Can we bundle the wedding with a guest holiday?' }, a: { ru: 'Да — стандарт «3-day wedding»: welcome dinner, церемония + reception, recovery brunch. Блок в отеле со скидкой 15–25% при бронировании ≥10 номеров.', en: 'Yes — the standard “3-day wedding”: welcome dinner, ceremony + reception, recovery brunch. Hotel block 15–25% off when booking 10+ rooms.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать площадку', en: 'Scout a venue' },
    href: '/wedding/venues',
    subtitle: { ru: 'Подборка под бюджет за 48 часов.', en: 'Curated shortlist within 48 hours.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть wedding-гид', en: 'Open the wedding guide' },
    href: '/wedding',
  },
  seo: {
    metaTitle: { ru: 'Свадьба на Пхукете под ключ — myUNO', en: 'Destination wedding on Phuket — myUNO' },
    metaDescription: { ru: 'Площадки, юридическая регистрация, planner, фото и логистика гостей. Свадьбы на 10–120 человек без сюрпризов в счёте.', en: 'Venues, legal registration, planner, photo and guest logistics. Weddings for 10–120 guests with no budget surprises.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/weddings',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/weddings?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/weddings?lang=en' },
    ],
  },
};
