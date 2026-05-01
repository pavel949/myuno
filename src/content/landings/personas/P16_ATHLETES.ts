/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Wave 3 expansion (2026-05): brought to production-grade parity with P14/P15.
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
    ru: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand, Sinbi — сборы, проживание в 5 минутах от зала, ED-виза, восстановление и питание под спортсмена.',
    en: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand, Sinbi — camps, gym-side housing, ED Visa, recovery and athlete-grade nutrition.',
  },
  pains: [
    { ru: 'Не знаете, какой зал подходит под уровень и стиль (грэпплинг vs ударка vs MMA).', en: 'You don’t know which gym fits your level and style (grappling vs striking vs MMA).' },
    { ru: 'Хотите жить в 5 минутах от зала, а не ездить через весь остров на скутере.', en: 'You want to live 5 minutes from the gym, not commute the whole island on a scooter.' },
    { ru: 'Нужен Education Visa или ED-виза на срок сборов 1–6 месяцев.', en: 'You need an Education or ED visa for a 1–6 month camp.' },
    { ru: 'Восстановление после нагрузки: спорт-массаж, физио, питание.', en: 'Recovery after load: sports massage, physio, nutrition.' },
  ],
  services: [
    { slug: 'gym-matcher', label: { ru: 'Подбор зала', en: 'Gym matcher' }, oneLiner: { ru: 'Tiger / PTT / AKA / Sinbi сравнение по уровню и цене.', en: 'Tiger / PTT / AKA / Sinbi compared by level and price.' }, href: '/cluster/lifestyle' },
    { slug: 'gym-side-housing', label: { ru: 'Жильё рядом с залом', en: 'Gym-side housing' }, oneLiner: { ru: 'Студии в Чалонге и Раваи от 14 ночей, ฿18 000–35 000/мес.', en: 'Studios in Chalong and Rawai from 14 nights, ฿18,000–35,000/mo.' }, href: '/property/rent' },
    { slug: 'ed-visa', label: { ru: 'ED Visa через зал', en: 'ED Visa via gym' }, oneLiner: { ru: 'Education Visa 6 / 12 месяцев через лицензированный зал.', en: 'Education Visa 6 / 12 months via a licensed gym.' }, href: '/visa/quiz' },
    { slug: 'sports-recovery', label: { ru: 'Sports recovery', en: 'Sports recovery' }, oneLiner: { ru: 'Спорт-массаж ฿1 500, физио ฿2 800, ice bath ฿800.', en: 'Sports massage ฿1,500, physio ฿2,800, ice bath ฿800.' }, href: '/wellness' },
    { slug: 'athlete-nutrition', label: { ru: 'Питание под cut/bulk', en: 'Athlete nutrition' }, oneLiner: { ru: 'Meal-prep с макросами, доставка к вилле, ฿7 500/неделя.', en: 'Macro-tracked meal-prep, villa delivery, ฿7,500/week.' }, href: '/services/health/nutrition' },
    { slug: 'team-retreat', label: { ru: 'Team retreats', en: 'Team retreats' }, oneLiner: { ru: 'Сборы клуба 8–30 человек: вилла + зал + восстановление.', en: 'Club camps for 8–30 athletes: villa + gym + recovery.' }, href: '/contact' },
  ],
  faq: [
    { q: { ru: 'Сколько стоят сборы на месяц?', en: 'How much for a one-month camp?' }, a: { ru: 'Тренировки: Tiger Muay Thai ฿16 500 unlimited, AKA ฿14 000, PTT ฿18 000. Жильё рядом: студия ฿18–25K, апартаменты 1BR ฿28–45K. Итого 35–60K ฿/мес без питания.', en: 'Training: Tiger Muay Thai ฿16,500 unlimited, AKA ฿14,000, PTT ฿18,000. Gym-side housing: studio ฿18–25K, 1BR ฿28–45K. Total ฿35–60K/mo excluding food.' } },
    { q: { ru: 'Можно ли с нуля без опыта?', en: 'Can I start without experience?' }, a: { ru: 'Да. У всех топ-залов 4 уровня beginner-классов, отдельные fundamentals-сессии и персональный тренер ฿1 200–1 800/час. Первая неделя обычно фокус на технике и кардио, без спарринга.', en: 'Yes. All top gyms run 4 beginner levels, separate fundamentals classes and personal trainers at ฿1,200–1,800/hr. The first week is usually technique and cardio, no sparring.' } },
    { q: { ru: 'ED-виза: срок и стоимость?', en: 'ED Visa: duration and cost?' }, a: { ru: 'Через зал: 6 мес — ฿35 000–45 000 (включает гос. сборы и оформление). 12 мес — ฿55 000–70 000. Школа делает 90-day report и продление. Минус: нельзя работать.', en: 'Via gym: 6 mo — ฿35,000–45,000 (incl. fees & paperwork). 12 mo — ฿55,000–70,000. The school handles the 90-day report and extension. Caveat: no work allowed.' } },
    { q: { ru: 'Что со страховкой при травмах?', en: 'What about insurance for injuries?' }, a: { ru: 'Стандартная travel-страховка часто не покрывает контактные виды. Нужна спортивная: World Nomads Explorer Plus или Battleface ($45–80/мес) с rider на MMA/боевые. Bangkok Hospital — direct billing с топ-страховщиками.', en: 'Standard travel insurance often excludes contact sports. You need a sports policy: World Nomads Explorer Plus or Battleface ($45–80/mo) with an MMA/combat rider. Bangkok Hospital direct-bills the major carriers.' } },
    { q: { ru: 'Сколько сессий в день — реалистично?', en: 'How many sessions per day is realistic?' }, a: { ru: 'Опытные: 2 сессии в день (утро + вечер) с 1 днём отдыха. Новички: 1 сессия + S&C через день. Превышение 14+ сессий/нед. почти всегда даёт перетрен или травму к концу месяца.', en: 'Experienced: 2/day (AM + PM) with 1 rest day. Beginners: 1/day + S&C every other day. Going above 14 sessions/wk almost always causes overtraining or injury by month-end.' } },
    { q: { ru: 'Можно ли совместить сборы и любительский турнир?', en: 'Can I combine camps with an amateur fight?' }, a: { ru: 'Да — Bangla Boxing Stadium и Patong Boxing Stadium принимают amateur-карты. Зал ставит на карту через 4–8 недель тренировок. Гонорар $100–500 + бесплатное обмундирование и угол.', en: 'Yes — Bangla and Patong Boxing Stadiums host amateur cards. Your gym books you on a card after 4–8 weeks of training. Purse $100–500 + free gear and corner.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать зал и жильё', en: 'Find a gym & housing' }, href: '/contact', subtitle: { ru: 'Подбор за 24 часа. Бесплатно.', en: 'Curated within 24 hours. Free.' } },
  secondaryCta: { label: { ru: 'Получить ED-визу', en: 'Get ED visa' }, href: '/visa/quiz' },
  seo: {
    metaTitle: { ru: 'Сборы на Пхукете: Tiger, PTT, AKA — жильё и виза — myUNO', en: 'Phuket training camps: Tiger, PTT, AKA — housing & visa — myUNO' },
    metaDescription: { ru: 'Сборы по MMA, Muay Thai и fitness в топ-залах Пхукета. Жильё в 5 минутах, ED Visa, восстановление и питание под спортсмена. От ฿35 000/мес.', en: 'MMA, Muay Thai and fitness camps at Phuket top gyms. 5-minute housing, ED Visa, recovery and athlete nutrition. From ฿35,000/mo.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/athletes',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/athletes?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/athletes?lang=en' },
    ],
  },
};
