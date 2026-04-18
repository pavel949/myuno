/**
 * Developer Portal Layout — sidebar + dark luxury theme
 */
import React, { Suspense } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import NewbuildsLayout from './NewbuildsLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeveloperProfile } from '@/hooks/useDeveloperPortal';
import { LayoutDashboard, FolderKanban, Users, BarChart3, Building2, ArrowLeft, UserCog, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { PROPERTY_VERTICAL_MUTED_LINK } from '@/design-system/propertyVertical';

const navItems = [
  { label: 'Обзор', path: APP_ROUTES.DEVELOPER_PORTAL, icon: LayoutDashboard, exact: true },
  { label: 'Мои проекты', path: '/developer-portal/projects', icon: FolderKanban },
  { label: 'Компания', path: APP_ROUTES.DEVELOPER_PORTAL_COMPANY, icon: Building2 },
  { label: 'Лиды', path: APP_ROUTES.DEVELOPER_PORTAL_LEADS, icon: Users },
  { label: 'Аналитика', path: '/developer-portal/analytics', icon: BarChart3 },
  { label: 'Команда', path: APP_ROUTES.DEVELOPER_PORTAL_TEAM, icon: UserCog },
];

function DeveloperPortalGate({ isRu }: { isRu: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 text-center sm:py-16">
      <h1 className="nb-display text-2xl font-bold text-[hsl(var(--nb-gold))] sm:text-3xl">
        {isRu ? 'Портал застройщика' : 'Developer portal'}
      </h1>
      <p className="mt-4 text-balance text-[hsl(var(--nb-text-secondary))]">
        {isRu
          ? 'Кабинет доступен после регистрации компании в myUNO. Начните онбординг или вернитесь к каталогу новостроек.'
          : 'The developer dashboard is available after you register your company on myUNO. Start onboarding or browse new developments.'}
      </p>
      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild className="rounded-xl font-semibold">
          <Link to={APP_ROUTES.DEVELOPER_PORTAL_ONBOARDING}>
            {isRu ? 'Начать регистрацию' : 'Start registration'}
          </Link>
        </Button>
        <Button variant="outline" asChild className="rounded-xl border-[hsl(var(--nb-glass-border))] bg-[hsl(var(--nb-glass-bg))]">
          <Link to={APP_ROUTES.DEVELOPER_PORTAL_APPLY}>{isRu ? 'Краткая заявка' : 'Short application'}</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-xl text-[hsl(var(--nb-muted))]">
          <Link to={APP_ROUTES.NEWBUILDS}>{isRu ? 'Новостройки' : 'New developments'}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function DeveloperPortalLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const { data: developer, isLoading: devLoading } = useDeveloperProfile();
  const location = useLocation();

  if (authLoading || devLoading) return <NewbuildsLayout><LoadingState /></NewbuildsLayout>;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!developer) {
    return (
      <NewbuildsLayout>
        <DeveloperPortalGate isRu={isRu} />
      </NewbuildsLayout>
    );
  }
  if ((developer as unknown as Record<string, unknown>).devmod_status === 'pending') {
    return <Navigate to={APP_ROUTES.DEVELOPER_PORTAL_PENDING} replace />;
  }

  return (
    <NewbuildsLayout>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-[hsl(var(--nb-glass-border))] bg-[hsl(var(--nb-surface))]">
          <div className="p-6 border-b border-[hsl(var(--nb-glass-border))]">
            <Link
              to={APP_ROUTES.PROPERTY}
              className={cn(
                PROPERTY_VERTICAL_MUTED_LINK,
                'flex items-center gap-2 text-sm mb-2 text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))]'
              )}
            >
              <Home className="w-4 h-4 shrink-0" />
              {t('developerPortal.backToProperty')}
            </Link>
            <Link to={APP_ROUTES.NEWBUILDS} className="flex items-center gap-2 text-[hsl(var(--nb-muted))] hover:text-[hsl(var(--nb-gold))] transition-colors text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> {isRu ? 'Новостройки' : 'New developments'}
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
