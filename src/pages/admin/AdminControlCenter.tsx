import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Wallet, Settings } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/page';

/** Compatibility entry: canonical screens own each function, without duplicate tabs. */
export default function AdminControlCenter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const destinations = [
    { path: '/admin/users', icon: Users, title: isRu ? 'Пользователи и доступ' : 'Users & access', description: isRu ? 'Пользователи, роли и RBAC' : 'Users, roles and RBAC' },
    { path: '/admin/finance', icon: Wallet, title: isRu ? 'Финансы и аналитика' : 'Finance & analytics', description: isRu ? 'Транзакции, аналитика, продвижение и выплаты' : 'Transactions, analytics, promotions and payouts' },
    { path: '/admin/settings', icon: Settings, title: isRu ? 'Настройки системы' : 'System settings', description: isRu ? 'Конфигурация, аудит, журнал, флаги и организация' : 'Configuration, audit, activity log, flags and organization' },
  ];
  return <PageShell width="wide">
    <PageHeader title={isRu ? 'Центр управления' : 'Control Center'} subtitle={isRu ? 'Выберите раздел управления платформой' : 'Choose a platform administration section'} />
    <nav aria-label={isRu ? 'Разделы управления платформой' : 'Platform administration sections'} className="grid gap-4 md:grid-cols-3">
      {destinations.map(item => <Link key={item.path} to={item.path} className="min-w-0 border border-border p-4 space-y-2 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <item.icon aria-hidden="true" className="h-5 w-5" />
        <h2 className="font-semibold">{item.title}</h2>
        <p className="text-sm text-muted-foreground break-words">{item.description}</p>
      </Link>)}
    </nav>
  </PageShell>;
}
