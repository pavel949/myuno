/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P25_STUDENTS: PersonaLanding = {
  personaCode: 'P25',
  slug: 'students',
  status: 'live',
  h1: { ru: 'Студенты и молодые взрослые на Пхукете', en: 'Students and young adults on Phuket' },
  subtitle: { ru: 'Учёба, языковые школы, дайвинг, Muay Thai и доступная аренда — Пхукет как gap-year или semester abroad.', en: 'Study, language schools, diving, Muay Thai and affordable rentals — Phuket as a gap year or semester abroad.' },
  pains: [
    { ru: 'Нужна ED-виза, но школы и условия запутаны.', en: 'You need an ED visa, but schools and conditions are confusing.' },
    { ru: 'Бюджет ограничен — нужна аренда от ฿15K и ниже.', en: 'Budget is tight — you need rentals from ฿15K and below.' },
    { ru: 'Хочется учить английский, тайский или дайвинг — не понятно где.', en: 'You want to learn English, Thai or diving — unclear where.' },
    { ru: 'Скучно одному — нужен student community.', en: 'Lonely solo — you need a student community.' },
  ],
  services: [
    { slug: 'language-schools', label: { ru: 'Языковые школы', en: 'Language schools' }, oneLiner: { ru: 'Английский, тайский, китайский — с ED-визой.', en: 'English, Thai, Chinese — with ED visa.' }, href: '/visa/quiz' },
    { slug: 'student-housing', label: { ru: 'Доступная аренда', en: 'Affordable rentals' }, oneLiner: { ru: 'Студии и shared house от ฿10–15K.', en: 'Studios and shared houses from ฿10–15K.' }, href: '/property/rent' },
    { slug: 'activities', label: { ru: 'Дайвинг и Muay Thai', en: 'Diving & Muay Thai' }, oneLiner: { ru: 'Сертификации PADI, тренировки в топ-залах.', en: 'PADI certifications, top gym training.' }, href: '/cluster/lifestyle' },
    { slug: 'community', label: { ru: 'Student community', en: 'Student community' }, oneLiner: { ru: 'Meetups, языковые обмены, спортивные группы.', en: 'Meetups, language exchanges, sports groups.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно ли работать на ED-визе?', en: 'Can I work on an ED visa?' }, a: { ru: 'Нет — ED-виза только для учёбы. Для работы нужна DTV или work permit.', en: 'No — ED visa is study only. For work you need DTV or a work permit.' } },
    { q: { ru: 'Сколько стоит жизнь в месяц?', en: 'What does a month cost?' }, a: { ru: 'Бюджет студента: ฿30–45K (аренда + еда + транспорт + школа).', en: 'Student budget: ฿30–45K (rent + food + transport + school).' } },
  ],
  primaryCta: { label: { ru: 'Подобрать школу и визу', en: 'Pick school & visa' }, href: '/visa/quiz' },
  secondaryCta: { label: { ru: 'Найти жильё', en: 'Find housing' }, href: '/property/rent' },
  seo: {
    metaTitle: { ru: 'Студенту на Пхукете: ED-виза, школы, жильё — myUNO', en: 'Students on Phuket: ED visa, schools, housing — myUNO' },
    metaDescription: { ru: 'Gap-year или semester abroad на Пхукете: ED-виза, языковые школы, доступная аренда, дайвинг и community.', en: 'Gap year or semester abroad on Phuket: ED visa, language schools, affordable rentals, diving and community.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/students',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/students?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/students?lang=en' },
    ],
  },
};
