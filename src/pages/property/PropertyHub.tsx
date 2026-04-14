/**
 * PropertyHub — Unified entry point for all property-related features
 * Tabs: Rent | Buy | New Build | My Property (auth-only)
 * Renders nested routes via Outlet
 */

import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Home, ShoppingCart, Building2, User, ArrowRightLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CompareProvider } from '@/components/property/PropertyCompare';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface TabConfig {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ElementType;
  path: string;
  matchPaths: string[];
  authOnly?: boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'rent',
    labelEn: 'Rent',
    labelRu: 'Аренда',
    icon: Home,
    path: `${APP_ROUTES.PROPERTY}?mode=rent`,
    matchPaths: [APP_ROUTES.PROPERTY],
  },
  {
    id: 'buy',
    labelEn: 'Buy',
    labelRu: 'Купить',
    icon: ShoppingCart,
    path: `${APP_ROUTES.PROPERTY}?mode=buy`,
    matchPaths: [],
  },
  {
    id: 'newbuild',
    labelEn: 'New Build',
    labelRu: 'Новостройки',
    icon: Building2,
    path: APP_ROUTES.OFFPLAN,
    matchPaths: [APP_ROUTES.OFFPLAN, APP_ROUTES.DEVELOPERS, APP_ROUTES.COMPLEXES],
  },
  {
    id: 'resale',
    labelEn: 'Resale',
    labelRu: 'Вторичка',
    icon: ArrowRightLeft,
    path: APP_ROUTES.RESALE,
    matchPaths: [APP_ROUTES.RESALE],
  },
  {
    id: 'my',
    labelEn: 'My Property',
    labelRu: 'Мои объекты',
    icon: User,
    path: '/property/my',
    matchPaths: ['/property/my', '/property/invest'],
    authOnly: true,
  },
];

function getActiveTab(pathname: string, search: string): string {
  if (pathname.startsWith('/property/my')) return 'my';
  if (pathname.startsWith(APP_ROUTES.INVEST)) return 'my';
  if (pathname.startsWith(APP_ROUTES.RESALE)) return 'resale';
  if (pathname.startsWith(APP_ROUTES.OFFPLAN) || pathname.startsWith(APP_ROUTES.DEVELOPERS) || pathname.startsWith(APP_ROUTES.COMPLEXES)) return 'newbuild';
  
  if (pathname === APP_ROUTES.PROPERTY || pathname.startsWith(APP_ROUTES.PROPERTY_SEARCH) || pathname.startsWith(APP_ROUTES.PROPERTY_MAP) || pathname.startsWith(APP_ROUTES.PROPERTY_CONSULTATION)) {
    const params = new URLSearchParams(search);
    if (params.get('mode') === 'buy') return 'buy';
    return 'rent';
  }
  
  return 'rent';
}

export function PropertyHubTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const activeTab = getActiveTab(location.pathname, location.search);

  // Don't show tabs on detail pages
  const isDetailPage = /^\/property\/[a-f0-9-]{36}/.test(location.pathname) ||
    /^\/property\/(offplan|developers|invest)\/[a-f0-9-]/.test(location.pathname) ||
    /^\/property\/project\//.test(location.pathname) ||
    /^\/property\/deposit-success/.test(location.pathname);

  if (isDetailPage) return null;

  const visibleTabs = TABS.filter(tab => !tab.authOnly || user);

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 bg-background border-b border-border/50">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {isRu ? tab.labelRu : tab.labelEn}
          </button>
        );
      })}
    </div>
  );
}

export default function PropertyHub() {
  const location = useLocation();
  // PropertyIndex has its own sticky header that embeds the tabs — avoid double nav
  const isIndexRoute = location.pathname === APP_ROUTES.PROPERTY || location.pathname === `${APP_ROUTES.PROPERTY}/`;
  return (
    <CompareProvider>
      {!isIndexRoute && <PropertyHubTabs />}
      <Outlet />
    </CompareProvider>
  );
}
