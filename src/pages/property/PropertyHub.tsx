/**
 * PropertyHub — Unified entry for property vertical
 * Nested routes via Outlet. Catalog + tabs live on /property/browse.
 */

import React from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarRange,
  ShoppingCart,
  Building2,
  User,
  ArrowRightLeft,
  Map,
  GitCompare,
  Users,
  Briefcase,
  Trees,
  Hotel,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPersonas, type UserPersona } from '@/hooks/useUserPersonas';
import { CompareProvider } from '@/components/property/PropertyCompare';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';

interface TabConfig {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ElementType;
  path: string;
  authOnly?: boolean;
  /** When set, tab visible only if user has at least one of these personas */
  personaGated?: UserPersona[];
}

const TABS: TabConfig[] = [
  {
    id: 'rent_short',
    labelEn: 'Nightly',
    labelRu: 'Посуточно',
    icon: CalendarClock,
    path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=short`,
  },
  {
    id: 'rent_long',
    labelEn: 'Monthly',
    labelRu: 'На месяц',
    icon: CalendarRange,
    path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=rent&tenancy=long`,
  },
  {
    id: 'buy',
    labelEn: 'Buy',
    labelRu: 'Купить',
    icon: ShoppingCart,
    path: `${APP_ROUTES.PROPERTY_BROWSE}?mode=buy`,
  },
  {
    id: 'newbuild',
    labelEn: 'New',
    labelRu: 'Новостройки',
    icon: Building2,
    path: APP_ROUTES.OFFPLAN,
  },
  {
    id: 'resale',
    labelEn: 'Resale',
    labelRu: 'Вторичка',
    icon: ArrowRightLeft,
    path: APP_ROUTES.RESALE,
  },
  {
    id: 'commercial',
    labelEn: 'Commercial',
    labelRu: 'Коммерция',
    icon: Briefcase,
    path: APP_ROUTES.COMMERCIAL,
    personaGated: ['business', 'investor'],
  },
  {
    id: 'hotels',
    labelEn: 'Hotels',
    labelRu: 'Отели',
    icon: Hotel,
    path: APP_ROUTES.HOTELS,
    personaGated: ['business', 'investor'],
  },
  {
    id: 'land',
    labelEn: 'Land',
    labelRu: 'Земля',
    icon: Trees,
    path: APP_ROUTES.LAND,
    personaGated: ['business', 'investor'],
  },
  {
    id: 'my',
    labelEn: 'My',
    labelRu: 'Мои',
    icon: User,
    path: '/property/my',
    authOnly: true,
  },
];

function getActiveTab(pathname: string, search: string): string {
  if (pathname.startsWith('/property/my')) return 'my';
  if (pathname.startsWith(APP_ROUTES.INVEST)) return 'my';
  if (pathname.startsWith(APP_ROUTES.COMMERCIAL)) return 'commercial';
  if (pathname.startsWith(APP_ROUTES.LAND)) return 'land';
  if (pathname.startsWith(APP_ROUTES.RESALE)) return 'resale';
  if (pathname.startsWith(APP_ROUTES.OFFPLAN) || pathname.startsWith(APP_ROUTES.DEVELOPERS) || pathname.startsWith(APP_ROUTES.COMPLEXES)) {
    return 'newbuild';
  }

  const isBrowse =
    pathname === APP_ROUTES.PROPERTY_BROWSE ||
    pathname === `${APP_ROUTES.PROPERTY}/` + 'browse';
  const isLegacyPropertySearch =
    pathname === APP_ROUTES.PROPERTY ||
    pathname.startsWith(APP_ROUTES.PROPERTY_SEARCH) ||
    pathname.startsWith(APP_ROUTES.PROPERTY_MAP) ||
    pathname.startsWith(APP_ROUTES.PROPERTY_CONSULTATION);

  if (isBrowse || isLegacyPropertySearch) {
    const params = new URLSearchParams(search);
    if (params.get('mode') === 'buy') return 'buy';
    if (params.get('tenancy') === 'long') return 'rent_long';
    return 'rent_short';
  }

  return 'rent_short';
}

/** Quick links for off-plan catalog + newbuilds-themed tools (map, compare, developers). */
export function OffplanHubToolsStrip() {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const p = location.pathname;
  const show =
    p.startsWith(APP_ROUTES.OFFPLAN) ||
    p.startsWith(APP_ROUTES.DEVELOPERS) ||
    p.startsWith(APP_ROUTES.COMPLEXES);

  if (!show) return null;

  const links = [
    { to: APP_ROUTES.OFFPLAN, labelRu: 'Каталог', labelEn: 'Catalog' },
    { to: APP_ROUTES.NEWBUILDS_MAP, labelRu: 'Карта', labelEn: 'Map' },
    { to: APP_ROUTES.NEWBUILDS_COMPARE, labelRu: 'Сравнение', labelEn: 'Compare' },
    { to: APP_ROUTES.DEVELOPERS, labelRu: 'Застройщики', labelEn: 'Developers' },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/30 border-b border-border/40 text-xs">
      {links.map((item) => {
        const active =
          item.to === APP_ROUTES.OFFPLAN
            ? p === APP_ROUTES.OFFPLAN || p.startsWith(`${APP_ROUTES.OFFPLAN}/`)
            : p === item.to || p.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.to === APP_ROUTES.NEWBUILDS_MAP && <Map className="w-3.5 h-3.5" />}
            {item.to === APP_ROUTES.NEWBUILDS_COMPARE && <GitCompare className="w-3.5 h-3.5" />}
            {item.to === APP_ROUTES.DEVELOPERS && <Users className="w-3.5 h-3.5" />}
            {item.to === APP_ROUTES.OFFPLAN && <Building2 className="w-3.5 h-3.5" />}
            {isRu ? item.labelRu : item.labelEn}
          </Link>
        );
      })}
    </div>
  );
}

