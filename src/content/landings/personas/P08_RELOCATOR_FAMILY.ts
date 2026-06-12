/**
 * Sprint C (orphan coverage): canonical P08_relocator_family.
 * Closes the biggest gap in Relocator segment per Master Taxonomy v1.0.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P08_RELOCATOR_FAMILY: PersonaLanding = {
  personaCode: 'P7',
  slug: 'relocator-family',
  status: 'live',
  h1: {
    ru: 'Переезд семьёй на Пхукет: школа, виза, дом за 90 дней',
    en: 'Family relocation to Phuket: school, visa, home in 90 days',
  },
  subtitle: {
    ru: 'Семьи переезжают на 1–3 года: подбираем школу, оформляем Education+Guardian визы, находим долгосрочную виллу и помогаем с медицинской страховкой и банковским счётом.',
    en: 'Families relocating for 1–3 years: we pick the school, file Education+Guardian visas, secure a long-term villa, and set up insurance and a Thai bank account.',
  },
  pains: [
    { ru: 'Не знаете, с чего начать: школа, виза или жильё — что первым.', en: "You don't know whether to start with school, visa or housing." },
    { ru: 'Боитесь приехать и не успеть оформить ED-визу до начала учебного года.', en: 'You fear arriving and missing the ED-visa window before the school year.' },
    { ru: 'Не понимаете, как открыть тайский счёт без work permit.', en: 'You cannot figure out how to open a Thai bank account without a work permit.' },
    { ru: 'Нужна страховка для всей семьи и план действий при ЧП.', en: 'You need family insurance and a clear plan for emergencies.' },
    { ru: 'Хотите подписать аренду на год без риска потерять депозит.', en: 'You want a 12-month rental contract without losing the deposit.' },
  ],
  services: [
    { slug: 'school-finder', label: { ru: 'Подбор школы', en: 'School Finder' }, oneLiner: { ru: '15 школ, фильтр по программе и бюджету.', en: '15 schools filtered by curriculum and budget.' }, href: '/school-finder' },
    { slug: 'ed-visa', label: { ru: 'Education + Guardian visa', en: 'Education + Guardian visa' }, oneLiner: { ru: 'ED для ребёнка, Guardian для родителя.', en: 'ED for the child, Guardian for the parent.' }, href: '/visa/quiz' },
    { slug: 'long-term-rental', label: { ru: 'Долгосрочная аренда', en: 'Long-term rental' }, oneLiner: { ru: 'Виллы 6–12 мес, защита депозита.', en: '6–12 month villas with deposit protection.' }, href: '/property?intent=rent-long' },
    { slug: 'family-insurance', label: { ru: 'Семейная страховка', en: 'Family insurance' }, oneLiner: { ru: 'Pacific Cross, Cigna, April — подбор.', en: 'Pacific Cross, Cigna, April — broker pick.' }, href: '/legal/insurance' },
    { slug: 'bank-account', label: { ru: 'Тайский банковский счёт', en: 'Thai bank account' }, oneLiner: { ru: 'Kasikorn, Bangkok Bank — открытие за визит.', en: 'Kasikorn, Bangkok Bank — opened in one visit.' }, href: '/banking' },
    { slug: 'cost-of-living', label: { ru: 'Калькулятор расходов', en: 'Cost of Living' }, oneLiner: { ru: 'Бюджет семьи 2+2 от ฿120k/мес.', en: 'Family of 4 budget from ฿120k/month.' }, href: '/cost-of-living' },
  ],
  faq: [
    { q: { ru: 'С чего начать переезд?', en: 'Where do we start?' }, a: { ru: 'Сначала школа — она определяет район и даёт основу для ED-визы. Затем долгосрочная аренда в радиусе 15 минут. Визы оформляются параллельно после оффера школы.', en: 'Start with the school — it determines the district and supports the ED visa. Then long-term rental within 15 minutes. Visas run in parallel once the school offer is in.' } },
    { q: { ru: 'Сколько времени занимает весь переезд?', en: 'How long does the full move take?' }, a: { ru: '60–90 дней при готовых документах. Школа — 2–4 недели на приём, ED-visa — 4–6 недель, аренда — 1–2 недели, банк — 1 день.', en: '60–90 days with documents ready. School admission 2–4 weeks, ED visa 4–6 weeks, rental 1–2 weeks, bank 1 day.' } },
    { q: { ru: 'Какой бюджет нужен семье из 4 человек?', en: 'What budget do we need for a family of 4?' }, a: { ru: 'Минимум ฿120 000/мес: аренда ฿55–75k, школа ฿20–30k (один ребёнок), еда и транспорт ฿30k, страховка ฿10k. Подробный расчёт — в Cost of Living.', en: 'Minimum ฿120,000/month: rent ฿55–75k, school ฿20–30k (one child), food and transport ฿30k, insurance ฿10k. See Cost of Living for full breakdown.' } },
    { q: { ru: 'Можно ли работать удалённо по ED-визе?', en: 'Can the parent work remotely on a Guardian visa?' }, a: { ru: 'Формально — нет. Альтернатива: DTV (Destination Thailand Visa) для родителя с дистанционной работой + dependent visa для ребёнка. Подберём вариант под вашу ситуацию.', en: 'Formally no. Alternative: DTV (Destination Thailand Visa) for the parent + dependent for the child. We pick the right combo for your case.' } },
    { q: { ru: 'А если ребёнку не подойдёт школа?', en: 'What if the school does not work out?' }, a: { ru: 'Переход в другую школу — 2–4 недели. ED-visa аннулируется и переоформляется новой школой. Депозит за обучение чаще всего возвращается за вычетом 1 семестра.', en: 'Switching schools takes 2–4 weeks. The ED visa is cancelled and reissued by the new school. Tuition deposit is usually refunded minus one term.' } },
  ],
  primaryCta: {
    label: { ru: 'Составить план переезда', en: 'Plan our relocation' },
    href: '/visa/quiz?intent=family-relocation',
    subtitle: { ru: 'Бесплатно, 7 минут.', en: 'Free, 7 minutes.' },
  },
  secondaryCta: {
    label: { ru: 'Подобрать школу', en: 'Find a school' },
    href: '/school-finder',
  },
  seo: {
    metaTitle: { ru: 'Переезд на Пхукет семьёй: школа, виза, дом — myUNO', en: 'Family relocation to Phuket: school, visa, home — myUNO' },
    metaDescription: { ru: 'Семейный переезд на Пхукет под ключ: подбор школы, ED+Guardian виза, долгосрочная аренда, страховка и банковский счёт. Бесплатный план.', en: 'Turnkey family relocation to Phuket: school choice, ED+Guardian visa, long-term rental, insurance, bank account. Free plan.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/relocator-family',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/relocator-family?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/relocator-family?lang=en' },
    ],
  },
};
