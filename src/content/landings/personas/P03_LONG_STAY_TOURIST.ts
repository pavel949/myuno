/**
 * Sprint C (orphan coverage): canonical P03_long_stay_tourist.
 * Visitors staying 1–6 months (longer than P01/P02, shorter than relocator).
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P03_LONG_STAY_TOURIST: PersonaLanding = {
  personaCode: 'P3',
  slug: 'long-stay',
  status: 'live',
  h1: {
    ru: 'Длинная зима на Пхукете: от 1 до 6 месяцев без хлопот',
    en: 'A long winter in Phuket: 1–6 months without hassle',
  },
  subtitle: {
    ru: 'Едете на 1–6 месяцев и не хотите оформлять полноценную релокацию: помогаем с визой (DTV или TR-90), арендой на месяцы, SIM-картой, страховкой и обустройством за неделю.',
    en: 'Staying 1–6 months and not ready for full relocation: we help with visa (DTV or TR-90), monthly rental, SIM, insurance and setup within a week.',
  },
  pains: [
    { ru: 'Туристического штампа 60 дней не хватит, а оформлять Non-O сложно.', en: 'The 60-day tourist stamp is too short, but Non-O is too heavy.' },
    { ru: 'Аренда на 1–3 месяца дороже на 40–60% — нужны проверенные варианты.', en: 'Rental for 1–3 months runs 40–60% pricier — you need vetted options.' },
    { ru: 'Хотите тайскую SIM с пакетом 30+ дней без переплат в роуминге.', en: 'You want a Thai SIM with a 30+ day plan, not roaming.' },
    { ru: 'Нужна туристическая страховка на месяцы, не на дни.', en: 'You need travel insurance for months, not days.' },
    { ru: 'Не понимаете, где жить, чтобы не зависеть от арендованного байка.', en: "You can't decide where to live to avoid depending on a rented scooter." },
  ],
  services: [
    { slug: 'visa-quiz', label: { ru: 'Виза на длительное пребывание', en: 'Long-stay visa' }, oneLiner: { ru: 'DTV (5 лет) или TR-90 (60+30 дней).', en: 'DTV (5 years) or TR-90 (60+30 days).' }, href: '/visa/quiz' },
    { slug: 'monthly-rental', label: { ru: 'Аренда по месяцам', en: 'Monthly rental' }, oneLiner: { ru: 'Кондо и виллы 30/60/90 дней с защитой депозита.', en: 'Condos and villas 30/60/90 days, deposit-protected.' }, href: '/property?intent=rent-month' },
    { slug: 'sim-start', label: { ru: 'Тайская SIM', en: 'Thai SIM' }, oneLiner: { ru: 'AIS / TrueMove от ฿299, 30 дней.', en: 'AIS / TrueMove from ฿299, 30 days.' }, href: '/sim' },
    { slug: 'travel-insurance', label: { ru: 'Страховка на месяцы', en: 'Multi-month insurance' }, oneLiner: { ru: 'От ฿4 500/мес, с эвакуацией.', en: 'From ฿4,500/month, with evacuation.' }, href: '/legal/insurance' },
    { slug: 'exchange', label: { ru: 'Выгодный обмен', en: 'FX exchange' }, oneLiner: { ru: 'Курс лучше банковского, без скрытых комиссий.', en: 'Better than bank rate, no hidden fees.' }, href: '/exchange' },
    { slug: 'area-guide', label: { ru: 'Гид по районам', en: 'Area guide' }, oneLiner: { ru: 'Бангтао, Раваи, Чалонг — что подходит вам.', en: 'Bang Tao, Rawai, Chalong — what fits you.' }, href: '/areas' },
  ],
  faq: [
    { q: { ru: 'TR-90 или DTV — что выбрать на зиму?', en: 'TR-90 or DTV for a winter stay?' }, a: { ru: 'TR-90 — туристическая, 60 дней + 30 продление, цена ฿2 000. DTV — 5 лет, multiple entry, до 180 дней за визит, цена $400. Если планируете возвращаться — DTV выгоднее.', en: 'TR-90 — tourist, 60 days + 30 extension, ฿2,000. DTV — 5 years, multi-entry, up to 180 days per stay, $400. If you plan repeat visits — DTV pays off.' } },
    { q: { ru: 'Почему помесячная аренда дороже, чем длинная?', en: 'Why is monthly rental pricier than long-term?' }, a: { ru: 'Из-за turnover-расходов и упущенной выгоды собственника. Январь–март — пик, цены +30–50%. Май–сентябрь — низкий сезон, можно торговаться от прайса −20–30%.', en: 'Owner turnover costs and opportunity cost. Jan–Mar — peak, prices +30–50%. May–Sep — low season, negotiate 20–30% below ask.' } },
    { q: { ru: 'Какой район лучший для зимовки?', en: 'Best area for a winter stay?' }, a: { ru: 'Бангтао — пляж + ресторан-сцена + community. Раваи — спокойнее, лучше для family и семей с детьми. Чалонг — бюджетнее и ближе к центру острова. Камала — компромисс.', en: 'Bang Tao — beach + restaurant scene + community. Rawai — calmer, better for families. Chalong — cheaper and central. Kamala — compromise.' } },
    { q: { ru: 'Можно ли работать удалённо на TR-90?', en: 'Can I work remotely on TR-90?' }, a: { ru: 'Формально — серая зона. Удалённая работа на иностранную компанию для клиентов вне Таиланда обычно не преследуется, но юридический статус — DTV. Если работаете больше 2 мес — оформляйте DTV.', en: 'Formally a grey zone. Remote work for a foreign company serving non-Thai clients is usually unenforced, but the lawful status is DTV. Staying 2+ months — switch to DTV.' } },
    { q: { ru: 'Нужна ли страховка, если у меня есть полис из России/EU?', en: 'Do I need local insurance if I already have an RU/EU policy?' }, a: { ru: 'Проверьте, покрывает ли он Таиланд и есть ли direct billing с Bangkok Hospital. Если нет — местная страховка нужна, иначе платите кэшем и потом возмещаете. Эвакуация без полиса — $30k+.', en: 'Check coverage for Thailand and direct billing with Bangkok Hospital. If not — get a local policy or pay cash and reclaim. Evacuation without coverage — $30k+.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу за 5 минут', en: 'Pick a visa in 5 min' },
    href: '/visa/quiz?intent=long-stay',
    subtitle: { ru: 'Бесплатно, с ценой и сроком.', en: 'Free, with price and timeline.' },
  },
  secondaryCta: {
    label: { ru: 'Жильё на месяцы', en: 'Monthly rentals' },
    href: '/property?intent=rent-month',
  },
  seo: {
    metaTitle: { ru: 'Длинная зимовка на Пхукете: виза, жильё, SIM — myUNO', en: 'Long winter stay in Phuket: visa, housing, SIM — myUNO' },
    metaDescription: { ru: 'Зимовка 1–6 месяцев на Пхукете: DTV или TR-90, аренда по месяцам, тайская SIM, страховка и обмен валюты — без переплат.', en: '1–6 month winter stay in Phuket: DTV or TR-90, monthly rental, Thai SIM, insurance and FX — no overpaying.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/long-stay',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/long-stay?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/long-stay?lang=en' },
    ],
  },
};
