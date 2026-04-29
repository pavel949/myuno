/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P7_FAMILIES: PersonaLanding = {
  personaCode: 'P7',
  slug: 'families',
  status: 'live',
  h1: {
    ru: 'Пхукет с детьми: школы, виллы, безопасность',
    en: 'Phuket with kids: schools, villas, safety',
  },
  subtitle: {
    ru: 'Международные школы, family-villas с бассейном и кухней, педиатры по-русски, экскурсии для детей — выстраиваем переезд или зимовку под ваш состав семьи.',
    en: 'International schools, family villas with pool and kitchen, Russian-speaking paediatricians and kid-friendly tours — we plan your move or winter stay around your family.',
  },
  pains: [
    { ru: 'Не понимаете, какая школа подходит ребёнку: British, IB, Russian curriculum.', en: 'Unclear which school fits your child: British, IB, Russian curriculum.' },
    { ru: 'Нужна вилла с огороженной территорией, кухней и стиральной машиной.', en: 'You need a villa with enclosed grounds, kitchen and washing machine.' },
    { ru: 'Боитесь ехать без понимания, как устроена медицина для детей.', en: 'You worry about coming over without understanding how kids healthcare works.' },
    { ru: 'Хотите занятия для детей: спорт, английский, плавание, лагерь на каникулах.', en: 'You want activities for kids: sports, English, swimming, holiday camps.' },
  ],
  services: [
    { slug: 'school-finder', label: { ru: 'Поиск школы', en: 'School Finder' }, oneLiner: { ru: '15 школ, фильтр по программе, бюджету и району.', en: '15 schools filtered by curriculum, budget and area.' }, href: '/school-finder' },
    { slug: 'family-villas', label: { ru: 'Family-friendly виллы', en: 'Family-friendly villas' }, oneLiner: { ru: 'Бассейн с забором, кухня, детская мебель.', en: 'Fenced pool, kitchen, child-safe furniture.' }, href: '/property?audience=family' },
    { slug: 'kids-activities', label: { ru: 'Занятия для детей', en: 'Kids activities' }, oneLiner: { ru: 'Спорт, плавание, art, robotics, лагеря на каникулах.', en: 'Sports, swimming, art, robotics, holiday camps.' }, href: '/kids' },
    { slug: 'paediatrics', label: { ru: 'Детская медицина', en: 'Paediatric care' }, oneLiner: { ru: 'Bangkok Hospital, BIH, частные педиатры по-русски.', en: 'Bangkok Hospital, BIH, Russian-speaking paediatricians.' }, href: '/services/health/paediatrics' },
    { slug: 'visa-family', label: { ru: 'Виза для семьи', en: 'Family visa' }, oneLiner: { ru: 'Education visa, dependent visa, DTV — что подходит.', en: 'Education, dependent or DTV visa — pick the right one.' }, href: '/visa/quiz' },
    { slug: 'family-tours', label: { ru: 'Семейные экскурсии', en: 'Family tours' }, oneLiner: { ru: 'Без укачивания, с детским меню и санузлами.', en: 'No motion sickness, kids menu, toilets.' }, href: '/tours?audience=family' },
  ],
  faq: [
    { q: { ru: 'Какая международная школа лучше всего для русскоязычного ребёнка?', en: 'Which international school works best for a Russian-speaking child?' }, a: { ru: 'Зависит от возраста и плана возврата. UWC (IB), British International School (British) — топ. Headstart — баланс цена/качество. HeadStart Russian — программа РФ + английский. Запустите School Finder с возрастом и бюджетом.', en: 'Depends on age and return plan. UWC (IB), British International School (British) — top tier. Headstart — best price/quality. HeadStart Russian — Russian curriculum + English. Run School Finder with age and budget.' } },
    { q: { ru: 'Сколько стоит школа в год?', en: 'What does school cost per year?' }, a: { ru: 'Бюджет — ฿200 000–350 000 (HeadStart, BCIS). Средний — ฿450 000–650 000 (Berda Claude, KIS). Топ — ฿800 000–1 200 000 (UWC, BISP). Плюс application fee, форма, автобус.', en: 'Budget — ฿200,000–350,000 (HeadStart, BCIS). Mid — ฿450,000–650,000 (Berda Claude, KIS). Top — ฿800,000–1,200,000 (UWC, BISP). Plus application, uniform, bus.' } },
    { q: { ru: 'Какой район выбрать для семьи?', en: 'Which area is best for families?' }, a: { ru: 'Бангтао и Лагуна — рядом с UWC и BISP, премиум. Камала — баланс цены/инфраструктуры. Чалонг — рядом с BCIS, бюджетнее. Раваи — для младших школьников и дошкольников.', en: 'Bang Tao and Laguna — close to UWC and BISP, premium. Kamala — balance of price and infrastructure. Chalong — near BCIS, more affordable. Rawai — for primary and pre-school.' } },
    { q: { ru: 'Где наблюдать ребёнка по медицине?', en: 'Where to handle paediatric care?' }, a: { ru: 'Bangkok Hospital Phuket и BIH — детские отделения с врачами, говорящими по-русски через переводчика. Частные педиатры — приём от ฿1 500. Прививки и анализы — там же.', en: 'Bangkok Hospital Phuket and BIH — paediatric wards with Russian translation. Private paediatricians from ฿1,500/visit. Vaccines and labs at the same hospitals.' } },
    { q: { ru: 'Какая виза для ребёнка-школьника?', en: 'Which visa for a school-age child?' }, a: { ru: 'Education visa (ED) — 1 год с продлением, оформляет школа. Родитель — Guardian visa параллельно. Альтернатива — DTV родителя + dependent visa ребёнку. Подбор — в Visa Quiz.', en: 'Education visa (ED) — 1 year renewable, issued by the school. Parent — guardian visa in parallel. Alternative — parent DTV + dependent for the child. Use Visa Quiz to choose.' } },
    { q: { ru: 'Безопасно ли отпускать детей одних?', en: 'Is it safe to let kids out alone?' }, a: { ru: 'Школьники с 12 лет — да, в гейтед-комьюнити (Лагуна, BCIS area). Младшие — только со взрослым или организованным транспортом школы. Уличное движение — главный риск.', en: 'School-age 12+ — yes, in gated communities (Laguna, BCIS area). Younger kids — only with an adult or organised school transport. Traffic is the main risk.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать школу', en: 'Find a school' },
    href: '/school-finder',
    subtitle: { ru: 'Бесплатно, результат за 5 минут.', en: 'Free, results in 5 minutes.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть family-виллы', en: 'Browse family villas' },
    href: '/property?audience=family',
  },
  seo: {
    metaTitle: { ru: 'Пхукет с детьми: школы, виллы, медицина — myUNO', en: 'Phuket with kids: schools, villas, healthcare — myUNO' },
    metaDescription: { ru: 'Международные школы, family-friendly виллы, педиатры по-русски, экскурсии и виза для семьи на Пхукете.', en: 'International schools, family villas, Russian-speaking paediatricians, kid-friendly tours and family visas on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/families',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/families?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/families?lang=en' },
    ],
  },
};
