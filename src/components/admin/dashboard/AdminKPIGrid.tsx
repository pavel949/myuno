import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { pickLang } from '@/lib/i18n/pickLang';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';

/** Current record counts only. Period finance is the separate snapshot panel. */
export function AdminKPIGrid() {
  const { language } = useLanguage();
  const { data, isLoading } = useAdminDashboardStats();
  const unavailable = pickLang(language, { en: 'Unavailable', ru: 'Недоступно', th: 'ไม่พร้อมใช้งาน' });
  const kpis = [
    { title: pickLang(language, { en: 'All user profiles', ru: 'Все профили пользователей', th: 'โปรไฟล์ผู้ใช้ทั้งหมด' }), value: data?.totalUsers, href: '/admin/users' },
    { title: pickLang(language, { en: 'All providers', ru: 'Все поставщики', th: 'ผู้ให้บริการทั้งหมด' }), value: data?.providers, href: '/admin/providers' },
    { title: pickLang(language, { en: 'Property records', ru: 'Записи объектов', th: 'ข้อมูลที่พัก' }), value: data?.properties, href: '/admin/properties' },
    { title: pickLang(language, { en: 'Listings & properties pending review', ru: 'Объявления и объекты на проверке', th: 'รายการและที่พักรอตรวจสอบ' }), value: data?.pendingContent, href: '/admin/operations?tab=moderation' },
  ];
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {kpis.map(kpi => <Link key={kpi.href} to={kpi.href} className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Surface variant="card" padding="md" radius="xl" className="h-full transition-colors hover:bg-muted/30">
        <p className="text-sm text-muted-foreground">{kpi.title}</p>
        {isLoading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-2 break-words text-2xl font-semibold">{kpi.value ?? unavailable}</p>}
      </Surface>
    </Link>)}
  </div>;
}
