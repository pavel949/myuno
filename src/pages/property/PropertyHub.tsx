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
    path: '/property?mode=rent',
    matchPaths: ['/property'],
  },
  {
    id: 'buy',
    labelEn: 'Buy',
    labelRu: 'Купить',
    icon: ShoppingCart,
    path: '/property?mode=buy',
    matchPaths: [],
  },
  {
    id: 'newbuild',
    labelEn: 'New Build',
    labelRu: 'Новостройки',
    icon: Building2,
    path: '/property/offplan',
    matchPaths: ['/property/offplan', '/property/developers', '/property/projects'],
  },
  {
    id: 'resale',
    labelEn: 'Resale',
    labelRu: 'Вторичка',
    icon: ArrowRightLeft,
    path: '/property/resale',
    matchPaths: ['/property/resale'],
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
  if (pathname.startsWith('/property/invest')) return 'my';
  if (pathname.startsWith('/property/resale')) return 'resale';
  if (pathname.startsWith('/property/offplan') || pathname.startsWith('/property/developers') || pathname.startsWith('/property/projects')) return 'newbuild';
  
  if (pathname === '/property' || pathname.startsWith('/property/search') || pathname.startsWith('/property/map') || pathname.startsWith('/property/consultation')) {
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
    /^\/property\/(offplan|developers|invest|resale)\/[a-f0-9-]/.test(location.pathname) ||
    /^\/property\/project\//.test(location.pathname) ||
    /^\/property\/deposit-success/.test(location.pathname);

  if (isDetailPage) return null;

  const visibleTabs = TABS.filter(tab => !tab.authOnly || user);

  // New Build sub-tabs
  const newBuildSubTabs = [
    { id: 'projects', labelEn: 'Projects', labelRu: 'Проекты', path: '/property/offplan' },
    { id: 'complexes', labelEn: 'Complexes', labelRu: 'Комплексы', path: '/property/projects' },
    { id: 'developers', labelEn: 'Developers', labelRu: 'Застройщики', path: '/property/developers' },
  ];

  const activeSubTab = location.pathname.startsWith('/property/developers') ? 'developers'
    : location.pathname.startsWith('/property/projects') ? 'complexes'
    : 'projects';

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2">
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
      {/* New Build sub-tabs */}
      {activeTab === 'newbuild' && (
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-1.5 border-t border-border/30">
          {newBuildSubTabs.map((sub) => (
            <button
              key={sub.id}
              onClick={() => navigate(sub.path)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                activeSubTab === sub.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isRu ? sub.labelRu : sub.labelEn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyHub() {
  return (
    <CompareProvider>
      <PropertyHubTabs />
      <Outlet />
    </CompareProvider>
  );
}
