/**
 * Navigation Index — SSOT for "go-to" search targets.
 *
 * Used by useGlobalSearch (layer 0) to surface actions / pages / mini-apps
 * in the global search modal. Matched by titles + keywords + cluster, then
 * re-ranked using the active persona / role.
 *
 * Sources:
 *  - APP_ROUTES (src/lib/config/routes.ts) for hrefs
 *  - Master Taxonomy v1.0 surfaces (src/lib/taxonomies/master.ts)
 *  - Each entry MUST resolve to an existing route — no dead links.
 */

export type NavCluster =
  | 'arrive'
  | 'live'
  | 'manage'
  | 'invest'
  | 'legal'
  | 'build'
  | 'me'
  | 'admin';

export interface NavTarget {
  id: string;
  titleRu: string;
  titleEn: string;
  descriptionRu?: string;
  descriptionEn?: string;
  path: string;
  /** Matching keywords (lowercase, RU+EN mixed). Must include common synonyms. */
  keywords: string[];
  cluster: NavCluster;
  /** Optional persona affinity — boosts ranking when user matches. */
  personas?: string[];
  /** Optional role gate — entry hidden if user lacks one of these. */
  requiresRole?: Array<'authenticated' | 'owner' | 'mc' | 'admin' | 'staff' | 'developer'>;
  /** Higher = preferred when multiple match equally. */
  weight?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRIVE — first-touch utilities
// ─────────────────────────────────────────────────────────────────────────────
const ARRIVE: NavTarget[] = [
  {
    id: 'nav-sim',
    titleRu: 'SIM-карта',
    titleEn: 'SIM Card',
    descriptionRu: 'Тайская SIM с доставкой',
    descriptionEn: 'Thai SIM with delivery',
    path: '/sim',
    keywords: ['sim', 'сим', 'симка', 'симкарта', 'интернет', 'связь', 'мобильный', 'mobile', 'phone'],
    cluster: 'arrive',
    personas: ['tourist', 'relocation'],
    weight: 8,
  },
  {
    id: 'nav-exchange',
    titleRu: 'Обмен валют',
    titleEn: 'Currency Exchange',
    descriptionRu: 'Курсы и обмен',
    descriptionEn: 'Rates and exchange',
    path: '/exchange',
    keywords: ['обмен', 'валют', 'валюта', 'курс', 'exchange', 'currency', 'rate', 'thb', 'usd', 'rub'],
    cluster: 'arrive',
    weight: 8,
  },
  {
    id: 'nav-transfer',
    titleRu: 'Трансфер из аэропорта',
    titleEn: 'Airport Transfer',
    descriptionRu: 'Встреча и доставка',
    descriptionEn: 'Meet and greet',
    path: '/transport/airport-transfer',
    keywords: ['трансфер', 'аэропорт', 'transfer', 'airport', 'встреча', 'pickup', 'такси из аэропорта'],
    cluster: 'arrive',
    personas: ['tourist'],
    weight: 8,
  },
  {
    id: 'nav-transport',
    titleRu: 'Аренда транспорта',
    titleEn: 'Transport Rental',
    descriptionRu: 'Авто, байки, скутеры',
    descriptionEn: 'Cars, bikes, scooters',
    path: '/transport',
    keywords: ['транспорт', 'аренда', 'авто', 'машина', 'байк', 'скутер', 'transport', 'rent', 'car', 'bike', 'scooter'],
    cluster: 'arrive',
    weight: 6,
  },
  {
    id: 'nav-visa',
    titleRu: 'Визы и продление',
    titleEn: 'Visa & Extensions',
    descriptionRu: 'Туристические и долгосрочные',
    descriptionEn: 'Tourist and long-stay',
    path: '/visa',
    keywords: ['виза', 'visa', 'продление', 'extension', 'dtv', 'ltr', 'work permit', 'edu visa'],
    cluster: 'legal',
    weight: 9,
  },
  {
    id: 'nav-sos',
    titleRu: 'SOS · Помощь 24/7',
    titleEn: 'SOS · 24/7 Help',
    descriptionRu: 'Концьерж и срочная помощь',
    descriptionEn: 'Concierge and emergencies',
    path: '/sos',
    keywords: ['sos', 'помощь', 'срочно', 'emergency', 'help', 'медицина срочно', 'concierge', 'консьерж'],
    cluster: 'arrive',
    weight: 10,
  },
  {
    id: 'nav-concierge',
    titleRu: 'VIP-консьерж',
    titleEn: 'VIP Concierge',
    descriptionRu: 'Персональный помощник',
    descriptionEn: 'Personal assistant',
    path: '/vip-concierge',
    keywords: ['vip', 'консьерж', 'concierge', 'персональный', 'помощник', 'assistant'],
    cluster: 'arrive',
    weight: 5,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LIVE — daily life
// ─────────────────────────────────────────────────────────────────────────────
const LIVE: NavTarget[] = [
  { id: 'nav-property-rent', titleRu: 'Аренда жилья', titleEn: 'Property Rentals', path: '/property?mode=rent',
    keywords: ['аренда', 'жильё', 'квартира', 'вилла', 'rent', 'rental', 'villa', 'apartment', 'condo'], cluster: 'live', weight: 7 },
  { id: 'nav-property-buy', titleRu: 'Покупка недвижимости', titleEn: 'Buy Property', path: '/property?mode=buy',
    keywords: ['купить', 'покупка', 'buy', 'purchase', 'real estate', 'недвижимость купить'], cluster: 'invest', weight: 7 },
  { id: 'nav-newbuilds', titleRu: 'Новостройки off-plan', titleEn: 'Off-plan Newbuilds', path: '/newbuilds',
    keywords: ['новостройки', 'off-plan', 'offplan', 'newbuilds', 'застройщик', 'developer'], cluster: 'invest', weight: 6 },
  { id: 'nav-beauty', titleRu: 'Красота и SPA', titleEn: 'Beauty & SPA', path: '/beauty',
    keywords: ['красота', 'spa', 'спа', 'массаж', 'massage', 'beauty', 'салон', 'salon', 'маникюр', 'nails'], cluster: 'live', weight: 5 },
  { id: 'nav-medical', titleRu: 'Медицина и клиники', titleEn: 'Medical & Clinics', path: '/medical',
    keywords: ['врач', 'клиника', 'медицина', 'doctor', 'clinic', 'medical', 'hospital', 'стоматолог', 'dentist'], cluster: 'live', weight: 7 },
  { id: 'nav-pharmacy', titleRu: 'Аптеки', titleEn: 'Pharmacies', path: '/pharmacy',
    keywords: ['аптека', 'pharmacy', 'лекарства', 'medicine', 'drugs'], cluster: 'live', weight: 5 },
  { id: 'nav-insurance', titleRu: 'Страхование', titleEn: 'Insurance', path: '/insurance',
    keywords: ['страховка', 'страхование', 'insurance', 'медстраховка', 'health insurance', 'auto insurance'], cluster: 'live', weight: 6 },
  { id: 'nav-fitness', titleRu: 'Фитнес и спорт', titleEn: 'Fitness & Sport', path: '/fitness',
    keywords: ['фитнес', 'спорт', 'зал', 'gym', 'fitness', 'crossfit', 'муай тай', 'muay thai', 'yoga', 'йога'], cluster: 'live', weight: 4 },
  { id: 'nav-education', titleRu: 'Школы и образование', titleEn: 'Schools & Education', path: '/education',
    keywords: ['школа', 'образование', 'репетитор', 'school', 'education', 'tutor', 'детский сад', 'kindergarten'],
    cluster: 'live', personas: ['family', 'relocation'], weight: 6 },
  { id: 'nav-pets', titleRu: 'Питомцы и ветклиники', titleEn: 'Pets & Vets', path: '/pets',
    keywords: ['питомец', 'собака', 'кошка', 'pet', 'dog', 'cat', 'ветеринар', 'vet', 'груминг', 'grooming'],
    cluster: 'live', personas: ['pet_owner'], weight: 5 },
  { id: 'nav-restaurants', titleRu: 'Рестораны и доставка', titleEn: 'Restaurants & Delivery', path: '/restaurants',
    keywords: ['ресторан', 'еда', 'доставка', 'restaurant', 'food', 'delivery', 'кафе', 'cafe'], cluster: 'live', weight: 5 },
  { id: 'nav-services', titleRu: 'Бытовые услуги', titleEn: 'Home Services', path: '/services',
    keywords: ['услуги', 'клининг', 'мастер', 'services', 'cleaning', 'handyman', 'электрик', 'electrician', 'сантехник', 'plumber'],
    cluster: 'live', weight: 5 },
  { id: 'nav-tours', titleRu: 'Туры и экскурсии', titleEn: 'Tours & Excursions', path: '/tours',
    keywords: ['тур', 'экскурсия', 'tour', 'excursion', 'trip'], cluster: 'live', personas: ['tourist'], weight: 5 },
  { id: 'nav-yachts', titleRu: 'Аренда яхт', titleEn: 'Yacht Charter', path: '/yachts',
    keywords: ['яхта', 'катер', 'yacht', 'boat', 'charter', 'чартер'], cluster: 'live', weight: 5 },
  { id: 'nav-water', titleRu: 'Водные развлечения', titleEn: 'Water Activities', path: '/water',
    keywords: ['дайвинг', 'снорклинг', 'diving', 'snorkeling', 'water', 'вода', 'каяк', 'kayak'], cluster: 'live', weight: 4 },
  { id: 'nav-events', titleRu: 'События и афиша', titleEn: 'Events & Tickets', path: '/events',
    keywords: ['событие', 'мероприятие', 'event', 'афиша', 'билет', 'ticket', 'концерт', 'concert'], cluster: 'live', weight: 4 },
  { id: 'nav-flowers', titleRu: 'Цветы и подарки', titleEn: 'Flowers & Gifts', path: '/flowers',
    keywords: ['цветы', 'букет', 'подарок', 'flowers', 'bouquet', 'gift'], cluster: 'live', weight: 3 },
  { id: 'nav-market', titleRu: 'Маркетплейс', titleEn: 'Marketplace', path: '/market',
    keywords: ['маркет', 'товар', 'market', 'shop', 'купить товар'], cluster: 'live', weight: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL
// ─────────────────────────────────────────────────────────────────────────────
const LEGAL: NavTarget[] = [
  { id: 'nav-legal', titleRu: 'Юридические услуги', titleEn: 'Legal Services', path: '/legal',
    keywords: ['юрист', 'lawyer', 'legal', 'юридический', 'нотариус', 'notary'], cluster: 'legal', weight: 7 },
  { id: 'nav-visa-quiz', titleRu: 'Квиз: какая виза подходит', titleEn: 'Visa Quiz', path: '/visa/quiz',
    keywords: ['виза квиз', 'visa quiz', 'какая виза', 'which visa'], cluster: 'legal', weight: 6 },
  { id: 'nav-tax', titleRu: 'Налоги в Таиланде', titleEn: 'Thailand Taxes', path: '/legal?topic=tax',
    keywords: ['налог', 'tax', 'taxes', 'налоги тайланд', 'tax id'], cluster: 'legal', weight: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// INVEST
// ─────────────────────────────────────────────────────────────────────────────
const INVEST: NavTarget[] = [
  { id: 'nav-invest', titleRu: 'Инвестиции в недвижимость', titleEn: 'Real Estate Investments', path: '/invest',
    keywords: ['инвестиции', 'invest', 'investment', 'roi', 'доходность', 'yield'], cluster: 'invest',
    personas: ['investor'], weight: 7 },
  { id: 'nav-clearview', titleRu: 'ClearView рейтинги off-plan', titleEn: 'ClearView Ratings', path: '/clearview',
    keywords: ['clearview', 'рейтинг', 'rating', 'off-plan rating', 'aaa', 'due diligence'], cluster: 'invest', weight: 6 },
  { id: 'nav-investor-deals', titleRu: 'Сделки и pipeline', titleEn: 'Deals & Pipeline', path: '/invest/deals',
    keywords: ['сделки', 'deals', 'pipeline', 'invest deals'], cluster: 'invest', personas: ['investor'], weight: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MANAGE / OWNER
// ─────────────────────────────────────────────────────────────────────────────
const MANAGE: NavTarget[] = [
  { id: 'nav-owner-properties', titleRu: 'Мои объекты', titleEn: 'My Properties', path: '/owner/properties',
    keywords: ['мои объекты', 'my properties', 'мои виллы', 'недвижимость моя'], cluster: 'manage',
    requiresRole: ['owner', 'mc'], weight: 8 },
  { id: 'nav-owner-calendar', titleRu: 'Календарь бронирований', titleEn: 'Booking Calendar', path: '/owner/calendar',
    keywords: ['календарь', 'calendar', 'бронирования', 'bookings', 'наличие', 'availability'], cluster: 'manage',
    requiresRole: ['owner', 'mc'], weight: 7 },
  { id: 'nav-owner-finance', titleRu: 'P&L и финансы', titleEn: 'P&L & Finance', path: '/owner/finance',
    keywords: ['финансы', 'выручка', 'доход', 'p&l', 'pnl', 'finance', 'revenue', 'income', 'отчёт'],
    cluster: 'manage', requiresRole: ['owner', 'mc'], weight: 8 },
  { id: 'nav-owner-tasks', titleRu: 'Задачи и операции', titleEn: 'Tasks & Operations', path: '/mc/tasks',
    keywords: ['задачи', 'tasks', 'операции', 'operations', 'клининг задачи'], cluster: 'manage',
    requiresRole: ['owner', 'mc'], weight: 6 },
  { id: 'nav-mc-crm', titleRu: 'CRM · контакты и сделки', titleEn: 'CRM · Contacts & Deals', path: '/mc/crm',
    keywords: ['crm', 'контакты', 'contacts', 'сделки', 'deals', 'лиды', 'leads'], cluster: 'manage',
    requiresRole: ['mc', 'admin'], weight: 7 },
  { id: 'nav-mc-team', titleRu: 'Команда', titleEn: 'Team', path: '/mc/team',
    keywords: ['команда', 'team', 'сотрудники', 'staff'], cluster: 'manage', requiresRole: ['mc'], weight: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ME / PERSONAL
// ─────────────────────────────────────────────────────────────────────────────
const ME: NavTarget[] = [
  { id: 'nav-me-bookings', titleRu: 'Мои бронирования', titleEn: 'My Bookings', path: '/me/bookings',
    keywords: ['мои бронирования', 'my bookings', 'мои брони', 'reservations'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 7 },
  { id: 'nav-me-orders', titleRu: 'Мои заказы', titleEn: 'My Orders', path: '/me/requests',
    keywords: ['мои заказы', 'my orders', 'заказы', 'orders'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 7 },
  { id: 'nav-me-documents', titleRu: 'Мои документы · Vault', titleEn: 'My Documents · Vault', path: '/me/documents',
    keywords: ['документы', 'vault', 'паспорт', 'passport', 'documents'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 6 },
  { id: 'nav-me-payments', titleRu: 'Платежи и кошелёк', titleEn: 'Payments & Wallet', path: '/me/payments',
    keywords: ['кошелёк', 'wallet', 'платежи', 'payments', 'карты', 'cards'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 6 },
  { id: 'nav-favorites', titleRu: 'Избранное', titleEn: 'Favorites', path: '/favorites',
    keywords: ['избранное', 'favorites', 'saved', 'сохранённое'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 4 },
  { id: 'nav-me-profile', titleRu: 'Профиль и настройки', titleEn: 'Profile & Settings', path: '/me/profile',
    keywords: ['профиль', 'profile', 'настройки', 'settings'], cluster: 'me',
    requiresRole: ['authenticated'], weight: 4 },
  { id: 'nav-support', titleRu: 'Поддержка', titleEn: 'Support', path: '/support',
    keywords: ['поддержка', 'support', 'тикет', 'ticket', 'help'], cluster: 'me', weight: 5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN: NavTarget[] = [
  { id: 'nav-admin', titleRu: 'Админ-панель', titleEn: 'Admin', path: '/admin',
    keywords: ['админ', 'admin', 'панель'], cluster: 'admin', requiresRole: ['admin'], weight: 5 },
  { id: 'nav-admin-ai', titleRu: 'AI · агенты и знания', titleEn: 'AI · Agents & Knowledge', path: '/admin/ai',
    keywords: ['ai', 'агенты', 'agents', 'knowledge'], cluster: 'admin', requiresRole: ['admin'], weight: 4 },
];

export const NAVIGATION_INDEX: NavTarget[] = [
  ...ARRIVE, ...LIVE, ...LEGAL, ...INVEST, ...MANAGE, ...ME, ...ADMIN,
];

// ─────────────────────────────────────────────────────────────────────────────
// Search / ranking
// ─────────────────────────────────────────────────────────────────────────────

export interface NavSearchContext {
  /** True if logged in. */
  isAuthenticated: boolean;
  /** Roles array, lowercase ('owner', 'mc', 'admin', ...). */
  roles: string[];
  /** Active personas (UserPersona enum values). */
  personas: string[];
  /** Active surface/cluster (from current route, optional). */
  activeCluster?: NavCluster;
}

export interface NavSearchHit {
  target: NavTarget;
  score: number;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

/**
 * Score one target against a query string + context.
 * Returns 0 when the entry should not be shown at all.
 */
function scoreTarget(target: NavTarget, qNorm: string, qTokens: string[], ctx: NavSearchContext): number {
  // Role gate
  if (target.requiresRole && target.requiresRole.length > 0) {
    if (target.requiresRole.includes('authenticated')) {
      if (!ctx.isAuthenticated) return 0;
    } else {
      const ok = target.requiresRole.some((r) => ctx.roles.includes(r));
      if (!ok) return 0;
    }
  }

  let score = 0;
  const titleRu = norm(target.titleRu);
  const titleEn = norm(target.titleEn);

  // Exact title match
  if (titleRu === qNorm || titleEn === qNorm) score += 100;
  // Title startsWith
  else if (titleRu.startsWith(qNorm) || titleEn.startsWith(qNorm)) score += 60;
  // Title contains
  else if (titleRu.includes(qNorm) || titleEn.includes(qNorm)) score += 35;

  // Keyword matches — each full-token hit counts more than substring
  for (const kw of target.keywords) {
    const kwN = norm(kw);
    if (qTokens.includes(kwN)) score += 25;
    else if (kwN.includes(qNorm) && qNorm.length >= 3) score += 12;
    else {
      for (const tok of qTokens) {
        if (tok.length >= 3 && kwN.includes(tok)) {
          score += 6;
          break;
        }
      }
    }
  }

  if (score === 0) return 0;

  // Boosts
  score += target.weight ?? 0;
  if (target.personas && ctx.personas.some((p) => target.personas!.includes(p))) score += 10;
  if (ctx.activeCluster && target.cluster === ctx.activeCluster) score += 5;

  return score;
}

export function searchNavigationIndex(
  query: string,
  ctx: NavSearchContext,
  limit = 5,
): NavSearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const qNorm = norm(trimmed);
  const qTokens = qNorm.split(/[\s,/-]+/).filter((t) => t.length >= 2);

  const hits: NavSearchHit[] = [];
  for (const target of NAVIGATION_INDEX) {
    const s = scoreTarget(target, qNorm, qTokens, ctx);
    if (s > 0) hits.push({ target, score: s });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
