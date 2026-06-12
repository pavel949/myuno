/**
 * Sprint C (orphan coverage): canonical P10_returnee.
 * Russian-speakers who lived in Phuket before, left, now coming back.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P10_RETURNEE: PersonaLanding = {
  personaCode: 'P6',
  slug: 'returnee',
  status: 'live',
  h1: {
    ru: 'Возвращаетесь на Пхукет: возобновляем визу, дом, школу',
    en: 'Returning to Phuket: visa, home and school reactivated',
  },
  subtitle: {
    ru: 'Жили здесь раньше и снова перебираетесь: восстанавливаем налоговый статус, возобновляем визу, ищем дом в знакомом районе и переподключаем школу или садик — без объяснений «с нуля».',
    en: "You used to live here and you are back: we restore tax residency, reactivate your visa, find a home in your old district, and re-enrol kids in school — without explaining everything from scratch.",
  },
  pains: [
    { ru: 'Прошлая виза истекла, не знаете, можно ли продлить или нужно новую.', en: 'Your old visa expired and you cannot tell if it is renewable or you need a fresh one.' },
    { ru: 'Тайский счёт заморозили или закрыли за бездействие.', en: 'Your Thai bank account was frozen or closed for inactivity.' },
    { ru: 'Хотите вернуться в тот же район, но цены изменились на 20–40%.', en: 'You want to return to the same district but prices shifted 20–40%.' },
    { ru: 'Школа просит подтвердить, что ребёнок не выпал из программы.', en: 'The school asks to confirm the child stayed on track academically.' },
    { ru: 'Не знаете, что осталось из «нашей» инфраструктуры — мастер, врач, продуктовая.', en: 'You are unsure which of "your" people are still around — handyman, doctor, grocer.' },
  ],
  services: [
    { slug: 'visa-quiz', label: { ru: 'Возобновление визы', en: 'Visa reactivation' }, oneLiner: { ru: 'DTV, Elite, ED — что доступно после паузы.', en: 'DTV, Elite, ED — what is available after a break.' }, href: '/visa/quiz' },
    { slug: 'bank-recovery', label: { ru: 'Восстановление банка', en: 'Bank recovery' }, oneLiner: { ru: 'Разморозка счёта или новый — за визит.', en: 'Reactivate or reopen — in one visit.' }, href: '/banking' },
    { slug: 'rental-known-area', label: { ru: 'Аренда в знакомом районе', en: 'Rental in your old area' }, oneLiner: { ru: 'Бангтао, Раваи, Чалонг — актуальные цены.', en: 'Bang Tao, Rawai, Chalong — current prices.' }, href: '/property?intent=rent-long' },
    { slug: 'school-readmission', label: { ru: 'Возврат в школу', en: 'School re-admission' }, oneLiner: { ru: 'UWC, BISP, HeadStart — re-entry без потери года.', en: 'UWC, BISP, HeadStart — re-entry without losing a year.' }, href: '/school-finder' },
    { slug: 'tax-residency', label: { ru: 'Налоговый статус', en: 'Tax residency' }, oneLiner: { ru: 'Что делать с remittance rule 2024.', en: 'How to handle the 2024 remittance rule.' }, href: '/legal/tax' },
  ],
  faq: [
    { q: { ru: 'Моя ED-виза истекла 2 года назад. Что делать?', en: 'My ED visa expired 2 years ago. What now?' }, a: { ru: 'ED не продлевается — оформляется заново через школу. Альтернатива — DTV (если работаете удалённо) или Elite (от $14k). Подбор — в Visa Quiz.', en: 'ED is not renewable — reissued via the school. Alternative: DTV (if you work remotely) or Elite (from $14k). Use Visa Quiz.' } },
    { q: { ru: 'Счёт в Kasikorn заблокирован. Можно реактивировать?', en: 'My Kasikorn account is blocked. Can it be reactivated?' }, a: { ru: 'Если счёт «спящий» (12+ мес без операций) — реактивируется в отделении за визит при наличии паспорта и действующей визы. Если закрыт — открываем новый за тот же день.', en: 'Dormant accounts (12+ months inactive) are reactivated at the branch in one visit with passport and active visa. Closed accounts — we open a new one same-day.' } },
    { q: { ru: 'Цены на аренду в Бангтао сильно выросли?', en: 'Did Bang Tao rentals get much more expensive?' }, a: { ru: 'С 2022 — да, +25–40% на виллы и +15–25% на кондо. Лучший вариант — подписаться за 30–45 дней до приезда. Раваи и Чалонг подросли меньше.', en: 'Since 2022 — yes, +25–40% on villas and +15–25% on condos. Best play: sign 30–45 days before arrival. Rawai and Chalong rose less.' } },
    { q: { ru: 'Школа примет ребёнка обратно?', en: 'Will the school re-admit my child?' }, a: { ru: 'Если уход был оформлен корректно — да, через standard re-admission interview. Если был «выпал из программы» больше года — могут потребовать assessment. Поможем подготовить документы и переговоры со школой.', en: 'If the original withdrawal was processed correctly — yes, via standard re-admission interview. If the child was out of curriculum >1 year — assessment may be required. We help with docs and negotiation.' } },
    { q: { ru: 'Что изменилось в налогах с моего отъезда?', en: 'What changed in taxes since I left?' }, a: { ru: 'С 01.01.2024 действует remittance rule: иностранный доход, переведённый в Таиланд в год получения, облагается налогом. Многих это касается впервые — обязательно консультация перед переводом крупной суммы.', en: 'Since 01.01.2024 a remittance rule applies: foreign income remitted to Thailand in the year earned is taxable. Many face this for the first time — consult before transferring a large sum.' } },
  ],
  primaryCta: {
    label: { ru: 'План возвращения за 7 минут', en: 'Return plan in 7 min' },
    href: '/visa/quiz?intent=returnee',
    subtitle: { ru: 'Бесплатно, без обязательств.', en: 'Free, no commitment.' },
  },
  secondaryCta: {
    label: { ru: 'Аренда в знакомом районе', en: 'Rental in your old area' },
    href: '/property?intent=rent-long',
  },
  seo: {
    metaTitle: { ru: 'Возвращение на Пхукет: виза, банк, школа — myUNO', en: 'Returning to Phuket: visa, bank, school — myUNO' },
    metaDescription: { ru: 'Возвращаетесь жить на Пхукет: возобновление визы, разморозка тайского счёта, аренда в знакомом районе, повторное поступление в школу.', en: 'Coming back to live in Phuket: reactivate visa, restore Thai bank, rent in your old area, re-enrol in school.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/returnee',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/returnee?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/returnee?lang=en' },
    ],
  },
};
