/**
 * Route metadata registry — Single source of truth for breadcrumbs & shell decisions.
 *
 * Two roles:
 *  1. **Surface segmentation** (`getRouteSurface`) — `customer` vs `workspace`. Used by
 *     header chooser (see docs/HEADER_ROUTE_INVENTORY.md).
 *  2. **Breadcrumb labels** (`SEGMENT_META`, `getRouteCrumbs`) — maps each URL segment
 *     to a bilingual label + canonical anchor path. Powers `<Breadcrumbs />` in TopBar.
 *
 * Rules (per docs/NAVIGATION_MAP.md):
 *  - Hierarchy: `Surface > Section > Entity` (max 4 visible crumbs, ellipsis in middle).
 *  - Hidden when depth < 2 (top-level pages don't need crumbs — title in TopBar suffices).
 *  - Hidden on auth/landing/fullscreen surfaces.
 *  - Dynamic ID segments (uuid, numeric, slugs) collapse to the entity type label.
 */

export type RouteSurface = 'customer' | 'workspace';
export type LangCode = 'ru' | 'en';

export interface SegmentMeta {
  /** Bilingual label shown in the breadcrumb. */
  labelRu: string;
  labelEn: string;
  /**
   * Optional anchor — when present, the crumb is a clickable link to this path.
   * When omitted, the crumb is a non-clickable label (current page or virtual section).
   */
  href?: string;
  /** Hide this segment entirely from breadcrumbs (e.g. internal grouping segments). */
  hidden?: boolean;
}

export interface BreadcrumbCrumb {
  labelRu: string;
  labelEn: string;
  href?: string;
}

// ── Workspace prefixes (mirrors docs/HEADER_ROUTE_INVENTORY.md) ──
const WORKSPACE_PREFIXES = [
  '/admin',
  '/vendor',
  '/mc',
  '/owner',
  '/team',
  '/staff',
  '/developer-portal',
] as const;

/** Routes that must NEVER render breadcrumbs (auth flows, landing pages, fullscreen). */
const NO_CRUMBS_PREFIXES = [
  '/',
  '/auth',
  '/start',
  '/install',
  '/sos',
  '/under-construction',
] as const;

/**
 * Per-segment metadata. Keys are the **first significant segment** of a URL path.
 * For nested sections, child labels are resolved against `NESTED_META[parent]`.
 *
 * Coverage focuses on user-facing surfaces; unmapped segments fall back to a
 * Title-Cased version of the slug, so adding a new route doesn't break crumbs.
 */
