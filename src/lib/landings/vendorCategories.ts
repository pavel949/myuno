/**
 * Vendor category landing configs — data-driven /for/vendor/:category landings.
 * Keep CTA target = `/vendor/join?category=<id>` so the existing CategoryPicker
 * inside VendorOnboarding can preselect.
 */

export type VendorCategoryId =
  | 'cleaning' | 'beauty' | 'fitness' | 'medical' | 'restaurants'
  | 'transport' | 'pets' | 'flowers' | 'education' | 'babysitter'
  | 'wellness' | 'yachts' | 'events';

export interface ValueProp {
  iconName: 'TrendingUp' | 'Users' | 'CreditCard' | 'ShieldCheck' | 'Zap' | 'Star';
  ru: { title: string; desc: string };
  en: { title: string; desc: string };
}

export interface VendorCategoryConfig {
  id: VendorCategoryId;
  emoji: string;
  hero: {
    ru: { eyebrow: string; title: string; subtitle: string };
    en: { eyebrow: string; title: string; subtitle: string };
  };
  commissionPct: number;
  audience: { ru: string; en: string };
  valueProps: ValueProp[];
  faq: Array<{ q_ru: string; a_ru: string; q_en: string; a_en: string }>;
}

const DEFAULT_VPS: ValueProp[] = [
  {
    iconName: 'Users',
    ru: { title: 'Поток клиентов', desc: 'Иностранцы на Пхукете уже ищут вас в myUNO — без затрат на рекламу.' },
    en: { title: 'Customer flow', desc: 'Foreigners on Phuket already search for you inside myUNO — no ad spend needed.' },
  },
  {
    iconName: 'CreditCard',
    ru: { title: 'Выплаты через Stripe', desc: 'Автоматические выплаты на банковский счёт раз в неделю. Никаких ручных переводов.' },
    en: { title: 'Stripe payouts', desc: 'Weekly automatic payouts to your bank account. No manual transfers.' },
  },
  {
    iconName: 'ShieldCheck',
    ru: { title: 'Доверие через ClearView™', desc: 'Верифицированный профиль с бейджем повышает конверсию в 2-3 раза.' },
    en: { title: 'ClearView™ trust badge', desc: 'A verified profile with the badge converts 2-3× better.' },
  },
  {
    iconName: 'Zap',
    ru: { title: 'Регистрация за 5 минут', desc: 'Без бюрократии. Загрузите 3 фото, опишите услугу — и вы в эфире.' },
    en: { title: '5-minute signup', desc: 'No paperwork. Upload 3 photos, describe a service — and you are live.' },
  },
];

const DEFAULT_FAQ = [
  {
    q_ru: 'Сколько стоит регистрация?',
    a_ru: 'Регистрация и базовое размещение — бесплатно. Платите только комиссию с фактических продаж.',
    q_en: 'How much does it cost to register?',
    a_en: 'Registration and basic listing are free. You only pay commission on actual sales.',
  },
  {
    q_ru: 'Когда я получу первую выплату?',
    a_ru: 'Выплаты идут каждую среду через Stripe. Первая — после прохождения KYC и первой завершённой брони.',
    q_en: 'When do I receive my first payout?',
    a_en: 'Payouts run every Wednesday via Stripe. The first one — after KYC verification and the first completed booking.',
  },
  {
    q_ru: 'Нужны ли тайские документы?',
    a_ru: 'Для приёма платежей через Stripe Connect — да, нужен тайский банковский счёт или ИП/компания. Поможем с оформлением через нашего юриста.',
    q_en: 'Do I need Thai paperwork?',
    a_en: 'To receive Stripe Connect payouts — yes, a Thai bank account or sole proprietor/company. Our legal team can help set it up.',
  },
];

