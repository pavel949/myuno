/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P18_LGBTQ: PersonaLanding = {
  personaCode: 'P18',
  slug: 'lgbtq',
  status: 'live',
  h1: { ru: 'Пхукет для ЛГБТК+ путешественников и резидентов', en: 'Phuket for LGBTQ+ travellers and residents' },
  subtitle: { ru: 'Friendly-виллы и кондо, открытые сообщества, вечеринки и медицинский сервис без вопросов.', en: 'Friendly villas and condos, open community, nightlife and judgement-free healthcare.' },
  pains: [
    { ru: 'Хочется быть уверенным, что вилла или отель примет пару.', en: 'You want to be sure a villa or hotel welcomes couples.' },
    { ru: 'Ищете комьюнити, события и friendly-районы.', en: 'You look for community, events and friendly neighbourhoods.' },
    { ru: 'Нужны клиники с конфиденциальной PrEP/HRT поддержкой.', en: 'You need clinics with confidential PrEP/HRT support.' },
    { ru: 'Хочется долгосрочной аренды или покупки без неловких вопросов.', en: 'You want long-stay rental or purchase without awkward questions.' },
  ],
  services: [
    { slug: 'friendly-stays', label: { ru: 'LGBTQ+ friendly жильё', en: 'LGBTQ+ friendly stays' }, oneLiner: { ru: 'Проверенные виллы и кондо, отзывы сообщества.', en: 'Vetted villas and condos with community reviews.' }, href: '/property/rent' },
    { slug: 'community', label: { ru: 'Сообщество и события', en: 'Community & events' }, oneLiner: { ru: 'Patong / Bangla, Pride-неделя, бранчи.', en: 'Patong / Bangla, Pride week, brunches.' }, href: '/cluster/lifestyle' },
    { slug: 'health', label: { ru: 'PrEP / HRT клиники', en: 'PrEP / HRT clinics' }, oneLiner: { ru: 'Конфиденциальный приём, рецепты на английском.', en: 'Confidential intake, English prescriptions.' }, href: '/cluster/health' },
    { slug: 'long-stay', label: { ru: 'Long-stay аренда', en: 'Long-stay rental' }, oneLiner: { ru: 'Контракт на пару, без discrimination clauses.', en: 'Couple-friendly contract, no discrimination clauses.' }, href: '/property/rent' },
  ],
  faq: [
    { q: { ru: 'Безопасно ли в Таиланде для пар?', en: 'Is Thailand safe for couples?' }, a: { ru: 'Да. С 2024 года в Таиланде легализованы однополые браки. Пхукет — один из самых открытых регионов.', en: 'Yes. Thailand legalised same-sex marriage in 2024. Phuket is among the most open regions.' } },
    { q: { ru: 'Где находится community?', en: 'Where is the community?' }, a: { ru: 'Patong (Paradise complex), Kata, Rawai. Регулярные события и meetups.', en: 'Patong (Paradise complex), Kata, Rawai. Regular events and meetups.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё', en: 'Find a stay' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Открыть сообщество', en: 'Browse community' }, href: '/cluster/lifestyle' },
  seo: {
    metaTitle: { ru: 'LGBTQ+ Пхукет: friendly жильё, сообщество, клиники — myUNO', en: 'LGBTQ+ Phuket: friendly stays, community, clinics — myUNO' },
    metaDescription: { ru: 'LGBTQ+ friendly виллы и кондо, события, PrEP/HRT клиники и long-stay аренда на Пхукете без неловких вопросов.', en: 'LGBTQ+ friendly villas and condos, events, PrEP/HRT clinics and long-stay rental on Phuket — no awkward questions.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/lgbtq',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/lgbtq?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/lgbtq?lang=en' },
    ],
  },
};
