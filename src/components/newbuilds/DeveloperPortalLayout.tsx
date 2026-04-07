/**
 * Developer Portal Layout — sidebar + dark luxury theme
 */
import React, { Suspense } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import NewbuildsLayout from './NewbuildsLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { LayoutDashboard, FolderKanban, Users, BarChart3, Megaphone, Settings, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { LoadingState } from '@/components/uno/LoadingSpinner';

const navItems = [
  { label: 'Обзор', path: '/developer-portal', icon: LayoutDashboard, exact: true },
  { label: 'Мои проекты', path: '/developer-portal/projects', icon: FolderKanban },
  { label: 'Лиды', path: '/developer-portal/leads', icon: Users },
  { label: 'Аналитика', path: '/developer-portal/analytics', icon: BarChart3 },
];

export default function DeveloperPortalLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: developer, isLoading: devLoading } = useDeveloperProfile();
  const location = useLocation();

  if (authLoading || devLoading) return <NewbuildsLayout><LoadingState /></NewbuildsLayout>;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!developer) return <Navigate to={APP_ROUTES.NEWBUILDS} replace />;

  return (
    <NewbuildsLayout>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-[hsl(var(--nb-glass-border))] bg-[hsl(var(--nb-surface))]">
          <div className="p-6 border-b border-[hsl(var(--nb-glass-border))]">
            <Link to={APP_ROUTES.NEWBUILDS} className="flex items-center gap-2 text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] transition-colors text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> Новостройки
            </Link>
            <h2 className="nb-display text-xl text-[hsl(var(--nb-gold))]">Кабинет</h2>
            {developer && (
              <p className="text-sm text-[hsl(var(--nb-text-secondary))] mt-1 truncate">{developer.name_en}</p>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all',
                    active
                      ? 'bg-[hsl(var(--nb-gold)/0.15)] text-[hsl(var(--nb-gold))] font-medium'
                      : 'text-[hsl(var(--nb-text-secondary))] hover:text-[hsl(var(--nb-text))] hover:bg-[hsl(var(--nb-glass-bg))]'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--nb-surface))] border-t border-[hsl(var(--nb-glass-border))] flex">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex-1 flex flex-col items-center py-3 text-xs transition-colors',
                  active ? 'text-[hsl(var(--nb-gold))]' : 'text-[hsl(var(--nb-muted))]'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </NewbuildsLayout>
  );
}