export const SEGMENT_META: Record<string, SegmentMeta> = {
  // ── Discovery ──
  discover: { labelRu: 'Каталог', labelEn: 'Discover', href: '/discover' },
  search: { labelRu: 'Поиск', labelEn: 'Search', href: '/search' },
  map: { labelRu: 'Карта', labelEn: 'Map', href: '/map' },
  cluster: { labelRu: 'Кластеры', labelEn: 'Clusters', hidden: true },

  // ── User / Me ──
  me: { labelRu: 'Мой кабинет', labelEn: 'My Hub', href: '/me' },
  account: { labelRu: 'Аккаунт', labelEn: 'Account', href: '/account' },
  profile: { labelRu: 'Профиль', labelEn: 'Profile', href: '/profile' },
  bookings: { labelRu: 'Бронирования', labelEn: 'Bookings', href: '/bookings' },
  favorites: { labelRu: 'Избранное', labelEn: 'Favorites', href: '/favorites' },
  notifications: { labelRu: 'Уведомления', labelEn: 'Notifications', href: '/notifications' },
  messages: { labelRu: 'Сообщения', labelEn: 'Messages', href: '/messages' },
  wallet: { labelRu: 'Кошелёк', labelEn: 'Wallet', href: '/wallet' },
  cart: { labelRu: 'Корзина', labelEn: 'Cart', href: '/cart' },
  history: { labelRu: 'История', labelEn: 'History', href: '/history' },
  support: { labelRu: 'Поддержка', labelEn: 'Support', href: '/support' },

  // ── Property ──
  property: { labelRu: 'Недвижимость', labelEn: 'Property', href: '/property' },
  newbuilds: { labelRu: 'Новостройки', labelEn: 'New Builds', href: '/newbuilds' },
  rent: { labelRu: 'Аренда', labelEn: 'Rent', href: '/rent' },
  buy: { labelRu: 'Купить', labelEn: 'Buy', href: '/buy' },

  // ── Lifestyle clusters ──
  beauty: { labelRu: 'Красота и SPA', labelEn: 'Beauty & Spa', href: '/beauty' },
  pets: { labelRu: 'Питомцы', labelEn: 'Pets', href: '/pets' },
  kids: { labelRu: 'Дети', labelEn: 'Kids', href: '/kids' },
  wedding: { labelRu: 'Свадьбы', labelEn: 'Weddings', href: '/wedding' },
  legal: { labelRu: 'Юридические услуги', labelEn: 'Legal', href: '/legal' },
  invest: { labelRu: 'Инвестиции', labelEn: 'Invest', href: '/invest' },
  capital: { labelRu: 'Capital', labelEn: 'Capital', href: '/capital' },
  clearview: { labelRu: 'ClearView', labelEn: 'ClearView', href: '/clearview' },
  knowledge: { labelRu: 'База знаний', labelEn: 'Knowledge', href: '/knowledge' },
  classifieds: { labelRu: 'Объявления', labelEn: 'Classifieds', href: '/classifieds' },
  market: { labelRu: 'Маркет', labelEn: 'Market', href: '/market' },
  events: { labelRu: 'События', labelEn: 'Events', href: '/events' },
  fitness: { labelRu: 'Фитнес', labelEn: 'Fitness', href: '/fitness' },
  wellness: { labelRu: 'Wellness', labelEn: 'Wellness', href: '/wellness' },
  pharmacy: { labelRu: 'Аптеки', labelEn: 'Pharmacy', href: '/pharmacy' },
  flowers: { labelRu: 'Цветы', labelEn: 'Flowers', href: '/flowers' },
  cleaning: { labelRu: 'Клининг', labelEn: 'Cleaning', href: '/cleaning' },
  transport: { labelRu: 'Транспорт', labelEn: 'Transport', href: '/transport' },
  education: { labelRu: 'Образование', labelEn: 'Education', href: '/education' },
  tour: { labelRu: 'Туры', labelEn: 'Tours', href: '/tour' },
  yacht: { labelRu: 'Яхты', labelEn: 'Yachts', href: '/yacht' },

  // ── Workspaces ──
  mc: { labelRu: 'Управляющая компания', labelEn: 'Management', href: '/mc' },
  owner: { labelRu: 'Кабинет собственника', labelEn: 'Owner Portal', href: '/owner' },
  vendor: { labelRu: 'Партнёр', labelEn: 'Partner', href: '/vendor' },
  admin: { labelRu: 'Администрирование', labelEn: 'Admin', href: '/admin' },
  team: { labelRu: 'Команда', labelEn: 'Team', href: '/team' },
  staff: { labelRu: 'Персонал', labelEn: 'Staff', href: '/staff' },
  'developer-portal': { labelRu: 'Девелоперский портал', labelEn: 'Developer Portal', href: '/developer-portal' },

  // ── Nested entity groups (no anchor — virtual section). Acts as a label only. ──
  properties: { labelRu: 'Объекты', labelEn: 'Properties' },
  services: { labelRu: 'Услуги', labelEn: 'Services' },
  tasks: { labelRu: 'Задачи', labelEn: 'Tasks' },
  calendar: { labelRu: 'Календарь', labelEn: 'Calendar' },
  finance: { labelRu: 'Финансы', labelEn: 'Finance' },
  reports: { labelRu: 'Отчёты', labelEn: 'Reports' },
  team_members: { labelRu: 'Сотрудники', labelEn: 'Team' },
  contacts: { labelRu: 'Контакты', labelEn: 'Contacts' },
  deals: { labelRu: 'Сделки', labelEn: 'Deals' },
  leads: { labelRu: 'Лиды', labelEn: 'Leads' },
  orders: { labelRu: 'Заказы', labelEn: 'Orders' },
  payouts: { labelRu: 'Выплаты', labelEn: 'Payouts' },
  bookings_workspace: { labelRu: 'Бронирования', labelEn: 'Bookings' },
  documents: { labelRu: 'Документы', labelEn: 'Documents' },
  settings: { labelRu: 'Настройки', labelEn: 'Settings' },
  edit: { labelRu: 'Редактирование', labelEn: 'Edit' },
  new: { labelRu: 'Создание', labelEn: 'New' },
  detail: { labelRu: 'Карточка', labelEn: 'Details' },
};