export const VENDOR_CATEGORIES: Record<VendorCategoryId, VendorCategoryConfig> = {
  cleaning: {
    id: 'cleaning', emoji: '🧹', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'КЛИНИНГ · ПХУКЕТ', title: 'Клининговые компании — приглашаем в myUNO', subtitle: 'Регулярные клиенты из апартаментов и вилл управляющих компаний. Один заказ через приложение — без звонков и торга.' },
      en: { eyebrow: 'CLEANING · PHUKET', title: 'Cleaning companies — join myUNO', subtitle: 'Repeat clients from villas and condos managed by professional MCs. One-tap booking — no calls, no haggling.' },
    },
    audience: { ru: 'Клининговые компании, частные клинеры, прачечные', en: 'Cleaning companies, private cleaners, laundry services' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  beauty: {
    id: 'beauty', emoji: '💅', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'BEAUTY · ПХУКЕТ', title: 'Салоны красоты — добавьте 30% к загрузке', subtitle: 'Туристы и резиденты бронируют маникюр, массаж, парикмахера через myUNO. Прозрачные слоты — без No-show.' },
      en: { eyebrow: 'BEAUTY · PHUKET', title: 'Beauty salons — fill 30% more slots', subtitle: 'Tourists and residents book nails, massage and hair via myUNO. Transparent slots — zero no-shows.' },
    },
    audience: { ru: 'Салоны, мастера на дом, барбершопы, SPA', en: 'Salons, mobile stylists, barbershops, SPAs' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  fitness: {
    id: 'fitness', emoji: '💪', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'FITNESS · ПХУКЕТ', title: 'Фитнес-клубы и тренеры — клиенты на день и абонементы', subtitle: 'Иностранцы ищут day-pass и персональные тренировки. myUNO продаёт пакеты без комиссии Airbnb-style.' },
      en: { eyebrow: 'FITNESS · PHUKET', title: 'Gyms & coaches — day-passes and memberships', subtitle: 'Foreigners search for day passes and PT sessions. myUNO sells packages without Airbnb-style fees.' },
    },
    audience: { ru: 'Тренажёрные залы, муай-тай, йога, персональные тренеры', en: 'Gyms, Muay Thai, yoga studios, personal trainers' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  medical: {
    id: 'medical', emoji: '🏥', commissionPct: 8,
    hero: {
      ru: { eyebrow: 'MEDICAL · ПХУКЕТ', title: 'Клиники и доктора — медицинский туризм 2.0', subtitle: 'Русскоязычные пациенты ищут стоматологию, чек-апы, эстетику. Запись через приложение с переводом.' },
      en: { eyebrow: 'MEDICAL · PHUKET', title: 'Clinics & doctors — medical tourism 2.0', subtitle: 'Russian-speaking patients search for dentistry, check-ups and aesthetics. In-app booking with built-in translation.' },
    },
    audience: { ru: 'Клиники, стоматологи, врачи, эстетическая медицина', en: 'Clinics, dentists, doctors, aesthetic medicine' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  restaurants: {
    id: 'restaurants', emoji: '🍜', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'RESTAURANTS · ПХУКЕТ', title: 'Рестораны — резервы и доставка через myUNO', subtitle: 'Гости отелей и владельцы вилл бронируют стол, кейтеринг и доставку напрямую. Без агрегаторских 30%.' },
      en: { eyebrow: 'RESTAURANTS · PHUKET', title: 'Restaurants — reservations and delivery', subtitle: 'Hotel guests and villa owners book tables, catering and delivery directly. No 30% aggregator fees.' },
    },
    audience: { ru: 'Рестораны, кафе, бары, кейтеринг, частные шефы', en: 'Restaurants, cafes, bars, catering, private chefs' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  transport: {
    id: 'transport', emoji: '🚗', commissionPct: 12,
    hero: {
      ru: { eyebrow: 'TRANSPORT · ПХУКЕТ', title: 'Трансферы, аренда авто и байков', subtitle: 'Гости со всего острова бронируют airport pickup, аренду и водителей. Календарь — у вас в кармане.' },
      en: { eyebrow: 'TRANSPORT · PHUKET', title: 'Transfers, car & bike rentals', subtitle: 'Guests across the island book airport pickups, rentals and drivers. Calendar in your pocket.' },
    },
    audience: { ru: 'Прокат авто/байков, водители, операторы трансферов', en: 'Car/bike rentals, drivers, transfer operators' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  pets: {
    id: 'pets', emoji: '🐾', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'PETS · ПХУКЕТ', title: 'Ветклиники, груминг, передержка', subtitle: 'Экспаты везут питомцев на Пхукет. Найдут вас в myUNO раньше, чем загуглят.' },
      en: { eyebrow: 'PETS · PHUKET', title: 'Vets, grooming and pet-sitting', subtitle: 'Expats bring pets to Phuket. They will find you in myUNO before they Google.' },
    },
    audience: { ru: 'Ветклиники, груминг, dog walkers, передержка', en: 'Vet clinics, grooming, dog walkers, boarding' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  flowers: {
    id: 'flowers', emoji: '💐', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'FLOWERS · ПХУКЕТ', title: 'Цветочные магазины — доставка букетов и оформление', subtitle: 'Свадьбы, романтика, бизнес-подарки. Доставка в день заказа через единое приложение.' },
      en: { eyebrow: 'FLOWERS · PHUKET', title: 'Flower shops — bouquet delivery & decor', subtitle: 'Weddings, romance, business gifts. Same-day delivery through one app.' },
    },
    audience: { ru: 'Цветочные магазины, флористы, декораторы', en: 'Flower shops, florists, event decorators' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  education: {
    id: 'education', emoji: '🎓', commissionPct: 8,
    hero: {
      ru: { eyebrow: 'EDUCATION · ПХУКЕТ', title: 'Школы и репетиторы', subtitle: 'Семьи-экспаты выбирают международные школы и репетиторов через myUNO. Заявки идут в CRM.' },
      en: { eyebrow: 'EDUCATION · PHUKET', title: 'Schools and tutors', subtitle: 'Expat families pick international schools and tutors via myUNO. Leads land in your CRM.' },
    },
    audience: { ru: 'Международные школы, репетиторы, языковые курсы', en: 'International schools, tutors, language courses' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  babysitter: {
    id: 'babysitter', emoji: '👶', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'BABYSITTER · ПХУКЕТ', title: 'Няни и детские центры', subtitle: 'Родители ищут проверенных нянь с английским и русским. Профиль — в первой пятёрке выдачи.' },
      en: { eyebrow: 'BABYSITTER · PHUKET', title: 'Babysitters and kids clubs', subtitle: 'Parents look for vetted sitters with English & Russian. Be in the top 5 of results.' },
    },
    audience: { ru: 'Няни, гувернантки, детские центры, аниматоры', en: 'Babysitters, nannies, kids clubs, entertainers' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  wellness: {
    id: 'wellness', emoji: '🧘', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'WELLNESS · ПХУКЕТ', title: 'SPA, йога, holistic-практики', subtitle: 'Wellness-туристы тратят в среднем $300/день. myUNO приводит их к вам через AI-рекомендации.' },
      en: { eyebrow: 'WELLNESS · PHUKET', title: 'SPAs, yoga, holistic practitioners', subtitle: 'Wellness tourists spend $300/day on average. myUNO sends them via AI recommendations.' },
    },
    audience: { ru: 'SPA, йога-студии, ретриты, holistic-практики', en: 'SPAs, yoga studios, retreats, holistic practitioners' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  yachts: {
    id: 'yachts', emoji: '⛵', commissionPct: 12,
    hero: {
      ru: { eyebrow: 'YACHTS · ПХУКЕТ', title: 'Яхты и лодки — чартеры с прозрачным календарём', subtitle: 'Двухсторонняя синхронизация с iCal. Гости видят только реально свободные дни.' },
      en: { eyebrow: 'YACHTS · PHUKET', title: 'Yachts & boats — charters with a clean calendar', subtitle: '2-way iCal sync. Guests only see truly available dates.' },
    },
    audience: { ru: 'Чартерные компании, частные капитаны, спидбоат-операторы', en: 'Charter companies, private captains, speedboat operators' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
  events: {
    id: 'events', emoji: '🎉', commissionPct: 10,
    hero: {
      ru: { eyebrow: 'EVENTS · ПХУКЕТ', title: 'Организаторы мероприятий и площадки', subtitle: 'Свадьбы, корпоративы, дни рождения. Билеты и заявки через единый чекаут.' },
      en: { eyebrow: 'EVENTS · PHUKET', title: 'Event organisers and venues', subtitle: 'Weddings, corporates, birthdays. Tickets and inquiries through one checkout.' },
    },
    audience: { ru: 'Event-агентства, площадки, артисты, DJ, кейтеринг', en: 'Event agencies, venues, performers, DJs, catering' },
    valueProps: DEFAULT_VPS, faq: DEFAULT_FAQ,
  },
};

export const VENDOR_CATEGORY_IDS = Object.keys(VENDOR_CATEGORIES) as VendorCategoryId[];

export function getVendorCategory(id: string | undefined): VendorCategoryConfig | null {
  if (!id) return null;
  return (VENDOR_CATEGORIES as Record<string, VendorCategoryConfig>)[id] ?? null;
}
