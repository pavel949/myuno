/**
 * PropertyHub — Unified entry point for all property-related features
 * Tabs: Stays | Buy | Off-Plan | Invest
 * Renders nested routes via Outlet or PropertyIndex based on active tab
 */

import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Home, ShoppingCart, Building2, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TabConfig {
  id: string;
  labelEn: string;
  labelRu: string;
  icon: React.ElementType;
  path: string;
  matchPaths: string[];
}

const TABS: TabConfig[] = [
  {
    id: 'stays',
    labelEn: 'Stays',
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
    id: 'offplan',
    labelEn: 'Off-Plan',
    labelRu: 'Новостройки',
    icon: Building2,
    path: '/property/offplan',
    matchPaths: ['/property/offplan', '/property/developers', '/property/projects'],
  },
  {
    id: 'invest',
    labelEn: 'Invest',
    labelRu: 'Инвестиции',
    icon: TrendingUp,
    path: '/property/invest',
    matchPaths: ['/property/invest'],
  },
];

function getActiveTab(pathname: string, search: string): string {
  // Check nested routes first (more specific)
  if (pathname.startsWith('/property/invest')) return 'invest';
  if (pathname.startsWith('/property/offplan') || pathname.startsWith('/property/developers') || pathname.startsWith('/property/projects')) return 'offplan';
  
  // For /property root, check mode param
  if (pathname === '/property' || pathname.startsWith('/property/search') || pathname.startsWith('/property/map') || pathname.startsWith('/property/consultation')) {
    const params = new URLSearchParams(search);
    if (params.get('mode') === 'buy') return 'buy';
    return 'stays';
  }
  
  return 'stays';
}

export function PropertyHubTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const activeTab = getActiveTab(location.pathname, location.search);

  // Don't show tabs on detail pages (property/:id, offplan/:id, etc.)
  const isDetailPage = /^\/property\/[a-f0-9-]{36}/.test(location.pathname) ||
    /^\/property\/(offplan|developers|invest)\/[a-f0-9-]/.test(location.pathname) ||
    /^\/property\/project\//.test(location.pathname) ||
    /^\/property\/deposit-success/.test(location.pathname);

  if (isDetailPage) return null;

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
      {TABS.map((tab) => {
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
  return (
    <>
      <PropertyHubTabs />
      <Outlet />
    </>
  );
}