// ── Surface (header chooser) ───────────────────────────────────────────────

/** Resolve `customer` vs `workspace` surface for a given pathname. */
export function getRouteSurface(pathname: string): RouteSurface {
  return WORKSPACE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ? 'workspace'
    : 'customer';
}

// ── Breadcrumbs ────────────────────────────────────────────────────────────

/** True for path segments that are dynamic ids (uuid / numeric / long slug). */
function isDynamicSegment(seg: string): boolean {
  if (/^\d+$/.test(seg)) return true;
  // UUID-ish (any hex+dash with at least one dash and length ≥ 16)
  if (/^[0-9a-f-]{16,}$/i.test(seg) && seg.includes('-')) return true;
  return false;
}

/** Title-case fallback for unmapped slugs (`new-builds` → `New Builds`). */
function titleizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** True when breadcrumbs should render at all for this pathname. */
export function shouldShowBreadcrumbs(pathname: string): boolean {
  if (NO_CRUMBS_PREFIXES.includes(pathname as (typeof NO_CRUMBS_PREFIXES)[number])) return false;
  if (pathname.startsWith('/auth/')) return false;

  // Depth rule: `Surface > Section > Entity`. Depth < 2 means top-level — no crumbs.
  const depth = pathname.split('/').filter(Boolean).length;
  return depth >= 2;
}

/**
 * Build breadcrumb crumbs for a given pathname.
 *
 * Behaviour:
 *  - Always prepends a virtual "Home" crumb (anchor `/`).
 *  - For each segment, looks up `SEGMENT_META`, falls back to title-case of slug.
 *  - Skips `hidden` segments and dynamic ids (those collapse into parent label).
 *  - Builds cumulative `href` per segment so each crumb is navigable.
 *  - The **last crumb** never has an `href` (it's the current page).
 *  - Trims to max 4 crumbs by collapsing the middle into `…`.
 */
export function getRouteCrumbs(pathname: string): BreadcrumbCrumb[] {
  if (!shouldShowBreadcrumbs(pathname)) return [];

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbCrumb[] = [
    { labelRu: 'Главная', labelEn: 'Home', href: '/' },
  ];

  let acc = '';
  segments.forEach((seg) => {
    acc += `/${seg}`;

    if (isDynamicSegment(seg)) {
      // Dynamic id — keep as a non-clickable "Detail" placeholder if this is
      // the leaf, otherwise drop it (the anchor stays in `acc` for children).
      return;
    }

    const meta = SEGMENT_META[seg];
    if (meta?.hidden) return;

    crumbs.push({
      labelRu: meta?.labelRu ?? titleizeSlug(seg),
      labelEn: meta?.labelEn ?? titleizeSlug(seg),
      href: acc,
    });
  });

  // Strip href from the last crumb (current page).
  if (crumbs.length > 0) {
    const last = crumbs[crumbs.length - 1];
    crumbs[crumbs.length - 1] = { labelRu: last.labelRu, labelEn: last.labelEn };
  }

  // Collapse middle when over 4: [Home, …, parent, current]
  if (crumbs.length > 4) {
    const head = crumbs[0];
    const tail = crumbs.slice(-2);
    return [head, { labelRu: '…', labelEn: '…' }, ...tail];
  }

  return crumbs;
}

/** Convenience: resolve label for a single segment (used by tests / SEO). */
export function getSegmentLabel(seg: string, lang: LangCode): string {
  const meta = SEGMENT_META[seg];
  if (!meta) return titleizeSlug(seg);
  return lang === 'ru' ? meta.labelRu : meta.labelEn;
}
