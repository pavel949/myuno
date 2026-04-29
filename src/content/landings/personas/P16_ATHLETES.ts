/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P16_ATHLETES: PersonaLanding = {
  personaCode: 'P16',
  slug: 'athletes',
  status: 'live',
  h1: {
    ru: 'Тренировочные сборы на Пхукете: MMA, Muay Thai, fitness',
    en: 'Training camps on Phuket: MMA, Muay Thai, fitness',
  },
  subtitle: {
    ru: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand — сборы, проживание рядом с залом, восстановление и виза.',
    en: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand — camps, gym-side housing, recovery and visa.',
  },
  pains: [
    { ru: 'Не знаете, какой зал подходит под ваш уровень и стиль.', en: 'You don’t know which gym fits your level and style.' },
    { ru: 'Хотите жить в 5 минутах от зала, а не ездить через весь остров.', en: 'You want to live 5 minutes from the gym, not commute across the island.' },
    { ru: 'Нужен Education Visa или ED-виза на срок сборов.', en: 'You need an Education or ED visa for the camp duration.' },
    { ru: 'Восстановление после нагрузки: спортивный массаж, физиотерапевт, питание.', en: 'Recovery after load: sports massage, physio, nutrition.' },
  ],
  services: [
    { slug: 'gym-matcher', label: { ru: 'Подбор зала', en: 'Gym matcher' }, oneLiner: { ru: 'Сравнение Tiger / PTT / AKA / Sinbi по уровню и цене.', en: 'Tiger / PTT / AKA / Sinbi compared by level and price.' }, href: '/cluster/lifestyle' },
    { slug: 'gym-side-housing', label: { ru: 'Жильё рядом с залом', en: 'Gym-side housing' }, oneLiner: { ru: 'Студии в Чалонге и Раваи от 14 ночей.', en: 'Studios in Chalong and Rawai from 14 nights.' }, href: '/property/rent' },
    { slug: 'ed-visa', label: { ru: 'ED Visa', en: 'ED Visa' }, oneLiner: { ru: 'Education Visa через лицензированный зал.', en: 'Education Visa via a licensed gym.' }, href: '/visa/quiz' },
    { slug: 'recovery', label: { ru: 'Sports recovery', en: 'Sports recovery' }, oneLiner: { ru: 'Спорт-массаж, физио, ice bath.', en: 'Sports massage, physio, ice bath.' }, href: '/wellness' },
  ],
  faq: [
    { q: { ru: 'Сколько стоят сборы на месяц?', en: 'How much for a one-month camp?' }, a: { ru: '600–1200 USD за тренировки + 400–900 USD за жильё. Точная смета — по запросу.', en: '600–1200 USD for training + 400–900 USD for housing. Exact quote on request.' } },
    { q: { ru: 'Можно с нуля без опыта?', en: 'Can I start without experience?' }, a: { ru: 'Да. У всех топ-залов есть beginner-классы и персональный тренер.', en: 'Yes. All top gyms run beginner classes and personal trainers.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать зал', en: 'Find a gym' }, href: '/contact' },
  secondaryCta: { label: { ru: 'Получить ED-визу', en: 'Get ED visa' }, href: '/visa/quiz' },
  seo: {
    metaTitle: { ru: 'Сборы на Пхукете: Tiger, PTT, AKA — жильё и виза — myUNO', en: 'Phuket training camps: Tiger, PTT, AKA — housing & visa — myUNO' },
    metaDescription: { ru: 'Сборы по MMA, Muay Thai и fitness в топ-залах Пхукета. Жильё рядом, ED Visa, восстановление и питание под спортсмена.', en: 'MMA, Muay Thai and fitness camps at Phuket top gyms. Gym-side housing, ED Visa, recovery and athlete nutrition.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/athletes',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/athletes?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/athletes?lang=en' },
    ],
  },
};
