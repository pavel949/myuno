/**
 * MeShellLayout — Phase A5 Universal Hub shell.
 *
 * Thin wrapper around AppLayout that adds an inner-tab nav for the 6
 * /me sub-routes (Feed / Services / Documents / Payments / Requests /
 * Profile). Mirrors the Gosuslugi single-shell pattern: one layout for
 * all four universal containers + profile.
 *
 * Tabs are sticky on mobile (top, scrollable) and desktop (top bar).
 * No new top-level shell is created — uses AppLayout per rule §13.2.
 */
import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Inbox, Compass, FileText, Wallet, ClipboardList, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page';
import { useLanguage } from '@/contexts/LanguageContext';

interface MeTab {
  to: string;
  end?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
}

const TABS: MeTab[] = [
  { to: '/me',           end: true,  icon: Inbox,         labelEn: 'Feed',      labelRu: 'Лента' },
  { to: '/me/services',              icon: Compass,       labelEn: 'Services',  labelRu: 'Услуги' },
  { to: '/me/documents',             icon: FileText,      labelEn: 'Documents', labelRu: 'Документы' },
  { to: '/me/payments',              icon: Wallet,        labelEn: 'Payments',  labelRu: 'Платежи' },
  { to: '/me/requests',              icon: ClipboardList, labelEn: 'Requests',  labelRu: 'Заявки' },
  { to: '/me/profile',               icon: User,          labelEn: 'Profile',   labelRu: 'Профиль' },
];

interface MeShellLayoutProps {
  title?: string;
  children: ReactNode;
}

export function MeShellLayout({ title, children }: MeShellLayoutProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <AppLayout title={title ?? (isRu ? 'Мой кабинет' : 'My Hub')}>
      <div className="sticky top-0 z-20 bg-background/95 supports-[backdrop-filter]:bg-background/70 border-b border-border/60">
        <div className="mx-auto w-full max-w-5xl px-[var(--page-padding-x)]">
          <nav
            aria-label={isRu ? 'Разделы' : 'Sections'}
            className="flex gap-1 overflow-x-auto no-scrollbar py-2"
          >
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <t.icon className="h-4 w-4" />
                <span>{isRu ? t.labelRu : t.labelEn}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <PageShell width="default">{children}</PageShell>
    </AppLayout>
  );
}
