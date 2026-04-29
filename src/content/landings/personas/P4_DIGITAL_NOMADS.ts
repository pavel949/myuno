/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P4_DIGITAL_NOMADS: PersonaLanding = {
  personaCode: 'P4',
  slug: 'digital-nomads',
  status: 'live',
  h1: {
    ru: 'Пхукет для digital nomad: виза, жильё, коворкинг',
    en: 'Phuket for digital nomads: visa, housing, co-working',
  },
  subtitle: {
    ru: 'DTV-виза на 5 лет, long-stay condo с быстрым интернетом, коворкинги и комьюнити — собрали всё, что нужно для удалённой работы из Таиланда.',
    en: 'DTV visa for up to 5 years, long-stay condos with fast internet, co-working spaces and community — everything you need to work remotely from Thailand.',
  },
  pains: [
    { ru: 'Не понятно, какая виза легально позволяет работать удалённо: туристическая, DTV или Education.', en: 'Unclear which visa lets you legally work remotely: tourist, DTV or Education.' },
    { ru: 'Нужен интернет 100+ Mbps и резерв на отключения — не каждое жильё это даёт.', en: 'You need 100+ Mbps and outage backup — not every rental delivers.' },
    { ru: 'Хочется коворкинг с приличным звуком для созвонов и людей вокруг.', en: 'You want a co-working space with good acoustics for calls and people around.' },
    { ru: 'Приехать одному скучно — где найти комьюнити удалённых работников.', en: 'Coming alone is dull — where to find a remote-worker community.' },
  ],
  services: [
    { slug: 'visa-quiz', label: { ru: 'Подбор визы (DTV / LTR / Education)', en: 'Visa picker (DTV / LTR / Education)' }, oneLiner: { ru: '4 вопроса — рекомендация и список документов.', en: '4 questions — recommendation and document checklist.' }, href: '/visa/quiz' },
    { slug: 'long-stay-condo', label: { ru: 'Long-stay condo', en: 'Long-stay condo' }, oneLiner: { ru: 'От 1 месяца, fiber 200 Mbps, кухня, бассейн.', en: 'From 1 month, 200 Mbps fibre, kitchen, pool.' }, href: '/property?staytype=long' },
    { slug: 'coworking-map', label: { ru: 'Карта коворкингов', en: 'Co-working map' }, oneLiner: { ru: 'KoHub, Garage, Hatch — цены, скорость, день-пасс.', en: 'KoHub, Garage, Hatch — prices, speed, day passes.' }, href: '/services/coworking' },
    { slug: 'nomad-guide', label: { ru: 'Nomad Guide', en: 'Nomad Guide' }, oneLiner: { ru: 'Полный гид по Пхукету для удалёнщика.', en: 'Full Phuket guide for the remote worker.' }, href: '/nomad-guide' },
  ],
  faq: [
    { q: { ru: 'Что такое DTV и кому она подходит?', en: 'What is DTV and who qualifies?' }, a: { ru: 'Destination Thailand Visa — мульти-виза на 5 лет для удалённых работников и фрилансеров. Каждое пребывание до 180 дней. Нужны: контракт/договор, выписка с балансом 500 000 THB, медицинская страховка.', en: 'Destination Thailand Visa — a 5-year multi-entry visa for remote workers and freelancers. Each stay up to 180 days. Required: contract, bank statement showing 500,000 THB, medical insurance.' } },
    { q: { ru: 'Можно ли работать на туристической визе?', en: 'Can I work on a tourist visa?' }, a: { ru: 'Удалённая работа на иностранного работодателя — серая зона. Тайские власти на практике не преследуют, но статус юридически уязвим. DTV закрывает этот вопрос полностью.', en: 'Remote work for a foreign employer is a grey zone. Authorities rarely enforce, but the status is legally fragile. DTV resolves this fully.' } },
    { q: { ru: 'Какой район выбрать для long-stay?', en: 'Which area for long-stay?' }, a: { ru: 'Раваи и Чалонг — нижний бюджет, тихо. Бангтао и Лагуна — премиум, инфраструктура, коворкинги. Камала — баланс. Патонг — только если нужна ночная жизнь.', en: 'Rawai and Chalong — lower budget, quiet. Bang Tao and Laguna — premium, infrastructure, co-working. Kamala — balanced. Patong — only if you want nightlife.' } },
    { q: { ru: 'Сколько стоит жизнь в месяц?', en: 'What is the monthly cost of living?' }, a: { ru: 'Минимум — ฿45 000 (студия, еда вне ресторанов, байк). Комфорт — ฿80 000–120 000 (1-bed condo, рестораны, спорт). Премиум — от ฿200 000.', en: 'Minimum — ฿45,000 (studio, mostly cooking, scooter). Comfortable — ฿80,000–120,000 (1-bed condo, eating out, sports). Premium — from ฿200,000.' } },
    { q: { ru: 'Где познакомиться с другими удалёнщиками?', en: 'Where to meet other nomads?' }, a: { ru: 'KoHub в Раваи — главное место. Telegram-группа myUNO Nomads — 1 200+ участников, события каждую неделю.', en: 'KoHub in Rawai is the main hub. The myUNO Nomads Telegram group — 1,200+ members, weekly events.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу', en: 'Pick a visa' },
    href: '/visa/quiz',
    subtitle: { ru: '4 вопроса, бесплатно.', en: '4 questions, free.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть Nomad Guide', en: 'Open the Nomad Guide' },
    href: '/nomad-guide',
  },
  seo: {
    metaTitle: { ru: 'Пхукет для digital nomad: DTV, condo, коворкинг — myUNO', en: 'Phuket for digital nomads: DTV, condo, co-working — myUNO' },
    metaDescription: { ru: 'DTV-виза на 5 лет, long-stay condo с fiber-интернетом, карта коворкингов и комьюнити удалёнщиков на Пхукете.', en: 'DTV 5-year visa, long-stay condos with fibre internet, co-working map and remote-worker community on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/digital-nomads',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/digital-nomads?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/digital-nomads?lang=en' },
    ],
  },
};
