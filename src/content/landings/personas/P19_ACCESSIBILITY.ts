/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P19_ACCESSIBILITY: PersonaLanding = {
  personaCode: 'P19',
  slug: 'accessibility',
  status: 'live',
  h1: { ru: 'Пхукет для путешественников с ограниченными возможностями', en: 'Phuket for accessibility-first travellers' },
  subtitle: { ru: 'Виллы без ступеней, трансфер с пандусом, медицинская поддержка и сиделки — путешествие без преград.', en: 'Step-free villas, ramp-equipped transfer, medical support and carers — travel without barriers.' },
  pains: [
    { ru: 'Сложно найти виллу или кондо с настоящим step-free доступом.', en: 'Hard to find a truly step-free villa or condo.' },
    { ru: 'Нужен трансфер, в который влезает коляска.', en: 'You need a transfer that fits a wheelchair.' },
    { ru: 'Не понятно, какие пляжи реально доступны.', en: 'It’s unclear which beaches are actually accessible.' },
    { ru: 'Хочется заранее знать, есть ли врач/сиделка по вызову.', en: 'You want to know in advance if a doctor / carer is on call.' },
  ],
  services: [
    { slug: 'accessible-stays', label: { ru: 'Step-free жильё', en: 'Step-free stays' }, oneLiner: { ru: 'Прокат коляски, поручни, roll-in shower.', en: 'Wheelchair rental, grab rails, roll-in shower.' }, href: '/property/rent' },
    { slug: 'wheelchair-transfer', label: { ru: 'Трансфер с пандусом', en: 'Wheelchair transfer' }, oneLiner: { ru: 'Toyota Hiace с лифтом, водитель обучен.', en: 'Toyota Hiace with lift, trained driver.' }, href: '/landing/airport-transfer' },
    { slug: 'beach-guide', label: { ru: 'Доступные пляжи', en: 'Accessible beaches' }, oneLiner: { ru: 'Surin, Bang Tao — beach mat и тень.', en: 'Surin, Bang Tao — beach mat and shade.' }, href: '/map' },
    { slug: 'medical', label: { ru: 'Врач и сиделка', en: 'Doctor & carer' }, oneLiner: { ru: 'Bangkok Hospital, лицензированные сиделки.', en: 'Bangkok Hospital, licensed carers.' }, href: '/cluster/health' },
  ],
  faq: [
    { q: { ru: 'Какой район самый удобный?', en: 'Which area is most convenient?' }, a: { ru: 'Bang Tao, Laguna, Cherngtalay — ровные тротуары и новая застройка с лифтами.', en: 'Bang Tao, Laguna, Cherngtalay — flat sidewalks and modern buildings with lifts.' } },
    { q: { ru: 'Можно арендовать электроколяску?', en: 'Can I rent a power wheelchair?' }, a: { ru: 'Да — доставка к вилле, инструктаж, поддержка 24/7.', en: 'Yes — delivery to the villa, briefing, 24/7 support.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё', en: 'Find a stay' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Заказать трансфер', en: 'Book a transfer' }, href: '/landing/airport-transfer' },
  seo: {
    metaTitle: { ru: 'Доступный Пхукет: жильё, трансфер, врачи — myUNO', en: 'Accessible Phuket: stays, transfer, doctors — myUNO' },
    metaDescription: { ru: 'Step-free виллы, трансфер с пандусом, прокат колясок и медицинская поддержка для путешественников с ограниченными возможностями.', en: 'Step-free villas, ramp transfer, wheelchair rental and medical support for accessibility-first travellers on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/accessibility',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/accessibility?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/accessibility?lang=en' },
    ],
  },
};
