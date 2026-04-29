/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P26_CONSCIOUS_EATERS: PersonaLanding = {
  personaCode: 'P26',
  slug: 'conscious-eaters',
  status: 'live',
  h1: {
    ru: 'Растительный Пхукет: vegan, vegetarian и без глютена',
    en: 'Plant-based Phuket: vegan, vegetarian and gluten-free',
  },
  subtitle: {
    ru: '120+ растительных кафе, доставка vegan-меню, виллы с кухней для своей готовки и wellness-ретриты — без компромиссов в питании.',
    en: '120+ plant-based cafés, vegan delivery, villas with self-catering kitchens and wellness retreats — no compromises on what you eat.',
  },
  pains: [
    { ru: 'Большинство тайских меню содержат рыбный соус — даже «вегетарианские».', en: 'Most Thai menus contain fish sauce — even the “vegetarian” ones.' },
    { ru: 'Сложно найти gluten-free хлеб и pasta вне Rawai/Bang Tao.', en: 'Hard to find gluten-free bread and pasta outside Rawai/Bang Tao.' },
    { ru: 'Хочется виллу с настоящей кухней, а не одной плиткой.', en: 'You want a villa with a real kitchen, not a single hotplate.' },
    { ru: 'Нужны wellness-ретриты с plant-based меню и yoga.', en: 'You need wellness retreats with plant-based menus and yoga.' },
  ],
  services: [
    { slug: 'vegan-restaurants', label: { ru: 'Растительные рестораны', en: 'Plant-based restaurants' }, oneLiner: { ru: '120+ кафе с верифицированным vegan/vegetarian меню.', en: '120+ cafés with verified vegan/vegetarian menus.' }, href: '/restaurants' },
    { slug: 'vegan-delivery',    label: { ru: 'Доставка vegan-меню',  en: 'Vegan delivery' },         oneLiner: { ru: 'Plant-based блюда домой за 30–45 минут.', en: 'Plant-based meals delivered in 30–45 min.' }, href: '/delivery' },
    { slug: 'self-catering-villa', label: { ru: 'Вилла с кухней',      en: 'Self-catering villa' },    oneLiner: { ru: 'Полноценная кухня — готовьте по своим правилам.', en: 'Real kitchen — cook by your own rules.' }, href: '/property/rent' },
    { slug: 'wellness-retreats', label: { ru: 'Wellness-ретриты',     en: 'Wellness retreats' },      oneLiner: { ru: 'Yoga, detox, plant-based menu — 3–7 дней.', en: 'Yoga, detox, plant-based menu — 3–7 days.' }, href: '/experiences' },
  ],
  faq: [
    { q: { ru: 'Где больше всего vegan-инфраструктуры?', en: 'Where is most vegan infrastructure?' }, a: { ru: 'Rawai, Bang Tao и Chalong — самая высокая концентрация plant-based кафе и магазинов.', en: 'Rawai, Bang Tao and Chalong — highest concentration of plant-based cafés and stores.' } },
    { q: { ru: 'Как сказать «без рыбного соуса» по-тайски?', en: 'How do I say “no fish sauce” in Thai?' }, a: { ru: '«Mai sai nam plaa» (ไม่ใส่น้ำปลา) — без рыбного соуса. Также: «jay» = строгий вегетарианец.', en: '“Mai sai nam plaa” (ไม่ใส่น้ำปลา) — no fish sauce. Also: “jay” = strict vegetarian.' } },
    { q: { ru: 'Есть ли gluten-free пекарни?', en: 'Are there gluten-free bakeries?' }, a: { ru: 'Да — несколько в Rawai и Bang Tao с сертифицированным GF-хлебом и десертами.', en: 'Yes — several in Rawai and Bang Tao with certified GF bread and desserts.' } },
  ],
  primaryCta: { label: { ru: 'Открыть рестораны', en: 'Browse restaurants' }, href: '/restaurants' },
  secondaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  seo: {
    metaTitle: { ru: 'Vegan Пхукет: рестораны, доставка, виллы — myUNO', en: 'Vegan Phuket: restaurants, delivery, villas — myUNO' },
    metaDescription: { ru: 'Vegan, vegetarian и gluten-free Пхукет: 120+ растительных кафе, доставка plant-based меню, виллы с кухней и wellness-ретриты.', en: 'Vegan, vegetarian and gluten-free Phuket: 120+ plant-based cafés, vegan delivery, self-catering villas and wellness retreats.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/conscious-eaters',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/conscious-eaters?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/conscious-eaters?lang=en' },
    ],
  },
};
