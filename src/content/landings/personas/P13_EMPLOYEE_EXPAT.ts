/**
 * Sprint C (orphan coverage): canonical P13_employee_expat.
 * Foreign professionals on Thai company payroll (Non-B + Work Permit).
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P13_EMPLOYEE_EXPAT: PersonaLanding = {
  personaCode: 'P6',
  slug: 'employee-expat',
  status: 'live',
  h1: {
    ru: 'Работа в Таиланде по найму: Non-B, Work Permit, всё под ключ',
    en: 'Employment in Thailand: Non-B, Work Permit, end-to-end',
  },
  subtitle: {
    ru: 'Вас наняла тайская компания: оформляем Non-B + Work Permit, помогаем с релокационным пакетом, жильём, школой для детей и налогами по тайскому стандарту PIT.',
    en: 'A Thai company hired you: we handle Non-B + Work Permit, relocation package, housing, schooling, and Thai PIT taxes.',
  },
  pains: [
    { ru: 'HR говорит «оформим» — но Work Permit задерживается уже 6 недель.', en: 'HR says "we will handle it" — but the Work Permit has been stuck 6 weeks.' },
    { ru: 'Релокационный пакет не покрывает депозит за виллу и школу детям.', en: 'The relocation package does not cover villa deposit and school fees.' },
    { ru: 'Не знаете, что делать с социальным фондом и медицинской страховкой.', en: 'You are unclear on the Social Security Fund and health insurance.' },
    { ru: 'Подоходный налог 35% — это правда, и как уменьшить.', en: 'Is the 35% PIT real, and how to reduce it.' },
    { ru: 'Виза привязана к работодателю — что будет при увольнении.', en: 'The visa is tied to the employer — what happens if you leave.' },
  ],
  services: [
    { slug: 'work-permit', label: { ru: 'Non-B + Work Permit', en: 'Non-B + Work Permit' }, oneLiner: { ru: 'Сопровождение оформления и продления.', en: 'Full filing and renewal support.' }, href: '/legal/work-permit' },
    { slug: 'relocation-package', label: { ru: 'Релокационный пакет', en: 'Relocation package' }, oneLiner: { ru: 'Жильё, школа, переезд вещей, авто.', en: 'Housing, school, shipping, car.' }, href: '/visa/quiz?intent=employee' },
    { slug: 'tax-pit', label: { ru: 'Тайский подоходный налог (PIT)', en: 'Thai personal income tax' }, oneLiner: { ru: 'Декларация PND.91, вычеты, DTA.', en: 'PND.91 filing, deductions, DTA.' }, href: '/legal/tax' },
    { slug: 'expat-insurance', label: { ru: 'Страховка сверх SSF', en: 'Insurance beyond SSF' }, oneLiner: { ru: 'SSF — это базовая клиника. Нужен private.', en: 'SSF is basic clinic-tier. Top up with private.' }, href: '/legal/insurance' },
    { slug: 'family-rental', label: { ru: 'Жильё для экспата', en: 'Expat housing' }, oneLiner: { ru: 'Виллы и кондо рядом с офисом.', en: 'Villas and condos near your office.' }, href: '/property?intent=rent-long' },
    { slug: 'school-finder', label: { ru: 'Школа для детей', en: 'School for kids' }, oneLiner: { ru: 'International + ED-visa для детей.', en: 'International + ED visa for kids.' }, href: '/school-finder' },
  ],
  faq: [
    { q: { ru: 'Сколько по времени оформляется Work Permit?', en: 'How long does the Work Permit take?' }, a: { ru: 'При полном пакете документов от компании — 7–14 рабочих дней. Задержки чаще всего у HR (не у иммиграции): уставные документы, отчётность, баланс капитала.', en: 'With a complete company package — 7–14 business days. Delays usually sit with HR (not immigration): corporate docs, financials, capital balance.' } },
    { q: { ru: 'Что произойдёт с визой, если я уволюсь?', en: 'What happens to my visa if I quit?' }, a: { ru: 'У вас есть 7 дней, чтобы покинуть страну или переоформить визу на новую компанию / DTV / туристический штамп. Work Permit аннулируется в день увольнения.', en: 'You have 7 days to leave the country or transfer your visa to a new employer / DTV / tourist stamp. The Work Permit is cancelled on the last working day.' } },
    { q: { ru: 'Какой реальный подоходный налог?', en: 'What is the effective personal income tax?' }, a: { ru: 'Прогрессивная шкала 5–35%. Эффективная ставка для ฿200k брутто в мес — около 18–22%. Вычеты: страховка, родители, ребёнок, ипотека, social fund. Декларация PND.91 — до 31 марта.', en: 'Progressive 5–35%. Effective rate at ฿200k gross/month — about 18–22%. Deductions: insurance, parents, child, mortgage, social fund. PND.91 due 31 March.' } },
    { q: { ru: 'Социальный фонд (SSF) обязателен?', en: 'Is the Social Security Fund mandatory?' }, a: { ru: 'Да, если у вас Work Permit. ฿750/мес с работника + ฿750 с работодателя. Покрывает базовую клинику и пенсию. Private-страховку рекомендуем сверху для нормальной медицины.', en: 'Yes, if you hold a Work Permit. ฿750/month employee + ฿750 employer. Covers basic clinic care and pension. Add private insurance for serious medicine.' } },
    { q: { ru: 'Можно ли оформить визу семье?', en: 'Can my family get visas too?' }, a: { ru: 'Да, Dependent visa (Non-O) для супруга и детей оформляется параллельно с вашей Non-B. Для детей школьного возраста часто проще ED-visa — больше прав, длиннее срок.', en: 'Yes, Dependent visa (Non-O) for spouse and children runs in parallel with your Non-B. For school-age kids, ED visa is often easier — more rights, longer term.' } },
  ],
  primaryCta: {
    label: { ru: 'Оформить Work Permit', en: 'Apply for Work Permit' },
    href: '/legal/work-permit',
    subtitle: { ru: 'От ฿35 000, срок 7–14 дней.', en: 'From ฿35,000, 7–14 days.' },
  },
  secondaryCta: {
    label: { ru: 'Жильё рядом с офисом', en: 'Housing near your office' },
    href: '/property?intent=rent-long',
  },
  seo: {
    metaTitle: { ru: 'Работа в Таиланде по найму: Non-B, WP, PIT — myUNO', en: 'Employment in Thailand: Non-B, WP, PIT — myUNO' },
    metaDescription: { ru: 'Релокация по найму в Таиланд: Non-B + Work Permit, релопакет, жильё, школа, подоходный налог, страховка. Под ключ.', en: 'Employment relocation to Thailand: Non-B + Work Permit, relo package, housing, school, PIT, insurance. End-to-end.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/employee-expat',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/employee-expat?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/employee-expat?lang=en' },
    ],
  },
};
