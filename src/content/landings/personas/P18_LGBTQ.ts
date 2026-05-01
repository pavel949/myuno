/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Wave 3 expansion (2026-05): brought to production-grade parity with P14/P15.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P18_LGBTQ: PersonaLanding = {
  personaCode: 'P18',
  slug: 'lgbtq',
  status: 'live',
  h1: {
    ru: 'Пхукет для ЛГБТК+ путешественников и резидентов',
    en: 'Phuket for LGBTQ+ travellers and residents',
  },
  subtitle: {
    ru: 'Friendly-виллы и кондо, легальный брак в Таиланде с 2024, открытое сообщество, PrEP/HRT клиники и долгосрочная аренда без неловких вопросов.',
    en: 'Friendly villas and condos, legal marriage in Thailand since 2024, open community, PrEP/HRT clinics and long-stay rental without awkward questions.',
  },
  pains: [
    { ru: 'Хочется быть уверенным, что вилла или отель примет однополую пару без вопросов.', en: 'You want to be sure a villa or hotel welcomes same-sex couples without questions.' },
    { ru: 'Ищете комьюнити, события и friendly-районы для долгого пребывания.', en: 'You look for community, events and friendly neighbourhoods for the long term.' },
    { ru: 'Нужны клиники с конфиденциальной PrEP / HRT поддержкой и рецептами на английском.', en: 'You need clinics with confidential PrEP / HRT support and English prescriptions.' },
    { ru: 'Хочется long-stay аренды или покупки без discrimination clauses.', en: 'You want long-stay rental or purchase with no discrimination clauses.' },
  ],
  services: [
    { slug: 'friendly-stays', label: { ru: 'LGBTQ+ friendly жильё', en: 'LGBTQ+ friendly stays' }, oneLiner: { ru: '120+ проверенных вилл и кондо, отзывы сообщества.', en: '120+ vetted villas and condos with community reviews.' }, href: '/property/rent' },
    { slug: 'community', label: { ru: 'Сообщество и события', en: 'Community & events' }, oneLiner: { ru: 'Patong / Bangla, Pride-неделя апрель, weekly бранчи.', en: 'Patong / Bangla, Pride week in April, weekly brunches.' }, href: '/cluster/lifestyle' },
    { slug: 'health', label: { ru: 'PrEP / HRT клиники', en: 'PrEP / HRT clinics' }, oneLiner: { ru: 'Pulse Clinic, BIH — конфиденциально, рецепты на EN.', en: 'Pulse Clinic, BIH — confidential, English prescriptions.' }, href: '/cluster/health' },
    { slug: 'wedding', label: { ru: 'Однополая свадьба', en: 'Same-sex wedding' }, oneLiner: { ru: 'С января 2025 — легально. Регистрация в амфуре, апостиль.', en: 'Legal since January 2025. Amphur registration, apostille.' }, href: '/wedding' },
    { slug: 'long-stay', label: { ru: 'Long-stay аренда', en: 'Long-stay rental' }, oneLiner: { ru: 'Контракт на пару, joint tenancy, без discrimination clauses.', en: 'Couple-friendly contract, joint tenancy, no discrimination clauses.' }, href: '/property/rent' },
    { slug: 'family-planning', label: { ru: 'IVF и family planning', en: 'IVF & family planning' }, oneLiner: { ru: 'Surrogacy ограничена; IVF/egg freezing в Bangkok IVF Center.', en: 'Surrogacy restricted; IVF / egg freezing at Bangkok IVF Center.' }, href: '/services/health/clinics' },
  ],
  faq: [
    { q: { ru: 'Безопасно ли в Таиланде для пар?', en: 'Is Thailand safe for couples?' }, a: { ru: 'Да. С 22 января 2025 года в Таиланде легализован однополый брак (Marriage Equality Act). Пхукет — один из самых открытых регионов SEA, public displays of affection воспринимаются нейтрально.', en: 'Yes. Same-sex marriage is legal in Thailand since 22 January 2025 (Marriage Equality Act). Phuket is among the most open regions in SEA; public displays of affection are received neutrally.' } },
    { q: { ru: 'Как зарегистрировать однополый брак?', en: 'How to register a same-sex marriage?' }, a: { ru: 'В местном амфуре с паспортами и Affirmation of Freedom to Marry из консульства. Срок 5–10 рабочих дней. Свидетельство на тайском, для признания дома — апостиль и нотариальный перевод. Стоимость через myUNO — ฿35 000.', en: 'At the local amphur with passports and an Affirmation of Freedom to Marry from your consulate. Timeline 5–10 business days. Certificate in Thai; for home-country recognition — apostille + notarised translation. Via myUNO — ฿35,000.' } },
    { q: { ru: 'Где находится community?', en: 'Where is the community?' }, a: { ru: 'Patong (Paradise complex, Boat Avenue), Kata, Rawai. Регулярные meetups, drag-шоу в Boat Bar, weekly tea-dance в Connect. Pride Phuket — последняя неделя апреля.', en: 'Patong (Paradise complex, Boat Avenue), Kata, Rawai. Regular meetups, drag shows at Boat Bar, weekly tea dance at Connect. Pride Phuket — last week of April.' } },
    { q: { ru: 'Наследование на пару — как защититься?', en: 'Inheritance for a couple — how to protect ourselves?' }, a: { ru: 'После легализации брака — автоматическое наследование как у любой пары. До регистрации брака рекомендуем тайское завещание (will) с обоюдным указанием наследника. Стоимость составления — ฿15 000–25 000.', en: 'After legal marriage — automatic spousal inheritance like any couple. Before registration we recommend a Thai will naming each other as beneficiary. Drafting fee — ฿15,000–25,000.' } },
    { q: { ru: 'PrEP/HRT доступны без рецепта из дома?', en: 'Are PrEP/HRT available without home prescription?' }, a: { ru: 'PrEP — да, через Pulse Clinic (Patong, Phuket Town): консультация ฿1 500, месячный курс ฿900–1 500. HRT (estradiol, T-blocker) — через эндокринолога BIH/Bangkok Hospital, рецепт на 3 мес, ~฿2 500–6 000/мес.', en: 'PrEP — yes, via Pulse Clinic (Patong, Phuket Town): consult ฿1,500, monthly course ฿900–1,500. HRT (estradiol, T-blocker) — via BIH/Bangkok Hospital endocrinologist, 3-month script, ~฿2,500–6,000/mo.' } },
    { q: { ru: 'Какие застройщики и MC реально friendly?', en: 'Which developers and MCs are truly friendly?' }, a: { ru: 'В платформе помечаем «verified inclusive» — застройщик подписал кодекс non-discrimination и MC прошёл обучение. На 2026 — 18 проектов и 9 MC. Список даём по запросу при подборе.', en: 'We tag “verified inclusive” developers and MCs — those who signed a non-discrimination code and trained their MC team. As of 2026 — 18 projects and 9 MCs. We share the list on request during shortlist.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё', en: 'Find a stay' }, href: '/property/rent', subtitle: { ru: 'Verified inclusive — отмечены отдельно.', en: 'Verified inclusive options highlighted.' } },
  secondaryCta: { label: { ru: 'Открыть сообщество', en: 'Browse community' }, href: '/cluster/lifestyle' },
  seo: {
    metaTitle: { ru: 'LGBTQ+ Пхукет: friendly жильё, брак, клиники — myUNO', en: 'LGBTQ+ Phuket: friendly stays, marriage, clinics — myUNO' },
    metaDescription: { ru: 'LGBTQ+ friendly виллы и кондо, легальный однополый брак, PrEP/HRT клиники и long-stay аренда на Пхукете без неловких вопросов.', en: 'LGBTQ+ friendly villas and condos, legal same-sex marriage, PrEP/HRT clinics and long-stay rental on Phuket — no awkward questions.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/lgbtq',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/lgbtq?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/lgbtq?lang=en' },
    ],
  },
};
