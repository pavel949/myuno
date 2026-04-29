/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P20_RETIREES: PersonaLanding = {
  personaCode: 'P20',
  slug: 'retirees',
  status: 'live',
  h1: {
    ru: 'Пенсионная зимовка и переезд на Пхукет',
    en: 'Retirement on Phuket: from snowbird to long-term',
  },
  subtitle: {
    ru: 'Retirement visa O-A на год, медицинская страховка, condo на одном уровне с лифтом, тайская медицина и комьюнити — устойчивая жизнь после 50.',
    en: 'Retirement O-A visa for a year, health insurance, single-level lift-access condo, Thai healthcare and community — sustainable life after 50.',
  },
  pains: [
    { ru: 'Не понятно, какая виза подходит и какие финансовые требования.', en: 'Unclear which visa suits you and what finances are required.' },
    { ru: 'Сложно найти страховку, которая принимает заявителей 60+.', en: 'Hard to find insurance that accepts 60+ applicants.' },
    { ru: 'Боитесь жить в condo с лестницей и без лифта в 30°C.', en: 'Worried about stairs and no-lift condos in 30°C heat.' },
    { ru: 'Хочется русскоязычное комьюнити рядом, не одному.', en: 'You want a Russian-speaking community nearby, not isolation.' },
  ],
  services: [
    { slug: 'retirement-visa', label: { ru: 'Retirement visa O-A', en: 'Retirement O-A visa' }, oneLiner: { ru: '1 год + продление, ฿800 000 на счету или ฿65 000/мес.', en: '1 year + renewal, ฿800,000 on deposit or ฿65,000/mo.' }, href: '/legal/retirement-visa' },
    { slug: 'senior-insurance', label: { ru: 'Страховка 60+', en: 'Insurance 60+' }, oneLiner: { ru: 'Pacific Cross, April — принимают до 75 лет.', en: 'Pacific Cross, April — accept up to age 75.' }, href: '/services/insurance/senior' },
    { slug: 'senior-housing', label: { ru: 'Comfort condo и виллы', en: 'Comfort condos & villas' }, oneLiner: { ru: 'Один уровень, лифт, рядом hospital и market.', en: 'Single level, lift, near hospital and market.' }, href: '/property?audience=senior' },
    { slug: 'thai-healthcare', label: { ru: 'Тайская медицина', en: 'Thai healthcare' }, oneLiner: { ru: 'Bangkok Hospital, BIH, кардиолог по-русски.', en: 'Bangkok Hospital, BIH, Russian-speaking cardiologist.' }, href: '/services/health/hospitals' },
    { slug: 'senior-community', label: { ru: 'Комьюнити и события', en: 'Community & events' }, oneLiner: { ru: 'Бридж-клуб, шахматы, Telegram-группа 800+.', en: 'Bridge club, chess, 800+ member Telegram group.' }, href: '/community/seniors' },
    { slug: 'home-help', label: { ru: 'Помощь по дому', en: 'Home help' }, oneLiner: { ru: 'Уборка ฿500/раз, готовка по-русски, ремонт.', en: 'Cleaning ฿500/visit, Russian cooking, repairs.' }, href: '/services/home/cleaning' },
  ],
  faq: [
    { q: { ru: 'Какая разница между O-A и O-X visa?', en: 'O-A vs O-X — what is the difference?' }, a: { ru: 'O-A — 1 год + продление, ฿800 000 на счету или ฿65 000/мес дохода. O-X — 5+5 лет, ฿3 млн на счету. Для большинства снежных птиц достаточно O-A.', en: 'O-A — 1 year + renewable, ฿800,000 deposit or ฿65,000/mo income. O-X — 5+5 years, ฿3M deposit. O-A suffices for most snowbirds.' } },
    { q: { ru: 'Какая страховка нужна для retirement visa?', en: 'What insurance is required for the retirement visa?' }, a: { ru: 'Минимум: $100 000 outpatient + $100 000 inpatient. Покрытие COVID-19 обязательно. Pacific Cross Thailand и April International — оба соответствуют требованиям.', en: 'Minimum: $100,000 outpatient + $100,000 inpatient. COVID-19 coverage required. Pacific Cross Thailand and April International both qualify.' } },
    { q: { ru: 'Сколько стоит жить на пенсии в месяц?', en: 'Monthly cost of retirement living?' }, a: { ru: 'Минимум — ฿55 000 (1-bed condo, готовка дома, без машины). Комфорт — ฿95 000–140 000 (вилла, рестораны, медицинские check-up). Премиум — от ฿200 000.', en: 'Minimum — ฿55,000 (1-bed condo, home cooking, no car). Comfortable — ฿95,000–140,000 (villa, dining out, regular check-ups). Premium — from ฿200,000.' } },
    { q: { ru: 'Какие районы лучше для пенсионеров?', en: 'Which areas are best for retirees?' }, a: { ru: 'Раваи и Чалонг — спокойствие, рядом рынок и medical. Камала — баланс инфраструктуры и тишины. Бангтао — премиум, рядом BIH. Патонга избегаем — шум.', en: 'Rawai and Chalong — calm, near markets and medical. Kamala — balanced. Bang Tao — premium, near BIH. Avoid Patong — too noisy.' } },
    { q: { ru: 'Где познакомиться с другими русскоязычными пенсионерами?', en: 'Where to meet other Russian-speaking retirees?' }, a: { ru: 'Telegram-группа myUNO Seniors (800+ участников), бридж-клуб в Чалонге по средам, шахматный клуб в Раваи. Ежемесячные ужины в ресторанах.', en: 'myUNO Seniors Telegram group (800+ members), bridge club in Chalong on Wednesdays, chess club in Rawai. Monthly community dinners.' } },
    { q: { ru: 'Что делать в экстренной медицинской ситуации?', en: 'What to do in a medical emergency?' }, a: { ru: 'Скорая 1669, Bangkok Hospital Phuket — 24/7 emergency. SOS-чат myUNO дублирует — координатор связывается со страховой и встречает в приёмном покое.', en: 'Ambulance 1669, Bangkok Hospital Phuket — 24/7 emergency. The myUNO SOS chat backs you up: the coordinator contacts the insurer and meets you at admissions.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать retirement visa', en: 'Pick a retirement visa' },
    href: '/legal/retirement-visa',
    subtitle: { ru: 'Бесплатная 15-минутная консультация.', en: '15-minute free consultation.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть comfort condo', en: 'Browse comfort condos' },
    href: '/property?audience=senior',
  },
  seo: {
    metaTitle: { ru: 'Пенсия и зимовка на Пхукете: O-A visa, страховка — myUNO', en: 'Retirement on Phuket: O-A visa, insurance, housing — myUNO' },
    metaDescription: { ru: 'Retirement visa O-A, страховка 60+, comfort condo, тайская медицина и русскоязычное комьюнити. Устойчивая жизнь после 50.', en: 'Retirement O-A visa, 60+ insurance, comfort condo, Thai healthcare and Russian-speaking community. Sustainable life after 50.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/retirees',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/retirees?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/retirees?lang=en' },
    ],
  },
};
