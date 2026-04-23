/**
 * NewbuildsLayout — Light Property Hub wrapper for /newbuilds tools section
 * Includes sticky section navigation bar.
 *
 * NOTE: NbCompareProvider is mounted at the router level (AnimatedRoutes.tsx)
 * so any /newbuilds/* route can read compare state, even before this layout mounts.
 */
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Map, Compass, Users, Calculator, Shield, GitCompare } from 'lucide-react';
import { getAttributionCookieId } from '@/lib/newbuilds/attribution';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import '@/styles/newbuilds-theme.css';

interface NewbuildsLayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

const NAV_ITEMS = [
  { path: APP_ROUTES.OFFPLAN, label: 'Каталог', icon: Building2, exact: true },
  { path: APP_ROUTES.NEWBUILDS_MAP, label: 'Карта', icon: Map },
  { path: APP_ROUTES.NEWBUILDS_COMPARE, label: 'Сравнение', icon: GitCompare },
  { path: APP_ROUTES.NEWBUILDS_AREAS, label: 'Районы', icon: Compass },
  { path: APP_ROUTES.DEVELOPERS, label: 'Девелоперы', icon: Users },
  { path: APP_ROUTES.NEWBUILDS_CALCULATOR, label: 'Калькулятор', icon: Calculator },
  { path: APP_ROUTES.NEWBUILDS_DUE_DILIGENCE, label: 'Due Diligence', icon: Shield },
];

export default function NewbuildsLayout({ children, className = '', hideNav }: NewbuildsLayoutProps) {
  const location = useLocation();

  // Ensure attribution cookie is set on first visit to any /newbuilds page
  useEffect(() => {
    getAttributionCookieId();
  }, []);

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) {
      return (
        location.pathname === item.path ||
        (item.path === APP_ROUTES.OFFPLAN && location.pathname.startsWith(`${APP_ROUTES.OFFPLAN}/`))
      );
    }
    return location.pathname.startsWith(item.path);
  };

  // Hide nav on detail pages and compare pages (handled by their own back navigation)
  const isDetailPage = /\/(projects|developers|areas)\/[^/]+/.test(location.pathname)
    || location.pathname.includes('/compare');

  const showNav = !hideNav && !isDetailPage;

  return (
    <div className={cn('nb-theme nb-theme--light min-h-screen bg-background text-foreground', className)}>
      {/* Sticky navigation */}
      {showNav && (
        <nav className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {NAV_ITEMS.map(item => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs whitespace-nowrap transition-all flex-shrink-0 font-medium',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
