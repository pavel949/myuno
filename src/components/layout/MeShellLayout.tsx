import { pickLang } from '@/lib/i18n/pickLang';
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
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Inbox, Compass, FileText, Wallet, ClipboardList, User, CalendarCheck } from 'lucide-react';
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
  labelTh: string;
}

const TABS: MeTab[] = [
  { to: '/me',           end: true,  icon: Inbox,         labelEn: 'Overview',  labelRu: 'Обзор', labelTh: 'ภาพรวม' },
  { to: '/me/bookings',              icon: CalendarCheck, labelEn: 'Bookings',  labelRu: 'Бронирования', labelTh: 'การจอง' },
  { to: '/me/services',              icon: Compass,       labelEn: 'Services',  labelRu: 'Услуги', labelTh: 'บริการ' },
  { to: '/me/documents',             icon: FileText,      labelEn: 'Documents', labelRu: 'Документы', labelTh: 'เอกสาร' },
  { to: '/me/payments',              icon: Wallet,        labelEn: 'Payments',  labelRu: 'Платежи', labelTh: 'การชำระเงิน' },
  { to: '/me/requests',              icon: ClipboardList, labelEn: 'Requests',  labelRu: 'Заявки', labelTh: 'คำขอ' },
  { to: '/me/profile',               icon: User,          labelEn: 'Profile',   labelRu: 'Профиль', labelTh: 'โปรไฟล์' },
];

interface MeShellLayoutProps {
  title?: string;
  children: ReactNode;
}

export function MeShellLayout({ title, children }: MeShellLayoutProps) {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = TABS.find(t => t.end ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + '/')) ?? TABS[0];
  return (
    <AppLayout usePageContainer={false} title={title ?? (pickLang(language, { ru: 'Мой кабинет', en: 'My Hub', th: 'บัญชีของฉัน' }))}>
      <div className="sticky top-[var(--consumer-header-height,0px)] z-20 bg-background border-b border-border/60">
        <div className="mx-auto w-full max-w-5xl px-[var(--page-padding-x)]">
          <div className="py-3 md:hidden">
            <Select value={activeTab.to} onValueChange={navigate}>
              <SelectTrigger aria-label={pickLang(language, { ru: 'Раздел аккаунта', en: 'Account section', th: 'ส่วนบัญชี' })} className="min-h-11 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{TABS.map(t => <SelectItem key={t.to} value={t.to}>{pickLang(language, { ru: t.labelRu, en: t.labelEn, th: t.labelTh })}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <nav
            aria-label={pickLang(language, { ru: 'Разделы', en: 'Sections', th: 'ส่วนต่าง ๆ' })}
            className="hidden gap-1 overflow-x-auto py-2 md:flex"
          >
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-h-11 px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <t.icon className="h-4 w-4" />
                <span>{pickLang(language, { ru: t.labelRu, en: t.labelEn, th: t.labelTh })}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <PageShell width="default">{children}</PageShell>
    </AppLayout>
  );
}
