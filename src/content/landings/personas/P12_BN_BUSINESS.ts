/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P12_BN_BUSINESS: PersonaLanding = {
  personaCode: 'P12',
  slug: 'bn-business',
  status: 'live',
  h1: { ru: 'Пхукет для бизнес-аудитории из Бангладеш', en: 'Phuket for Bangladeshi business audience' },
  subtitle: { ru: 'Семейные виллы, halal-инфраструктура, корпоративные ретриты и поддержка по визам — всё в одной точке.', en: 'Family villas, halal infrastructure, corporate retreats and visa support — all in one place.' },
  pains: [
    { ru: 'Сложно подобрать виллу для большой семьи с halal-сервисом.', en: 'Hard to find a large-family villa with halal service.' },
    { ru: 'Нужна виза для ретрита команды на 7–14 дней.', en: 'You need visas for a 7–14 day team retreat.' },
    { ru: 'Хочется проверить инвестиционный кейс перед поездкой.', en: 'You want to vet an investment case before flying in.' },
    { ru: 'Не хватает посредника, который говорит на бенгали или урду.', en: 'You miss a Bangla- or Urdu-speaking liaison.' },
  ],
  services: [
    { slug: 'family-villa', label: { ru: 'Семейная вилла 4–8 спален', en: 'Family villa 4–8 BR' }, oneLiner: { ru: 'Privacy, бассейн, halal-кухня по запросу.', en: 'Privacy, pool, halal kitchen on request.' }, href: '/property/rent' },
    { slug: 'team-retreat', label: { ru: 'Корпоративный ретрит', en: 'Corporate retreat' }, oneLiner: { ru: 'Виллы 10+ спален, конференц-зона, кейтеринг.', en: 'Villas 10+ BR, meeting area, catering.' }, href: '/contact' },
    { slug: 'visa-support', label: { ru: 'Виза и приглашение', en: 'Visa & invitation' }, oneLiner: { ru: 'Tourist / business visa support letter.', en: 'Tourist / business visa support letter.' }, href: '/visa/quiz' },
    { slug: 'investment-brief', label: { ru: 'Investment brief', en: 'Investment brief' }, oneLiner: { ru: 'Письменный обзор рынка перед визитом.', en: 'Written market brief before your visit.' }, href: '/property/mandate' },
  ],
  faq: [
    { q: { ru: 'Можно ли халяль кейтеринг на вилле?', en: 'Can we get halal catering at the villa?' }, a: { ru: 'Да — повар с сертификатом, меню согласовываем заранее.', en: 'Yes — certified chef, menu agreed in advance.' } },
    { q: { ru: 'Какая виза подойдёт для команды?', en: 'Which visa fits a team trip?' }, a: { ru: 'Tourist visa или DTV для корпоративных ретритов до 180 дней.', en: 'Tourist visa or DTV for corporate retreats up to 180 days.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Получить investment brief', en: 'Get investment brief' }, href: '/property/mandate?source=bn' },
  seo: {
    metaTitle: { ru: 'Пхукет для гостей из Бангладеш: виллы, halal, визы — myUNO', en: 'Phuket for Bangladeshi guests: villas, halal, visas — myUNO' },
    metaDescription: { ru: 'Семейные виллы, halal-кейтеринг, корпоративные ретриты и визовая поддержка для гостей из Бангладеш.', en: 'Family villas, halal catering, corporate retreats and visa support for Bangladeshi guests on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/bn-business',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/bn-business?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/bn-business?lang=en' },
    ],
  },
};
