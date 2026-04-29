/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P10_OPERATORS: PersonaLanding = {
  personaCode: 'P10',
  slug: 'operators',
  status: 'live',
  h1: {
    ru: 'Расширьте портфель: от первого объекта ко второму',
    en: 'Expand your portfolio: from one property to the next',
  },
  subtitle: {
    ru: 'У вас уже есть один работающий объект. Покажем, как добавить второй с диверсификацией района и типа — на ваших данных yield/occupancy.',
    en: 'You already run one property successfully. We’ll show how to add a second with district and type diversification — based on your real yield/occupancy data.',
  },
  pains: [
    { ru: 'Один объект сильно зависит от сезона и ремонта — нужна диверсификация.', en: 'A single property is highly seasonal and repair-dependent — you need diversification.' },
    { ru: 'Нет данных по другим районам и типам, чтобы выбрать второй объект осознанно.', en: 'You lack data on other districts and types to pick the second property wisely.' },
    { ru: 'Управление двумя объектами вручную — нагрузка кратно растёт.', en: 'Self-managing two properties scales operational load non-linearly.' },
    { ru: 'Не знаете, как структурировать ownership чтобы оба объекта были в одной налоговой картине.', en: 'You don’t know how to structure ownership so both properties sit in one tax picture.' },
  ],
  services: [
    { slug: 'portfolio-expansion', label: { ru: '«Готов к #2?» analysis', en: '“Ready for #2?” analysis' }, oneLiner: { ru: 'Анализ текущего объекта + рекомендации диверсификации.', en: 'Current-property review + diversification recommendation.' }, href: '/owner' },
    { slug: 'district-heatmap', label: { ru: 'District Heatmap (Pro)', en: 'District Heatmap (Pro)' }, oneLiner: { ru: 'Yield, occupancy, ADR по 8 районам — реальные PM-данные.', en: 'Yield, occupancy, ADR across 8 districts — real PM data.' }, href: '/property/insights' },
    { slug: 'urgent-deals', label: { ru: 'Urgent deals под ваши критерии', en: 'Urgent deals matching your criteria' }, oneLiner: { ru: 'Distressed-объекты со скидкой 15–25% к AVM.', en: 'Distressed properties with 15–25% discount to AVM.' }, href: '/property/urgent' },
    { slug: 'pm-platform', label: { ru: 'Управление портфелем', en: 'Portfolio management' }, oneLiner: { ru: 'Multi-property dashboard, единая отчётность, налоги.', en: 'Multi-property dashboard, unified reporting, taxes.' }, href: '/owner' },
  ],
  faq: [
    { q: { ru: 'Когда стоит покупать второй объект?', en: 'When should you buy the second property?' }, a: { ru: 'Если первый объект 12+ мес показывает stable occupancy >65% и net yield >5%, имеет смысл диверсифицироваться. Покажем расчёт на ваших данных.', en: 'If your first property shows 12+ mo of stable occupancy >65% and net yield >5%, diversifying makes sense. We’ll model it on your data.' } },
    { q: { ru: 'В какой район диверсифицироваться?', en: 'Which district to diversify into?' }, a: { ru: 'Если первый — Раваи (long-stay), второй — Бангтао/Сурин (premium STR). Если первый — кондо, рассмотрите pool villa. Heatmap покажет.', en: 'If your first is Rawai (long-stay), the second could be Bangtao/Surin (premium STR). If your first is a condo, consider a pool villa. Heatmap will show.' } },
    { q: { ru: 'Что с urgent deals — насколько они «настоящие»?', en: 'How real are urgent deals?' }, a: { ru: 'Каждый urgent объект проходит admin-валидацию: AVM-discount подтверждён, причина продажи verified, title clean. Скам-объекты не публикуются.', en: 'Every urgent property is admin-validated: AVM discount verified, sale reason confirmed, title clean. Scam listings are not published.' } },
    { q: { ru: 'Как оформить второй объект на ту же структуру?', en: 'How to put the second property under the same structure?' }, a: { ru: 'Зависит от первой структуры (personal / Thai company / BVI). Юрист пройдёт по обоим объектам единым проектом — экономия 30–40% vs два отдельных.', en: 'Depends on your first structure (personal / Thai company / BVI). The lawyer covers both properties as one project — 30–40% saving vs two separate.' } },
  ],
  primaryCta: {
    label: { ru: 'Открыть owner-кабинет', en: 'Open the owner dashboard' },
    href: '/owner',
    subtitle: { ru: '«Ready for #2?» виджет — на главной кабинета.', en: '“Ready for #2?” widget on dashboard.' },
  },
  secondaryCta: {
    label: { ru: 'Посмотреть urgent deals', en: 'Browse urgent deals' },
    href: '/property/urgent',
  },
  seo: {
    metaTitle: { ru: 'Расширение портфеля недвижимости на Пхукете — myUNO', en: 'Phuket property portfolio expansion — myUNO' },
    metaDescription: { ru: 'Аналитика для STR/PM операторов: когда покупать второй объект, в какой район диверсифицироваться, urgent deals под ваши критерии.', en: 'Analytics for STR/PM operators: when to add the second property, which district to diversify into, urgent deals matching your criteria.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/operators',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/operators?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/operators?lang=en' },
    ],
  },
};
