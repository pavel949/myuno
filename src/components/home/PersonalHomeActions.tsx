import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, House, LifeBuoy, Search, Shapes } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

/** Stable personal destinations, independent of interests and workspace roles. */
export function PersonalHomeActions() {
  const { language } = useLanguage();
  const actions = [
    { to: APP_ROUTES.PROPERTY, icon: House, label: { ru: 'Жильё', en: 'Homes', th: 'ที่พัก' } },
    { to: APP_ROUTES.SERVICES, icon: Shapes, label: { ru: 'Услуги', en: 'Services', th: 'บริการ' } },
    { to: APP_ROUTES.BOOKINGS, icon: CalendarDays, label: { ru: 'Брони и заявки', en: 'Bookings & requests', th: 'การจองและคำขอ' } },
    { to: APP_ROUTES.SUPPORT, icon: LifeBuoy, label: { ru: 'Помощь', en: 'Help', th: 'ความช่วยเหลือ' } },
  ];
  return (
    <div className="px-4 pb-5 pt-2">
      <Link to={APP_ROUTES.SEARCH} className="mb-3 flex min-h-12 items-center gap-3 border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">{pickLang(language, { ru: 'Найти жильё, услугу, документ', en: 'Find a home, service or document', th: 'ค้นหาที่พัก บริการ หรือเอกสาร' })}</span>
      </Link>
      <nav aria-label={pickLang(language, { ru: 'Личные разделы', en: 'Personal shortcuts', th: 'ทางลัดส่วนตัว' })} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="flex min-h-14 min-w-0 items-center gap-2.5 border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Icon className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 break-words leading-snug">{pickLang(language, label)}</span>
          </Link>
        ))}
      </nav>
      <Link to={APP_ROUTES.TRIP_PLANNER} className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{pickLang(language, { ru: 'Спланировать поездку', en: 'Plan a trip', th: 'วางแผนการเดินทาง' })}</Link>
    </div>
  );
}
