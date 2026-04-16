/**
 * NewbuildsLayout — Dark editorial wrapper for /newbuilds section
 * Includes sticky section navigation bar
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Map, Compass, Users, Calculator, Shield, TrendingUp } from 'lucide-react';
import { NbCompareProvider } from './NbCompareProvider';
import '@/styles/newbuilds-theme.css';

interface NewbuildsLayoutProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

const NAV_ITEMS = [
  { path: '/newbuilds', label: 'Каталог', icon: Building2, exact: true },
  { path: '/newbuilds/map', label: 'Карта', icon: Map },
  { path: '/newbuilds/areas', label: 'Районы', icon: Compass },
  { path: '/newbuilds/developers', label: 'Девелоперы', icon: Users },
  { path: '/newbuilds/calculator', label: 'Калькулятор', icon: Calculator },
  { path: '/newbuilds/due-diligence', label: 'Due Diligence', icon: Shield },
];

export default function NewbuildsLayout({ children, className = '', hideNav }: NewbuildsLayoutProps) {
  const location = useLocation();

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  // Hide nav on project detail, developer detail, area detail, compare pages
  const isDetailPage = /\/(projects|developers|areas)\/[^/]+/.test(location.pathname)
    || location.pathname.includes('/compare');

  const showNav = !hideNav && !isDetailPage;

  return (
    <NbCompareProvider>
    <div className={`nb-theme min-h-screen ${className}`}>
      {/* Sticky navigation */}
      {showNav && (
        <nav className="sticky top-0 z-30 border-b" style={{ background: 'hsl(var(--nb-bg) / 0.95)', backdropFilter: 'blur(12px)', borderColor: 'hsl(var(--nb-gold) / 0.15)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {NAV_ITEMS.map(item => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      background: active ? 'hsl(var(--nb-gold) / 0.15)' : 'transparent',
                      color: active ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
      {children}
    </div>
    </NbCompareProvider>
  );
}
