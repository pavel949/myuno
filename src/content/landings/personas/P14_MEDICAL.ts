/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P14_MEDICAL: PersonaLanding = {
  personaCode: 'P14',
  slug: 'medical',
  status: 'live',
  h1: {
    ru: 'Медицинский туризм на Пхукете: клиники и сопровождение',
    en: 'Medical tourism on Phuket: clinics and concierge',
  },
  subtitle: {
    ru: 'JCI-аккредитованные госпитали, координатор по-русски, страховой cashless и пакеты check-up — лечение и обследование без языкового барьера и переплат.',
    en: 'JCI-accredited hospitals, Russian-speaking coordinator, cashless insurance and check-up packages — treatment and diagnostics without language barrier or markup.',
  },
  pains: [
    { ru: 'Не понятно, в какую клинику с какой проблемой ехать.', en: 'Unclear which hospital to choose for which condition.' },
    { ru: 'Страховая может отказать в cashless без правильно оформленной guarantee letter.', en: 'Insurer may refuse cashless without a properly issued guarantee letter.' },
    { ru: 'Языковой барьер с врачом — критично при сложном диагнозе.', en: 'Language barrier with the doctor — critical for complex diagnoses.' },
    { ru: 'Цены на check-up отличаются в 3 раза между клиниками за тот же набор анализов.', en: 'Check-up prices vary 3× between clinics for the same panel.' },
  ],
  services: [
    { slug: 'hospital-match', label: { ru: 'Подбор клиники', en: 'Hospital matching' }, oneLiner: { ru: 'Bangkok Hospital, BIH, Mission, Vachira — под диагноз и бюджет.', en: 'Bangkok Hospital, BIH, Mission, Vachira — by diagnosis and budget.' }, href: '/services/health/hospitals' },
    { slug: 'medical-coordinator', label: { ru: 'Координатор по-русски', en: 'Russian-speaking coordinator' }, oneLiner: { ru: 'Сопровождение на приёмы, перевод заключений.', en: 'Appointment escort, report translation.' }, href: '/concierge?topic=medical' },
    { slug: 'insurance-liaison', label: { ru: 'Связь со страховой', en: 'Insurance liaison' }, oneLiner: { ru: 'Cashless approval и работа с ассистансом.', en: 'Cashless approval and assistance coordination.' }, href: '/services/insurance/liaison' },
    { slug: 'checkup', label: { ru: 'Пакеты check-up', en: 'Check-up packages' }, oneLiner: { ru: 'Executive ฿18 000, кардио ฿28 000, женский ฿22 000.', en: 'Executive ฿18,000, cardio ฿28,000, women’s ฿22,000.' }, href: '/services/health/checkup' },
    { slug: 'dental', label: { ru: 'Стоматология', en: 'Dentistry' }, oneLiner: { ru: 'Имплантация Straumann ฿55 000, виниры ฿18 000.', en: 'Straumann implants ฿55,000, veneers ฿18,000.' }, href: '/services/health/dental' },
    { slug: 'surgery-recovery', label: { ru: 'Восстановление после операции', en: 'Post-surgery recovery' }, oneLiner: { ru: 'Виллы с медсестрой и реабилитационная программа.', en: 'Villas with on-call nurse and rehab program.' }, href: '/services/health/recovery' },
  ],
  faq: [
    { q: { ru: 'Какие клиники аккредитованы JCI?', en: 'Which hospitals are JCI-accredited?' }, a: { ru: 'Bangkok Hospital Phuket и BIH — обе с JCI. Mission Hospital — без JCI, но с международным отделением. Vachira (государственная) — без JCI, но 24/7 для критических случаев.', en: 'Bangkok Hospital Phuket and BIH — both JCI-accredited. Mission Hospital — no JCI but has an international wing. Vachira (public) — no JCI, 24/7 for critical cases.' } },
    { q: { ru: 'Как организован cashless с международной страховкой?', en: 'How does cashless work with international insurance?' }, a: { ru: 'Координатор клиники запрашивает guarantee letter у вашего ассистанса до приёма. Без letter — оплата на месте с последующим возмещением (3–6 недель).', en: 'The hospital coordinator requests a guarantee letter from your assistance before the visit. Without it — pay-and-claim with 3–6-week reimbursement.' } },
    { q: { ru: 'Сколько стоит executive check-up?', en: 'What does an executive check-up cost?' }, a: { ru: 'Bangkok Hospital — ฿18 000–25 000 (анализы крови, ЭКГ, УЗИ органов, консультация). BIH — ฿20 000–35 000. Полный кардио-чек с эхо и КТ — ฿28 000–45 000.', en: 'Bangkok Hospital — ฿18,000–25,000 (blood panel, ECG, organ ultrasound, consult). BIH — ฿20,000–35,000. Full cardio with echo + CT — ฿28,000–45,000.' } },
    { q: { ru: 'Можно ли приехать только на стоматологию?', en: 'Can I come just for dental work?' }, a: { ru: 'Да: импланты, виниры, ортодонтия. Цены в 2–3 раза ниже Европы. Срок 5–14 дней с учётом приживления абатмента. Совмещают с зимовкой 30+ дней.', en: 'Yes: implants, veneers, orthodontics. Prices 2–3× cheaper than Europe. Timeline 5–14 days incl. abutment healing. Often combined with a 30+ day stay.' } },
    { q: { ru: 'Кто оформит документы для возврата по страховой?', en: 'Who handles paperwork for insurance reimbursement?' }, a: { ru: 'Координатор myUNO собирает: счёт-фактуру, заключения, рецепты, протокол на английском. Отправляем пакет ассистансу. Выплата 3–6 недель.', en: 'The myUNO coordinator collects: invoice, doctor reports, prescriptions, English protocol. We send the package to your assistance. Payout 3–6 weeks.' } },
    { q: { ru: 'Можно ли остаться на восстановление после операции?', en: 'Can I stay for post-op recovery?' }, a: { ru: 'Да: виллы 1–3 спальни с медсестрой 8/16/24 часа в день, физиотерапевт, диетолог. Пакет 14 дней — от ฿180 000. Помощь с продлением визы.', en: 'Yes: 1–3 BR villas with 8/16/24-hour nurse, physiotherapist, nutritionist. 14-day package — from ฿180,000. Visa extension assistance included.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать клинику', en: 'Match a hospital' },
    href: '/services/health/hospitals',
    subtitle: { ru: 'Бесплатно, ответ за 4 часа.', en: 'Free, reply within 4 hours.' },
  },
  secondaryCta: {
    label: { ru: 'Заказать check-up', en: 'Book a check-up' },
    href: '/services/health/checkup',
  },
  seo: {
    metaTitle: { ru: 'Медицинский туризм на Пхукете: JCI-клиники — myUNO', en: 'Medical tourism on Phuket: JCI hospitals — myUNO' },
    metaDescription: { ru: 'Bangkok Hospital, BIH, координатор по-русски, cashless страховка и пакеты check-up. Без языкового барьера и переплат.', en: 'Bangkok Hospital, BIH, Russian-speaking coordinator, cashless insurance and check-up packages. No language barrier, no markup.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/medical',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/medical?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/medical?lang=en' },
    ],
  },
};