export function PropertyHubTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { personas } = useUserPersonas();
  const isRu = language === 'ru';
  const activeTab = getActiveTab(location.pathname, location.search);

  const isDetailPage =
    /^\/property\/[a-f0-9-]{36}/.test(location.pathname) ||
    /^\/property\/(offplan|developers|invest|commercial|land)\/[a-f0-9-]/.test(location.pathname) ||
    /^\/property\/project\//.test(location.pathname) ||
    /^\/property\/deposit-success/.test(location.pathname);

  if (isDetailPage) return null;

  const visibleTabs = TABS.filter(
    (tab) =>
      (!tab.authOnly || user) &&
      (!tab.personaGated || tab.personaGated.some((p) => personas.includes(p))),
  );

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2 bg-background border-b border-border/50 snap-x snap-mandatory">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isPro = !!tab.personaGated;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.path)}
            className={cn(
              'shrink-0 snap-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] sm:text-sm font-medium whitespace-nowrap transition-all leading-none',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{isRu ? tab.labelRu : tab.labelEn}</span>
            {isPro && (
              <span
                className={cn(
                  'ml-0.5 inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-semibold tracking-wide uppercase leading-tight',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-accent/15 text-accent dark:text-accent'
                )}
              >
                Pro
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function PropertyHub() {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const p = location.pathname;
  const n = (en: string, ru: string) => (isRu ? ru : en);

  /** PropertyIndex embeds tabs; landing has its own layout */
  const hideOuterTabs =
    p === APP_ROUTES.PROPERTY ||
    p === `${APP_ROUTES.PROPERTY}/` ||
    p === APP_ROUTES.PROPERTY_BROWSE ||
    p === `${APP_ROUTES.PROPERTY_BROWSE}/`;

  /**
   * Single AppLayout/NavShell for the whole /property/* tree. Nested AppLayout
   * in child routes was rendering a second SideRail (duplicate left chrome).
   * Immerse browse + search: custom sticky header; /property/my: no global top bar.
   */
  const isBrowseImmersive =
    p === APP_ROUTES.PROPERTY_BROWSE || p === `${APP_ROUTES.PROPERTY_BROWSE}/`;
  const hideGlobalTopBar =
    isBrowseImmersive ||
    p.startsWith('/property/my') ||
    p === APP_ROUTES.PROPERTY_SEARCH;

  let title: string | undefined;
  if (!hideGlobalTopBar) {
    if (p === APP_ROUTES.PROPERTY || p === `${APP_ROUTES.PROPERTY}/`) {
      title = n('Property', 'Недвижимость');
    } else if (p === APP_ROUTES.OFFPLAN || p === `${APP_ROUTES.OFFPLAN}/`) {
      title = n('Phuket New Developments', 'Новостройки Пхукета');
    } else if (p === APP_ROUTES.DEVELOPERS || p === `${APP_ROUTES.DEVELOPERS}/`) {
      title = n('Developers', 'Застройщики');
    } else if (p === APP_ROUTES.RESALE || p === `${APP_ROUTES.RESALE}/`) {
      title = n('Resale', 'Вторичка');
    } else if (
      p === APP_ROUTES.COMMERCIAL ||
      p === `${APP_ROUTES.COMMERCIAL}/` ||
      p === APP_ROUTES.COMMERCIAL_BROWSE
    ) {
      title = n('Commercial', 'Коммерция');
    } else if (p === APP_ROUTES.LAND || p === `${APP_ROUTES.LAND}/` || p === APP_ROUTES.LAND_BROWSE) {
      title = n('Land', 'Земля');
    } else if (p === APP_ROUTES.HOTELS || p === `${APP_ROUTES.HOTELS}/`) {
      title = n('Hotels', 'Отели');
    } else if (p === APP_ROUTES.PROPERTY_MAP) {
      title = n('Map', 'Карта');
    } else if (p === APP_ROUTES.PROPERTY_CONSULTATION) {
      title = n('Consultation', 'Консультация');
    } else if (p === APP_ROUTES.PROPERTY_DEPOSIT_SUCCESS) {
      title = n('Booking', 'Бронирование');
    }
  }

  const showBottomNav = !(
    p === APP_ROUTES.PROPERTY_DEPOSIT_SUCCESS ||
    p.includes('/inquiry') ||
    p.includes('/manual-payment')
  );

  return (
    <AppLayout
      title={title}
      showHeader={!hideGlobalTopBar}
      showBottomNav={showBottomNav}
    >
      <CompareProvider>
        {!hideOuterTabs && <PropertyHubTabs />}
        <OffplanHubToolsStrip />
        <Outlet />
      </CompareProvider>
    </AppLayout>
  );
}
